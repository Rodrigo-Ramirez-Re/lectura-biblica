import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import type { DayState, MonthDay, MonthDays, Streaks } from '@lectura/insights-domain';
import type { LocalDate } from '@lectura/shared-kernel';
import {
  CalendarHeatmapComponent,
  CardComponent,
  ChartTableComponent,
  type CalendarCell,
  type CalendarLegendItem,
} from '@lectura/ui-components';

/** How much of the day's pace was read, as a shade: a rest day read on counts as a full day. */
function level(day: MonthDay): CalendarCell['level'] {
  if (day.chapters === 0) return 0;
  if (day.expected === 0) return 3;
  const ratio = day.chapters / day.expected;
  return ratio < 0.5 ? 1 : ratio < 1 ? 2 : ratio < 2 ? 3 : 4;
}

/** "¿Qué tan constante soy?" (LB-024): streaks and the month's calendar. */
@Component({
  selector: 'lb-consistency-section',
  imports: [CalendarHeatmapComponent, CardComponent, ChartTableComponent],
  template: `
    <section lbCard aria-labelledby="consistency-title">
      <h2 id="consistency-title" class="text-heading-2" i18n="@@insights.consistency.title">
        ¿Qué tan constante soy?
      </h2>
      @if (streaks(); as streaks) {
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-card bg-surface-subtle p-3">
            <dt class="text-body-sm text-on-surface-muted" i18n="@@insights.consistency.current">
              Racha actual
            </dt>
            <dd class="text-heading-3" data-testid="streak-current">{{ days(streaks.current) }}</dd>
          </div>
          <div class="rounded-card bg-surface-subtle p-3">
            <dt class="text-body-sm text-on-surface-muted" i18n="@@insights.consistency.best">
              Mejor racha
            </dt>
            <dd class="text-heading-3" data-testid="streak-best">{{ days(streaks.best) }}</dd>
          </div>
        </dl>
        <p i18n="@@insights.consistency.month-days">
          {{ month().readDays }} de {{ month().readingDays }} días con lectura este mes.
        </p>
        <lb-calendar-heatmap
          [cells]="cells()"
          [firstWeekday]="firstWeekday()"
          [label]="monthName()"
          [legend]="legend"
        />
        <lb-chart-table [caption]="monthName()" [columns]="columns" [rows]="rows()" />
      } @else {
        <p i18n="@@insights.consistency.empty">Tus rachas empiezan con tu primer día de lectura.</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsistencySection {
  readonly streaks = input.required<Streaks | null>();
  readonly month = input.required<MonthDays>();
  readonly today = input.required<LocalDate>();

  private readonly locale = inject(LOCALE_ID);

  private readonly states: Record<DayState, string> = {
    read: $localize`:@@insights.consistency.state-read:Leído`,
    missed: $localize`:@@insights.consistency.state-missed:Sin leer`,
    today: $localize`:@@insights.consistency.state-today:Hoy, falta leer`,
    rest: $localize`:@@insights.consistency.state-rest:Sin lectura prevista`,
    upcoming: $localize`:@@insights.consistency.state-upcoming:Por venir`,
  };

  protected readonly legend: readonly CalendarLegendItem[] = [
    { tone: 'read', label: this.states.read },
    { tone: 'missed', label: this.states.missed },
    { tone: 'today', label: $localize`:@@insights.consistency.legend-today:Hoy` },
    { tone: 'rest', label: this.states.rest },
  ];

  protected readonly columns = [
    $localize`:@@insights.consistency.column-day:Día`,
    $localize`:@@insights.consistency.column-chapters:Capítulos`,
    $localize`:@@insights.consistency.column-state:Estado`,
  ];

  protected readonly firstWeekday = computed(() => this.month().days[0]?.day.dayOfWeek ?? 0);
  protected readonly monthName = computed(() => {
    const month = formatDate(this.today().toDate(), "MMMM 'de' y", this.locale);
    return $localize`:@@insights.consistency.calendar:Días de lectura de ${month}:month:`;
  });

  protected readonly cells = computed<CalendarCell[]>(() =>
    this.month().days.map((day) => ({
      day: day.day.day,
      level: level(day),
      tone: day.state,
      detail: this.detail(day),
    })),
  );

  protected readonly rows = computed(() =>
    this.month()
      .days.filter((day) => day.state !== 'upcoming')
      .map((day) => [this.date(day.day), day.chapters, this.states[day.state]]),
  );

  protected days(count: number): string {
    return count === 1
      ? $localize`:@@insights.consistency.one-day:1 día`
      : $localize`:@@insights.consistency.days:${count}:count: días`;
  }

  private detail(day: MonthDay): string {
    const date = this.date(day.day);
    const state = this.states[day.state];
    if (day.chapters === 0) return `${date}: ${state}`;
    const chapters =
      day.chapters === 1
        ? $localize`:@@insights.consistency.one-chapter:1 capítulo`
        : $localize`:@@insights.consistency.chapters:${day.chapters}:count: capítulos`;
    return `${date}: ${chapters}`;
  }

  private date(day: LocalDate): string {
    return formatDate(day.toDate(), "d 'de' MMMM", this.locale);
  }
}
