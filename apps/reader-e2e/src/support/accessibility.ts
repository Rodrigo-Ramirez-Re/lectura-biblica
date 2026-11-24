import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * WCAG 2.2 A/AA scan of the current page; fails listing each violation's rule and targets.
 * Runs in Chromium and WebKit only: Playwright's Firefox crashes during the analysis whenever the
 * page did async work on start-up (LB-011 decisions). The DOM and styles axe checks are the same.
 */
export async function expectNoAccessibilityViolations(page: Page): Promise<void> {
  if (test.info().project.name === 'firefox') {
    test.info().annotations.push({ type: 'axe', description: 'skipped in Firefox (see LB-011)' });
    return;
  }
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
}
