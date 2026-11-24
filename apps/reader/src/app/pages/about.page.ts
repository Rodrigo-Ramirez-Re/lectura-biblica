import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { StorageGuard } from '@lectura/shared-kernel';
import { BackupPanel } from '@lectura/reading-feature-backup';
import { CardComponent } from '@lectura/ui-components';
import { appSettings } from '../app-config';
import { ThemeService, type ThemeChoice } from '../theme/theme';

@Component({
  selector: 'lb-about-page',
  imports: [CardComponent, BackupPanel],
  template: `
    <h1 class="font-display text-heading-1" i18n="@@reader.about.title">Acerca de</h1>

    <div class="mt-section flex flex-col gap-section">
      <section lbCard aria-labelledby="about-app">
        <h2 id="about-app" class="text-heading-2" i18n="@@reader.about.app-heading">
          Qué es {{ appName }}
        </h2>
        <p i18n="@@reader.about.app-text">
          Una aplicación para planear tu lectura de la Biblia a tu manera, registrar lo que lees
          cada día y ver cómo avanzas.
        </p>
        <p i18n="@@reader.about.free">Es gratuita y todas sus funciones lo seguirán siendo.</p>
      </section>

      <section lbCard aria-labelledby="about-privacy">
        <h2 id="about-privacy" class="text-heading-2" i18n="@@reader.about.privacy-heading">
          Tus datos
        </h2>
        <p i18n="@@reader.about.privacy-text">
          Tu plan y tu historial se guardan solo en este dispositivo. No pedimos cuenta, no
          recopilamos datos personales y no usamos rastreadores.
        </p>
        @if (persisted() === true) {
          <p class="text-success" i18n="@@reader.about.storage-persisted">
            ✓ Almacenamiento persistente: el navegador no borrará tus datos por falta de espacio.
          </p>
        } @else if (persisted() === false) {
          <p class="text-on-surface-muted" i18n="@@reader.about.storage-not-persisted">
            Almacenamiento no persistente: el navegador podría borrar tus datos si no usas la
            aplicación por un tiempo. Instálala y exporta respaldos para protegerlos.
          </p>
        }
      </section>

      <lb-backup-panel />

      <section lbCard aria-labelledby="about-theme">
        <h2 id="about-theme" class="text-heading-2" i18n="@@reader.about.theme-heading">
          Apariencia
        </h2>
        <fieldset class="flex flex-col gap-1">
          <legend class="text-body-sm font-semibold" i18n="@@reader.about.theme-legend">
            Tema
          </legend>
          @for (option of options; track option.value) {
            <label class="flex min-h-touch items-center gap-3">
              <input
                type="radio"
                name="theme"
                class="size-5 accent-primary focus-visible:focus-ring"
                [value]="option.value"
                [checked]="theme.choice() === option.value"
                (change)="theme.choose(option.value)"
              />
              {{ option.label }}
            </label>
          }
        </fieldset>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly theme = inject(ThemeService);
  protected readonly appName = appSettings.appName;

  protected readonly options: readonly { value: ThemeChoice; label: string }[] = [
    {
      value: 'auto',
      label: $localize`:@@reader.about.theme-auto:Automático (como el dispositivo)`,
    },
    { value: 'light', label: $localize`:@@reader.about.theme-light:Claro` },
    { value: 'dark', label: $localize`:@@reader.about.theme-dark:Oscuro` },
  ];

  /** Null until the browser answers. */
  protected readonly persisted = signal<boolean | null>(null);

  constructor() {
    inject(StorageGuard)
      .isPersisted()
      .then((persisted) => this.persisted.set(persisted));
  }
}
