import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AdvanceBlocks,
  CheckBackupReminder,
  PostponeBackupReminder,
  ControlCurrentBlock,
  GetSchedule,
  GetToday,
  LogReading,
  SetBlockGoal,
  StartDefaultPlan,
  UndoReading,
  type BackupReminder,
  type ScheduleView,
  type StartChoice,
  type BookChoice,
  type LogReadingError,
  type TodayView,
} from '@lectura/reading-application';
import type { BlockControlError } from '@lectura/reading-domain';
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
import { BookNotesSection } from './book-notes.section';
import { describeReading } from './describe-reading';

const UNDO_SECONDS = 10;

interface LastLog {
  readonly id: string;
  readonly text: string;
}

@Component({
  selector: 'lb-today-page',
  imports: [
    BookNotesSection,
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
      @if (backupReminder(); as reminder) {
        <section lbCard aria-labelledby="backup-reminder" class="mt-section border border-accent">
          <h2 id="backup-reminder" class="text-heading-3" i18n="@@reading.reminder.title">
            Haz un respaldo
          </h2>
          <p i18n="@@reading.reminder.text">
            Tus datos viven solo en este dispositivo. Exporta un respaldo de vez en cuando para no
            perderlos.
          </p>
          @if (reminder.lastBackupAt; as last) {
            <p i18n="@@reading.reminder.last">
              Tu último respaldo fue el {{ last | date: 'longDate' }}.
            </p>
          } @else {
            <p i18n="@@reading.reminder.never">Aún no has hecho ningún respaldo.</p>
          }
          <div class="flex flex-wrap gap-2">
            <a lbButton routerLink="/acerca" i18n="@@reading.reminder.go">Ir a Respaldo</a>
            <button
              lbButton
              variant="ghost"
              type="button"
              (click)="postponeReminder()"
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
          <details>
            <summary
              class="min-h-touch cursor-pointer py-2 text-primary focus-visible:focus-ring"
              i18n="@@reading.control.summary"
            >
              Cambiar este libro
            </summary>
            <div class="mt-2 flex flex-col gap-3">
              <p class="text-body-sm text-on-surface-muted" i18n="@@reading.control.tomorrow-hint">
                Si ya registraste lectura hoy, el cambio empieza mañana.
              </p>
              <lb-form-field label="Otro libro" i18n-label="@@reading.control.other-book">
                <select lbControl (change)="bookChoice.set(asText($event))">
                  @for (book of choices(); track book.bookId) {
                    <option [value]="book.bookId" [selected]="book.bookId === bookChoice()">
                      {{ book.name }}
                    </option>
                  }
                </select>
              </lb-form-field>
              <button
                lbButton
                variant="secondary"
                type="button"
                class="self-start"
                [disabled]="saving() || !bookChoice()"
                (click)="control('change')"
                i18n="@@reading.control.change"
              >
                Empezar este libro
              </button>
              <lb-form-field label="Terminar este libro el" i18n-label="@@reading.control.end">
                <input
                  lbControl
                  type="date"
                  [min]="view.today.toString()"
                  [value]="newEnd()"
                  (change)="newEnd.set(asText($event))"
                />
              </lb-form-field>
              <button
                lbButton
                variant="secondary"
                type="button"
                class="self-start"
                [disabled]="saving()"
                (click)="control('end')"
                i18n="@@reading.control.save-end"
              >
                Guardar fecha
              </button>
              <div class="flex flex-wrap gap-2">
                <button
                  lbButton
                  variant="secondary"
                  type="button"
                  [disabled]="saving()"
                  (click)="control('skip')"
                  i18n="@@reading.control.skip"
                >
                  Saltar este libro
                </button>
                <button
                  lbButton
                  variant="ghost"
                  type="button"
                  [disabled]="saving()"
                  (click)="control('pause')"
                  i18n="@@reading.control.pause"
                >
                  Pausar el plan
                </button>
              </div>
              @if (controlError(); as message) {
                <p role="alert" class="font-semibold text-danger">{{ message }}</p>
              }
            </div>
          </details>
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
          } @else if (view.restDay && view.readToday === 0) {
            <p class="font-semibold" i18n="@@reading.today.rest-day">Hoy es día de descanso.</p>
            <p class="text-body-sm text-on-surface-muted" i18n="@@reading.today.rest-day-hint">
              Si quieres leer de todos modos, regístralo en «Otra cantidad u otro día».
            </p>
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
              <lb-form-field label="Día" i18n-label="@@reading.today.date" [error]="logError()">
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
          @if (view.goalPasses !== null) {
            @if (view.goalMet) {
              <p class="flex items-center gap-2 font-semibold text-success">
                <lb-icon name="check" />
                <span i18n="@@reading.today.goal-met"
                  >¡Cumpliste tu meta de {{ view.goalPasses }} vueltas!</span
                >
              </p>
              <p class="text-body-sm text-on-surface-muted" i18n="@@reading.today.goal-met-hint">
                Puedes seguir leyéndolo hasta que termine el bloque, o pasar ya al siguiente libro.
              </p>
              <button
                lbButton
                variant="secondary"
                type="button"
                class="self-start"
                [disabled]="saving()"
                (click)="control('finish')"
                i18n="@@reading.control.finish"
              >
                Pasar al siguiente libro
              </button>
            } @else {
              <p class="font-semibold" i18n="@@reading.today.goal">
                Meta: {{ view.goalPasses }} vueltas · llevas {{ view.passesInBlock.complete }}
              </p>
            }
          }
          <details>
            <summary
              class="min-h-touch cursor-pointer py-2 text-primary focus-visible:focus-ring"
              i18n="@@reading.today.goal-edit"
            >
              Meta de vueltas
            </summary>
            <div class="mt-2 flex flex-col gap-3">
              <lb-stepper
                label="Vueltas en este bloque"
                i18n-label="@@reading.today.goal-amount"
                [(value)]="goal"
                [min]="1"
                [max]="999"
              />
              <div class="flex flex-wrap gap-2">
                <button
                  lbButton
                  variant="secondary"
                  type="button"
                  [disabled]="saving()"
                  (click)="saveGoal(goal())"
                  i18n="@@reading.today.goal-save"
                >
                  Guardar meta
                </button>
                @if (view.goalPasses !== null) {
                  <button
                    lbButton
                    variant="ghost"
                    type="button"
                    [disabled]="saving()"
                    (click)="saveGoal(null)"
                    i18n="@@reading.today.goal-clear"
                  >
                    Quitar meta
                  </button>
                }
              </div>
            </div>
          </details>
        </section>
        <lb-book-notes class="mt-section block" [bookId]="view.bookId" [canAdd]="true" />
      } @else if (schedule(); as plan) {
        @if (plan.plan.pausedSince; as since) {
          <section lbCard aria-labelledby="paused-title" class="mt-section">
            <h2 id="paused-title" class="text-heading-2" i18n="@@reading.control.paused-title">
              Plan en pausa
            </h2>
            <p i18n="@@reading.control.paused-since">
              Tu plan está en pausa desde el {{ asDate(since) | date: "d 'de' MMMM" }}.
            </p>
            <button
              lbButton
              type="button"
              class="self-start"
              [disabled]="saving()"
              (click)="control('resume')"
              i18n="@@reading.control.resume"
            >
              Reanudar
            </button>
          </section>
        } @else if (plan.start.isAfter(options.today)) {
          <p class="mt-section" i18n="@@reading.today.not-started">
            Tu plan empieza el {{ plan.start.toDate() | date: "d 'de' MMMM" }} con
            {{ plan.entries[0].bookName }}.
          </p>
        } @else {
          <p class="mt-section" i18n="@@reading.today.cycle-finished">
            Terminaste tu recorrido de lectura. Para leer de nuevo, reinicia el ciclo en Editar
            plan.
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
            [disabled]="saving()"
            (click)="start()"
            i18n="@@reading.welcome.start"
          >
            Empezar
          </button>
        </section>
      }
    }

    @if (failed()) {
      <p
        role="alert"
        class="mt-section font-semibold text-danger"
        i18n="@@reading.today.save-failed"
      >
        No se pudieron leer o guardar tus datos en este dispositivo. Revisa que el navegador permita
        guardar datos e inténtalo de nuevo.
      </p>
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
  private readonly postponeBackup = inject(PostponeBackupReminder);
  private readonly setBlockGoal = inject(SetBlockGoal);
  private readonly controlBlock = inject(ControlCurrentBlock);

  protected readonly options = this.startPlan.options();
  protected readonly choice = signal<StartChoice>('today');
  protected readonly schedule = signal<ScheduleView | null>(null);
  protected readonly today = signal<TodayView | null>(null);
  protected readonly loaded = signal(false);
  protected readonly saving = signal(false);
  protected readonly amount = signal(3);
  protected readonly date = signal(this.options.today.toString());
  protected readonly lastLog = signal<LastLog | null>(null);
  protected readonly backupReminder = signal<BackupReminder | null>(null);
  protected readonly goal = signal(2);
  protected readonly choices = signal<readonly BookChoice[]>([]);
  protected readonly bookChoice = signal('');
  protected readonly newEnd = signal('');
  protected readonly controlError = signal<string | null>(null);

  private readonly controlErrors: Record<BlockControlError, string> = {
    'no-plan': $localize`:@@reading.control.error-no-plan:Todavía no tienes un plan.`,
    'no-active-block': $localize`:@@reading.control.error-no-block:Este libro ya terminó o cambió; vuelve a abrir Hoy.`,
    'not-available': $localize`:@@reading.control.error-book:Ese libro ya está leído o en curso en este ciclo.`,
    'not-paused': $localize`:@@reading.control.error-not-paused:El plan no está en pausa.`,
    'invalid-end': $localize`:@@reading.control.error-end:Elige una fecha desde hoy.`,
  };
  protected readonly logError = signal<string | undefined>(undefined);
  protected readonly failed = signal(false);
  private undoTimer?: ReturnType<typeof setTimeout>;

  private readonly logErrors: Record<LogReadingError, string> = {
    'invalid-amount': $localize`:@@reading.today.error-amount:Escribe cuántos capítulos leíste (1 o más).`,
    'outside-block': $localize`:@@reading.today.error-outside:Elige un día del libro actual, desde que empezó hasta hoy.`,
    'in-the-future': $localize`:@@reading.today.error-future:No puedes registrar un día que todavía no llega.`,
    'no-active-block': $localize`:@@reading.today.error-no-block:No hay un libro activo hoy.`,
  };

  constructor() {
    void this.busy(() => Promise.resolve());
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
      if (!result.ok) {
        this.logError.set(this.logErrors[result.error]);
        return;
      }
      this.logError.set(undefined);
      const book = this.today()?.bookName;
      const amount = this.chaptersText(chapters);
      this.offerUndo({ id: result.value.id, text: book ? `${book} · ${amount}` : amount });
    });
  }

  protected async logOther(view: TodayView): Promise<void> {
    const parsed = LocalDate.parse(this.date());
    await this.log(this.amount(), parsed.ok ? parsed.value : view.today);
  }

  protected async control(
    action: 'change' | 'skip' | 'finish' | 'pause' | 'resume' | 'end',
  ): Promise<void> {
    await this.busy(async () => {
      const result = await this.runControl(action);
      this.controlError.set(result.ok ? null : this.controlErrors[result.error]);
      if (result.ok) await this.advanceBlocks.execute();
    });
  }

  private runControl(action: 'change' | 'skip' | 'finish' | 'pause' | 'resume' | 'end') {
    if (action === 'change') return this.controlBlock.changeBook(this.bookChoice());
    if (action !== 'end') return this.controlBlock[action]();
    const end = LocalDate.parse(this.newEnd());
    return end.ok
      ? this.controlBlock.changeEnd(end.value)
      : Promise.resolve({ ok: false as const, error: 'invalid-end' as const });
  }

  protected asDate(iso: string): Date | null {
    const parsed = LocalDate.parse(iso);
    return parsed.ok ? parsed.value.toDate() : null;
  }

  protected async saveGoal(goal: number | null): Promise<void> {
    await this.busy(() => this.setBlockGoal.execute(goal));
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
    this.failed.set(false);
    try {
      await action();
      await this.load();
    } catch {
      this.failed.set(true);
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * "Ahora no": hidden once saved, so it stays away for a week even after a restart. If it can't
   * be saved the reminder simply stays.
   */
  protected async postponeReminder(): Promise<void> {
    try {
      await this.postponeBackup.execute();
      this.backupReminder.set(null);
    } catch {
      // Nothing to undo: the reminder is still showing.
    }
  }

  // Blocks that started while the app was closed are recorded before anything is read.
  private async load(): Promise<void> {
    await this.advanceBlocks.execute();
    const [schedule, today, backupReminder, choices] = await Promise.all([
      this.getSchedule.execute(),
      this.getToday.execute(),
      this.checkBackup.execute(),
      this.controlBlock.choices(),
    ]);
    this.backupReminder.set(backupReminder);
    this.schedule.set(schedule);
    this.today.set(today);
    this.choices.set(choices);
    if (today) {
      if (!choices.some((book) => book.bookId === this.bookChoice()))
        this.bookChoice.set(choices[0]?.bookId ?? '');
      this.newEnd.set(today.end.toString());
      this.amount.set(today.dueChapters || today.todayPace || 1);
      this.goal.set(today.goalPasses ?? Math.max(1, Math.floor(today.passesThatFit)));
    }
    this.loaded.set(true);
  }
}
