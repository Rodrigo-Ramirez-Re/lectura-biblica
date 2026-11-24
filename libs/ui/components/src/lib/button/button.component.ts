import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

const BASE =
  'inline-flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-control ' +
  'font-body font-semibold transition-colors motion-reduce:transition-none ' +
  'focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-strong',
  secondary:
    'border border-primary bg-transparent text-primary hover:bg-primary hover:text-on-primary',
  ghost: 'bg-transparent text-primary hover:bg-surface-subtle',
  danger: 'bg-transparent text-danger border border-danger hover:bg-surface-subtle',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'px-4 py-2 text-body-sm',
  lg: 'px-6 py-3 text-body',
};

/** Styles a native `<button>` or `<a>`, so semantics and keyboard behaviour stay native. */
@Component({
  selector: 'button[lbButton], a[lbButton]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');

  protected readonly classes = computed(
    () => `${BASE} ${VARIANTS[this.variant()]} ${SIZES[this.size()]}`,
  );
}
