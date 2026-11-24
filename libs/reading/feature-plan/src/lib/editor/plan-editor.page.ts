import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GetPlan, UpdatePlan, type UpdatePlanError } from '@lectura/reading-application';
import { planSettings, type PlanSettings } from '@lectura/reading-domain';
import { ButtonComponent, FormControlDirective, FormFieldComponent } from '@lectura/ui-components';
import { DurationSection } from './duration-section';
import { PaceSection } from './pace-section';

/**
 * The plan editor (`/plan/editar`): a draft of the plan's settings, saved at once with
 * "Guardar cambios". Each story adds its own section (LB-015 onwards).
 */
@Component({
  selector: 'lb-plan-editor-page',
  imports: [
    RouterLink,
    ButtonComponent,
    FormFieldComponent,
    FormControlDirective,
    PaceSection,
    DurationSection,
  ],
  template: `
    <h1 class="font-display text-heading-1" i18n="@@reading.editor.title">Editar plan</h1>

    @if (draft(); as plan) {
      <form class="mt-section flex flex-col gap-section" (submit)="save($event)" novalidate>
        <lb-form-field label="Nombre del plan" i18n-label="@@reading.editor.name">
          <input
            lbControl
            type="text"
            autocomplete="off"
            [value]="plan.name"
            (input)="patch({ name: asText($event) })"
          />
        </lb-form-field>

        <lb-pace-section [pace]="plan" (changed)="patch($event)" />
        <lb-duration-section [block]="plan.defaultBlock" (changed)="patch($event)" />

        @if (error(); as message) {
          <p role="alert" class="font-semibold text-danger">{{ message }}</p>
        }

        <div class="flex flex-wrap gap-2">
          <button lbButton type="submit" [disabled]="saving()" i18n="@@reading.editor.save">
            Guardar cambios
          </button>
          <a lbButton variant="ghost" routerLink="/plan" i18n="@@reading.editor.cancel">Cancelar</a>
        </div>
      </form>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanEditorPage {
  private readonly updatePlan = inject(UpdatePlan);
  private readonly router = inject(Router);

  protected readonly draft = signal<PlanSettings | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);

  private readonly messages: Record<UpdatePlanError, string> = {
    'no-plan': $localize`:@@reading.editor.error-no-plan:Todavía no tienes un plan. Empieza en Hoy.`,
    'empty-name': $localize`:@@reading.editor.error-name:Escribe un nombre para el plan.`,
    'invalid-pace': $localize`:@@reading.editor.error-pace:Revisa el ritmo: usa números enteros de capítulos.`,
    'no-reading-days': $localize`:@@reading.editor.error-no-days:Elige al menos un día de lectura.`,
    'invalid-duration': $localize`:@@reading.editor.error-duration:Revisa la duración de cada libro.`,
    'invalid-order': $localize`:@@reading.editor.error-order:Deja al menos un libro en el plan.`,
  };

  constructor() {
    void inject(GetPlan)
      .execute()
      .then((plan) => this.draft.set(plan && planSettings(plan)));
  }

  protected patch(changes: Partial<PlanSettings>): void {
    this.draft.update((draft) => draft && { ...draft, ...changes });
    this.error.set(null);
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    const draft = this.draft();
    if (!draft) return;
    this.saving.set(true);
    const result = await this.updatePlan.execute(draft);
    this.saving.set(false);
    if (result.ok) await this.router.navigateByUrl('/plan');
    else this.error.set(this.messages[result.error]);
  }

  protected asText(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
