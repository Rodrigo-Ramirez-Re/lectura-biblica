import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import type { OnPace } from '@lectura/insights-domain';
import type { LocalDate } from '@lectura/shared-kernel';
import {
  CardComponent,
  ChartTableComponent,
  LineChartComponent,
  type LineSeries,
} from '@lectura/ui-components';

/** "¿Voy al día?" (LB-023): this month's chapters read against the plan's. */
@Component({
  selector: 'lb-on-pace-section',
  imports: [CardComponent, ChartTableComponent, LineChartComponent],
  template: `
    <section lbCard aria-labelledby="on-pace-title">
      <h2 id="on-pace-title" class="text-heading-2" i18n="@@insights.on-pace.title">
        ¿Voy al día?
      </h2>
      @if (pace(); as pace) {
        @if (pace.read === 0 && pace.expected === 0) {
          <p i18n="@@insights.on-pace.empty">
            Este mes todavía no hay lectura que mostrar. Aparecerá con tu primer día de lectura.
          </p>
        } @else {
          <p class="text-heading-3" data-testid="on-pace-verdict">
            @if (pace.difference > 0) {
              <span i18n="@@insights.on-pace.ahead"
                >Vas
                {pace.difference, plural,
                  =1 {1 capítulo adelantado}
                  other {{{ pace.difference }} capítulos adelantado}
                }</span
              >
            } @else if (pace.difference < 0) {
              <span i18n="@@insights.on-pace.behind"
                >Vas
                {-pace.difference, plural,
                  =1 {1 capítulo atrasado}
                  other {{{ -pace.difference }} capítulos atrasado}
                }</span
              >
            } @else {
              <span i18n="@@insights.on-pace.even">Vas al día</span>
            }
            @if (absDays(); as days) {
              <span i18n="@@insights.on-pace.days"
                >&ngsp;({days, plural, =1 {1 día} other {{{ days }} días}})</span
              >
            }
          </p>
          <p i18n="@@insights.on-pace.totals">
            Llevas {{ pace.read }} de {{ pace.expected }} capítulos que tu plan espera este mes.
          </p>
          <lb-line-chart
            [series]="series()"
            [labels]="labels()"
            [axisLabels]="axisLabels()"
            [summary]="summary()"
          />
          <lb-chart-table [caption]="summary()" [columns]="columns" [rows]="rows()" />
        }
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnPaceSection {
  readonly pace = input.required<OnPace>();
  readonly today = input.required<LocalDate>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly columns = [
    $localize`:@@insights.on-pace.column-day:Día`,
    $localize`:@@insights.on-pace.column-read:Leídos`,
    $localize`:@@insights.on-pace.column-expected:Según el plan`,
  ];

  protected readonly absDays = computed(() => Math.abs(this.pace().days ?? 0));

  protected readonly labels = computed(() =>
    this.pace().series.map((point) => this.date(point.day, "d 'de' MMMM")),
  );
  protected readonly axisLabels = computed(() =>
    this.pace().series.map((point) => this.date(point.day, 'd MMM')),
  );

  protected readonly series = computed<LineSeries[]>(() => [
    {
      label: $localize`:@@insights.on-pace.series-read:Leídos`,
      values: this.pace().series.map((point) => point.read),
      style: 'solid',
    },
    {
      label: $localize`:@@insights.on-pace.series-expected:Según el plan`,
      values: this.pace().series.map((point) => point.expected),
      style: 'dashed',
    },
  ]);

  protected readonly summary = computed(() => {
    const month = this.date(this.today(), "MMMM 'de' y");
    return $localize`:@@insights.on-pace.summary:Capítulos acumulados de ${month}:month:, leídos y según el plan, día por día`;
  });

  protected readonly rows = computed(() =>
    this.pace().series.map((point, i) => [this.labels()[i] ?? '', point.read, point.expected]),
  );

  private date(day: LocalDate, format: string): string {
    return formatDate(day.toDate(), format, this.locale);
  }
}
