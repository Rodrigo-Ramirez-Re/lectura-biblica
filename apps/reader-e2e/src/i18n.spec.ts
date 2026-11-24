import { expect, test } from '@playwright/test';

test.describe('i18n baseline (LB-004)', () => {
  test('declares Mexican Spanish as the document language', async ({ page }) => {
    await page.goto('./');

    await expect(page.locator('html')).toHaveAttribute('lang', 'es-MX');
  });
});
