import { bookCatalog, type BookCatalog } from '@lectura/catalog-domain';
import {
  advanceBlocks,
  defaultPlan,
  projectSchedule,
  type JournalReader,
  type JournalWriter,
  type PlanRecord,
} from '@lectura/reading-domain';
import {
  err,
  ok,
  type Clock,
  type IdGenerator,
  type LocalDate,
  type Result,
} from '@lectura/shared-kernel';

export type StartChoice = 'today' | 'next-month';

export interface StartOptions {
  readonly today: LocalDate;
  readonly nextMonth: LocalDate;
}

/** Starts reading with the default plan "Un libro al mes" (LB-011). */
export class StartDefaultPlan {
  constructor(
    private readonly reader: JournalReader,
    private readonly writer: JournalWriter,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  options(): StartOptions {
    const today = this.clock.today();
    return { today, nextMonth: today.firstOfNextMonth() };
  }

  async execute(choice: StartChoice): Promise<Result<PlanRecord, 'plan-exists'>> {
    if ((await this.reader.load()).plan) return err('plan-exists');
    const { today, nextMonth } = this.options();
    const plan = defaultPlan(choice === 'today' ? today : nextMonth, this.catalog);
    await this.writer.savePlan(plan);
    const blocks = advanceBlocks(plan, [], this.catalog, today, () => this.ids.next());
    if (blocks.length) await this.writer.saveBlocks(blocks);
    return ok(plan);
  }
}

/** Records the blocks that have started since the app was last opened (LB-011). */
export class AdvanceBlocks {
  constructor(
    private readonly reader: JournalReader,
    private readonly writer: JournalWriter,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  async execute(): Promise<void> {
    const { plan, blocks } = await this.reader.load();
    if (!plan) return;
    const changes = advanceBlocks(plan, blocks, this.catalog, this.clock.today(), () =>
      this.ids.next(),
    );
    if (changes.length) await this.writer.saveBlocks(changes);
  }
}

export type BlockState = 'done' | 'current' | 'upcoming';

export interface ScheduleEntry {
  readonly bookId: string;
  readonly bookName: string;
  readonly start: LocalDate;
  readonly end: LocalDate;
  readonly state: BlockState;
}

export interface ScheduleView {
  readonly plan: PlanRecord;
  readonly entries: readonly ScheduleEntry[];
  readonly start: LocalDate;
  readonly end: LocalDate;
  /** Calendar months the cycle spans. */
  readonly months: number;
}

/** The cycle's blocks, past, current and upcoming, for the Plan screen (LB-011). */
export class GetSchedule {
  constructor(
    private readonly reader: JournalReader,
    private readonly clock: Clock,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  async execute(): Promise<ScheduleView | null> {
    const { plan, blocks } = await this.reader.load();
    if (!plan) return null;
    const today = this.clock.today();
    const entries = projectSchedule(plan, blocks, this.catalog).map((block) => ({
      bookId: block.bookId,
      bookName: this.catalog.find(block.bookId)?.name ?? block.bookId,
      start: block.start,
      end: block.end,
      state: (block.end.isBefore(today)
        ? 'done'
        : block.start.isAfter(today)
          ? 'upcoming'
          : 'current') as BlockState,
    }));
    const start = entries[0].start;
    const end = entries[entries.length - 1].end;
    return { plan, entries, start, end, months: start.monthsSpannedUntil(end) };
  }
}
