import { expect, test } from '@playwright/test';

test.describe('PWA (LB-007)', () => {
  test.use({ serviceWorkers: 'allow' });

  test('links the manifest and serves it', async ({ page, request }) => {
    await page.goto('./');

    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifest = await (await request.get(new URL(href ?? '', page.url()).href)).json();
    expect(manifest.display).toBe('standalone');
  });

  test('works offline after the first visit', async ({ page, context }) => {
    await page.goto('./');
    await page.evaluate(() => navigator.serviceWorker.ready);
    // The worker controls the page from the next load on, once it has cached the app.
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible();
    await page.getByRole('link', { name: 'Acerca de' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Acerca de' })).toBeVisible();
  });

  test('makes no request outside its own origin', async ({ page, baseURL }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));

    await page.goto('./');
    await page.getByRole('link', { name: 'Acerca de' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Acerca de' })).toBeVisible();

    const origin = new URL(baseURL ?? '').origin;
    expect(requests.filter((url) => !url.startsWith(origin) && !url.startsWith('data:'))).toEqual(
      [],
    );
  });
});
