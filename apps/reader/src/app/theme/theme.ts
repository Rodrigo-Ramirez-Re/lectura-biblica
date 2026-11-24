import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { readDevicePreference, writeDevicePreference } from '../preferences/device-preferences';

export type ThemeChoice = 'auto' | 'light' | 'dark';

export const THEME_CHOICES: readonly ThemeChoice[] = ['auto', 'light', 'dark'];

/** Where the device keeps the person's theme choice. */
export abstract class ThemePreference {
  abstract read(): ThemeChoice;
  abstract write(choice: ThemeChoice): void;
}

/** index.html reads the same key before the first paint. */
export const THEME_STORAGE_KEY = 'lectura-biblica.theme';

@Injectable()
export class LocalStorageThemePreference extends ThemePreference {
  read(): ThemeChoice {
    const stored = readDevicePreference('theme');
    return THEME_CHOICES.includes(stored as ThemeChoice) ? (stored as ThemeChoice) : 'auto';
  }

  write(choice: ThemeChoice): void {
    writeDevicePreference('theme', choice);
  }
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly preference = inject(ThemePreference);
  private readonly root = inject(DOCUMENT).documentElement;

  readonly choice = signal<ThemeChoice>(this.preference.read());

  constructor() {
    this.apply(this.choice());
  }

  choose(choice: ThemeChoice): void {
    this.choice.set(choice);
    this.preference.write(choice);
    this.apply(choice);
  }

  private apply(choice: ThemeChoice): void {
    if (choice === 'auto') this.root.removeAttribute('data-theme');
    else this.root.setAttribute('data-theme', choice);
  }
}
