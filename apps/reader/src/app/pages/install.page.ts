import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonComponent, CardComponent } from '@lectura/ui-components';
import { APP_SETTINGS } from '../app-config';
import { InstallPrompt } from '../pwa/install-prompt';
import type { Platform } from '../pwa/platform';

const ORDER: readonly Platform[] = ['desktop', 'android', 'ios'];

@Component({
  selector: 'lb-install-page',
  imports: [ButtonComponent, CardComponent],
  template: `
    <h1 class="font-display text-heading-1" i18n="@@reader.install.title">
      Instalar la aplicación
    </h1>

    <div class="mt-section flex flex-col gap-section">
      @if (prompt.installed()) {
        <section lbCard>
          <p class="text-success" role="status" i18n="@@reader.install.installed">
            ✓ Ya estás usando la aplicación instalada.
          </p>
        </section>
      } @else if (prompt.canInstall()) {
        <section lbCard aria-labelledby="install-now">
          <h2 id="install-now" class="text-heading-2" i18n="@@reader.install.now-heading">
            Instálala ahora
          </h2>
          <p i18n="@@reader.install.now-text">Tu navegador puede instalarla en un paso.</p>
          <button
            lbButton
            type="button"
            class="self-start"
            (click)="install()"
            i18n="@@reader.install.now"
          >
            Instalar ahora
          </button>
        </section>
      }

      <section lbCard aria-labelledby="install-why">
        <h2 id="install-why" class="text-heading-2" i18n="@@reader.install.why-heading">
          Por qué instalarla
        </h2>
        <ul class="list-disc ps-5">
          <li i18n="@@reader.install.why-icon">
            Tiene su propio ícono en tu pantalla de inicio y se abre como cualquier aplicación.
          </li>
          <li i18n="@@reader.install.why-offline">Funciona sin internet.</li>
          <li i18n="@@reader.install.why-data">
            El navegador conserva tus datos por más tiempo: Safari puede borrar los de una página
            que no abres en semanas, pero no los de una aplicación instalada.
          </li>
        </ul>
      </section>

      <div class="flex flex-col gap-3">
        @for (platform of platforms; track platform) {
          <section lbCard>
            <details [open]="$first">
              @switch (platform) {
                @case ('android') {
                  <summary
                    class="min-h-touch cursor-pointer content-center rounded-control font-semibold focus-visible:focus-ring"
                    i18n="@@reader.install.android"
                  >
                    En Android
                  </summary>
                  <ol class="mt-2 list-decimal ps-5">
                    <li i18n="@@reader.install.android-1">Abre esta página en Chrome.</li>
                    <li i18n="@@reader.install.android-2">Toca el menú ⋮ (arriba a la derecha).</li>
                    <li i18n="@@reader.install.android-3">
                      Elige «Instalar aplicación» o «Agregar a la pantalla principal» y confirma.
                    </li>
                  </ol>
                  <p
                    class="mt-2 text-body-sm text-on-surface-muted"
                    i18n="@@reader.install.android-other"
                  >
                    En Samsung Internet o Edge, la opción también está en el menú: «Agregar página
                    a» › «Pantalla de inicio».
                  </p>
                }
                @case ('ios') {
                  <summary
                    class="min-h-touch cursor-pointer content-center rounded-control font-semibold focus-visible:focus-ring"
                    i18n="@@reader.install.ios"
                  >
                    En iPhone o iPad
                  </summary>
                  <ol class="mt-2 list-decimal ps-5">
                    <li i18n="@@reader.install.ios-1">Abre esta página en Safari.</li>
                    <li i18n="@@reader.install.ios-2">
                      Toca el botón Compartir (el cuadro con una flecha hacia arriba).
                    </li>
                    <li i18n="@@reader.install.ios-3">
                      Desliza hacia abajo, elige «Agregar a inicio» y toca «Agregar».
                    </li>
                  </ol>
                  <p
                    class="mt-2 text-body-sm text-on-surface-muted"
                    i18n="@@reader.install.ios-other"
                  >
                    Desde iOS 16.4 también puedes hacerlo con el botón Compartir de Chrome o Edge.
                  </p>
                }
                @case ('desktop') {
                  <summary
                    class="min-h-touch cursor-pointer content-center rounded-control font-semibold focus-visible:focus-ring"
                    i18n="@@reader.install.desktop"
                  >
                    En una computadora
                  </summary>
                  <ul class="mt-2 list-disc ps-5">
                    <li i18n="@@reader.install.desktop-chrome">
                      Chrome o Edge: haz clic en el ícono de instalar al final de la barra de
                      direcciones, o abre el menú y elige «Instalar {{ appName }}» (en Edge,
                      «Aplicaciones» › «Instalar este sitio como una aplicación»).
                    </li>
                    <li i18n="@@reader.install.desktop-safari">
                      Safari en Mac: menú Archivo › «Agregar al Dock».
                    </li>
                    <li i18n="@@reader.install.desktop-firefox">
                      Firefox no instala aplicaciones web: usa Chrome, Edge o Safari, o sigue
                      usándola en una pestaña.
                    </li>
                  </ul>
                }
              }
            </details>
          </section>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallPage {
  protected readonly prompt = inject(InstallPrompt);
  protected readonly appName = inject(APP_SETTINGS).appName;

  /** The person's own device first. */
  protected readonly platforms = [
    this.prompt.platform,
    ...ORDER.filter((platform) => platform !== this.prompt.platform),
  ];

  protected install(): void {
    void this.prompt.install();
  }
}
