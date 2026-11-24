import { workspaceRoot } from '@nx/devkit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE_HREF } from './site.mjs';

describe('site path (LB-008)', () => {
  it('builds the app with the base href it is served under', () => {
    const project = JSON.parse(
      readFileSync(join(workspaceRoot, 'apps/reader/project.json'), 'utf8'),
    );

    expect(project.targets.build.configurations.production.baseHref).toBe(BASE_HREF);
  });

  it('is the repository name', () => {
    expect(BASE_HREF).toBe('/lectura-biblica/');
  });
});
