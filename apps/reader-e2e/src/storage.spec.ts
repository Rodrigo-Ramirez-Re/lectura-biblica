import { expect, test } from '@playwright/test';

test.describe('Local storage (LB-010)', () => {
  test('explains once where the data lives', async ({ page }) => {
    await page.goto('./');

    const notice = page.getByRole('region', { name: 'Tus datos viven en este dispositivo' });
    await expect(notice).toContainText('Safari');
    await notice.getByRole('button', { name: 'Entendido' }).click();
    await expect(notice).toBeHidden();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible();
    await expect(page.getByText('Tus datos viven en este dispositivo')).toBeHidden();
  });

  test('creates its database under a fixed name', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible();

    await expect
      .poll(() => page.evaluate(async () => (await indexedDB.databases()).map((db) => db.name)))
      .toContain('lectura-biblica');
  });

  test('tells on Acerca de whether the browser keeps the data', async ({ page }) => {
    await page.goto('./acerca');

    await expect(page.getByText(/Almacenamiento (no )?persistente/)).toBeVisible();
  });
});
