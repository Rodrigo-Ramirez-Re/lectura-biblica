import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  DeleteAllData,
  ExportBackup,
  ImportBackup,
  PreviewBackup,
} from '@lectura/reading-application';
import { JournalReader, type BackupError, type BackupSummary } from '@lectura/reading-domain';
import {
  ButtonComponent,
  CardComponent,
  FormControlDirective,
  FormFieldComponent,
} from '@lectura/ui-components';

const CONFIRM_WORD = 'BORRAR';

/** Export, import and delete the data on this device (LB-013). Lives on Acerca de. */
@Component({
  selector: 'lb-backup-panel',
  imports: [DatePipe, ButtonComponent, CardComponent, FormFieldComponent, FormControlDirective],
  template: `
    <section lbCard aria-labelledby="backup-title" id="respaldo">
      <h2 id="backup-title" class="text-heading-2" i18n="@@reading.backup.title">Respaldo</h2>
      @if (lastBackupAt(); as last) {
        <p class="text-body-sm text-on-surface-muted" i18n="@@reading.backup.last">
          Último respaldo: {{ last | date: "d 'de' MMMM 'de' y, HH:mm" }}
        </p>
      } @else {
        <p class="text-body-sm text-on-surface-muted" i18n="@@reading.backup.never">
          Aún no has exportado un respaldo.
        </p>
      }
      <button
        lbButton
        type="button"
        class="self-start"
        (click)="export()"
        i18n="@@reading.backup.export"
      >
        Exportar respaldo
      </button>

      <lb-form-field
        label="Importar respaldo"
        i18n-label="@@reading.backup.import"
        hint="Un archivo .json exportado desde esta aplicación."
        i18n-hint="@@reading.backup.import-hint"
        [error]="error()"
      >
        <input lbControl type="file" accept="application/json,.json" (change)="choose($event)" />
      </lb-form-field>

      @if (preview(); as summary) {
        <div
          role="region"
          aria-labelledby="preview-title"
          class="flex flex-col gap-2 rounded-card bg-surface-subtle p-3"
        >
          <h3 id="preview-title" class="text-heading-3" i18n="@@reading.backup.preview-title">
            Contenido del respaldo
          </h3>
          <ul class="text-body-sm">
            <li i18n="@@reading.backup.preview-plan">Plan: {{ summary.planName ?? '—' }}</li>
            <li i18n="@@reading.backup.preview-logs">
              {summary.logs, plural,
                =1 {1 registro de lectura}
                other {{{ summary.logs }} registros de lectura}
              }
            </li>
            @if (summary.firstDate) {
              <li i18n="@@reading.backup.preview-range">
                Del {{ summary.firstDate }} al {{ summary.lastDate }}
              </li>
            }
          </ul>
          <p class="font-semibold text-danger" i18n="@@reading.backup.replace-warning">
            Importarlo reemplaza todos tus datos actuales en este dispositivo.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              lbButton
              variant="danger"
              type="button"
              (click)="import()"
              i18n="@@reading.backup.replace"
            >
              Reemplazar mis datos
            </button>
            <button
              lbButton
              variant="ghost"
              type="button"
              (click)="cancel()"
              i18n="@@reading.backup.cancel"
            >
              Cancelar
            </button>
          </div>
        </div>
      }

      <details class="mt-2">
        <summary
          class="min-h-touch cursor-pointer py-2 text-danger focus-visible:focus-ring"
          i18n="@@reading.backup.delete-summary"
        >
          Borrar mis datos
        </summary>
        <div class="mt-2 flex flex-col gap-2">
          <p i18n="@@reading.backup.delete-warning">
            Se borrará tu plan y todo tu historial de este dispositivo. Exporta un respaldo antes si
            quieres conservarlos.
          </p>
          <lb-form-field
            label="Escribe BORRAR para confirmar"
            i18n-label="@@reading.backup.delete-confirm"
          >
            <input
              lbControl
              type="text"
              autocomplete="off"
              [value]="confirmation()"
              (input)="confirmation.set(asText($event))"
            />
          </lb-form-field>
          <button
            lbButton
            variant="danger"
            type="button"
            class="self-start"
            [disabled]="confirmation() !== confirmWord"
            (click)="deleteAll()"
            i18n="@@reading.backup.delete"
          >
            Borrar todo
          </button>
        </div>
      </details>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupPanel {
  private readonly reader = inject(JournalReader);
  private readonly exportBackup = inject(ExportBackup);
  private readonly previewBackup = inject(PreviewBackup);
  private readonly importBackup = inject(ImportBackup);
  private readonly deleteAllData = inject(DeleteAllData);
  private readonly router = inject(Router);

  protected readonly confirmWord = CONFIRM_WORD;
  protected readonly lastBackupAt = signal<Date | null>(null);
  protected readonly preview = signal<BackupSummary | null>(null);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly confirmation = signal('');
  private fileText = '';

  private readonly messages: Record<BackupError, string> = {
    'not-json': $localize`:@@reading.backup.error-not-json:El archivo no es un respaldo: no se pudo leer como JSON.`,
    'not-a-backup': $localize`:@@reading.backup.error-not-a-backup:El archivo no es un respaldo de esta aplicación.`,
    'newer-version': $localize`:@@reading.backup.error-newer:El respaldo viene de una versión más nueva. Actualiza la aplicación (recárgala) e inténtalo de nuevo.`,
    invalid: $localize`:@@reading.backup.error-invalid:El respaldo está dañado o incompleto. Tus datos no se cambiaron.`,
  };

  constructor() {
    void this.loadLastBackup();
  }

  protected async export(): Promise<void> {
    await this.exportBackup.execute();
    await this.loadLastBackup();
  }

  protected async choose(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.preview.set(null);
    this.error.set(undefined);
    if (!file) return;
    this.fileText = await file.text();
    const result = this.previewBackup.execute(this.fileText);
    if (result.ok) this.preview.set(result.value);
    else this.error.set(this.messages[result.error]);
  }

  protected async import(): Promise<void> {
    const result = await this.importBackup.execute(this.fileText);
    if (!result.ok) {
      this.error.set(this.messages[result.error]);
      return;
    }
    this.cancel();
    await this.router.navigateByUrl('/');
  }

  protected cancel(): void {
    this.preview.set(null);
    this.fileText = '';
  }

  protected async deleteAll(): Promise<void> {
    await this.deleteAllData.execute();
    this.confirmation.set('');
    await this.router.navigateByUrl('/');
  }

  protected asText(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private async loadLastBackup(): Promise<void> {
    const { lastBackupAt } = (await this.reader.load()).settings;
    this.lastBackupAt.set(lastBackupAt ? new Date(lastBackupAt) : null);
  }
}
