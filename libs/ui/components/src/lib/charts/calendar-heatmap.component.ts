import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  signal,
  viewChildren,
} from '@angular/core';

/** What a day was: each has its own symbol, so the calendar never relies on shade alone. */
export type CalendarTone = 'read' | 'missed' | 'today' | 'rest' | 'upcoming';

export interface CalendarCell {
  /** Day of the month, 1 to 31. */
  readonly day: number;
  /** Shade from 0 (nothing) to 4 (the most). */
  readonly level: 0 | 1 | 2 | 3 | 4;
  readonly tone: CalendarTone;
  /** The whole day in words, e.g. "3 de diciembre: 5 capítulos". */
  readonly detail: string;
}

export interface CalendarLegendItem {
  readonly tone: CalendarTone;
  readonly label: string;
}

const SYMBOLS: Record<CalendarTone, readonly string[]> = {
  read: ['M20 6 9 17l-5-5'],
  missed: ['M18 6 6 18', 'm6 6 12 12'],
  today: ['M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z'],
  rest: ['M6 12h12'],
  upcoming: [],
};

const SHADES = [
  'bg-surface-subtle',
  'bg-primary/25',
  'bg-primary/50',
  'bg-primary/75',
  'bg-primary',
];

/**
 * A month as a calendar, Monday first like es-MX calendars (LB-024). Each day is a button: tap,
 * click or the arrow keys show its detail; only one day is in the tab order at a time.
 */
@Component({
  selector: 'lb-calendar-heatmap',
  template: `
    <div role="group" [attr.aria-label]="label()">
      <div
        class="grid grid-cols-7 gap-1 text-center text-caption text-on-surface-muted"
        aria-hidden="true"
      >
        <span i18n="@@ui.calendar.monday">L</span>
        <span i18n="@@ui.calendar.tuesday">M</span>
        <span i18n="@@ui.calendar.wednesday">M</span>
        <span i18n="@@ui.calendar.thursday">J</span>
        <span i18n="@@ui.calendar.friday">V</span>
        <span i18n="@@ui.calendar.saturday">S</span>
        <span i18n="@@ui.calendar.sunday">D</span>
      </div>
      <div class="mt-1 grid grid-cols-7 gap-1">
        @for (blank of blanks(); track $index) {
          <span></span>
        }
        @for (cell of cells(); track cell.day; let i = $index) {
          <button
            #day
            type="button"
            class="flex min-h-touch flex-col items-center justify-center gap-0.5 rounded-control p-0.5 focus-visible:focus-ring"
            [class.ring-2]="selected() === i"
            [class.ring-border-strong]="selected() === i"
            [attr.aria-label]="cell.detail"
            [tabindex]="i === focus() ? 0 : -1"
            (click)="select(i)"
            (keydown)="onKey($event)"
            (focus)="focus.set(i)"
          >
            <span class="text-caption" aria-hidden="true">{{ cell.day }}</span>
            <span
              class="flex size-6 items-center justify-center rounded-control"
              [class]="shade(cell.level)"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                focusable="false"
                class="size-4"
                [class]="ink(cell)"
              >
                @for (d of symbol(cell.tone); track $index) {
                  <path [attr.d]="d" />
                }
              </svg>
            </span>
          </button>
        }
      </div>
      <p class="mt-2 min-h-6 text-body-sm" aria-live="polite">{{ detail() }}</p>
    </div>
    <ul class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-body-sm" aria-hidden="true">
      @for (item of legend(); track item.tone) {
        <li class="flex items-center gap-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            focusable="false"
            class="size-4"
            [class.text-danger]="item.tone === 'missed'"
          >
            @for (d of symbol(item.tone); track $index) {
              <path [attr.d]="d" />
            }
          </svg>
          {{ item.label }}
        </li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class CalendarHeatmapComponent {
  readonly cells = input.required<readonly CalendarCell[]>();
  /** Day of the week of the 1st: 0 is Sunday, as in `Date.getDay()`. */
  readonly firstWeekday = input.required<number>();
  readonly label = input.required<string>();
  readonly legend = input<readonly CalendarLegendItem[]>([]);

  protected readonly selected = signal<number | null>(null);
  protected readonly focus = signal(0);
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('day');

  protected readonly blanks = computed(() => Array.from({ length: (this.firstWeekday() + 6) % 7 }));
  protected readonly detail = computed(() => {
    const index = this.selected();
    return index === null ? '' : (this.cells()[index]?.detail ?? '');
  });

  protected shade(level: CalendarCell['level']): string {
    return SHADES[level] ?? SHADES[0];
  }

  protected ink(cell: CalendarCell): string {
    if (cell.level >= 3) return 'text-on-primary';
    return cell.tone === 'missed' ? 'text-danger' : 'text-on-surface';
  }

  protected symbol(tone: CalendarTone): readonly string[] {
    return SYMBOLS[tone];
  }

  protected select(index: number): void {
    this.selected.set(index);
    this.focus.set(index);
  }

  protected onKey(event: KeyboardEvent): void {
    const last = this.cells().length - 1;
    const current = this.focus();
    const moves: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      ArrowDown: current + 7,
      ArrowUp: current - 7,
      Home: 0,
      End: last,
    };
    const target = moves[event.key];
    if (target === undefined || target < 0 || target > last) return;
    event.preventDefault();
    this.select(target);
    this.buttons()[target]?.nativeElement.focus();
  }
}
