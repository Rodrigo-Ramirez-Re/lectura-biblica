import { bookCatalog, type BookCatalog } from '@lectura/catalog-domain';
import {
  BUILT_IN_TEMPLATE_ID,
  applyTemplate,
  builtInTemplate,
  createTemplate,
  parseTemplateFile,
  templateFileName,
  toTemplateFile,
  type JournalReader,
  type JournalWriter,
  type PlanSettings,
  type PlanTemplateRecord,
  type TemplateError,
} from '@lectura/reading-domain';
import { err, ok, type FileSaver, type IdGenerator, type Result } from '@lectura/shared-kernel';

export interface TemplateView {
  readonly id: string;
  readonly name: string;
  readonly builtIn: boolean;
}

export type TemplatesError = TemplateError | 'not-found' | 'no-plan' | 'built-in';

/** Reusable ways of reading: save, apply, export, import, delete (LB-022). */
export class PlanTemplates {
  constructor(
    private readonly reader: JournalReader,
    private readonly writer: JournalWriter,
    private readonly ids: IdGenerator,
    private readonly files: FileSaver,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  /** The built-in template first, then the saved ones by name. */
  async list(): Promise<TemplateView[]> {
    const saved = [...(await this.reader.load()).templates]
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map((template) => ({ id: template.id, name: template.name, builtIn: false }));
    const builtIn = builtInTemplate(this.catalog);
    return [{ id: builtIn.id, name: builtIn.name, builtIn: true }, ...saved];
  }

  async save(name: string, settings: PlanSettings): Promise<Result<void, TemplatesError>> {
    const created = createTemplate(this.ids.next(), name, settings, this.catalog);
    if (!created.ok) return created;
    await this.writer.saveTemplate(created.value);
    return ok(undefined);
  }

  /** The plan takes the template's settings from today; the history stays. */
  async apply(templateId: string): Promise<Result<void, TemplatesError>> {
    const { plan } = await this.reader.load();
    if (!plan) return err('no-plan');
    const template = await this.find(templateId);
    if (!template) return err('not-found');
    await this.writer.savePlan(applyTemplate(plan, template));
    return ok(undefined);
  }

  async export(templateId: string): Promise<Result<void, TemplatesError>> {
    const template = await this.find(templateId);
    if (!template) return err('not-found');
    this.files.save(
      templateFileName(template),
      JSON.stringify(toTemplateFile(template), null, 2),
      'application/json',
    );
    return ok(undefined);
  }

  async import(text: string): Promise<Result<string, TemplatesError>> {
    const parsed = parseTemplateFile(text, this.ids.next(), this.catalog);
    if (!parsed.ok) return parsed;
    await this.writer.saveTemplate(parsed.value);
    return ok(parsed.value.name);
  }

  async remove(templateId: string): Promise<Result<void, TemplatesError>> {
    if (templateId === BUILT_IN_TEMPLATE_ID) return err('built-in');
    await this.writer.removeTemplate(templateId);
    return ok(undefined);
  }

  private async find(templateId: string): Promise<PlanTemplateRecord | undefined> {
    if (templateId === BUILT_IN_TEMPLATE_ID) return builtInTemplate(this.catalog);
    return (await this.reader.load()).templates.find((template) => template.id === templateId);
  }
}
