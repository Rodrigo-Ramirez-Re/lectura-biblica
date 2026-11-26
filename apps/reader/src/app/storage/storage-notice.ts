import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { StorageGuard } from '@lectura/shared-kernel';
import { RouterLink } from '@angular/router';
import { ButtonComponent, CardComponent } from '@lectura/ui-components';
import { readDevicePreference, writeDevicePreference } from '../preferences/device-preferences';
import { InstallPrompt } from '../pwa/install-prompt';

const NOTICE_SEEN = 'data-notice';

/**
 * Tells the person, once, that their data lives only on this device and how to protect it; or,
 * when the browser refuses local storage, that nothing can be saved (ADR 0003).
 */
@Component({
  selector: 'lb-storage-notice',
  imports: [RouterLink, ButtonComponent, CardComponent],
  template: `
    @if (unavailable()) {
      <section lbCard role="alert" class="mb-section border border-danger">
        <h2 class="text-heading-3 text-danger" i18n="@@reader.storage.unavailable-title">
          No se puede guardar en este dispositivo
        </h2>
        <p i18n="@@reader.storage.unavailable-text">
          Este navegador no permite que la aplicación guarde datos (puede pasar en modo privado). Lo
          que registres se perderá al cerrar la página.
        </p>
      </section>
    } @else if (showNotice()) {
      <section lbCard aria-labelledby="storage-notice-title" class="mb-section">
        <h2 id="storage-notice-title" class="text-heading-3" i18n="@@reader.storage.notice-title">
          Tus datos viven en este dispositivo
        </h2>
        <p i18n="@@reader.storage.notice-text">
          No hay cuenta ni nube: tu plan y tu historial se guardan solo aquí. Algunos navegadores,
          como Safari, pueden borrarlos si no usas la aplicación por un tiempo. Instalarla en tu
          pantalla de inicio y exportar respaldos de vez en cuando los protege.
        </p>
        <div class="flex flex-wrap gap-2">
          <button lbButton type="button" (click)="dismiss()" i18n="@@reader.storage.notice-ok">
            Entendido
          </button>
          @if (!installed()) {
            <a
              lbButton
              variant="ghost"
              routerLink="/instalar"
              i18n="@@reader.storage.notice-install"
            >
              Cómo instalarla
            </a>
          }
        </div>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageNotice {
  protected readonly installed = inject(InstallPrompt).installed;
  protected readonly unavailable = signal(false);
  protected readonly showNotice = signal(readDevicePreference(NOTICE_SEEN) === null);

  constructor() {
    inject(StorageGuard)
      .isAvailable()
      .then((available) => this.unavailable.set(!available));
  }

  protected dismiss(): void {
    writeDevicePreference(NOTICE_SEEN, 'seen');
    this.showNotice.set(false);
  }
}
