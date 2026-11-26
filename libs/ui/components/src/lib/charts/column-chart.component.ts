import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { niceScale } from './chart-scale';

export interface ColumnItem {
  readonly label: string;
  readonly value: number;
  /** The value as written above its column ("3.5"). */
  readonly text: string;
}

export interface ColumnReference {
  readonly value: number;
  /** Named in the legend, e.g. "Promedio diario: 3.4". */
  readonly label: string;
}

const HEIGHT = 170;
const PAD = { top: 20, right: 4, bottom: 22, left: 4 };
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

/**
 * Vertical columns with their values written above them and an optional dashed reference line
 * (LB-027). Every value is printed, so there is nothing to reveal on hover; the equivalent table
 * (`lb-chart-table`) is what assistive technology reads.
 */
@Component({
  selector: 'lb-column-chart',
  template: `
    <div role="img" [attr.aria-label]="summary()">
      <svg
        [attr.viewBox]="'0 0 ' + width() + ' ' + height"
        class="block h-auto w-full overflow-visible"
        aria-hidden="true"
        focusable="false"
      >
        <line
          class="stroke-border-strong"
          [attr.x1]="pad.left"
          [attr.x2]="width() - pad.right"
          [attr.y1]="height - pad.bottom"
          [attr.y2]="height - pad.bottom"
        />
        @for (column of columns(); track column.label + $index) {
          <rect
            class="fill-primary"
            rx="3"
            [attr.x]="column.x"
            [attr.y]="column.y"
            [attr.width]="column.width"
            [attr.height]="column.height"
          />
          <text
            class="fill-on-surface text-caption"
            text-anchor="middle"
            [attr.x]="column.center"
            [attr.y]="column.y - 4"
          >
            {{ column.text }}
          </text>
          <text
            class="fill-on-surface-muted text-caption"
            text-anchor="middle"
            [attr.x]="column.center"
            [attr.y]="height - 6"
          >
            {{ column.label }}
          </text>
        }
        @if (referenceY(); as y) {
          <line
            class="stroke-accent"
            stroke-width="2"
            stroke-dasharray="6 4"
            [attr.x1]="pad.left"
            [attr.x2]="width() - pad.right"
            [attr.y1]="y"
            [attr.y2]="y"
          />
        }
      </svg>
    </div>
    @if (reference(); as reference) {
      <p class="mt-2 flex items-center gap-2 text-body-sm" aria-hidden="true">
        <svg viewBox="0 0 24 8" class="h-2 w-6" focusable="false">
          <line
            x1="1"
            y1="4"
            x2="23"
            y2="4"
            class="stroke-accent"
            stroke-width="2"
            stroke-dasharray="6 4"
          />
        </svg>
        {{ reference.label }}
      </p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ColumnChartComponent {
  readonly items = input.required<readonly ColumnItem[]>();
  readonly reference = input<ColumnReference | null>(null);
  /** What the chart shows, in one sentence, for assistive technology. */
  readonly summary = input.required<string>();

  protected readonly height = HEIGHT;
  protected readonly pad = PAD;
  /** The drawn width in CSS pixels, so text keeps its size on any screen. */
  protected readonly width = signal(320);

  private readonly top = computed(
    () =>
      niceScale(
        Math.max(0, ...this.items().map((item) => item.value), this.reference()?.value ?? 0),
      ).top,
  );

  protected readonly columns = computed(() => {
    const items = this.items();
    const slot = (this.width() - PAD.left - PAD.right) / Math.max(1, items.length);
    const barWidth = Math.min(40, slot * 0.6);
    return items.map((item, i) => {
      const center = PAD.left + slot * (i + 0.5);
      const height = (item.value / this.top()) * PLOT_H;
      return {
        ...item,
        center,
        x: center - barWidth / 2,
        width: barWidth,
        height,
        y: HEIGHT - PAD.bottom - height,
      };
    });
  });

  protected readonly referenceY = computed(() => {
    const reference = this.reference();
    return reference ? HEIGHT - PAD.bottom - (reference.value / this.top()) * PLOT_H : null;
  });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => {
        const width = Math.round(entry?.contentRect.width ?? 0);
        if (width > 0) this.width.set(width);
      });
      observer.observe(host);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
