import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  LocalStorageThemePreference,
  THEME_STORAGE_KEY,
  ThemePreference,
  ThemeService,
  type ThemeChoice,
} from './theme';

class InMemoryThemePreference extends ThemePreference {
  constructor(public stored: ThemeChoice = 'auto') {
    super();
  }
  read = () => this.stored;
  write = (choice: ThemeChoice) => {
    this.stored = choice;
  };
}

function setup(stored: ThemeChoice = 'auto') {
  const preference = new InMemoryThemePreference(stored);
  TestBed.configureTestingModule({
    providers: [{ provide: ThemePreference, useValue: preference }],
  });
  return {
    preference,
    service: TestBed.inject(ThemeService),
    root: TestBed.inject(DOCUMENT).documentElement,
  };
}

describe('ThemeService (LB-006)', () => {
  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  it('applies the stored choice on start', () => {
    const { root } = setup('dark');

    expect(root.getAttribute('data-theme')).toBe('dark');
  });

  it('applies and keeps a new choice', () => {
    const { service, root, preference } = setup();

    service.choose('light');

    expect(root.getAttribute('data-theme')).toBe('light');
    expect(preference.stored).toBe('light');
    expect(service.choice()).toBe('light');
  });

  it('lets the device decide with "auto"', () => {
    const { service, root } = setup('dark');

    service.choose('auto');

    expect(root.hasAttribute('data-theme')).toBe(false);
  });
});

describe('LocalStorageThemePreference (LB-006)', () => {
  afterEach(() => localStorage.clear());

  it('reads back what it wrote under a namespaced key', () => {
    const preference = new LocalStorageThemePreference();

    preference.write('dark');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(preference.read()).toBe('dark');
  });

  it('falls back to "auto" for missing or unknown values', () => {
    const preference = new LocalStorageThemePreference();
    expect(preference.read()).toBe('auto');

    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(preference.read()).toBe('auto');
  });
});
