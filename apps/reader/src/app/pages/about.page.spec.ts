import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { StorageGuard } from '@lectura/shared-kernel';
import { FakeStorageGuard } from '../../testing/fake-storage-guard';
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

  async function setup(persisted = false) {
    const preference = new InMemoryThemePreference();
    const { fixture } = await render(AboutPage, {
      providers: [
        { provide: ThemePreference, useValue: preference },
        { provide: StorageGuard, useValue: new FakeStorageGuard(true, persisted) },
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
});
