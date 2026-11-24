import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  inject,
  input,
} from '@angular/core';

let nextId = 0;

/**
 * Label, optional hint and validation error around one control marked with `lbControl`.
 * Validation stays with the form; this only presents its result accessibly.
 */
@Component({
  selector: 'lb-form-field',
  template: `
    <div class="flex flex-col gap-1">
      <label class="text-body-sm font-semibold" [for]="controlId">{{ label() }}</label>
      <ng-content />
      @if (hint()) {
        <p class="text-body-sm text-on-surface-muted" [id]="hintId">{{ hint() }}</p>
      }
      @if (error()) {
        <p class="text-body-sm font-semibold text-danger" [id]="errorId">{{ error() }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();

  private readonly id = `lb-field-${nextId++}`;
  readonly controlId = `${this.id}-control`;
  readonly hintId = `${this.id}-hint`;
  readonly errorId = `${this.id}-error`;

  readonly describedBy = computed(() => {
    const ids = [this.hint() && this.hintId, this.error() && this.errorId].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });
}

/** Marks the input, textarea or select inside an `lb-form-field` and wires its ARIA. */
@Directive({
  selector: 'input[lbControl], textarea[lbControl], select[lbControl]',
  host: {
    class:
      'min-h-touch w-full rounded-control border border-border-strong bg-surface-raised px-3 py-2 ' +
      'text-body text-on-surface focus-visible:focus-ring aria-invalid:border-danger',
    '[id]': 'field.controlId',
    '[attr.aria-describedby]': 'field.describedBy()',
    '[attr.aria-invalid]': "field.error() ? 'true' : null",
  },
})
export class FormControlDirective {
  protected readonly field = inject(FormFieldComponent);
}
