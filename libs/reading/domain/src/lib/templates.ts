import type { BookCatalog } from '@lectura/catalog-domain';
import { LocalDate, err, ok, type Result } from '@lectura/shared-kernel';
import { BACKUP_APP, isPlanSettings } from './backup';
import {
  SCHEMA_VERSION,
  planSettings,
  type PlanRecord,
  type PlanSettings,
  type PlanTemplateRecord,
} from './journal';
import { defaultPlan, validatePlan, type PlanError } from './reading-plan';

export const BUILT_IN_TEMPLATE_ID = 'un-libro-al-mes';

export type TemplateError =
  PlanError | 'empty-name' | 'not-json' | 'not-a-template' | 'newer-version' | 'invalid';

/** "Un libro al mes", always available and never deleted (LB-022). */
export function builtInTemplate(catalog: BookCatalog): PlanTemplateRecord {
  const settings = planSettings(defaultPlan(LocalDate.of(2026, 1, 1), catalog));
  return { id: BUILT_IN_TEMPLATE_ID, name: settings.name, settings };
}

/** A template of how one reads, named by the person (LB-022). */
export function createTemplate(
  id: string,
  name: string,
  settings: PlanSettings,
  catalog: BookCatalog,
): Result<PlanTemplateRecord, TemplateError> {
  const trimmed = name.trim();
  if (!trimmed) return err('empty-name');
  const named = planSettings({ ...settings, name: trimmed });
  const valid = validatePlan(named, catalog);
  if (!valid.ok) return valid;
  return ok({ id, name: trimmed, settings: named });
}

/**
 * The plan takes the template's settings; its start date, pause and history stay, so only what is
 * still to come changes (LB-022, ADR 0007).
 */
export function applyTemplate(plan: PlanRecord, template: PlanTemplateRecord): PlanRecord {
  return {
    ...plan,
    ...template.settings,
    startDate: plan.startDate,
    pausedSince: plan.pausedSince,
  };
}

export interface TemplateFile {
  readonly app: typeof BACKUP_APP;
  readonly kind: 'plan-template';
  readonly schemaVersion: number;
  readonly template: { readonly name: string; readonly settings: PlanSettings };
}

export function toTemplateFile(template: PlanTemplateRecord): TemplateFile {
  return {
    app: BACKUP_APP,
    kind: 'plan-template',
    schemaVersion: SCHEMA_VERSION,
    template: { name: template.name, settings: template.settings },
  };
}

/** "plantilla-mi-plan-de-2027.json": lowercase ASCII, so it is a safe file name everywhere. */
export function templateFileName(template: Pick<PlanTemplateRecord, 'name'>): string {
  const slug = template.name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `plantilla-${slug || 'plan'}.json`;
}

/** Reads a template file; an imported template always gets a new id on this device. */
export function parseTemplateFile(
  text: string,
  id: string,
  catalog: BookCatalog,
): Result<PlanTemplateRecord, TemplateError> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return err('not-json');
  }
  const file = data as Partial<TemplateFile> | null;
  if (!file || file.app !== BACKUP_APP || file.kind !== 'plan-template')
    return err('not-a-template');
  if (typeof file.schemaVersion !== 'number' || file.schemaVersion > SCHEMA_VERSION)
    return err('newer-version');
  const template = file.template;
  if (!template || typeof template.name !== 'string' || !isPlanSettings(template.settings))
    return err('invalid');
  return createTemplate(id, template.name, template.settings, catalog);
}
