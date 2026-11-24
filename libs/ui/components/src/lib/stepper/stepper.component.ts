import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

let nextId = 0;

/** A whole number changed with − / + or by typing, kept within `min` and `max`. */
@Component({
  selector: 'lb-stepper',
  imports: [ButtonComponent],
  template: `
    <label class="text-body-sm font-semibold" [for]="inputId">{{ label() }}</label>
    <div class="mt-1 flex items-center gap-2">
      <button
        lbButton
        variant="secondary"
        type="button"
        [disabled]="value() <= min()"
        (click)="change(value() - 1)"
        aria-label="Menos"
        i18n-aria-label="@@ui.stepper.decrease"
        [attr.aria-controls]="inputId"
      >
        −
      </button>
      <input
        type="number"
        inputmode="numeric"
        class="min-h-touch w-20 rounded-control border border-border-strong bg-surface-raised px-3 text-center text-body text-on-surface focus-visible:focus-ring"
        [id]="inputId"
        [min]="min()"
        [max]="max()"
        [value]="value()"
        (change)="change(asNumber($event))"
      />
      <button
        lbButton
        variant="secondary"
        type="button"
        [disabled]="value() >= max()"
        (click)="change(value() + 1)"
        aria-label="Más"
        i18n-aria-label="@@ui.stepper.increase"
        [attr.aria-controls]="inputId"
      >
        +
      </button>
    </div>
    <p class="sr-only" aria-live="polite">{{ announcement() }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class StepperComponent {
  readonly value = model.required<number>();
  readonly label = input.required<string>();
  readonly min = input(1);
  readonly max = input(Number.MAX_SAFE_INTEGER);

  protected readonly inputId = `lb-stepper-${nextId++}`;
  protected readonly announcement = computed(() => `${this.label()}: ${this.value()}`);

  protected change(next: number): void {
    if (Number.isNaN(next)) return;
    this.value.set(Math.min(Math.max(Math.round(next), this.min()), this.max()));
  }

  protected asNumber(event: Event): number {
    return (event.target as HTMLInputElement).valueAsNumber;
  }
}
