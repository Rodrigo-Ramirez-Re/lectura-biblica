import { workspaceRoot } from '@nx/devkit';
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (file: string) => readFileSync(join(workspaceRoot, file), 'utf8');

/** Every Vitest config of a lib or tool (the app runs Angular's builder, checked below). */
const vitestConfigs = () =>
  globSync('{libs,tools}/**/{vite,vitest}.config.mts', { cwd: workspaceRoot }).filter(
    (file) => !file.includes('node_modules'),
  );

describe('coverage gate (LB-034)', () => {
  it('finds the configs to check', () => {
    expect(vitestConfigs().length).toBeGreaterThanOrEqual(19);
  });

  it.each(vitestConfigs())('%s measures coverage with the shared preset', (file) => {
    const config = read(file);

    expect(config).toMatch(/from '(\.\.\/)+vitest\.coverage'/);
    expect(config).toMatch(/coverage: coverage\(/);
  });

  it('enforces 90 % of statements, lines and functions, and 70 % of branches', () => {
    const preset = read('vitest.coverage.ts');

    expect(preset).toMatch(/enabled: true/);
    expect(preset).toMatch(/statements: 90/);
    expect(preset).toMatch(/lines: 90/);
    expect(preset).toMatch(/functions: 90/);
    expect(preset).toMatch(/branches: 70/);
  });

  it('counts only the own source of each project', () => {
    const preset = read('vitest.coverage.ts');

    expect(preset).toMatch(/include: \['src\/\*\*\/\*\.ts'\]/);
    for (const excluded of ['*.spec.ts', '*.stories.ts', 'index.ts', 'testing/**', 'test-setup.ts'])
      expect(preset).toContain(excluded);
  });

  it('holds the reader app to the same thresholds, on its own code only', () => {
    const test = JSON.parse(read('apps/reader/project.json')).targets.test.options;

    expect(test.coverage).toBe(true);
    expect(test.coverageInclude).toEqual(['apps/reader/src/**/*.ts']);
    expect(test.coverageExclude).toEqual(
      expect.arrayContaining(['apps/reader/src/**/*.spec.ts', 'apps/reader/src/testing/**']),
    );
    expect(test.coverageThresholds).toEqual({
      statements: 90,
      lines: 90,
      functions: 90,
      branches: 70,
    });
  });
});
