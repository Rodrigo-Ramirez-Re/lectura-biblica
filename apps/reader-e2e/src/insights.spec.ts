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

test.describe('Insights — on pace (LB-023)', () => {
  test('Avance sits between Plan and Libros in the navigation', async ({ page }) => {
    await openOn(page, '2026-12-01');

    const links = page.getByRole('navigation', { name: 'Principal' }).getByRole('link');
    await expect(links).toHaveText(['Hoy', 'Plan', 'Avance', 'Libros', 'Acerca de']);
  });

  test('explains insights before a plan starts', async ({ page }) => {
    await openOn(page, '2026-12-01', './avance');

    await expect(page.getByText(/Tu avance aparecerá aquí/)).toBeVisible();
  });

  test('says how far behind and draws the month', async ({ page }) => {
    await readFirstDay(page);
    await openOn(page, '2026-12-03', './avance');

    const section = page.getByRole('region', { name: '¿Voy al día?' });
    await expect(section.getByTestId('on-pace-verdict')).toHaveText(
      'Vas 6 capítulos atrasado (2 días)',
    );
    await expect(section).toContainText('Llevas 3 de 9 capítulos');

    const chart = section.getByRole('img', { name: /Capítulos acumulados de diciembre de 2026/ });
    await chart.scrollIntoViewIfNeeded();
    const box = await chart.boundingBox();
    if (!box) throw new Error('chart not drawn');
    await chart.hover({ position: { x: box.width - 12, y: box.height / 2 } });
    await expect(section.getByTestId('chart-tooltip')).toContainText('3 de diciembre');
    await expect(section.getByTestId('chart-tooltip')).toContainText('Según el plan: 9');

    await section.getByText('Ver como tabla').click();
    await expect(section.getByRole('row')).toHaveCount(4);
  });

  test('has no accessibility violations', async ({ page }) => {
    await readFirstDay(page);
    await openOn(page, '2026-12-03', './avance');
    await expect(page.getByTestId('on-pace-verdict')).toBeVisible();
    await page.getByText('Ver como tabla').click();

    await expectNoAccessibilityViolations(page);
  });
});
