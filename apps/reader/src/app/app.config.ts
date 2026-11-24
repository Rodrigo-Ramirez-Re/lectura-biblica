import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { TitleStrategy, provideRouter } from '@angular/router';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { appRoutes } from './app.routes';
import { AppTitleStrategy } from './navigation/app-title-strategy';
import { focusHeadingOnNavigation } from './navigation/focus-on-navigation';
import { LocalStorageThemePreference, ThemePreference, ThemeService } from './theme/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideSpanishLocale(),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    { provide: ThemePreference, useClass: LocalStorageThemePreference },
    provideAppInitializer(() => {
      inject(ThemeService);
      focusHeadingOnNavigation();
    }),
  ],
};
