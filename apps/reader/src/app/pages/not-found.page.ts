import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@lectura/ui-components';

@Component({
  selector: 'lb-not-found-page',
  imports: [RouterLink, ButtonComponent],
  template: `
    <h1 class="font-display text-heading-1" i18n="@@reader.not-found.title">
      Página no encontrada
    </h1>
    <p class="mt-3" i18n="@@reader.not-found.text">Esta dirección no existe en la aplicación.</p>
    <a lbButton class="mt-section" routerLink="/" i18n="@@reader.not-found.back">Ir a Hoy</a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
