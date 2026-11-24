import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// The production build served like GitHub Pages, under the repository sub-path (LB-008).
const pagesURL = 'http://localhost:4210/lectura-biblica/';
const baseURL = process.env['BASE_URL'] || pagesURL;
// Narrows the engines for a quick local run (E2E_BROWSERS=chromium); unset runs all.
const browsers = process.env['E2E_BROWSERS']?.split(',');

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  // The production build in three engines at once is slow to answer under load on a laptop.
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    // The worker prefetches the whole app on every first load; only the suites about it need it.
    serviceWorkers: 'block',
  },
  // With BASE_URL (e.g. a check against the published site) no local server is started.
  webServer: process.env['BASE_URL']
    ? undefined
    : {
        command: 'npx nx run reader:serve-pages',
        url: pagesURL,
        reuseExistingServer: true,
        cwd: workspaceRoot,
      },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ].filter((project) => !browsers || browsers.includes(project.name)),
});
