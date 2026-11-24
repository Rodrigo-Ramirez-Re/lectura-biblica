import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

async function openOn(page: Page, day: string, path = './') {
  await page.clock.setFixedTime(new Date(`${day}T10:00:00`));
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

async function startToday(page: Page) {
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Abdías', exact: true })).toBeVisible();
}

test.describe('Default plan (LB-011)', () => {
  test('starts today with Abdías until the end of the month', async ({ page }) => {
    await openOn(page, '2026-11-24');

    await expect(page.getByRole('region', { name: 'Empieza con «Un libro al mes»' })).toBeVisible();
    await startToday(page);

    await expect(page.getByText('Del 24 de noviembre al 30 de noviembre de 2026')).toBeVisible();
  });

  test('keeps the plan after closing and reopening the app (LB-010)', async ({ page }) => {
    await openOn(page, '2026-11-24');
    await startToday(page);

    await page.reload();

    await expect(
      page.getByRole('heading', { level: 2, name: 'Abdías', exact: true }),
    ).toBeVisible();
  });

  test('starts on the 1st of next month', async ({ page }) => {
    await openOn(page, '2026-11-24');

    await page.getByRole('radio', { name: /El 1 de diciembre/ }).check();
    await page.getByRole('button', { name: 'Empezar' }).click();

    await expect(page.getByText('Tu plan empieza el 1 de diciembre con Abdías.')).toBeVisible();
  });

  test('moves to the next book when the month ends', async ({ page }) => {
    await openOn(page, '2026-11-24');
    await startToday(page);

    await openOn(page, '2026-12-02');

    await expect(
      page.getByRole('heading', { level: 2, name: 'Filemón', exact: true }),
    ).toBeVisible();
  });

  test('shows the cycle book by book on Plan', async ({ page }) => {
    await openOn(page, '2026-12-01');
    await startToday(page);

    await page.getByRole('navigation').getByRole('link', { name: 'Plan' }).click();

    await expect(page.getByText(/66 libros en 67 meses/)).toBeVisible();
    const blocks = page.getByRole('region', { name: 'Libro por libro' }).getByRole('listitem');
    await expect(blocks).toHaveCount(66);
    await expect(blocks.first()).toHaveAttribute('aria-current', 'step');
    await expect(blocks.last()).toContainText('Salmos');
    await expectNoAccessibilityViolations(page);
  });

  test('has no accessibility violations on the welcome', async ({ page }) => {
    await openOn(page, '2026-11-24');

    await expectNoAccessibilityViolations(page);
  });
});

test.describe('Default plan offline (LB-010, LB-011)', () => {
  test.use({ serviceWorkers: 'allow' });

  test('shows the plan without connection', async ({ page, context }) => {
    await openOn(page, '2026-11-24');
    await startToday(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.reload();

    await expect(
      page.getByRole('heading', { level: 2, name: 'Abdías', exact: true }),
    ).toBeVisible();
  });
});
