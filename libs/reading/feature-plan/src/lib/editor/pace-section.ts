import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { PlanSettings } from '@lectura/reading-domain';
import { CardComponent, StepperComponent } from '@lectura/ui-components';
import { WEEKDAYS, WEEK_ORDER } from '../plan-text';

type PaceFields = Pick<PlanSettings, 'chaptersPerDay' | 'restDays' | 'paceByWeekday'>;

/** "Ritmo" section of the plan editor (LB-015): the same pace with rest days, or one per weekday. */
@Component({
  selector: 'lb-pace-section',
  imports: [CardComponent, StepperComponent],
  template: `
    <section lbCard aria-labelledby="pace-title">
      <h2 id="pace-title" class="text-heading-2" i18n="@@reading.editor.pace">Ritmo</h2>
      <fieldset class="flex flex-col gap-1">
        <legend class="sr-only" i18n="@@reading.editor.pace-mode">Cómo es tu ritmo</legend>
        <label class="flex min-h-touch items-center gap-3">
          <input
            type="radio"
            name="pace-mode"
            class="size-5 accent-primary focus-visible:focus-ring"
            [checked]="!byWeekday()"
            (change)="useSamePace()"
          />
          <span i18n="@@reading.editor.pace-same">El mismo todos los días</span>
        </label>
        <label class="flex min-h-touch items-center gap-3">
          <input
            type="radio"
            name="pace-mode"
            class="size-5 accent-primary focus-visible:focus-ring"
            [checked]="byWeekday()"
            (change)="usePaceByWeekday()"
          />
          <span i18n="@@reading.editor.pace-by-weekday">Distinto cada día</span>
        </label>
      </fieldset>

      @if (byWeekday(); as week) {
        <p class="text-body-sm text-on-surface-muted" i18n="@@reading.editor.pace-zero-hint">
          0 capítulos es día de descanso.
        </p>
        @for (day of weekOrder; track day) {
          <lb-stepper
            [label]="weekdays[day]"
            [value]="week[day]"
            (valueChange)="setWeekday(day, $event)"
            [min]="0"
            [max]="150"
          />
        }
      } @else {
        <lb-stepper
          label="Capítulos al día"
          i18n-label="@@reading.editor.chapters-per-day"
          [value]="pace().chaptersPerDay"
          (valueChange)="changed.emit({ chaptersPerDay: $event })"
          [min]="1"
          [max]="150"
        />
        <fieldset class="flex flex-col gap-1">
          <legend class="text-body-sm font-semibold" i18n="@@reading.editor.rest-days">
            Días de descanso
          </legend>
          @for (day of weekOrder; track day) {
            <label class="flex min-h-touch items-center gap-3">
              <input
                type="checkbox"
                class="size-5 accent-primary focus-visible:focus-ring"
                [checked]="pace().restDays.includes(day)"
                (change)="toggleRest(day)"
              />
              <span class="capitalize">{{ weekdays[day] }}</span>
            </label>
          }
        </fieldset>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaceSection {
  readonly pace = input.required<PaceFields>();
  readonly changed = output<Partial<PlanSettings>>();

  protected readonly weekdays = WEEKDAYS;
  protected readonly weekOrder = WEEK_ORDER;
  protected readonly byWeekday = computed(() => this.pace().paceByWeekday);

  protected useSamePace(): void {
    this.changed.emit({ paceByWeekday: null });
  }

  // Starts from what the same-pace settings expect each day, so switching changes nothing yet.
  protected usePaceByWeekday(): void {
    const { chaptersPerDay, restDays } = this.pace();
    this.changed.emit({
      paceByWeekday: [0, 1, 2, 3, 4, 5, 6].map((day) =>
        restDays.includes(day) ? 0 : chaptersPerDay,
      ),
    });
  }

  protected setWeekday(day: number, amount: number): void {
    const week = [...(this.pace().paceByWeekday ?? [])];
    week[day] = amount;
    this.changed.emit({ paceByWeekday: week });
  }

  protected toggleRest(day: number): void {
    const rest = this.pace().restDays;
    this.changed.emit({
      restDays: rest.includes(day) ? rest.filter((d) => d !== day) : [...rest, day].sort(),
    });
  }
}
