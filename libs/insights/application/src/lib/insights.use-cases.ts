import {
  monthDays,
  onPace,
  streaks,
  type MonthDays,
  type OnPace,
  type Streaks,
} from '@lectura/insights-domain';
import type { JournalReader } from '@lectura/reading-domain';
import type { Clock, LocalDate } from '@lectura/shared-kernel';

export interface InsightsView {
  readonly today: LocalDate;
  readonly onPace: OnPace;
  /** Null until something is read. */
  readonly streaks: Streaks | null;
  readonly month: MonthDays;
}

/**
 * Every insight, computed from the journal on each call: nothing derived is stored, so a corrected
 * past day updates them all (data model). Null until a plan starts.
 */
export class GetInsights {
  constructor(
    private readonly reader: JournalReader,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<InsightsView | null> {
    const journal = await this.reader.load();
    const today = this.clock.today();
    const pace = onPace(journal, today);
    const month = monthDays(journal, today);
    if (!pace || !month) return null;
    return { today, onPace: pace, streaks: streaks(journal, today), month };
  }
}
