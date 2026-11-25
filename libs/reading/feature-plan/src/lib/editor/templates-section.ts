import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import {
  PlanTemplates,
  type TemplateView,
  type TemplatesError,
} from '@lectura/reading-application';
import type { PlanSettings } from '@lectura/reading-domain';
import {
  ButtonComponent,
  CardComponent,
  FormControlDirective,
  FormFieldComponent,
} from '@lectura/ui-components';

type Confirming = { kind: 'apply' | 'delete'; template: TemplateView } | null;

/**
 * "Plantillas" section of the plan editor (LB-022): save the settings being edited as a template,
 * apply one (confirmed: it changes the plan from today), export, import and delete.
 */
@Component({
  selector: 'lb-templates-section',
  imports: [ButtonComponent, CardComponent, FormFieldComponent, FormControlDirective],
  template: `
    <section lbCard aria-labelledby="templates-title">
      <h2 id="templates-title" class="text-heading-2" i18n="@@reading.templates.title">
        Plantillas
      </h2>
      <ul class="flex flex-col">
        @for (template of templates(); track template.id) {
          <li class="flex flex-col gap-2 border-b border-border py-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-semibold">
                {{ template.name }}
                @if (template.builtIn) {
                  <span
                    class="text-body-sm font-normal text-on-surface-muted"
                    i18n="@@reading.templates.built-in"
                    >(incluida)</span
                  >
                }
              </span>
              <span class="flex flex-wrap gap-1">
                <button
                  lbButton
                  variant="secondary"
                  type="button"
                  (click)="confirming.set({ kind: 'apply', template })"
                  [attr.aria-label]="label('apply', template)"
                >
                  <span i18n="@@reading.templates.apply">Aplicar</span>
                </button>
                <button
                  lbButton
                  variant="ghost"
                  type="button"
                  (click)="export(template)"
                  [attr.aria-label]="label('export', template)"
                >
                  <span i18n="@@reading.templates.export">Exportar</span>
                </button>
                @if (!template.builtIn) {
                  <button
                    lbButton
                    variant="danger"
                    type="button"
                    (click)="confirming.set({ kind: 'delete', template })"
                    [attr.aria-label]="label('delete', template)"
                  >
                    <span i18n="@@reading.templates.delete">Borrar</span>
                  </button>
                }
              </span>
            </div>
            @if (confirming(); as current) {
              @if (current.template.id === template.id) {
                <div
                  role="group"
                  class="flex flex-col gap-2 rounded-card bg-surface-subtle p-3"
                  [attr.aria-label]="label(current.kind, template)"
                >
                  @if (current.kind === 'apply') {
                    <p i18n="@@reading.templates.apply-question">
                      ¿Aplicar «{{ template.name }}»? Tu plan tomará su ritmo, duración, orden y
                      ciclos desde hoy. Tu historial no cambia.
                    </p>
                  } @else {
                    <p i18n="@@reading.templates.delete-question">
                      ¿Borrar la plantilla «{{ template.name }}»?
                    </p>
                  }
                  <div class="flex gap-2">
                    <button
                      lbButton
                      type="button"
                      (click)="confirm()"
                      i18n="@@reading.templates.confirm"
                    >
                      Sí
                    </button>
                    <button
                      lbButton
                      variant="ghost"
                      type="button"
                      (click)="confirming.set(null)"
                      i18n="@@reading.templates.cancel"
                    >
                      No
                    </button>
                  </div>
                </div>
              }
            }
          </li>
        }
      </ul>

      <lb-form-field label="Nombre de la plantilla" i18n-label="@@reading.templates.name">
        <input
          lbControl
          type="text"
          autocomplete="off"
          [value]="name()"
          (input)="name.set(asText($event))"
        />
      </lb-form-field>
      <button
        lbButton
        variant="secondary"
        type="button"
        class="self-start"
        (click)="save()"
        i18n="@@reading.templates.save"
      >
        Guardar estas opciones como plantilla
      </button>

      <lb-form-field
        label="Importar plantilla"
        i18n-label="@@reading.templates.import"
        hint="Un archivo .json de plantilla de esta aplicación."
        i18n-hint="@@reading.templates.import-hint"
      >
        <input lbControl type="file" accept="application/json,.json" (change)="import($event)" />
      </lb-form-field>

      @if (error(); as message) {
        <p role="alert" class="font-semibold text-danger">{{ message }}</p>
      }
      <p role="status" class="text-success">{{ notice() }}</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesSection {
  /** The settings being edited: what "Guardar" turns into a template. */
  readonly settings = input.required<PlanSettings>();
  readonly applied = output<void>();

  private readonly service = inject(PlanTemplates);

  protected readonly templates = signal<readonly TemplateView[]>([]);
  protected readonly confirming = signal<Confirming>(null);
  protected readonly name = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal('');

  private readonly messages: Record<TemplatesError, string> = {
    'empty-name': $localize`:@@reading.templates.error-name:Escribe un nombre para la plantilla.`,
    'not-json': $localize`:@@reading.templates.error-json:El archivo no es una plantilla: no se pudo leer.`,
    'not-a-template': $localize`:@@reading.templates.error-not-template:El archivo no es una plantilla de esta aplicación.`,
    'newer-version': $localize`:@@reading.templates.error-newer:La plantilla viene de una versión más nueva. Actualiza la aplicación.`,
    invalid: $localize`:@@reading.templates.error-invalid:La plantilla está dañada o incompleta.`,
    'invalid-pace': $localize`:@@reading.templates.error-pace:La plantilla tiene un ritmo no válido.`,
    'no-reading-days': $localize`:@@reading.templates.error-days:La plantilla no tiene días de lectura.`,
    'invalid-duration': $localize`:@@reading.templates.error-duration:La plantilla tiene una duración no válida.`,
    'invalid-order': $localize`:@@reading.templates.error-order:La plantilla tiene libros que no existen o se repiten.`,
    'not-found': $localize`:@@reading.templates.error-not-found:Esa plantilla ya no existe.`,
    'no-plan': $localize`:@@reading.templates.error-no-plan:Todavía no tienes un plan.`,
    'built-in': $localize`:@@reading.templates.error-built-in:La plantilla incluida no se puede borrar.`,
  };

  constructor() {
    void this.load();
  }

  protected label(action: 'apply' | 'export' | 'delete', template: TemplateView): string {
    const labels = {
      apply: $localize`:@@reading.templates.apply-label:Aplicar ${template.name}:name:`,
      export: $localize`:@@reading.templates.export-label:Exportar ${template.name}:name:`,
      delete: $localize`:@@reading.templates.delete-label:Borrar ${template.name}:name:`,
    };
    return labels[action];
  }

  protected async confirm(): Promise<void> {
    const confirming = this.confirming();
    if (!confirming) return;
    const { kind, template } = confirming;
    const result =
      kind === 'apply'
        ? await this.service.apply(template.id)
        : await this.service.remove(template.id);
    this.confirming.set(null);
    if (!this.report(result)) return;
    if (kind === 'apply') this.applied.emit();
    else await this.load();
  }

  protected async export(template: TemplateView): Promise<void> {
    this.report(await this.service.export(template.id));
  }

  protected async save(): Promise<void> {
    const result = await this.service.save(this.name(), this.settings());
    if (!this.report(result)) return;
    this.notice.set($localize`:@@reading.templates.saved:Plantilla guardada.`);
    this.name.set('');
    await this.load();
  }

  protected async import(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const result = await this.service.import(await file.text());
    if (!this.report(result)) return;
    this.notice.set(
      $localize`:@@reading.templates.imported:Plantilla «${result.ok ? result.value : ''}:name:» importada.`,
    );
    await this.load();
  }

  protected asText(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private report(result: { ok: true } | { ok: false; error: TemplatesError }): boolean {
    this.error.set(result.ok ? null : this.messages[result.error]);
    if (!result.ok) this.notice.set('');
    return result.ok;
  }

  private async load(): Promise<void> {
    this.templates.set(await this.service.list());
  }
}
