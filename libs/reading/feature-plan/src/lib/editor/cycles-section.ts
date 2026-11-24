import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import type { PlanSettings } from '@lectura/reading-domain';
import { ButtonComponent, CardComponent, StepperComponent } from '@lectura/ui-components';

/**
 * "Ciclos" section of the plan editor (LB-019): repeat the journey without limit or a number of
 * times, and restart the cycle (an action of its own, confirmed, not part of the draft).
 */
@Component({
  selector: 'lb-cycles-section',
  imports: [ButtonComponent, CardComponent, StepperComponent],
  template: `
    <section lbCard aria-labelledby="cycles-title">
      <h2 id="cycles-title" class="text-heading-2" i18n="@@reading.editor.cycles">Ciclos</h2>
      <fieldset class="flex flex-col gap-1">
        <legend class="sr-only" i18n="@@reading.editor.cycles-legend">Cuántas veces repetir</legend>
        <label class="flex min-h-touch items-center gap-3">
          <input
            type="radio"
            name="cycles"
            class="size-5 accent-primary focus-visible:focus-ring"
            [checked]="cyclesTarget() === null"
            (change)="changed.emit({ cyclesTarget: null })"
          />
          <span i18n="@@reading.editor.cycles-unlimited">Repetir sin límite</span>
        </label>
        <label class="flex min-h-touch items-center gap-3">
          <input
            type="radio"
            name="cycles"
            class="size-5 accent-primary focus-visible:focus-ring"
            [checked]="cyclesTarget() !== null"
            (change)="changed.emit({ cyclesTarget: 1 })"
          />
          <span i18n="@@reading.editor.cycles-limited">Un número de ciclos</span>
        </label>
      </fieldset>
      @if (cyclesTarget(); as target) {
        <lb-stepper
          label="Número de ciclos"
          i18n-label="@@reading.editor.cycles-count"
          [value]="target"
          (valueChange)="changed.emit({ cyclesTarget: $event })"
          [min]="1"
          [max]="99"
        />
      }

      @if (confirming()) {
        <div
          role="group"
          aria-labelledby="restart-question"
          class="flex flex-col gap-2 rounded-card bg-surface-subtle p-3"
        >
          <p id="restart-question" class="font-semibold" i18n="@@reading.editor.restart-question">
            ¿Empezar un ciclo nuevo hoy con el primer libro? Tu historial se conserva.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              lbButton
              type="button"
              (click)="restart.emit()"
              i18n="@@reading.editor.restart-confirm"
            >
              Sí, reiniciar
            </button>
            <button
              lbButton
              variant="ghost"
              type="button"
              (click)="confirming.set(false)"
              i18n="@@reading.editor.restart-cancel"
            >
              No
            </button>
          </div>
        </div>
      } @else {
        <button
          lbButton
          variant="secondary"
          type="button"
          class="self-start"
          (click)="confirming.set(true)"
          i18n="@@reading.editor.restart"
        >
          Reiniciar el ciclo
        </button>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CyclesSection {
  readonly cyclesTarget = input.required<number | null>();
  readonly changed = output<Partial<PlanSettings>>();
  readonly restart = output<void>();

  protected readonly confirming = signal(false);
}
