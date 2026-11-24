import { expect, test } from '@playwright/test';

const BASE = '/lectura-biblica/';

test.describe('GitHub Pages sub-path (LB-008)', () => {
  test.use({ serviceWorkers: 'allow' });

  test('requests every asset under the sub-path', async ({ page, baseURL }) => {
    const paths: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin === new URL(baseURL ?? '').origin) paths.push(url.pathname);
    });

    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready);

    expect(paths.length).toBeGreaterThan(3);
    expect(paths.filter((path) => !path.startsWith(BASE))).toEqual([]);
  });

  test('scopes the service worker and the manifest to the sub-path', async ({ page }) => {
    await page.goto('./');

    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(new URL(scope).pathname).toBe(BASE);
    const manifest = await page
      .locator('link[rel="manifest"]')
      .evaluate((link: HTMLLinkElement) => link.href);
    expect(new URL(manifest).pathname).toBe(`${BASE}manifest.webmanifest`);
  });

  test('boots a deep link on a first visit', async ({ page }) => {
    await page.goto('./acerca');

    await expect(page.getByRole('heading', { level: 1, name: 'Acerca de' })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(`${BASE}acerca`);
  });
});
