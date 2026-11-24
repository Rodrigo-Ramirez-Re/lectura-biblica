import { expect, test } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

test.describe('App shell (LB-006)', () => {
  test('shows a bottom tab bar on a narrow screen and marks the current screen', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./plan');

    const nav = page.getByRole('navigation', { name: 'Principal' });
    const box = await nav.boundingBox();
    expect(box && box.y + box.height).toBeGreaterThan(800);
    await expect(nav.getByRole('link', { name: 'Plan' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Hoy' })).not.toHaveAttribute('aria-current');
  });

  test('shows the navigation at the top on a wide screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./');

    const box = await page.getByRole('navigation', { name: 'Principal' }).boundingBox();
    expect(box?.y).toBeLessThan(200);
  });

  test('titles each screen and moves focus to its heading', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveTitle('Hoy · Lectura bíblica');
    await expect(page.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible();

    await page.getByRole('navigation').getByRole('link', { name: 'Libros' }).click();

    await expect(page).toHaveTitle('Libros · Lectura bíblica');
    await expect(page.getByRole('heading', { level: 1, name: 'Libros' })).toBeFocused();
  });

  test('explains the app on Acerca de', async ({ page }) => {
    await page.goto('./acerca');

    await expect(page.getByText(/es gratuita/i)).toBeVisible();
    await expect(page.getByText(/solo en este dispositivo/i)).toBeVisible();
  });

  test('keeps the theme choice after reloading', async ({ page }) => {
    await page.goto('./acerca');

    await page.getByRole('radio', { name: 'Oscuro' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('radio', { name: 'Oscuro' })).toBeChecked();
  });

  test('shows a not-found screen with a way back', async ({ page }) => {
    await page.goto('./no-existe');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página no encontrada');
    await page.getByRole('link', { name: 'Ir a Hoy' }).click();
    await expect(page).toHaveTitle('Hoy · Lectura bíblica');
  });

  test('offers the skip link as the first focusable element', async ({ page, browserName }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const firstFocusable = await page.evaluate(() =>
      document
        .querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ?.textContent?.trim(),
    );
    expect(firstFocusable).toBe('Saltar al contenido');

    // WebKit only tabs to links when the platform setting allows it, so the key is checked elsewhere.
    test.skip(browserName === 'webkit');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  });

  for (const path of ['./', './plan', './libros', './acerca', './no-existe']) {
    test(`has no accessibility violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      await expectNoAccessibilityViolations(page);
    });
  }
});
