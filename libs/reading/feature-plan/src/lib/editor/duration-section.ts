import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { BlockUnit, PlanSettings } from '@lectura/reading-domain';
import { CardComponent, StepperComponent } from '@lectura/ui-components';

/** "Duración" section of the plan editor (LB-016): how long to stay on each book. */
@Component({
  selector: 'lb-duration-section',
  imports: [CardComponent, StepperComponent],
  template: `
    <section lbCard aria-labelledby="duration-title">
      <h2 id="duration-title" class="text-heading-2" i18n="@@reading.editor.duration">
        Tiempo en cada libro
      </h2>
      <fieldset class="flex flex-col gap-1">
        <legend class="sr-only" i18n="@@reading.editor.duration-unit">Cómo se mide</legend>
        @for (option of options; track option.unit) {
          <label class="flex min-h-touch items-center gap-3">
            <input
              type="radio"
              name="duration-unit"
              class="size-5 accent-primary focus-visible:focus-ring"
              [checked]="block().unit === option.unit"
              (change)="changed.emit({ defaultBlock: { unit: option.unit, value: block().value } })"
            />
            <span>{{ option.label }}</span>
          </label>
        }
      </fieldset>
      <lb-stepper
        [label]="valueLabel()"
        [value]="block().value"
        (valueChange)="changed.emit({ defaultBlock: { unit: block().unit, value: $event } })"
        [min]="1"
        [max]="99"
      />
      <p class="text-body-sm text-on-surface-muted" i18n="@@reading.editor.duration-hint">
        Si un libro no alcanza a leerse una vez, su bloque se alarga hasta que quepa.
      </p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DurationSection {
  readonly block = input.required<PlanSettings['defaultBlock']>();
  readonly changed = output<Partial<PlanSettings>>();

  protected readonly options: readonly { unit: BlockUnit; label: string; value: string }[] = [
    {
      unit: 'month',
      label: $localize`:@@reading.editor.unit-month:Meses`,
      value: $localize`:@@reading.editor.value-months:Meses por libro`,
    },
    {
      unit: 'weeks',
      label: $localize`:@@reading.editor.unit-weeks:Semanas`,
      value: $localize`:@@reading.editor.value-weeks:Semanas por libro`,
    },
    {
      unit: 'days',
      label: $localize`:@@reading.editor.unit-days:Días`,
      value: $localize`:@@reading.editor.value-days:Días por libro`,
    },
    {
      unit: 'passes',
      label: $localize`:@@reading.editor.unit-passes:Hasta leerlo varias veces`,
      value: $localize`:@@reading.editor.value-passes:Veces que lo lees`,
    },
  ];

  protected readonly valueLabel = computed(
    () => this.options.find((option) => option.unit === this.block().unit)?.value ?? '',
  );
}
