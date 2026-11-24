import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

async function openOn(page: Page, day: string, path = './') {
  await page.clock.setFixedTime(new Date(`${day}T10:00:00`));
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Starts the default plan on 1 December 2026 (Abdías) and returns on `day`. */
async function readingAbdias(page: Page, day = '2026-12-01') {
  await openOn(page, '2026-12-01');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Abdías', exact: true })).toBeVisible();
  if (day !== '2026-12-01') await openOn(page, day);
}

test.describe('Today (LB-012)', () => {
  test('shows what is due and logs it with one tap', async ({ page }) => {
    await readingAbdias(page);
    const reading = page.getByRole('region', { name: 'Lectura de hoy' });
    await expect(reading).toContainText('Abdías 1, 3 veces');

    await reading.getByRole('button', { name: 'Ya leí' }).click();

    await expect(reading).toContainText('Listo por hoy');
    await expect(page.getByRole('status').filter({ hasText: 'Registrado' })).toContainText(
      'Registrado: Abdías · 3 capítulos',
    );
    await expect(page.getByRole('region', { name: 'Tu avance en Abdías' })).toContainText(
      '3 vueltas completas en este bloque.',
    );
  });

  test('undoes a log', async ({ page }) => {
    await readingAbdias(page);
    await page.getByRole('button', { name: 'Ya leí' }).click();

    await page.getByRole('button', { name: 'Deshacer' }).click();

    await expect(page.getByRole('button', { name: 'Ya leí' })).toBeVisible();
  });

  test('logs extra chapters after finishing the day', async ({ page }) => {
    await readingAbdias(page);
    await page.getByRole('button', { name: 'Ya leí' }).click();
    await expect(page.getByText('Listo por hoy')).toBeVisible();

    await page.getByText('Otra cantidad u otro día').click();
    await page.getByLabel('Capítulos').fill('2');
    await page.getByLabel('Capítulos').blur();
    await page.getByRole('button', { name: 'Registrar' }).click();

    await expect(page.getByText('Leíste 5 capítulos hoy.')).toBeVisible();
  });

  test('logs a past day of the block', async ({ page }) => {
    await readingAbdias(page, '2026-12-03');

    await page.getByText('Otra cantidad u otro día').click();
    // The date field of 'Día': Hoy has other date fields, and a date input exposes its parts as 'Día', 'Mes', 'Año'.
    await page
      .locator('lb-form-field')
      .filter({ has: page.getByText('Día', { exact: true }) })
      .locator('input')
      .fill('2026-12-02');
    await page.getByLabel('Capítulos').fill('4');
    await page.getByLabel('Capítulos').blur();
    await page.getByRole('button', { name: 'Registrar' }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Registrado' })).toContainText(
      'Abdías · 4 capítulos',
    );
    await expect(page.getByRole('region', { name: 'Lectura de hoy' })).toContainText(
      'Abdías 1, 3 veces',
    );
  });

  test('adds a "Tu lectura" section to the book page', async ({ page }) => {
    await readingAbdias(page);
    await page.getByRole('button', { name: 'Ya leí' }).click();
    await expect(page.getByText('Listo por hoy')).toBeVisible();

    await page.getByRole('navigation').getByRole('link', { name: 'Libros' }).click();
    await page.getByRole('link', { name: /Abdías/ }).click();

    const section = page.getByRole('region', { name: 'Tu lectura' });
    await expect(section).toContainText('3 vueltas completas');
    await expect(section).toContainText('3 capítulos');
  });

  test('has no accessibility violations while reading', async ({ page }) => {
    await readingAbdias(page);
    await page.getByText('Otra cantidad u otro día').click();

    await expectNoAccessibilityViolations(page);
  });
});
