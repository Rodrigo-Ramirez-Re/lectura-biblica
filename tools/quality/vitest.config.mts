import { defineConfig } from 'vitest/config';
import { coverage } from '../../vitest.coverage';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/tools/quality',
  test: {
    name: 'quality',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // Loading the full ESLint config per test is slow on a cold cache.
    testTimeout: 30_000,
    reporters: ['default'],
    coverage: coverage('../../coverage/tools/quality'),
  },
}));
