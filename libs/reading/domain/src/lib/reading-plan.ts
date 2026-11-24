import { orderTemplates, type BookCatalog } from '@lectura/catalog-domain';
import { err, ok, type LocalDate, type Result } from '@lectura/shared-kernel';
import { BLOCK_UNITS, type PlanRecord } from './journal';

export type PlanError = 'invalid-pace' | 'no-reading-days' | 'invalid-duration' | 'invalid-order';

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
    paceByWeekday: null,
    pausedSince: null,
  };
}

type ValidatedFields = Pick<
  PlanRecord,
  'chaptersPerDay' | 'restDays' | 'paceByWeekday' | 'bookOrder' | 'excluded' | 'defaultBlock'
>;

/**
 * Guards the plan's invariants: at least one reading day with whole chapter counts, a valid block
 * duration, and an order of known, unique books with at least one not excluded.
 */
export function validatePlan<P extends ValidatedFields>(
  plan: P,
  catalog: BookCatalog,
): Result<P, PlanError> {
  const whole = (n: number, min: number) => Number.isInteger(n) && n >= min;
  if (!whole(plan.chaptersPerDay, 1)) return err('invalid-pace');
  if (plan.paceByWeekday) {
    if (plan.paceByWeekday.length !== 7 || !plan.paceByWeekday.every((n) => whole(n, 0)))
      return err('invalid-pace');
    if (plan.paceByWeekday.every((n) => n === 0)) return err('no-reading-days');
  } else if (new Set(plan.restDays).size >= 7) return err('no-reading-days');
  if (!BLOCK_UNITS.includes(plan.defaultBlock.unit) || !whole(plan.defaultBlock.value, 1))
    return err('invalid-duration');

  const unique = new Set(plan.bookOrder);
  const known = [...plan.bookOrder, ...plan.excluded].every((id) => catalog.find(id));
  const remaining = plan.bookOrder.filter((id) => !plan.excluded.includes(id));
  if (!known || unique.size !== plan.bookOrder.length || remaining.length === 0)
    return err('invalid-order');
  return ok(plan);
}
