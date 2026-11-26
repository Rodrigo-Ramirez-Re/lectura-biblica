import { onPace, type OnPace } from '@lectura/insights-domain';
import type { JournalReader } from '@lectura/reading-domain';
import type { Clock, LocalDate } from '@lectura/shared-kernel';

export interface InsightsView {
  readonly today: LocalDate;
  readonly onPace: OnPace;
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
    if (!pace) return null;
    return { today, onPace: pace };
  }
}
