import { formatDate, formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import type { CycleProgress, FinishEstimate } from '@lectura/insights-domain';
import type { LocalDate } from '@lectura/shared-kernel';
import { CardComponent, ProgressComponent } from '@lectura/ui-components';

/** "¿Cuánto llevo del ciclo?" and "¿Cuándo termino?" (LB-026). */
@Component({
  selector: 'lb-cycle-section',
  imports: [CardComponent, ProgressComponent],
  template: `
    <section lbCard aria-labelledby="cycle-title">
      <h2 id="cycle-title" class="text-heading-2" i18n="@@insights.cycle.title">
        ¿Cuánto llevo del ciclo?
      </h2>
      @if (cycle().complete) {
        <p class="text-heading-3" i18n="@@insights.cycle.complete">
          ¡Completaste tu recorrido! Leíste todos los ciclos de tu plan.
        </p>
      } @else {
        <lb-progress [value]="cycle().finished" [max]="cycle().total" [label]="barLabel()">
          <span i18n="@@insights.cycle.books"
            >{{ cycle().finished }} de {{ cycle().total }} libros</span
          >
        </lb-progress>
        @if (cycle().paused) {
          <p i18n="@@insights.cycle.paused">
            Tu plan está en pausa: la fecha de fin se moverá cuando lo reanudes.
          </p>
        } @else {
          <p data-testid="cycle-end">
            <span i18n="@@insights.cycle.end"
              >Según tu plan, este ciclo termina el {{ endText() }}</span
            >&ngsp;<span i18n="@@insights.cycle.months-left"
              >({cycle().monthsLeft, plural,
                =1 {falta este mes}
                other {faltan {{ cycle().monthsLeft }} meses, contando este}

              }).</span
            >
          </p>
        }

        <h3 class="text-heading-3" i18n="@@insights.finish.title">¿Cuándo termino?</h3>
        @switch (finish().kind) {
          @case ('estimate') {
            <p data-testid="finish-estimate">{{ estimateText() }}</p>
          }
          @case ('too-early') {
            <p i18n="@@insights.finish.too-early">
              Con una semana de lectura podré estimar cuándo terminas el ciclo.
            </p>
          }
          @case ('too-little') {
            <p i18n="@@insights.finish.too-little">
              No hay suficiente lectura en los últimos 30 días para estimar cuándo terminarías.
            </p>
          }
          @case ('paused') {
            <p i18n="@@insights.finish.paused">Al reanudar tu plan volveré a estimarlo.</p>
          }
        }
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CycleSection {
  readonly cycle = input.required<CycleProgress>();
  readonly finish = input.required<FinishEstimate>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly barLabel = computed(
    () => $localize`:@@insights.cycle.bar:Libros terminados del ciclo ${this.cycle().cycle}:cycle:`,
  );
  protected readonly endText = computed(() => this.date(this.cycle().end));

  protected readonly estimateText = computed(() => {
    const finish = this.finish();
    if (finish.kind !== 'estimate') return '';
    const pace = formatNumber(finish.pace, this.locale, '1.0-1');
    const end = this.date(finish.end);
    return finish.days >= 30
      ? $localize`:@@insights.finish.estimate:A tu ritmo de los últimos 30 días (${pace}:pace: capítulos al día), terminarías este ciclo el ${end}:end:.`
      : $localize`:@@insights.finish.estimate-since:A tu ritmo desde que empezaste (${pace}:pace: capítulos al día), terminarías este ciclo el ${end}:end:.`;
  });

  private date(day: LocalDate): string {
    return formatDate(day.toDate(), "d 'de' MMMM 'de' y", this.locale);
  }
}
