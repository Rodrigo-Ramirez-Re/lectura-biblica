import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AdvanceBlocks,
  CheckBackupReminder,
  GetSchedule,
  GetToday,
  LogReading,
  StartDefaultPlan,
  UndoReading,
  type ScheduleView,
  type StartChoice,
  type TodayView,
} from '@lectura/reading-application';
import { LocalDate } from '@lectura/shared-kernel';
import {
  ButtonComponent,
  CardComponent,
  FormControlDirective,
  FormFieldComponent,
  IconComponent,
  ProgressComponent,
  StepperComponent,
} from '@lectura/ui-components';
import { describeReading } from './describe-reading';

const UNDO_SECONDS = 10;

interface LastLog {
  readonly id: string;
  readonly text: string;
}

@Component({
  selector: 'lb-today-page',
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    ButtonComponent,
    CardComponent,
    FormFieldComponent,
    FormControlDirective,
    IconComponent,
    ProgressComponent,
    StepperComponent,
  ],
  template: `
    <h1 class="font-display text-heading-1" i18n="@@reading.today.title">Hoy</h1>

    @if (loaded()) {
      @if (backupDue() && !reminderDismissed()) {
        <section lbCard aria-labelledby="backup-reminder" class="mt-section border border-accent">
          <h2 id="backup-reminder" class="text-heading-3" i18n="@@reading.reminder.title">
            Haz un respaldo
          </h2>
          <p i18n="@@reading.reminder.text">
            Tus datos viven solo en este dispositivo. Exporta un respaldo de vez en cuando para no
            perderlos.
          </p>
          <div class="flex flex-wrap gap-2">
            <a lbButton routerLink="/acerca" i18n="@@reading.reminder.go">Ir a Respaldo</a>
            <button
              lbButton
              variant="ghost"
              type="button"
              (click)="reminderDismissed.set(true)"
              i18n="@@reading.reminder.later"
            >
              Ahora no
            </button>
          </div>
        </section>
      }
      @if (today(); as view) {
        <section lbCard aria-labelledby="current-book" class="mt-section">
          <p class="text-body-sm text-on-surface-muted" i18n="@@reading.today.book-of-block">
            Libro de este bloque
          </p>
          <h2 id="current-book" class="font-display text-display text-accent">
            {{ view.bookName }}
          </h2>
          <p class="text-body-sm text-on-surface-muted" i18n="@@reading.today.block-dates">
            Del {{ view.start.toDate() | date: "d 'de' MMMM" }} al
            {{ view.end.toDate() | date: "d 'de' MMMM 'de' y" }}
          </p>
        </section>

        <section lbCard aria-labelledby="todays-reading" class="mt-section">
          <h2 id="todays-reading" class="text-heading-2" i18n="@@reading.today.reading-title">
            Lectura de hoy
          </h2>
          @if (view.dueChapters > 0) {
            <p class="font-display text-heading-1">{{ due(view) }}</p>
            <button
              lbButton
              size="lg"
              type="button"
              class="self-start"
              [disabled]="saving()"
              (click)="log(view.dueChapters)"
              i18n="@@reading.today.read"
            >
              Ya leí
            </button>
          } @else {
            <p class="flex items-center gap-2 font-semibold text-success">
              <lb-icon name="check" />
              <span i18n="@@reading.today.done">Listo por hoy</span>
            </p>
            <p class="text-body-sm text-on-surface-muted" i18n="@@reading.today.read-today">
              {view.readToday, plural,
                =1 {Leíste 1 capítulo hoy.}
                other {Leíste {{ view.readToday }} capítulos hoy.}
              }
            </p>
          }

          <details class="mt-2">
            <summary
              class="min-h-touch cursor-pointer py-2 text-primary focus-visible:focus-ring"
              i18n="@@reading.today.other"
            >
              Otra cantidad u otro día
            </summary>
            <div class="mt-2 flex flex-col gap-3">
              <lb-form-field label="Día" i18n-label="@@reading.today.date">
                <input
                  lbControl
                  type="date"
                  [min]="view.start.toString()"
                  [max]="view.today.toString()"
                  [value]="date()"
                  (change)="date.set(asText($event))"
                />
              </lb-form-field>
              <lb-stepper
                label="Capítulos"
                i18n-label="@@reading.today.amount"
                [(value)]="amount"
                [min]="1"
                [max]="999"
              />
              <button
                lbButton
                variant="secondary"
                type="button"
                class="self-start"
                [disabled]="saving()"
                (click)="logOther(view)"
                i18n="@@reading.today.log-other"
              >
                Registrar
              </button>
            </div>
          </details>
        </section>

        <section lbCard aria-labelledby="book-progress" class="mt-section">
          <h2 id="book-progress" class="text-heading-2" i18n="@@reading.today.progress-title">
            Tu avance en {{ view.bookName }}
          </h2>
          <p i18n="@@reading.today.passes">
            {view.passesInBlock.complete, plural,
              =0 {Aún no completas una vuelta en este bloque.}
              =1 {1 vuelta completa en este bloque.}
              other {{{ view.passesInBlock.complete }} vueltas completas en este bloque.}
            }
          </p>
          <lb-progress
            [value]="view.passesInBlock.chaptersIntoCurrent"
            [max]="view.bookChapters"
            label="Vuelta actual"
            i18n-label="@@reading.today.current-pass"
          >
            <span i18n="@@reading.today.current-pass-caption">
              Vuelta actual: {{ view.passesInBlock.chaptersIntoCurrent }} de
              {{ view.bookChapters }} capítulos
            </span>
          </lb-progress>
          <p class="text-body-sm text-on-surface-muted" i18n="@@reading.today.passes-fit">
            A tu ritmo caben {{ view.passesThatFit | number: '1.0-1' }} vueltas en este bloque.
          </p>
        </section>
      } @else if (schedule(); as plan) {
        <p class="mt-section" i18n="@@reading.today.not-started">
          Tu plan empieza el {{ plan.start.toDate() | date: "d 'de' MMMM" }} con
          {{ plan.entries[0].bookName }}.
        </p>
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
            [disabled]="saving()"
            (click)="start()"
            i18n="@@reading.welcome.start"
          >
            Empezar
          </button>
        </section>
      }
    }

    <div role="status" class="fixed inset-x-0 bottom-20 z-20 px-gutter md:bottom-4">
      @if (lastLog(); as last) {
        <div
          class="mx-auto flex max-w-content items-center justify-between gap-3 rounded-card bg-surface-raised p-3 shadow-raised"
        >
          <p i18n="@@reading.today.logged">Registrado: {{ last.text }}</p>
          <button
            lbButton
            variant="ghost"
            type="button"
            (click)="undo(last.id)"
            i18n="@@reading.today.undo"
          >
            Deshacer
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayPage {
  private readonly advanceBlocks = inject(AdvanceBlocks);
  private readonly getSchedule = inject(GetSchedule);
  private readonly getToday = inject(GetToday);
  private readonly startPlan = inject(StartDefaultPlan);
  private readonly logReading = inject(LogReading);
  private readonly undoReading = inject(UndoReading);
  private readonly checkBackup = inject(CheckBackupReminder);

  protected readonly options = this.startPlan.options();
  protected readonly choice = signal<StartChoice>('today');
  protected readonly schedule = signal<ScheduleView | null>(null);
  protected readonly today = signal<TodayView | null>(null);
  protected readonly loaded = signal(false);
  protected readonly saving = signal(false);
  protected readonly amount = signal(3);
  protected readonly date = signal(this.options.today.toString());
  protected readonly lastLog = signal<LastLog | null>(null);
  protected readonly backupDue = signal(false);
  /** "Ahora no" hides the reminder until the app is opened again. */
  protected readonly reminderDismissed = signal(false);
  private undoTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    void this.load();
  }

  protected due(view: TodayView): string {
    return describeReading(view.bookName, view.dueSpans);
  }

  protected async start(): Promise<void> {
    await this.busy(() => this.startPlan.execute(this.choice()));
  }

  protected async log(chapters: number, date?: LocalDate): Promise<void> {
    await this.busy(async () => {
      const result = await this.logReading.execute({ chapters, date });
      if (!result.ok) return;
      const book = this.today()?.bookName;
      const amount = this.chaptersText(chapters);
      this.offerUndo({ id: result.value.id, text: book ? `${book} · ${amount}` : amount });
    });
  }

  protected async logOther(view: TodayView): Promise<void> {
    const parsed = LocalDate.parse(this.date());
    await this.log(this.amount(), parsed.ok ? parsed.value : view.today);
  }

  protected async undo(id: string): Promise<void> {
    clearTimeout(this.undoTimer);
    this.lastLog.set(null);
    await this.busy(() => this.undoReading.execute(id));
  }

  protected asText(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private chaptersText(chapters: number): string {
    return chapters === 1
      ? $localize`:@@reading.today.one-chapter:1 capítulo`
      : $localize`:@@reading.today.chapters:${chapters}:count: capítulos`;
  }

  private offerUndo(last: LastLog): void {
    clearTimeout(this.undoTimer);
    this.lastLog.set(last);
    this.undoTimer = setTimeout(() => this.lastLog.set(null), UNDO_SECONDS * 1000);
  }

  private async busy(action: () => Promise<unknown>): Promise<void> {
    this.saving.set(true);
    await action();
    await this.load();
    this.saving.set(false);
  }

  // Blocks that started while the app was closed are recorded before anything is read.
  private async load(): Promise<void> {
    await this.advanceBlocks.execute();
    const [schedule, today, backupDue] = await Promise.all([
      this.getSchedule.execute(),
      this.getToday.execute(),
      this.checkBackup.execute(),
    ]);
    this.backupDue.set(backupDue);
    this.schedule.set(schedule);
    this.today.set(today);
    if (today) this.amount.set(today.dueChapters || today.chaptersPerDay);
    this.loaded.set(true);
  }
}
