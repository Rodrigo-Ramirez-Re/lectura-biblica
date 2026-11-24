import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

async function openOn(page: Page, day: string, path = './') {
  await page.clock.setFixedTime(new Date(`${day}T10:00:00`));
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Starts the default plan on 1 December 2026 and opens the plan editor. */
async function openEditor(page: Page) {
  await openOn(page, '2026-12-01');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Abdías', exact: true })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Plan' }).click();
  await page.getByRole('link', { name: 'Editar plan' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Editar plan' })).toBeVisible();
}

// The number field only: a checkbox can share the label ("sábado" as a rest day and as a pace).
async function setNumber(page: Page, label: string, value: string) {
  const field = page.getByRole('spinbutton', { name: label, exact: true });
  await field.fill(value);
  await field.blur();
}

test.describe('Plan editor — pace (LB-015)', () => {
  test('a new daily pace changes Plan and Hoy', async ({ page }) => {
    await openEditor(page);

    await setNumber(page, 'Capítulos al día', '4');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByText('4 capítulos al día')).toBeVisible();
    await page.getByRole('navigation').getByRole('link', { name: 'Hoy' }).click();
    await expect(page.getByRole('region', { name: 'Lectura de hoy' })).toContainText(
      'Abdías 1, 4 veces',
    );
  });

  test('a rest day expects nothing', async ({ page }) => {
    await openEditor(page);

    await page.getByRole('checkbox', { name: 'domingo' }).check();
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('3 capítulos al día; descanso: domingo')).toBeVisible();

    await openOn(page, '2026-12-06');
    await expect(page.getByText('Hoy es día de descanso.')).toBeVisible();
  });

  test('a pace per weekday', async ({ page }) => {
    await openEditor(page);

    await page.getByRole('radio', { name: 'Distinto cada día' }).check();
    await setNumber(page, 'sábado', '5');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByText(/Por día: .*sábado 5/)).toBeVisible();
  });

  test('cancel changes nothing', async ({ page }) => {
    await openEditor(page);

    await setNumber(page, 'Capítulos al día', '9');
    await page.getByRole('link', { name: 'Cancelar' }).click();

    await expect(page.getByText('3 capítulos al día')).toBeVisible();
  });

  test('has no accessibility violations', async ({ page }) => {
    await openEditor(page);

    await expectNoAccessibilityViolations(page);
  });
});

test.describe('Plan editor — durations and goals (LB-016)', () => {
  test('two weeks per book from the next block on', async ({ page }) => {
    await openEditor(page);

    await page.getByRole('radio', { name: 'Semanas' }).check();
    await setNumber(page, 'Semanas por libro', '2');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByText('Cada libro: 2 semanas')).toBeVisible();
    const blocks = page.getByRole('region', { name: 'Libro por libro' }).getByRole('listitem');
    await expect(blocks.nth(0)).toContainText('31 dic 2026');
    await expect(blocks.nth(1)).toContainText('1 ene 2027 – 14 ene 2027');
  });

  test('a goal of passes on Hoy', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('navigation').getByRole('link', { name: 'Hoy' }).click();

    await page.getByText('Meta de vueltas').click();
    await setNumber(page, 'Vueltas en este bloque', '3');
    await page.getByRole('button', { name: 'Guardar meta' }).click();
    await expect(page.getByText('Meta: 3 vueltas · llevas 0')).toBeVisible();

    await page.getByRole('button', { name: 'Ya leí' }).click();
    await expect(page.getByText('¡Cumpliste tu meta de 3 vueltas!')).toBeVisible();
  });
});

test.describe('Plan editor — book order (LB-017)', () => {
  test('a template and a book left out change the upcoming blocks only', async ({ page }) => {
    await openEditor(page);

    await page.getByRole('button', { name: 'Canónico' }).click();
    await page.getByRole('checkbox', { name: /Génesis/ }).uncheck();
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByText('Orden: Canónico; sin 1 libro')).toBeVisible();
    const blocks = page.getByRole('region', { name: 'Libro por libro' }).getByRole('listitem');
    await expect(blocks).toHaveCount(65);
    await expect(blocks.nth(0)).toContainText('Abdías');
    await expect(blocks.nth(1)).toContainText('Éxodo');
  });

  test('moves a book with the keyboard', async ({ page }) => {
    await openEditor(page);

    await page.getByRole('button', { name: 'Subir Filemón' }).focus();
    await page.keyboard.press('Enter');

    await expect(page.getByText('Filemón ahora es el 1 de 66')).toBeAttached();
  });
});
