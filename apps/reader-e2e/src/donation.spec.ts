import { expect, test } from '@playwright/test';

// The published config keeps donations off until the owner picks a service (LB-029); the section
// itself is covered by the about page's component tests.
test('shows no donation section while it is turned off (LB-029)', async ({ page }) => {
  await page.goto('./acerca');

  await expect(page.getByRole('heading', { level: 1, name: 'Acerca de' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Apoya este proyecto' })).toHaveCount(0);
  await expect(page.getByText(/donación/i)).toHaveCount(0);
});
