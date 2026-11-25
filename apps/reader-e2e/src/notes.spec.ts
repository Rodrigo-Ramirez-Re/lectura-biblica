import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

async function startReading(page: Page) {
  await page.clock.setFixedTime(new Date('2026-12-01T10:00:00'));
  await page.goto('./');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Abdías', exact: true })).toBeVisible();
}

async function writeNote(page: Page, text: string) {
  await page.getByLabel('Lo que entendiste y los puntos importantes').fill(text);
  await page.getByRole('button', { name: 'Guardar nota' }).click();
}

test.describe('Notes (LB-021)', () => {
  test('writes a note on Hoy and finds it on the book page', async ({ page }) => {
    await startReading(page);

    await writeNote(page, 'Edom cosechará lo que sembró.\nEl reino será del Señor.');
    await expect(page.getByText('Edom cosechará lo que sembró.')).toBeVisible();

    await page.getByRole('navigation').getByRole('link', { name: 'Libros' }).click();
    await page.getByRole('link', { name: /Abdías/ }).click();
    const notes = page.getByRole('region', { name: 'Tus notas' });
    await expect(notes).toContainText('Edom cosechará lo que sembró.');
    await expect(notes).toContainText('1 de diciembre de 2026');
  });

  test('edits and deletes a note on the book page', async ({ page }) => {
    await startReading(page);
    await writeNote(page, 'Borrador');
    await expect(page.getByText('Borrador')).toBeVisible();
    await page.getByRole('navigation').getByRole('link', { name: 'Libros' }).click();
    await page.getByRole('link', { name: /Abdías/ }).click();
    const notes = page.getByRole('region', { name: 'Tus notas' });

    await notes.getByRole('button', { name: 'Editar' }).click();
    await notes.getByLabel('Editar nota').fill('Versión final');
    await notes.getByRole('button', { name: 'Guardar' }).click();
    await expect(notes).toContainText('Versión final');

    await notes.getByRole('button', { name: 'Borrar' }).click();
    await notes.getByRole('button', { name: 'Sí, borrar' }).click();
    await expect(notes).toContainText('Aún no tienes notas de este libro.');
  });

  test('refuses an empty note', async ({ page }) => {
    await startReading(page);

    await page.getByRole('button', { name: 'Guardar nota' }).click();

    await expect(page.getByText('La nota está vacía.')).toBeVisible();
  });

  test('has no accessibility violations', async ({ page }) => {
    await startReading(page);
    await writeNote(page, 'Una nota');

    await expectNoAccessibilityViolations(page);
  });
});
