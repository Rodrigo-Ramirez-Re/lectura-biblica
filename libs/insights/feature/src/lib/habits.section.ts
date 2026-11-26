import { formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import type { Habits } from '@lectura/insights-domain';
import {
  CardComponent,
  ChartTableComponent,
  ColumnChartComponent,
  type ColumnItem,
  type ColumnReference,
} from '@lectura/ui-components';

/** "¿Cómo leo?" (LB-027): chapters per weekday, the 7-day average and days without reading. */
@Component({
  selector: 'lb-habits-section',
  imports: [CardComponent, ChartTableComponent, ColumnChartComponent],
  template: `
    <section lbCard aria-labelledby="habits-title">
      <h2 id="habits-title" class="text-heading-2" i18n="@@insights.habits.title">¿Cómo leo?</h2>
      @if (habits(); as habits) {
        @if (habits.kind === 'habits') {
          <ul class="flex flex-col gap-1">
            <li data-testid="habits-last7">{{ last7() }}</li>
            <li data-testid="habits-zero">{{ zeroDays() }}</li>
          </ul>
          <lb-column-chart [items]="items()" [reference]="reference()" [summary]="summary" />
          <lb-chart-table [caption]="summary" [columns]="columns" [rows]="rows()" />
        } @else {
          <p i18n="@@insights.habits.too-early">
            Con una semana de lectura verás qué días de la semana lees más.
          </p>
        }
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitsSection {
  readonly habits = input.required<Habits>();

  private readonly locale = inject(LOCALE_ID);

  private readonly short: Record<number, string> = {
    1: $localize`:@@insights.habits.mon:lun`,
    2: $localize`:@@insights.habits.tue:mar`,
    3: $localize`:@@insights.habits.wed:mié`,
    4: $localize`:@@insights.habits.thu:jue`,
    5: $localize`:@@insights.habits.fri:vie`,
    6: $localize`:@@insights.habits.sat:sáb`,
    0: $localize`:@@insights.habits.sun:dom`,
  };
  private readonly long: Record<number, string> = {
    1: $localize`:@@insights.habits.monday:Lunes`,
    2: $localize`:@@insights.habits.tuesday:Martes`,
    3: $localize`:@@insights.habits.wednesday:Miércoles`,
    4: $localize`:@@insights.habits.thursday:Jueves`,
    5: $localize`:@@insights.habits.friday:Viernes`,
    6: $localize`:@@insights.habits.saturday:Sábado`,
    0: $localize`:@@insights.habits.sunday:Domingo`,
  };

  protected readonly summary = $localize`:@@insights.habits.summary:Capítulos en promedio por día de la semana, de lunes a domingo`;
  protected readonly columns = [
    $localize`:@@insights.habits.column-day:Día`,
    $localize`:@@insights.habits.column-average:Capítulos en promedio`,
  ];

  private readonly data = computed(() => {
    const habits = this.habits();
    return habits.kind === 'habits' ? habits : null;
  });

  protected readonly items = computed<ColumnItem[]>(
    () =>
      this.data()?.weekdays.map((day) => ({
        label: this.short[day.weekday] ?? '',
        value: day.average,
        text: this.number(day.average),
      })) ?? [],
  );

  protected readonly reference = computed<ColumnReference | null>(() => {
    const data = this.data();
    if (!data) return null;
    const average = this.number(data.dailyAverage);
    return {
      value: data.dailyAverage,
      label: $localize`:@@insights.habits.daily-average:Tu promedio diario: ${average}:average: capítulos`,
    };
  });

  protected readonly rows = computed(
    () =>
      this.data()?.weekdays.map((day) => [
        this.long[day.weekday] ?? '',
        this.number(day.average),
      ]) ?? [],
  );

  protected readonly last7 = computed(() => {
    const average = this.number(this.data()?.last7Average ?? 0);
    return $localize`:@@insights.habits.last7:Promedio de 7 días: ${average}:average: capítulos al día`;
  });

  protected readonly zeroDays = computed(() => {
    const days = this.data()?.zeroDays ?? 0;
    if (days === 0)
      return $localize`:@@insights.habits.zero-none:Ningún día sin leer en los últimos 30.`;
    if (days === 1) return $localize`:@@insights.habits.zero-one:1 día sin leer en los últimos 30.`;
    return $localize`:@@insights.habits.zero-many:${days}:days: días sin leer en los últimos 30.`;
  });

  private number(value: number): string {
    return formatNumber(value, this.locale, '1.0-1');
  }
}
