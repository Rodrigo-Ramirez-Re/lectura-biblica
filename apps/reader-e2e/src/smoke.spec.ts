import { expect, test } from '@playwright/test';

test.describe('Workspace scaffold (LB-001)', () => {
  test('loads the home route without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('./');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lectura bíblica');
    expect(errors).toEqual([]);
  });

  test('applies Tailwind utilities', async ({ page }) => {
    await page.goto('./');

    await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-weight', '700');
  });
});
