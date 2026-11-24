import { orderTemplates, type BookCatalog } from '@lectura/catalog-domain';
import { err, ok, type LocalDate, type Result } from '@lectura/shared-kernel';
import type { PlanRecord } from './journal';

export type PlanError = 'invalid-pace' | 'invalid-order';

export const DEFAULT_PLAN_NAME = 'Un libro al mes';

/**
 * "Un libro al mes": 3 chapters a day, one book per calendar month, fewest chapters first. It is
 * the default template, data like any other plan (docs/product/spec.md §2).
 */
export function defaultPlan(startDate: LocalDate, catalog: BookCatalog): PlanRecord {
  return {
    name: DEFAULT_PLAN_NAME,
    startDate: startDate.toString(),
    chaptersPerDay: 3,
    restDays: [],
    bookOrder: orderTemplates['by-chapters'](catalog),
    excluded: [],
    defaultBlock: { unit: 'month', value: 1 },
    cyclesTarget: null,
  };
}

/** Guards the plan's invariants: a whole positive pace and an order of known, unique books. */
export function validatePlan(
  plan: PlanRecord,
  catalog: BookCatalog,
): Result<PlanRecord, PlanError> {
  if (!Number.isInteger(plan.chaptersPerDay) || plan.chaptersPerDay < 1) return err('invalid-pace');
  const unique = new Set(plan.bookOrder);
  const known = plan.bookOrder.every((id) => catalog.find(id));
  if (!known || unique.size !== plan.bookOrder.length || unique.size === 0)
    return err('invalid-order');
  return ok(plan);
}
