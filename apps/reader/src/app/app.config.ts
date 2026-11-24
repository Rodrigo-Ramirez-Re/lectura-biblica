import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { JournalReader, JournalWriter } from '@lectura/reading-domain';
import { IndexedDbJournal } from '@lectura/reading-infrastructure';
import { BrowserStorageGuard } from '@lectura/shared-infrastructure-browser';
import { StorageGuard } from '@lectura/shared-kernel';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { appRoutes } from './app.routes';
import { AppTitleStrategy } from './navigation/app-title-strategy';
import { focusHeadingOnNavigation } from './navigation/focus-on-navigation';
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
    { provide: StorageGuard, useFactory: () => new BrowserStorageGuard() },
    { provide: IndexedDbJournal, useFactory: () => new IndexedDbJournal(inject(StorageGuard)) },
    { provide: JournalReader, useExisting: IndexedDbJournal },
    { provide: JournalWriter, useExisting: IndexedDbJournal },
    provideAppInitializer(() => {
      inject(ThemeService);
      focusHeadingOnNavigation();
    }),
  ],
};
