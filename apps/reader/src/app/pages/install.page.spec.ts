import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { InstallPrompt } from '../pwa/install-prompt';
import type { Platform } from '../pwa/platform';
import { InstallPage } from './install.page';

class FakeInstallPrompt {
  readonly canInstall = signal(false);
  readonly installed = signal(false);
  platform: Platform = 'desktop';
  accepts = true;
  install = vi.fn(async () => {
    this.canInstall.set(false);
    this.installed.set(this.accepts);
    return this.accepts;
  });
}

async function setup(change: (prompt: FakeInstallPrompt) => void = () => undefined) {
  const prompt = new FakeInstallPrompt();
  change(prompt);
  const { fixture } = await render(InstallPage, {
    providers: [{ provide: InstallPrompt, useValue: prompt }],
  });
  return { prompt, fixture };
}

const sections = () =>
  [...document.querySelectorAll('details')].map((details) => ({
    name: details.querySelector('summary')?.textContent?.trim(),
    open: details.open,
  }));

describe('InstallPage (LB-030)', () => {
  it('gives steps for Android, iPhone or iPad, and computer', async () => {
    await setup();

    expect(screen.getByRole('heading', { level: 1, name: 'Instalar la aplicación' })).toBeTruthy();
    expect(sections().map((section) => section.name)).toEqual([
      'En una computadora',
      'En Android',
      'En iPhone o iPad',
    ]);
  });

  it.each([
    ['android', 'En Android'],
    ['ios', 'En iPhone o iPad'],
    ['desktop', 'En una computadora'],
  ] as const)('puts the steps for %s first and open', async (platform, name) => {
    await setup((prompt) => (prompt.platform = platform));

    const [first, ...others] = sections();
    expect(first).toEqual({ name, open: true });
    expect(others.every((section) => !section.open)).toBe(true);
  });

  it('says what installing gives', async () => {
    await setup();

    const why = screen.getByRole('region', { name: 'Por qué instalarla' }).textContent ?? '';
    expect(why).toMatch(/ícono/);
    expect(why).toMatch(/sin internet/);
    expect(why).toMatch(/conserva tus datos/);
  });

  it('installs in one tap when the browser offers it', async () => {
    const { prompt, fixture } = await setup((prompt) => prompt.canInstall.set(true));

    await userEvent.setup().click(screen.getByRole('button', { name: 'Instalar ahora' }));
    await fixture.whenStable();

    expect(prompt.install).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Instalar ahora' })).toBeNull();
    expect(screen.getByText(/Ya estás usando la aplicación instalada/)).toBeTruthy();
  });

  it('offers no button when the browser cannot install it', async () => {
    await setup();

    expect(screen.queryByRole('button', { name: 'Instalar ahora' })).toBeNull();
  });

  it('says so when the app is already installed', async () => {
    await setup((prompt) => prompt.installed.set(true));

    expect(screen.getByText(/Ya estás usando la aplicación instalada/)).toBeTruthy();
  });

  describe('after "Instalar ahora" (LB-030 review)', () => {
    it('announces the result in a status region that was already there', async () => {
      const { fixture } = await setup((prompt) => prompt.canInstall.set(true));
      const status = screen.getByRole('status');

      await userEvent.setup().click(screen.getByRole('button', { name: 'Instalar ahora' }));
      await fixture.whenStable();

      expect(screen.getByRole('status')).toBe(status);
      expect(status.textContent).toMatch(/Ya estás usando la aplicación instalada/);
    });

    it('says it was not installed when the person says no', async () => {
      const { fixture } = await setup((prompt) => {
        prompt.canInstall.set(true);
        prompt.accepts = false;
      });

      await userEvent.setup().click(screen.getByRole('button', { name: 'Instalar ahora' }));
      await fixture.whenStable();

      expect(screen.getByRole('status').textContent).toMatch(
        /No se instaló. Puedes hacerlo cuando quieras con los pasos de abajo./,
      );
    });

    it('moves the focus to the page title instead of losing it with the button', async () => {
      const { fixture } = await setup((prompt) => prompt.canInstall.set(true));

      await userEvent.setup().click(screen.getByRole('button', { name: 'Instalar ahora' }));
      await fixture.whenStable();

      expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }));
    });

    it('keeps the check mark away from screen readers', async () => {
      await setup((prompt) => prompt.installed.set(true));

      const mark = screen.getByText('✓');
      expect(mark.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
