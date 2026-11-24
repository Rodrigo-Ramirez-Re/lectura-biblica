import { bookCatalog, type BookCatalog } from '@lectura/catalog-domain';
import {
  validatePlan,
  type JournalReader,
  type JournalWriter,
  type PlanError,
  type PlanRecord,
  type PlanSettings,
} from '@lectura/reading-domain';
import { err, ok, type Result } from '@lectura/shared-kernel';

/** The plan as it is now, for the editor (LB-015). */
export class GetPlan {
  constructor(private readonly reader: JournalReader) {}

  async execute(): Promise<PlanRecord | null> {
    return (await this.reader.load()).plan;
  }
}

export type UpdatePlanError = PlanError | 'no-plan' | 'empty-name';

/**
 * Saves new settings for the plan. Only what is still to come changes: recorded blocks and logs
 * stay as they are (ADR 0007).
 */
export class UpdatePlan {
  constructor(
    private readonly reader: JournalReader,
    private readonly writer: JournalWriter,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  async execute(changes: Partial<PlanSettings>): Promise<Result<PlanRecord, UpdatePlanError>> {
    const { plan } = await this.reader.load();
    if (!plan) return err('no-plan');
    const updated: PlanRecord = { ...plan, ...changes, name: (changes.name ?? plan.name).trim() };
    if (!updated.name) return err('empty-name');
    const valid = validatePlan(updated, this.catalog);
    if (!valid.ok) return valid;
    await this.writer.savePlan(updated);
    return ok(updated);
  }
}
