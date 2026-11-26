/**
 * Coverage for every Vitest project (LB-034): always measured, only the project's own source, and
 * the test target fails below the thresholds. The reader app sets the same in its project.json.
 * Plain ESM with a `.d.mts` beside it, so Vite loads it natively and TypeScript checks its use.
 *
 * @param {string} reportsDirectory where the report goes, relative to the project
 * @param {{ include?: string[]; exclude?: string[] }} [files] the project's source, and entry points
 *   that only wire tested code (like an app's main.ts), relative to the project
 */
export function coverage(reportsDirectory, { include = ['src/**/*.ts'], exclude = [] } = {}) {
  return {
    enabled: true,
    provider: 'v8',
    reportsDirectory,
    include,
    exclude: [
      '**/*.spec.ts',
      '**/*.stories.ts',
      '**/index.ts',
      '**/testing/**',
      '**/test-setup.ts',
      '**/*.d.ts',
      '**/*.d.mts',
      ...exclude,
    ],
    reporter: ['text-summary', 'json', 'html'],
    thresholds: { statements: 90, lines: 90, functions: 90, branches: 70 },
  };
}
