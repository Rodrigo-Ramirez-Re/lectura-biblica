import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

/** Starts the default plan on 1 December 2026 and opens the plan editor. */
async function openEditor(page: Page) {
  await page.clock.setFixedTime(new Date('2026-12-01T10:00:00'));
  await page.goto('./');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Abdías', exact: true })).toBeVisible();
  await page.goto('./plan/editar');
  await expect(page.getByRole('heading', { level: 1, name: 'Editar plan' })).toBeVisible();
}

async function saveTemplate(page: Page, name: string, chaptersPerDay: string) {
  const pace = page.getByRole('spinbutton', { name: 'Capítulos al día', exact: true });
  await pace.fill(chaptersPerDay);
  await pace.blur();
  await page.getByLabel('Nombre de la plantilla').fill(name);
  await page.getByRole('button', { name: 'Guardar estas opciones como plantilla' }).click();
  await expect(page.getByText('Plantilla guardada.')).toBeVisible();
}

test.describe('Plan templates (LB-022)', () => {
  test('saves the options as a template and applies another one', async ({ page }) => {
    await openEditor(page);
    await saveTemplate(page, 'Cinco al día', '5');

    await page.getByRole('button', { name: 'Aplicar Cinco al día' }).click();
    await page.getByRole('button', { name: 'Sí', exact: true }).click();

    await expect(page.getByRole('heading', { level: 2, name: 'Cinco al día' })).toBeVisible();
    await expect(page.getByText('5 capítulos al día')).toBeVisible();
  });

  test('exports a template and imports it back', async ({ page }) => {
    await openEditor(page);
    await saveTemplate(page, 'Mi plan de 2027', '4');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar Mi plan de 2027' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('plantilla-mi-plan-de-2027.json');
    const text = await readFile(await file.path(), 'utf8');

    await page.getByRole('button', { name: 'Borrar Mi plan de 2027' }).click();
    await page.getByRole('button', { name: 'Sí', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Aplicar Mi plan de 2027' })).toBeHidden();

    await page.getByLabel('Importar plantilla').setInputFiles({
      name: 'plantilla.json',
      mimeType: 'application/json',
      buffer: Buffer.from(text),
    });

    await expect(page.getByText('Plantilla «Mi plan de 2027» importada.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aplicar Mi plan de 2027' })).toBeVisible();
  });

  test('rejects a file that is not a template', async ({ page }) => {
    await openEditor(page);

    await page.getByLabel('Importar plantilla').setInputFiles({
      name: 'x.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"hola": 1}'),
    });

    await expect(
      page.getByText('El archivo no es una plantilla de esta aplicación.'),
    ).toBeVisible();
  });

  test('has no accessibility violations', async ({ page }) => {
    await openEditor(page);

    await expectNoAccessibilityViolations(page);
  });
});
