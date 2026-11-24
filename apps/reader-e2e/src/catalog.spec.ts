import { expect, test } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

test.describe('Book catalog (LB-009)', () => {
  test('browses the books by testament and opens one', async ({ page }) => {
    await page.goto('./libros');

    const old = page.getByRole('region', { name: 'Antiguo Testamento' });
    await expect(old.getByRole('link')).toHaveCount(39);
    await expect(
      page.getByRole('region', { name: 'Nuevo Testamento' }).getByRole('link'),
    ).toHaveCount(27);

    await old.getByRole('link', { name: /Abdías/ }).click();

    await expect(page).toHaveTitle('Abdías · Lectura bíblica');
    await expect(page.getByRole('heading', { level: 1, name: 'Abdías' })).toBeFocused();
    await expect(page.getByText('libro 31 de 66')).toBeVisible();
    await expect(page.getByText('1 capítulo', { exact: true })).toBeVisible();
  });

  test('searches ignoring accents and case', async ({ page }) => {
    await page.goto('./libros');

    await page.getByRole('searchbox', { name: 'Buscar libro' }).fill('GENESIS');

    await expect(page.getByRole('link', { name: /Génesis/ })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link')).toHaveCount(1);
  });

  test('opens a book page from its address', async ({ page }) => {
    await page.goto('./libros/salmos');

    await expect(page.getByRole('heading', { level: 1, name: 'Salmos' })).toBeVisible();
    await expect(page.getByText('150 capítulos')).toBeVisible();
  });

  test('says when a book does not exist', async ({ page }) => {
    await page.goto('./libros/xyz');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Libro no encontrado');
    await page.getByRole('link', { name: 'Ver todos los libros' }).click();
    await expect(page).toHaveTitle('Libros · Lectura bíblica');
  });

  for (const path of ['./libros', './libros/salmos']) {
    test(`has no accessibility violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      await expectNoAccessibilityViolations(page);
    });
  }
});
