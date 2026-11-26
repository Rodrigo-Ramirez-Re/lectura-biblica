import { formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { niceScale } from './chart-scale';
import { trackHostWidth } from './chart-width';

export interface LineSeries {
  readonly label: string;
  readonly values: readonly number[];
  /** Series differ by dash as well as by colour, so colour is never the only cue. */
  readonly style: 'solid' | 'dashed';
}

const DEFAULT_WIDTH = 320;
const HEIGHT = 180;
const PAD = { top: 8, right: 8, bottom: 22, left: 30 };
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

/**
 * A hand-drawn SVG line chart (spec §4 chart rules). Hover, tap or the arrow keys show one point's
 * values; the equivalent data table (`lb-chart-table`) is what assistive technology reads.
 */
@Component({
  selector: 'lb-line-chart',
  template: `
    <div
      class="relative touch-pan-y rounded-card focus-visible:focus-ring"
      tabindex="0"
      role="img"
      [attr.aria-label]="summary()"
      (keydown)="onKey($event)"
      (blur)="active.set(null)"
    >
      <svg
        [attr.viewBox]="viewBox()"
        class="block h-auto w-full overflow-visible"
        aria-hidden="true"
        focusable="false"
        (pointermove)="onPointer($event)"
        (pointerdown)="onPointer($event)"
        (pointerleave)="onLeave($event)"
      >
        @for (tick of ticks(); track tick.value) {
          <line
            class="stroke-border"
            [attr.x1]="pad.left"
            [attr.x2]="width() - pad.right"
            [attr.y1]="tick.y"
            [attr.y2]="tick.y"
          />
          <text
            class="fill-on-surface-muted text-caption"
            text-anchor="end"
            dominant-baseline="middle"
            [attr.x]="pad.left - 4"
            [attr.y]="tick.y"
          >
            {{ tick.text }}
          </text>
        }
        @for (tick of xTicks(); track tick.index) {
          <text
            class="fill-on-surface-muted text-caption"
            [attr.text-anchor]="tick.anchor"
            [attr.x]="tick.x"
            [attr.y]="height - 4"
          >
            {{ tick.text }}
          </text>
        }
        @for (line of lines(); track line.label) {
          <path
            fill="none"
            stroke-width="2.5"
            stroke-linejoin="round"
            stroke-linecap="round"
            [class]="line.style === 'solid' ? 'stroke-primary' : 'stroke-accent'"
            [attr.stroke-dasharray]="line.style === 'dashed' ? '6 4' : null"
            [attr.d]="line.d"
          />
        }
        @if (activePoint(); as point) {
          <line
            class="stroke-border-strong"
            [attr.x1]="point.x"
            [attr.x2]="point.x"
            [attr.y1]="pad.top"
            [attr.y2]="height - pad.bottom"
          />
          @for (dot of point.dots; track dot.label) {
            <circle
              r="4"
              [class]="dot.style === 'solid' ? 'fill-primary' : 'fill-accent'"
              [attr.cx]="point.x"
              [attr.cy]="dot.y"
            />
          }
        }
      </svg>
      @if (activePoint(); as point) {
        <div
          class="pointer-events-none absolute top-0 z-10 w-max rounded-control border border-border bg-surface-raised px-2 py-1 text-body-sm shadow-card"
          [style.left.%]="point.left"
          [style.transform]="point.left > 50 ? 'translateX(-100%)' : 'none'"
          data-testid="chart-tooltip"
        >
          <p class="font-semibold">{{ point.label }}</p>
          @for (dot of point.dots; track dot.label) {
            <p>{{ dot.label }}: {{ dot.text }}</p>
          }
        </div>
      }
    </div>
    <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-body-sm" aria-hidden="true">
      @for (line of series(); track line.label) {
        <li class="flex items-center gap-2">
          <svg viewBox="0 0 24 8" class="h-2 w-6" focusable="false">
            <line
              x1="1"
              y1="4"
              x2="23"
              y2="4"
              stroke-width="2.5"
              [class]="line.style === 'solid' ? 'stroke-primary' : 'stroke-accent'"
              [attr.stroke-dasharray]="line.style === 'dashed' ? '6 4' : null"
            />
          </svg>
          {{ line.label }}
        </li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class LineChartComponent {
  readonly series = input.required<readonly LineSeries[]>();
  /** One label per point, e.g. "3 de diciembre"; the axis shows the first, middle and last. */
  readonly labels = input.required<readonly string[]>();
  /** Short axis labels; defaults to `labels`. */
  readonly axisLabels = input<readonly string[] | null>(null);
  /** What the chart shows, in one sentence, for assistive technology. */
  readonly summary = input.required<string>();

  private readonly locale = inject(LOCALE_ID);

  constructor() {
    trackHostWidth(this.width);
  }

  /** The drawn width in CSS pixels, so text and strokes keep their size on any screen. */
  protected readonly width = signal(DEFAULT_WIDTH);
  protected readonly height = HEIGHT;
  protected readonly pad = PAD;
  protected readonly viewBox = computed(() => `0 0 ${this.width()} ${HEIGHT}`);
  protected readonly active = signal<number | null>(null);

  private readonly count = computed(() => this.labels().length);
  private readonly scale = computed(() =>
    niceScale(Math.max(0, ...this.series().flatMap((line) => line.values))),
  );

  protected readonly ticks = computed(() => {
    const { top, step } = this.scale();
    const ticks = [];
    for (let value = 0; value <= top; value += step)
      ticks.push({ value, y: this.y(value), text: this.format(value) });
    return ticks;
  });

  protected readonly xTicks = computed(() => {
    const labels = this.axisLabels() ?? this.labels();
    const last = labels.length - 1;
    const indexes = [...new Set([0, Math.round(last / 2), last])].filter((i) => i >= 0);
    return indexes.map((index) => ({
      index,
      x: this.x(index),
      text: labels[index] ?? '',
      anchor: index === 0 && last > 0 ? 'start' : index === last && last > 0 ? 'end' : 'middle',
    }));
  });

  protected readonly lines = computed(() =>
    this.series().map((line) => ({
      ...line,
      d: line.values
        .map((value, i) => `${i ? 'L' : 'M'}${this.x(i).toFixed(1)} ${this.y(value).toFixed(1)}`)
        .join(' '),
    })),
  );

  protected readonly activePoint = computed(() => {
    const index = this.active();
    if (index === null || index >= this.count()) return null;
    const x = this.x(index);
    return {
      x,
      left: (x / this.width()) * 100,
      label: this.labels()[index] ?? '',
      dots: this.series().map((line) => {
        const value = line.values[index] ?? 0;
        return { label: line.label, style: line.style, y: this.y(value), text: this.format(value) };
      }),
    };
  });

  protected onPointer(event: PointerEvent): void {
    const box = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    if (!box.width || this.count() === 0) return;
    const x = ((event.clientX - box.left) / box.width) * this.width();
    this.active.set(this.indexAt(x));
  }

  // A finger lifting also "leaves"; keep the tapped point visible until the next tap.
  protected onLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.active.set(null);
  }

  protected onKey(event: KeyboardEvent): void {
    const last = this.count() - 1;
    if (last < 0) return;
    const current = this.active();
    const moves: Record<string, number> = {
      ArrowRight: Math.min(last, (current ?? -1) + 1),
      ArrowLeft: Math.max(0, (current ?? last + 1) - 1),
      Home: 0,
      End: last,
    };
    if (event.key === 'Escape') {
      this.active.set(null);
      return;
    }
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    this.active.set(next);
  }

  private indexAt(x: number): number {
    const last = this.count() - 1;
    if (last <= 0) return 0;
    const index = Math.round(((x - PAD.left) / this.plotWidth()) * last);
    return Math.min(last, Math.max(0, index));
  }

  private x(index: number): number {
    const last = this.count() - 1;
    const plot = this.plotWidth();
    return last <= 0 ? PAD.left + plot / 2 : PAD.left + (index / last) * plot;
  }

  private plotWidth(): number {
    return this.width() - PAD.left - PAD.right;
  }

  private y(value: number): number {
    return PAD.top + PLOT_H * (1 - value / this.scale().top);
  }

  private format(value: number): string {
    return formatNumber(value, this.locale, '1.0-1');
  }
}
