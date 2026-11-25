import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

async function openOn(page: Page, day: string, path = './') {
  await page.clock.setFixedTime(new Date(`${day}T10:00:00`));
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Starts the default plan on 1 December 2026, reads today's chapters and opens the block. */
async function openBlock(page: Page) {
  await openOn(page, '2026-12-01');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByRole('button', { name: 'Ya leí' }).click();
  await expect(page.getByText('Listo por hoy')).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Plan' }).click();
  await page.getByRole('link', { name: 'Abdías' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Abdías' })).toBeVisible();
}

test.describe('Edit and delete logs (LB-020)', () => {
  test('lists the logs of a block', async ({ page }) => {
    await openBlock(page);

    await expect(page.getByText('3 vueltas completas')).toBeVisible();
    const logs = page.getByRole('region', { name: 'Registros' }).getByRole('listitem');
    await expect(logs.first()).toContainText('martes 1 de diciembre');
  });

  test('edits a log and the passes follow', async ({ page }) => {
    await openBlock(page);

    await page.getByRole('button', { name: 'Editar el registro del 2026-12-01' }).click();
    await page.getByRole('spinbutton', { name: 'Capítulos leídos' }).fill('5');
    await page.getByRole('spinbutton', { name: 'Capítulos leídos' }).blur();
    await page.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText('5 vueltas completas')).toBeVisible();
  });

  test('deletes a log after confirming', async ({ page }) => {
    await openBlock(page);

    await page.getByRole('button', { name: 'Borrar el registro del 2026-12-01' }).click();
    await page.getByRole('button', { name: 'Sí, borrar' }).click();

    await expect(page.getByText('No hay registros en este libro.')).toBeVisible();
    await page.getByRole('navigation').getByRole('link', { name: 'Hoy' }).click();
    await expect(page.getByRole('button', { name: 'Ya leí' })).toBeVisible();
  });

  test('has no accessibility violations', async ({ page }) => {
    await openBlock(page);
    await page.getByRole('button', { name: 'Editar el registro del 2026-12-01' }).click();

    await expectNoAccessibilityViolations(page);
  });
});
