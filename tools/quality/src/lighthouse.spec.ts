import { workspaceRoot } from '@nx/devkit';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const read = (file: string) => readFileSync(join(workspaceRoot, file), 'utf8');
const config = createRequire(import.meta.url)(join(workspaceRoot, 'apps/reader/lighthouserc.cjs'))
  .ci as {
  collect: { url: string[]; numberOfRuns: number; startServerCommand: string };
  assert: { assertions: Record<string, [string, { minScore: number; aggregationMethod: string }]> };
  upload: { target: string; outputDir: string };
};

describe('Lighthouse in CI (LB-033)', () => {
  it('measures Hoy, Avance, Libros and Acerca de under the Pages sub-path', () => {
    expect(config.collect.url.map((url) => new URL(url).pathname)).toEqual([
      '/lectura-biblica/',
      '/lectura-biblica/avance',
      '/lectura-biblica/libros',
      '/lectura-biblica/acerca',
    ]);
    expect(config.collect.startServerCommand).toContain('tools/pages/src/serve.mjs');
  });

  it('takes the median of three runs', () => {
    expect(config.collect.numberOfRuns).toBe(3);
    for (const [, options] of Object.values(config.assert.assertions))
      expect(options.aggregationMethod).toBe('median-run');
  });

  it.each([
    ['performance', 0.9],
    ['accessibility', 1],
    ['best-practices', 0.95],
    ['seo', 0.9],
  ])('fails below %s %d', (category, minScore) => {
    expect(config.assert.assertions[`categories:${category}`]).toEqual([
      'error',
      expect.objectContaining({ minScore }),
    ]);
  });

  it('keeps the reports on disk, never on a public server', () => {
    expect(config.upload.target).toBe('filesystem');
  });

  it('runs on every pull request that affects the app, and keeps the reports', () => {
    const ci = read('.github/workflows/ci.yml');

    expect(ci).toMatch(/npx nx affected -t lighthouse/);
    expect(ci).toMatch(/path: dist\/lighthouse/);
  });

  it('is an Nx target of the app that builds the Pages site first', () => {
    const target = JSON.parse(read('apps/reader/project.json')).targets.lighthouse;

    expect(target.dependsOn).toContain('pages');
    expect(target.options.command).toContain('lhci autorun');
  });
});
