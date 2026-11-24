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

async function setNumber(page: Page, label: string, value: string) {
  await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel(label, { exact: true }).blur();
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
