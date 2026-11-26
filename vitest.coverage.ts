/**
 * Coverage for every Vitest project (LB-034): always measured, only the project's own source, and
 * the test target fails below the thresholds. The reader app sets the same in its project.json.
 */
export function coverage(reportsDirectory: string) {
  return {
    enabled: true,
    provider: 'v8' as const,
    reportsDirectory,
    include: ['src/**/*.ts'],
    exclude: [
      'src/**/*.spec.ts',
      'src/**/*.stories.ts',
      'src/**/index.ts',
      'src/**/testing/**',
      'src/test-setup.ts',
      'src/**/*.d.ts',
    ],
    reporter: ['text-summary', 'json', 'html'],
    thresholds: { statements: 90, lines: 90, functions: 90, branches: 70 },
  };
}
