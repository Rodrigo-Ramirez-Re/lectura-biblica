import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

// Read as a file: e2e may not import the app's code (module boundaries).
const config = JSON.parse(
  readFileSync(join(__dirname, '../../reader/src/config.json'), 'utf8'),
) as { donation: { enabled: boolean } };

// Checks the published build while donations are off (LB-029). Once the owner turns them on, the
// section is covered by the about page's component tests and this check steps aside.
test('shows no donation section while it is turned off (LB-029)', async ({ page }) => {
  test.skip(config.donation.enabled, 'donations are turned on in config.json');
  await page.goto('./acerca');

  await expect(page.getByRole('heading', { level: 1, name: 'Acerca de' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Apoya este proyecto' })).toHaveCount(0);
  await expect(page.getByText(/donación/i)).toHaveCount(0);
});
