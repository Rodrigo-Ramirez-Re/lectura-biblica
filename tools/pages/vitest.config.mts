import { defineConfig } from 'vitest/config';
import { coverage } from '../../vitest.coverage.mjs';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/tools/pages',
  test: {
    name: 'pages',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: coverage('../../coverage/tools/pages', {
      include: ['src/**/*.mjs'],
      exclude: ['src/serve.mjs', 'src/prepare.mjs'],
    }),
  },
}));
