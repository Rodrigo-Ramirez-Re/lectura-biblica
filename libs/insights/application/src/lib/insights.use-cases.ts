import {
  cycleProgress,
  finishEstimate,
  habits,
  historyCsv,
  historyFileName,
  monthlyHistory,
  monthDays,
  onPace,
  passesByBook,
  streaks,
  type BookPasses,
  type CycleProgress,
  type FinishEstimate,
  type Habits,
  type HistoryMonth,
  type MonthDays,
  type OnPace,
  type Streaks,
} from '@lectura/insights-domain';
import { bookCatalog, type BookCatalog } from '@lectura/catalog-domain';
import type { JournalReader } from '@lectura/reading-domain';
import type { Clock, FileSaver, LocalDate } from '@lectura/shared-kernel';

export interface InsightsView {
  readonly today: LocalDate;
  readonly onPace: OnPace;
  /** Null until something is read. */
  readonly streaks: Streaks | null;
  readonly month: MonthDays;
  /** Books with something read, in the plan's order. */
  readonly books: readonly BookPasses[];
  readonly cycle: CycleProgress;
  readonly finish: FinishEstimate;
  readonly habits: Habits;
  /** Newest month first. */
  readonly history: readonly HistoryMonth[];
}

/**
 * Every insight, computed from the journal on each call: nothing derived is stored, so a corrected
 * past day updates them all (data model). Null until a plan starts.
 */
export class GetInsights {
  constructor(
    private readonly reader: JournalReader,
    private readonly clock: Clock,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  async execute(): Promise<InsightsView | null> {
    const journal = await this.reader.load();
    const today = this.clock.today();
    const pace = onPace(journal, today);
    const month = monthDays(journal, today);
    const cycle = cycleProgress(journal, this.catalog, today);
    const finish = finishEstimate(journal, this.catalog, today);
    if (!pace || !month || !cycle || !finish) return null;
    return {
      today,
      onPace: pace,
      streaks: streaks(journal, today),
      month,
      books: passesByBook(journal, this.catalog),
      cycle,
      finish,
      habits: habits(journal, today),
      history: monthlyHistory(journal, this.catalog, today),
    };
  }
}

/** Saves the whole reading history as a CSV file (LB-028). False when nothing is logged yet. */
export class ExportHistory {
  constructor(
    private readonly reader: JournalReader,
    private readonly clock: Clock,
    private readonly files: FileSaver,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  async execute(): Promise<boolean> {
    const journal = await this.reader.load();
    if (!journal.logs.length) return false;
    this.files.save(
      historyFileName(this.clock.today()),
      historyCsv(journal, this.catalog),
      'text/csv;charset=utf-8',
    );
    return true;
  }
}
