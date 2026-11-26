import { expect, test } from '@playwright/test';

test.describe('PWA (LB-007)', () => {
  test.use({ serviceWorkers: 'allow' });

  test('links the manifest and serves it', async ({ page, request }) => {
    await page.goto('./');

    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifest = await (await request.get(new URL(href ?? '', page.url()).href)).json();
    expect(manifest.display).toBe('standalone');
  });

  test('has what browsers need to install it (LB-033)', async ({ page, request }) => {
    await page.goto('./');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifestUrl = new URL(href ?? '', page.url()).href;
    const manifest = await (await request.get(manifestUrl)).json();

    expect(manifest).toMatchObject({
      name: 'Lectura bíblica',
      short_name: 'Lectura',
      start_url: './',
      scope: './',
      display: 'standalone',
      lang: 'es',
    });
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    const icons: { src: string; sizes: string; purpose: string }[] = manifest.icons;
    expect(icons.map((icon) => `${icon.sizes} ${icon.purpose}`)).toEqual(
      expect.arrayContaining(['192x192 any', '512x512 any', '512x512 maskable']),
    );
    for (const icon of icons) {
      const response = await request.get(new URL(icon.src, manifestUrl).href);
      expect(response.ok(), icon.src).toBe(true);
      expect(response.headers()['content-type']).toBe('image/png');
    }
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
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
