import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  EditLogs,
  GetBlockHistory,
  type BlockHistory,
  type LogEntry,
} from '@lectura/reading-application';
import type { ChapterSpan, LogEditError } from '@lectura/reading-domain';
import { LocalDate } from '@lectura/shared-kernel';
import {
  ButtonComponent,
  CardComponent,
  FormControlDirective,
  FormFieldComponent,
  StepperComponent,
} from '@lectura/ui-components';

type Mode = { kind: 'edit' | 'delete'; logId: string } | null;

/** One block with every log of it, to correct or delete any of them (LB-020). */
@Component({
  selector: 'lb-block-page',
  imports: [
    DatePipe,
    RouterLink,
    ButtonComponent,
    CardComponent,
    FormFieldComponent,
    FormControlDirective,
    StepperComponent,
  ],
  template: `
    @if (history(); as block) {
      <h1 class="font-display text-heading-1">{{ block.bookName }}</h1>
      <p class="text-body-sm text-on-surface-muted" i18n="@@reading.block.dates">
        Del {{ block.start.toDate() | date: "d 'de' MMMM 'de' y" }} al
        {{ block.end.toDate() | date: "d 'de' MMMM 'de' y" }}
      </p>
      <p class="mt-2" i18n="@@reading.block.passes">
        {block.passes.complete, plural,
          =1 {1 vuelta completa}
          other {{{ block.passes.complete }} vueltas completas}
        }
        y
        {block.passes.chaptersIntoCurrent, plural,
          =1 {1 capítulo}
          other {{{ block.passes.chaptersIntoCurrent }} capítulos}
        }
        de la siguiente
      </p>

      <section lbCard aria-labelledby="logs-title" class="mt-section">
        <h2 id="logs-title" class="text-heading-2" i18n="@@reading.block.logs">Registros</h2>
        @if (error(); as message) {
          <p role="alert" class="font-semibold text-danger">{{ message }}</p>
        }
        <ul class="flex flex-col">
          @for (log of block.logs; track log.id) {
            <li class="flex flex-col gap-2 border-b border-border py-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span class="font-semibold">{{
                    log.date.toDate() | date: "EEEE d 'de' MMMM"
                  }}</span>
                  <span
                    class="block text-body-sm text-on-surface-muted"
                    i18n="@@reading.block.log-chapters"
                  >
                    {log.chaptersRead, plural,
                      =1 {1 capítulo}
                      other {{{ log.chaptersRead }} capítulos}

                    }: {{ chapters(log.spans) }}
                  </span>
                </span>
                <span class="flex gap-1">
                  <button
                    lbButton
                    variant="ghost"
                    type="button"
                    (click)="startEdit(log)"
                    [attr.aria-label]="editLabel(log)"
                  >
                    <span i18n="@@reading.block.edit">Editar</span>
                  </button>
                  <button
                    lbButton
                    variant="danger"
                    type="button"
                    (click)="mode.set({ kind: 'delete', logId: log.id })"
                    [attr.aria-label]="deleteLabel(log)"
                  >
                    <span i18n="@@reading.block.delete">Borrar</span>
                  </button>
                </span>
              </div>

              @if (mode()?.logId === log.id && mode()?.kind === 'edit') {
                <form class="flex flex-col gap-3" (submit)="save($event, log)" novalidate>
                  <lb-form-field label="Día del registro" i18n-label="@@reading.block.log-date">
                    <input
                      lbControl
                      type="date"
                      [min]="block.start.toString()"
                      [max]="block.end.toString()"
                      [value]="editDate()"
                      (change)="editDate.set(asText($event))"
                    />
                  </lb-form-field>
                  <lb-stepper
                    label="Capítulos leídos"
                    i18n-label="@@reading.block.log-amount"
                    [(value)]="editAmount"
                    [min]="1"
                    [max]="999"
                  />
                  <div class="flex gap-2">
                    <button lbButton type="submit" i18n="@@reading.block.save">Guardar</button>
                    <button
                      lbButton
                      variant="ghost"
                      type="button"
                      (click)="mode.set(null)"
                      i18n="@@reading.block.cancel"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              }
              @if (mode()?.logId === log.id && mode()?.kind === 'delete') {
                <div
                  role="group"
                  [attr.aria-label]="deleteLabel(log)"
                  class="flex flex-wrap items-center gap-2"
                >
                  <span i18n="@@reading.block.delete-question">¿Borrar este registro?</span>
                  <button
                    lbButton
                    variant="danger"
                    type="button"
                    (click)="remove(log)"
                    i18n="@@reading.block.delete-confirm"
                  >
                    Sí, borrar
                  </button>
                  <button
                    lbButton
                    variant="ghost"
                    type="button"
                    (click)="mode.set(null)"
                    i18n="@@reading.block.delete-cancel"
                  >
                    No
                  </button>
                </div>
              }
            </li>
          } @empty {
            <li class="py-2 text-on-surface-muted" i18n="@@reading.block.empty">
              No hay registros en este libro.
            </li>
          }
        </ul>
      </section>
      <a lbButton variant="ghost" class="mt-section" routerLink="/plan" i18n="@@reading.block.back"
        >Volver a Plan</a
      >
    } @else if (loaded()) {
      <h1 class="font-display text-heading-1" i18n="@@reading.block.not-found">
        Bloque no encontrado
      </h1>
      <a lbButton class="mt-section" routerLink="/plan" i18n="@@reading.block.back"
        >Volver a Plan</a
      >
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockPage {
  /** Bound from the route parameter. */
  readonly blockId = input.required<string>();

  private readonly getHistory = inject(GetBlockHistory);
  private readonly edits = inject(EditLogs);

  protected readonly history = signal<BlockHistory | null>(null);
  protected readonly loaded = signal(false);
  protected readonly mode = signal<Mode>(null);
  protected readonly editDate = signal('');
  protected readonly editAmount = signal(1);
  protected readonly error = signal<string | null>(null);

  private readonly messages: Record<LogEditError, string> = {
    'not-found': $localize`:@@reading.block.error-not-found:Ese registro ya no existe.`,
    'invalid-amount': $localize`:@@reading.block.error-amount:Escribe cuántos capítulos leíste (1 o más).`,
    'outside-block': $localize`:@@reading.block.error-outside:Elige un día dentro de las fechas de este libro.`,
    'in-the-future': $localize`:@@reading.block.error-future:No puedes registrar un día que todavía no llega.`,
  };

  constructor() {
    effect(() => {
      const blockId = this.blockId();
      void this.load(blockId);
    });
  }

  protected chapters(spans: readonly ChapterSpan[]): string {
    return spans
      .map((span) => (span.from === span.to ? `${span.from}` : `${span.from}–${span.to}`))
      .join(', ');
  }

  protected editLabel(log: LogEntry): string {
    return $localize`:@@reading.block.edit-label:Editar el registro del ${log.date.toString()}:date:`;
  }

  protected deleteLabel(log: LogEntry): string {
    return $localize`:@@reading.block.delete-label:Borrar el registro del ${log.date.toString()}:date:`;
  }

  protected startEdit(log: LogEntry): void {
    this.editDate.set(log.date.toString());
    this.editAmount.set(log.chaptersRead);
    this.mode.set({ kind: 'edit', logId: log.id });
  }

  protected async save(event: Event, log: LogEntry): Promise<void> {
    event.preventDefault();
    const date = LocalDate.parse(this.editDate());
    const result = await this.edits.edit(log.id, {
      date: date.ok ? date.value : log.date,
      chaptersRead: this.editAmount(),
    });
    await this.settle(result);
  }

  protected async remove(log: LogEntry): Promise<void> {
    await this.settle(await this.edits.delete(log.id));
  }

  protected asText(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private async settle(result: { ok: true } | { ok: false; error: LogEditError }): Promise<void> {
    this.error.set(result.ok ? null : this.messages[result.error]);
    if (result.ok) this.mode.set(null);
    await this.load(this.blockId());
  }

  private async load(blockId: string): Promise<void> {
    this.history.set(await this.getHistory.execute(blockId));
    this.loaded.set(true);
  }
}
