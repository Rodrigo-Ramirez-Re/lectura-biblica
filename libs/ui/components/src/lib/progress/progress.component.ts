import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * A progress bar with its value as text. The projected content is the visible caption
 * ("capítulo 4 de 150"); `label` names the bar for assistive technology.
 */
@Component({
  selector: 'lb-progress',
  template: `
    <div
      role="progressbar"
      class="h-2 w-full overflow-hidden rounded-pill bg-surface-subtle"
      aria-valuemin="0"
      [attr.aria-valuenow]="clamped()"
      [attr.aria-valuemax]="max()"
      [attr.aria-label]="label()"
    >
      <div class="h-full rounded-pill bg-primary" [style.width.%]="percent()"></div>
    </div>
    <div class="mt-1 text-body-sm text-on-surface-muted"><ng-content /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ProgressComponent {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly label = input.required<string>();

  protected readonly clamped = computed(() => Math.min(Math.max(this.value(), 0), this.max()));
  protected readonly percent = computed(() =>
    this.max() > 0 ? (this.clamped() / this.max()) * 100 : 0,
  );
}
