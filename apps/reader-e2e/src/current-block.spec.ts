import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

async function openOn(page: Page, day: string, path = './') {
  await page.clock.setFixedTime(new Date(`${day}T10:00:00`));
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Starts the default plan on 1 December 2026 and comes back on the 10th. */
async function readingOnTheTenth(page: Page) {
  await openOn(page, '2026-12-01');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Abdías', exact: true })).toBeVisible();
  await openOn(page, '2026-12-10');
  await page.getByText('Cambiar este libro').click();
}

const book = (page: Page, name: string) =>
  page.getByRole('heading', { level: 2, name, exact: true });

test.describe('Current book (LB-018)', () => {
  test('switches to another book and the previous one returns to the queue', async ({ page }) => {
    await readingOnTheTenth(page);

    await page.getByLabel('Otro libro').selectOption({ label: 'Rut' });
    await page.getByRole('button', { name: 'Empezar este libro' }).click();

    await expect(book(page, 'Rut')).toBeVisible();
    await page.getByRole('navigation').getByRole('link', { name: 'Plan' }).click();
    const blocks = page.getByRole('region', { name: 'Libro por libro' }).getByRole('listitem');
    await expect(blocks.nth(0)).toContainText('Cambiado');
    await expect(blocks.nth(1)).toContainText('Rut');
    await expect(blocks.nth(2)).toContainText('Abdías');
  });

  test('skips the book', async ({ page }) => {
    await readingOnTheTenth(page);

    await page.getByRole('button', { name: 'Saltar este libro' }).click();

    await expect(book(page, 'Filemón')).toBeVisible();
  });

  test('pauses and resumes days later', async ({ page }) => {
    await readingOnTheTenth(page);

    await page.getByRole('button', { name: 'Pausar el plan' }).click();
    await expect(page.getByRole('region', { name: 'Plan en pausa' })).toContainText(
      'desde el 10 de diciembre',
    );

    await openOn(page, '2027-01-05');
    await page.getByRole('button', { name: 'Reanudar' }).click();

    await expect(book(page, 'Abdías')).toBeVisible();
    await expect(page.getByText('Del 5 de enero al 31 de enero de 2027')).toBeVisible();
  });

  test('ends the book on another day', async ({ page }) => {
    await readingOnTheTenth(page);

    await page.getByLabel('Terminar este libro el').fill('2026-12-20');
    await page.getByRole('button', { name: 'Guardar fecha' }).click();

    await expect(page.getByText('Del 1 de diciembre al 20 de diciembre de 2026')).toBeVisible();
  });

  test('has no accessibility violations', async ({ page }) => {
    await readingOnTheTenth(page);

    await expectNoAccessibilityViolations(page);
  });
});
