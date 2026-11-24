import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

async function openOn(page: Page, day: string, path = './') {
  await page.clock.setFixedTime(new Date(`${day}T10:00:00`));
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Starts the default plan on 1 December 2026, reads today's chapters and opens Acerca de. */
async function readAndOpenAbout(page: Page) {
  await openOn(page, '2026-12-01');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByRole('button', { name: 'Ya leí' }).click();
  await expect(page.getByText('Listo por hoy')).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Acerca de' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Acerca de' })).toBeVisible();
}

async function exportBackup(page: Page) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar respaldo' }).click();
  const file = await download;
  return { name: file.suggestedFilename(), text: await readFile(await file.path(), 'utf8') };
}

async function importText(page: Page, text: string) {
  await page.getByLabel('Importar respaldo').setInputFiles({
    name: 'respaldo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  });
}

async function deleteEverything(page: Page) {
  await page.getByText('Borrar mis datos').click();
  await page.getByLabel('Escribe BORRAR para confirmar').fill('BORRAR');
  await page.getByRole('button', { name: 'Borrar todo' }).click();
  await expect(page.getByRole('region', { name: 'Empieza con «Un libro al mes»' })).toBeVisible();
}

test.describe('Backup (LB-013)', () => {
  test('exports a dated file with everything', async ({ page }) => {
    await readAndOpenAbout(page);

    const { name, text } = await exportBackup(page);

    expect(name).toBe('lectura-biblica-respaldo-2026-12-01.json');
    const backup = JSON.parse(text);
    expect(backup).toMatchObject({ schemaVersion: 1, app: 'lectura-biblica' });
    expect(backup.plan.name).toBe('Un libro al mes');
    expect(backup.logs).toHaveLength(1);
    await expect(page.getByText(/Último respaldo: 1 de diciembre de 2026/)).toBeVisible();
  });

  test('restores everything after deleting it', async ({ page }) => {
    await readAndOpenAbout(page);
    const { text } = await exportBackup(page);
    await deleteEverything(page);

    await page.getByRole('navigation').getByRole('link', { name: 'Acerca de' }).click();
    await importText(page, text);
    const preview = page.getByRole('region', { name: 'Contenido del respaldo' });
    await expect(preview).toContainText('Un libro al mes');
    await expect(preview).toContainText('1 registro de lectura');
    await preview.getByRole('button', { name: 'Reemplazar mis datos' }).click();

    await expect(
      page.getByRole('heading', { level: 2, name: 'Abdías', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Listo por hoy')).toBeVisible();
  });

  test('rejects a file that is not a backup and keeps the data', async ({ page }) => {
    await readAndOpenAbout(page);

    await importText(page, '{"hola": "mundo"}');

    await expect(page.getByText('El archivo no es un respaldo de esta aplicación.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reemplazar mis datos' })).toBeHidden();
    await page.getByRole('navigation').getByRole('link', { name: 'Hoy' }).click();
    await expect(page.getByText('Listo por hoy')).toBeVisible();
  });

  test('asks to update the app for a backup of a newer version', async ({ page }) => {
    await readAndOpenAbout(page);

    await importText(page, JSON.stringify({ app: 'lectura-biblica', schemaVersion: 99 }));

    await expect(page.getByText(/versión más nueva/)).toBeVisible();
  });

  test('reminds to export after 7 days of reading without a backup', async ({ page }) => {
    await readAndOpenAbout(page);
    const backup = JSON.parse((await exportBackup(page)).text);
    const [log] = backup.logs;
    backup.settings.lastBackupAt = null;
    backup.logs = Array.from({ length: 7 }, (_, i) => ({
      ...log,
      id: `l${i}`,
      date: `2026-12-0${i + 1}`,
    }));
    await openOn(page, '2026-12-08', './acerca');
    await importText(page, JSON.stringify(backup));
    await page.getByRole('button', { name: 'Reemplazar mis datos' }).click();

    const reminder = page.getByRole('region', { name: 'Haz un respaldo' });
    await expect(reminder).toBeVisible();
    await reminder.getByRole('button', { name: 'Ahora no' }).click();
    await expect(reminder).toBeHidden();
  });

  test('has no accessibility violations on the backup panel', async ({ page }) => {
    await readAndOpenAbout(page);
    await page.getByText('Borrar mis datos').click();

    await expectNoAccessibilityViolations(page);
  });
});
