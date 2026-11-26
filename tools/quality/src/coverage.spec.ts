import { workspaceRoot } from '@nx/devkit';
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const read = (file: string) => readFileSync(join(workspaceRoot, file), 'utf8');

/** Every Vitest config of a lib or tool (the app runs Angular's builder, checked below). */
const vitestConfigs = () =>
  globSync('{libs,tools}/**/{vite,vitest}.config.mts', { cwd: workspaceRoot })
    .filter((file) => !file.includes('node_modules'))
    .map((file) => file.split('\\').join('/'));

interface ResolvedCoverage {
  enabled?: boolean;
  include?: string[];
  exclude?: string[];
  thresholds?: Record<string, number>;
}

/** The coverage options a config really resolves to, as Vitest would read them. */
async function resolvedCoverage(file: string): Promise<ResolvedCoverage | undefined> {
  const module = await import(pathToFileURL(join(workspaceRoot, file)).href);
  const config = typeof module.default === 'function' ? await module.default({}) : module.default;
  return config.test?.coverage;
}

const GATE = { statements: 90, lines: 90, functions: 90, branches: 70 };

describe('coverage gate (LB-034)', () => {
  it('finds the configs to check', () => {
    expect(vitestConfigs().length).toBeGreaterThanOrEqual(19);
  });

  it.each(vitestConfigs())('%s measures its own source and enforces the gate', async (file) => {
    const coverage = await resolvedCoverage(file);

    expect(coverage?.enabled).toBe(true);
    expect(coverage?.thresholds).toEqual(GATE);
    expect(coverage?.include?.length).toBeGreaterThan(0);
    for (const excluded of ['**/*.spec.ts', '**/*.stories.ts', '**/index.ts', '**/testing/**'])
      expect(coverage?.exclude?.some((pattern) => pattern.endsWith(excluded))).toBe(true);
  });

  it.each(vitestConfigs())('%s has source files for its include patterns', async (file) => {
    const coverage = await resolvedCoverage(file);
    const root = file.slice(0, file.lastIndexOf('/'));
    const measured = (coverage?.include ?? []).flatMap((pattern) =>
      globSync(pattern, { cwd: join(workspaceRoot, root) }),
    );

    expect(measured.length).toBeGreaterThan(0);
  });

  it('holds the reader app to the same thresholds, on its own code only', () => {
    const test = JSON.parse(read('apps/reader/project.json')).targets.test;

    expect(test.options.coverage).toBe(true);
    expect(test.options.coverageInclude).toEqual(['apps/reader/src/**/*.ts']);
    expect(test.options.coverageExclude).toEqual(
      expect.arrayContaining(['apps/reader/src/**/*.spec.ts', 'apps/reader/src/testing/**']),
    );
    expect(test.options.coverageThresholds).toEqual(GATE);
    expect(test.outputs).toEqual(['{workspaceRoot}/coverage/reader']);
  });

  it('reruns every test target when the shared preset changes', () => {
    expect(JSON.parse(read('nx.json')).namedInputs.sharedGlobals).toContain(
      '{workspaceRoot}/vitest.coverage.mjs',
    );
  });

  it('checks the gate itself on every pull request, affected or not', () => {
    expect(read('.github/workflows/ci.yml')).toMatch(/run: npx nx test quality\b/);
  });
});
