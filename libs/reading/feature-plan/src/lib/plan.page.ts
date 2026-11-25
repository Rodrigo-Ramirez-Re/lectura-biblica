import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdvanceBlocks, GetSchedule, type ScheduleView } from '@lectura/reading-application';
import { ButtonComponent, CardComponent } from '@lectura/ui-components';
import { describeDuration, describeOrder, describePace } from './plan-text';

@Component({
  selector: 'lb-plan-page',
  imports: [DatePipe, RouterLink, ButtonComponent, CardComponent],
  template: `
    <h1 class="font-display text-heading-1" i18n="@@reading.plan.title">Plan</h1>

    @if (failed()) {
      <p
        role="alert"
        class="mt-section font-semibold text-danger"
        i18n="@@reading.plan.load-failed"
      >
        No se pudo leer tu plan en este dispositivo. Revisa que el navegador permita guardar datos.
      </p>
    }

    @if (loaded()) {
      @if (schedule(); as view) {
        <section lbCard aria-labelledby="plan-summary" class="mt-section">
          <h2 id="plan-summary" class="text-heading-2">{{ view.plan.name }}</h2>
          <ul class="flex flex-col gap-1">
            <li>
              @if (view.cyclesTarget; as target) {
                <span i18n="@@reading.plan.cycle-of">Ciclo {{ view.cycle }} de {{ target }}</span>
              } @else {
                <span i18n="@@reading.plan.cycle-number">Ciclo {{ view.cycle }}</span>
              }
            </li>
            <li>{{ pace(view) }}</li>
            <li>{{ duration(view) }}</li>
            <li>{{ order(view) }}</li>
            <li i18n="@@reading.plan.cycle">
              {{ view.entries.length }} libros en {{ view.months }} meses: del
              {{ view.start.toDate() | date: "d 'de' MMMM 'de' y" }} al
              {{ view.end.toDate() | date: "d 'de' MMMM 'de' y" }}
            </li>
          </ul>
          <a
            lbButton
            variant="secondary"
            class="self-start"
            routerLink="editar"
            i18n="@@reading.plan.edit"
          >
            Editar plan
          </a>
        </section>

        <section class="mt-section" aria-labelledby="plan-blocks">
          <h2 id="plan-blocks" class="text-heading-2" i18n="@@reading.plan.blocks">
            Libro por libro
          </h2>
          <ol class="mt-2 flex flex-col">
            @for (entry of view.entries; track entry.key) {
              <li
                class="flex items-center justify-between gap-3 border-b border-border px-2 py-2"
                [class.bg-surface-subtle]="entry.state === 'current'"
                [attr.aria-current]="entry.state === 'current' ? 'step' : null"
              >
                <span>
                  <span class="font-display text-heading-3">{{ entry.bookName }}</span>
                  <span class="block text-body-sm text-on-surface-muted">
                    {{ entry.start.toDate() | date: 'd MMM y' }} –
                    {{ entry.end.toDate() | date: 'd MMM y' }}
                  </span>
                </span>
                @switch (entry.state) {
                  @case ('done') {
                    <span
                      class="text-body-sm text-on-surface-muted"
                      i18n="@@reading.plan.state-done"
                      >Terminado</span
                    >
                  }
                  @case ('skipped') {
                    <span
                      class="text-body-sm text-on-surface-muted"
                      i18n="@@reading.plan.state-skipped"
                      >Saltado</span
                    >
                  }
                  @case ('replaced') {
                    <span
                      class="text-body-sm text-on-surface-muted"
                      i18n="@@reading.plan.state-replaced"
                      >Cambiado</span
                    >
                  }
                  @case ('paused') {
                    <span
                      class="text-body-sm text-on-surface-muted"
                      i18n="@@reading.plan.state-paused"
                      >En pausa</span
                    >
                  }
                  @case ('current') {
                    <span
                      class="text-body-sm font-semibold text-accent"
                      i18n="@@reading.plan.state-current"
                      >Ahora</span
                    >
                  }
                  @default {
                    <span
                      class="text-body-sm text-on-surface-muted"
                      i18n="@@reading.plan.state-upcoming"
                      >Próximo</span
                    >
                  }
                }
              </li>
            }
          </ol>
        </section>
      } @else {
        <p class="mt-section" i18n="@@reading.plan.empty">Todavía no tienes un plan de lectura.</p>
        <a lbButton class="mt-section" routerLink="/" i18n="@@reading.plan.go-start">
          Empezar en Hoy
        </a>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanPage {
  private readonly advanceBlocks = inject(AdvanceBlocks);
  private readonly getSchedule = inject(GetSchedule);

  protected readonly schedule = signal<ScheduleView | null>(null);
  protected readonly loaded = signal(false);
  protected readonly failed = signal(false);

  protected duration(view: ScheduleView): string {
    return describeDuration(view.plan.defaultBlock);
  }

  protected order(view: ScheduleView): string {
    return describeOrder(view.plan);
  }

  protected pace(view: ScheduleView): string {
    return describePace(view.plan);
  }

  constructor() {
    void this.load();
  }

  // Blocks that started while the app was closed are recorded before the schedule is read.
  private async load(): Promise<void> {
    try {
      await this.advanceBlocks.execute();
      this.schedule.set(await this.getSchedule.execute());
      this.loaded.set(true);
    } catch {
      this.failed.set(true);
    }
  }
}
