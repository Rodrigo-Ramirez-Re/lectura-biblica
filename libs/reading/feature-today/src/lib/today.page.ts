import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AdvanceBlocks,
  GetSchedule,
  StartDefaultPlan,
  type ScheduleView,
  type StartChoice,
} from '@lectura/reading-application';
import { ButtonComponent, CardComponent } from '@lectura/ui-components';

@Component({
  selector: 'lb-today-page',
  imports: [DatePipe, ButtonComponent, CardComponent],
  template: `
    <h1 class="font-display text-heading-1" i18n="@@reading.today.title">Hoy</h1>

    @if (loaded()) {
      @if (schedule(); as view) {
        @let current = currentEntry(view);
        @if (current) {
          <section lbCard aria-labelledby="current-book" class="mt-section">
            <p class="text-body-sm text-on-surface-muted" i18n="@@reading.today.book-of-block">
              Libro de este bloque
            </p>
            <h2 id="current-book" class="font-display text-display text-accent">
              {{ current.bookName }}
            </h2>
            <p class="text-body-sm text-on-surface-muted" i18n="@@reading.today.block-dates">
              Del {{ current.start.toDate() | date: "d 'de' MMMM" }} al
              {{ current.end.toDate() | date: "d 'de' MMMM 'de' y" }}
            </p>
          </section>
        } @else {
          <p class="mt-section" i18n="@@reading.today.not-started">
            Tu plan empieza el {{ view.start.toDate() | date: "d 'de' MMMM" }} con
            {{ view.entries[0].bookName }}.
          </p>
        }
      } @else {
        <section lbCard aria-labelledby="welcome-title" class="mt-section">
          <h2 id="welcome-title" class="text-heading-2" i18n="@@reading.welcome.title">
            Empieza con «Un libro al mes»
          </h2>
          <p i18n="@@reading.welcome.text">
            Lee 3 capítulos al día y dedica cada mes a un solo libro, leyéndolo las veces que
            quepan. Los libros van del más corto al más largo: los 66 en unos 5 años y medio.
            Después podrás ajustar el plan a tu manera.
          </p>
          <fieldset class="flex flex-col gap-1">
            <legend class="text-body-sm font-semibold" i18n="@@reading.welcome.start-legend">
              ¿Cuándo empiezas?
            </legend>
            <label class="flex min-h-touch items-center gap-3">
              <input
                type="radio"
                name="start"
                class="size-5 accent-primary focus-visible:focus-ring"
                [checked]="choice() === 'today'"
                (change)="choice.set('today')"
              />
              <span i18n="@@reading.welcome.start-today">
                Hoy, {{ options.today.toDate() | date: "EEEE d 'de' MMMM" }}
              </span>
            </label>
            <label class="flex min-h-touch items-center gap-3">
              <input
                type="radio"
                name="start"
                class="size-5 accent-primary focus-visible:focus-ring"
                [checked]="choice() === 'next-month'"
                (change)="choice.set('next-month')"
              />
              <span i18n="@@reading.welcome.start-next-month">
                El {{ options.nextMonth.toDate() | date: "d 'de' MMMM" }}
              </span>
            </label>
          </fieldset>
          <button
            lbButton
            size="lg"
            type="button"
            class="self-start"
            [disabled]="starting()"
            (click)="start()"
            i18n="@@reading.welcome.start"
          >
            Empezar
          </button>
        </section>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayPage {
  private readonly advanceBlocks = inject(AdvanceBlocks);
  private readonly getSchedule = inject(GetSchedule);
  private readonly startPlan = inject(StartDefaultPlan);

  protected readonly options = this.startPlan.options();
  protected readonly choice = signal<StartChoice>('today');
  protected readonly schedule = signal<ScheduleView | null>(null);
  protected readonly loaded = signal(false);
  protected readonly starting = signal(false);

  constructor() {
    void this.load();
  }

  protected currentEntry(view: ScheduleView) {
    return view.entries.find((entry) => entry.state === 'current') ?? null;
  }

  protected async start(): Promise<void> {
    this.starting.set(true);
    await this.startPlan.execute(this.choice());
    await this.load();
    this.starting.set(false);
  }

  // Blocks that started while the app was closed are recorded before the schedule is read.
  private async load(): Promise<void> {
    await this.advanceBlocks.execute();
    this.schedule.set(await this.getSchedule.execute());
    this.loaded.set(true);
  }
}
