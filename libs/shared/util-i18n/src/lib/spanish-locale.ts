import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';
import { EnvironmentProviders, LOCALE_ID, makeEnvironmentProviders } from '@angular/core';

/** Spanish (Mexico) for dates and numbers in pipes (ADR 0005). */
export function provideSpanishLocale(): EnvironmentProviders {
  registerLocaleData(localeEsMx, 'es-MX');
  return makeEnvironmentProviders([{ provide: LOCALE_ID, useValue: 'es-MX' }]);
}
