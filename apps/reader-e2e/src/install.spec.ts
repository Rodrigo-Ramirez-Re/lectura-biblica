import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36';

const openSteps = (page: Page) => page.locator('details[open] summary');

test.describe('Install help (LB-030)', () => {
  test('is reached from Acerca de and puts the computer steps first on a computer', async ({
    page,
  }) => {
    await page.goto('./acerca');
    await page.getByRole('link', { name: 'Cómo instalar la aplicación' }).click();

    await expect(
      page.getByRole('heading', { level: 1, name: 'Instalar la aplicación' }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/^Instalar la aplicación · /);
    await expect(page.locator('summary')).toHaveText([
      'En una computadora',
      'En Android',
      'En iPhone o iPad',
    ]);
    await expect(openSteps(page)).toHaveText(['En una computadora']);
    await expectNoAccessibilityViolations(page);
  });

  test('opens the other steps with the keyboard', async ({ page }) => {
    await page.goto('./instalar');

    await page.getByText('En iPhone o iPad').focus();
    await page.keyboard.press('Enter');

    await expect(page.getByText('Abre esta página en Safari.')).toBeVisible();
  });

  test('is linked from the first-run notice about the data', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'Cómo instalarla' }).click();

    await expect(
      page.getByRole('heading', { level: 1, name: 'Instalar la aplicación' }),
    ).toBeVisible();
  });

  test('installs in one tap when the browser offers it', async ({ page }) => {
    await page.goto('./instalar');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Browsers only offer installing to a real person; this is the event Chrome and Edge fire.
    await page.evaluate(() => {
      const offer = Object.assign(new Event('beforeinstallprompt'), {
        prompt: async () => undefined,
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });
      window.dispatchEvent(offer);
    });
    await page.getByRole('button', { name: 'Instalar ahora' }).click();

    await expect(page.getByText('Ya estás usando la aplicación instalada.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Instalar ahora' })).toHaveCount(0);
  });
});

test.describe('Install help on Android (LB-030)', () => {
  test.use({ userAgent: ANDROID });

  test('puts the Android steps first and open', async ({ page }) => {
    await page.goto('./instalar');

    await expect(page.locator('summary').first()).toHaveText('En Android');
    await expect(openSteps(page)).toHaveText(['En Android']);
  });
});
