import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { appRoutes } from './app.routes';
import { AppTitleStrategy } from './navigation/app-title-strategy';
import { focusHeadingOnNavigation } from './navigation/focus-on-navigation';
import { InstallPrompt } from './pwa/install-prompt';
import { provideReading } from './reading.providers';
import { LocalStorageThemePreference, ThemePreference, ThemeService } from './theme/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideSpanishLocale(),
    // Relative path: resolves under the GitHub Pages sub-path (ADR 0002).
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    { provide: ThemePreference, useClass: LocalStorageThemePreference },
    ...provideReading(),
    provideAppInitializer(() => {
      inject(ThemeService);
      // The browser offers to install once, early: listen before any screen asks (LB-030).
      inject(InstallPrompt);
      focusHeadingOnNavigation();
    }),
  ],
};
