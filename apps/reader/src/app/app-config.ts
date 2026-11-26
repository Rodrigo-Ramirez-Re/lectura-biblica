import { InjectionToken } from '@angular/core';
import config from '../config.json';

export interface AppSettings {
  readonly appName: string;
  readonly shortName: string;
  /** Off unless `enabled` and an https `url` (docs/operations/donations.md). */
  readonly donation: { readonly enabled: boolean; readonly label: string; readonly url: string };
}

/** The app's name and optional sections, configured in one place (src/config.json). */
export const appSettings: AppSettings = config;

/** The settings as a dependency, so tests can turn optional sections on. */
export const APP_SETTINGS = new InjectionToken<AppSettings>('APP_SETTINGS', {
  providedIn: 'root',
  factory: () => appSettings,
});
