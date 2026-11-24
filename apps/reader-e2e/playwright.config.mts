import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { getReadyUrl, workspaceRoot } from '@nx/devkit';

const isCI = !!process.env['CI'];
// With BASE_URL (e.g. a check against the published site) no local server is started.
const baseURL = process.env['BASE_URL'] || getReadyUrl('http://localhost:4210');
// Narrows the engines for a quick local run (E2E_BROWSERS=chromium); unset runs all.
const browsers = process.env['E2E_BROWSERS']?.split(',');

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: process.env['BASE_URL']
    ? undefined
    : {
        command: isCI ? 'npx nx run reader:serve-static' : 'npx nx run reader:serve',
        url: getReadyUrl('http://localhost:4210'),
        reuseExistingServer: true,
        cwd: workspaceRoot,
      },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ].filter((project) => !browsers || browsers.includes(project.name)),
});
