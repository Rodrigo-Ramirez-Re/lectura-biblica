import { workspaceRoot } from '@nx/devkit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (file: string) => readFileSync(join(workspaceRoot, file), 'utf8');

describe('CI e2e image (LB-002)', () => {
  it('uses the Playwright image of the installed @playwright/test version', () => {
    const installed = JSON.parse(read('package.json')).devDependencies['@playwright/test'];
    const image = /mcr\.microsoft\.com\/playwright:v([\d.]+)-/.exec(
      read('.github/workflows/ci.yml'),
    )?.[1];

    expect(installed).toMatch(/^\d+\.\d+\.\d+$/);
    expect(image).toBe(installed);
  });
});
