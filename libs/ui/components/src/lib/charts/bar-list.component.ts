import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface BarItem {
  readonly label: string;
  readonly value: number;
  /** The exact value in words, always shown next to the bar ("1 vuelta y 40 % de la siguiente"). */
  readonly text: string;
}

/**
 * Horizontal bars as a list (LB-025): each row says its label and exact value in text, so the
 * bars add the comparison and never hold information of their own. One scale, 0 to the largest.
 */
@Component({
  selector: 'lb-bar-list',
  template: `
    <ul class="flex flex-col gap-2" [attr.aria-label]="summary()">
      @for (bar of bars(); track bar.label) {
        <li>
          <p class="flex flex-wrap justify-between gap-x-2 text-body-sm">
            <span class="font-semibold">{{ bar.label }}</span>&ngsp;
            <span class="text-on-surface-muted">{{ bar.text }}</span>
          </p>
          <div class="mt-1 h-3 w-full rounded-pill bg-surface-subtle" aria-hidden="true">
            <div class="h-full min-w-1 rounded-pill bg-primary" [style.width.%]="bar.percent"></div>
          </div>
        </li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class BarListComponent {
  readonly items = input.required<readonly BarItem[]>();
  readonly summary = input.required<string>();

  protected readonly bars = computed(() => {
    const max = Math.max(0, ...this.items().map((item) => item.value));
    return this.items().map((item) => ({
      ...item,
      percent: max > 0 ? (item.value / max) * 100 : 0,
    }));
  });
}
