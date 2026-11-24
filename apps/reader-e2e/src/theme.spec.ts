import { expect, test } from '@playwright/test';

const LIGHT_SURFACE = 'rgb(251, 248, 243)';
const DARK_SURFACE = 'rgb(23, 21, 18)';

test.describe('Design tokens (LB-003)', () => {
  test('follows the device theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('./');

    await expect(page.locator('body')).toHaveCSS('background-color', DARK_SURFACE);
  });

  test('a forced theme wins over the device', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('./');

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));

    await expect(page.locator('body')).toHaveCSS('background-color', LIGHT_SURFACE);
  });
});
