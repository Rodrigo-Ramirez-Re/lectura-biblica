import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonComponent, CardComponent, IconComponent } from '@lectura/ui-components';
import { APP_SETTINGS } from '../app-config';
import { donationLink } from './donation';

/** Voluntary support, only in Acerca de and only when configured (spec §6: no nagging). */
@Component({
  selector: 'lb-donation-section',
  imports: [ButtonComponent, CardComponent, IconComponent],
  template: `
    @if (link; as link) {
      <section lbCard aria-labelledby="about-support">
        <h2 id="about-support" class="text-heading-2" i18n="@@reader.donation.heading">
          Apoya este proyecto
        </h2>
        <p i18n="@@reader.donation.text">
          La aplicación es gratuita y lo seguirá siendo: ninguna función depende de un pago. Si te
          sirve y quieres apoyar su desarrollo, puedes hacerlo de forma voluntaria.
        </p>
        <a
          lbButton
          variant="secondary"
          class="self-start"
          target="_blank"
          rel="noopener noreferrer"
          [href]="link.url"
        >
          @if (link.label; as label) {
            {{ label }}
          } @else {
            <ng-container i18n="@@reader.donation.default-label">Hacer una donación</ng-container>
          }
          <lb-icon name="external" />
          <span class="sr-only" i18n="@@reader.donation.new-tab">(se abre en otro sitio)</span>
        </a>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonationSection {
  protected readonly link = donationLink(inject(APP_SETTINGS));
}
