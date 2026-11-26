import { provideRouter } from '@angular/router';
import {
  DeleteAllData,
  ExportBackup,
  ImportBackup,
  PreviewBackup,
} from '@lectura/reading-application';
import { JournalReader } from '@lectura/reading-domain';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { StorageGuard } from '@lectura/shared-kernel';
import { FixedClock, InMemoryFileSaver } from '@lectura/shared-kernel/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { signal } from '@angular/core';
import { FakeStorageGuard } from '../../testing/fake-storage-guard';
import { APP_SETTINGS, appSettings, type AppSettings } from '../app-config';
import { InstallPrompt } from '../pwa/install-prompt';
import { ThemePreference, ThemeService, type ThemeChoice } from '../theme/theme';
import { AboutPage } from './about.page';

class InMemoryThemePreference extends ThemePreference {
  stored: ThemeChoice = 'auto';
  read = () => this.stored;
  write = (choice: ThemeChoice) => {
    this.stored = choice;
  };
}

describe('AboutPage (LB-006)', () => {
  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  async function setup(
    persisted = false,
    donation: AppSettings['donation'] = appSettings.donation,
    installed = false,
  ) {
    const preference = new InMemoryThemePreference();
    const journal = new InMemoryJournal();
    const clock = new FixedClock('2026-12-03');
    const { fixture } = await render(AboutPage, {
      providers: [
        provideRouter([]),
        { provide: ThemePreference, useValue: preference },
        { provide: APP_SETTINGS, useValue: { ...appSettings, donation } },
        { provide: InstallPrompt, useValue: { installed: signal(installed) } },
        { provide: StorageGuard, useValue: new FakeStorageGuard(true, persisted) },
        { provide: JournalReader, useValue: journal },
        {
          provide: ExportBackup,
          useValue: new ExportBackup(journal, journal, clock, new InMemoryFileSaver()),
        },
        { provide: PreviewBackup, useValue: new PreviewBackup() },
        { provide: ImportBackup, useValue: new ImportBackup(journal) },
        { provide: DeleteAllData, useValue: new DeleteAllData(journal) },
      ],
    });
    await fixture.whenStable();
    return { preference, theme: fixture.debugElement.injector.get(ThemeService) };
  }

  it('explains that the app is free and that data stays on the device', async () => {
    await setup();

    expect(screen.getByRole('heading', { level: 1, name: 'Acerca de' })).toBeTruthy();
    expect(screen.getByText(/es gratuita/i)).toBeTruthy();
    expect(screen.getByText(/solo en este dispositivo/i)).toBeTruthy();
    expect(screen.getByText(/no recopilamos datos personales/i)).toBeTruthy();
  });

  it('starts with the current theme selected', async () => {
    await setup();

    expect(screen.getByRole('radio', { name: /Automático/ })).toHaveProperty('checked', true);
  });

  it('changes the theme at once when another option is chosen', async () => {
    const { preference, theme } = await setup();

    await userEvent.setup().click(screen.getByRole('radio', { name: 'Oscuro' }));

    expect(theme.choice()).toBe('dark');
    expect(preference.stored).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('says when the browser keeps the data persistently (LB-010)', async () => {
    await setup(true);

    expect(screen.getByText(/Almacenamiento persistente/)).toBeTruthy();
  });

  it('warns when the browser may delete the data (LB-010)', async () => {
    await setup(false);

    expect(screen.getByText(/Almacenamiento no persistente/).textContent).toContain('respaldos');
  });

  it('links to the install help (LB-030)', async () => {
    await setup();

    expect(
      screen.getByRole('link', { name: 'Cómo instalar la aplicación' }).getAttribute('href'),
    ).toBe('/instalar');
  });

  it('does not suggest installing an app that is already installed (LB-030)', async () => {
    await setup(false, appSettings.donation, true);

    expect(screen.queryByRole('link', { name: 'Cómo instalar la aplicación' })).toBeNull();
  });

  describe('donation (LB-029)', () => {
    it('shows nothing while donations are turned off', async () => {
      await setup(false, { enabled: false, label: 'Donar', url: 'https://example.org/d' });

      expect(screen.queryByRole('heading', { name: 'Apoya este proyecto' })).toBeNull();
      expect(screen.queryByText(/donación/i)).toBeNull();
    });

    it('offers the configured link, saying the app stays free and support is voluntary', async () => {
      await setup(false, {
        enabled: true,
        label: 'Invítame un café',
        url: 'https://example.org/d',
      });

      const section = screen.getByRole('region', { name: 'Apoya este proyecto' });
      expect(section.textContent).toMatch(/gratuita/);
      expect(section.textContent).toMatch(/voluntari/);
      const link = screen.getByRole('link', { name: /Invítame un café/ });
      expect(link.getAttribute('href')).toBe('https://example.org/d');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link.textContent).toMatch(/se abre en otro sitio/);
    });

    it('names the link "Hacer una donación" without a configured label', async () => {
      await setup(false, { enabled: true, label: '', url: 'https://example.org/d' });

      expect(screen.getByRole('link', { name: /Hacer una donación/ })).toBeTruthy();
    });

    it('never shows a link that is not https', async () => {
      await setup(false, { enabled: true, label: 'Donar', url: 'javascript:alert(1)' });

      expect(screen.queryByRole('link', { name: /Donar/ })).toBeNull();
    });
  });
});
