import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

async function openOn(page: Page, day: string, path = './') {
  await page.clock.setFixedTime(new Date(`${day}T10:00:00`));
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Starts the default plan on 1 December 2026 and logs that day's reading (3 chapters). */
async function readFirstDay(page: Page) {
  await openOn(page, '2026-12-01');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByRole('button', { name: 'Ya leí' }).click();
  await expect(page.getByText('Listo por hoy')).toBeVisible();
}

test.describe('Insights — monthly history (LB-028)', () => {
  test('shows the month and exports the history as CSV', async ({ page }) => {
    await readFirstDay(page);
    await openOn(page, '2026-12-02', './avance');

    const section = page.getByRole('region', { name: '¿Qué pasó cada mes?' });
    const december = section.getByRole('row').nth(1);
    await expect(december).toContainText('Diciembre de 2026');
    await expect(december).toContainText('Abdías · 3 vueltas');

    const download = page.waitForEvent('download');
    await section.getByRole('button', { name: 'Exportar historial (CSV)' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('lectura-biblica-historial-2026-12-02.csv');
    expect(await readFile(await file.path(), 'utf8')).toBe(
      '\uFEFFfecha,libro,desde,hasta,capitulos,ciclo\r\n2026-12-01,Abdías,1,1,3,1\r\n',
    );
    await expect(section.getByText('Historial exportado.')).toBeVisible();
  });

  test('offers no export before anything is read', async ({ page }) => {
    await openOn(page, '2026-12-01');
    await page.getByRole('button', { name: 'Empezar' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Abdías', exact: true }),
    ).toBeVisible();
    await openOn(page, '2026-12-01', './avance');

    const section = page.getByRole('region', { name: '¿Qué pasó cada mes?' });
    await expect(section).toContainText('Tu primer mes aparecerá aquí con tu primera lectura.');
    await expect(section.getByRole('button')).toHaveCount(0);
  });

  test('Avance has no accessibility violations with every section', async ({ page }) => {
    await readFirstDay(page);
    await openOn(page, '2026-12-02', './avance');
    await expect(page.getByRole('region', { name: '¿Qué pasó cada mes?' })).toBeVisible();
    for (const toggle of await page.getByText('Ver como tabla').all()) await toggle.click();

    await expectNoAccessibilityViolations(page);
  });
});
