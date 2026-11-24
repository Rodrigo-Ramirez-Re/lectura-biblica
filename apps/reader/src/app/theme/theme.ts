import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

export type ThemeChoice = 'auto' | 'light' | 'dark';

export const THEME_CHOICES: readonly ThemeChoice[] = ['auto', 'light', 'dark'];

/** Where the device keeps the person's theme choice. */
export abstract class ThemePreference {
  abstract read(): ThemeChoice;
  abstract write(choice: ThemeChoice): void;
}

/**
 * The theme is a per-device preference read before the first paint (see index.html), so it lives
 * in localStorage rather than IndexedDB, which is asynchronous. The key is namespaced because every
 * project site of the account shares the github.io origin.
 */
export const THEME_STORAGE_KEY = 'lectura-biblica.theme';

@Injectable()
export class LocalStorageThemePreference extends ThemePreference {
  read(): ThemeChoice {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return THEME_CHOICES.includes(stored as ThemeChoice) ? (stored as ThemeChoice) : 'auto';
    } catch {
      return 'auto';
    }
  }

  write(choice: ThemeChoice): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, choice);
    } catch {
      // Storage blocked (private mode): the choice still applies until the page is closed.
    }
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
