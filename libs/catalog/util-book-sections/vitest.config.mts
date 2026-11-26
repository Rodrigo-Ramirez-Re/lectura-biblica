import { defineConfig } from 'vitest/config';
import { coverage } from '../../../vitest.coverage.mjs';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/catalog/util-book-sections',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'catalog-util-book-sections',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: coverage('../../../coverage/libs/catalog/util-book-sections'),
  },
}));
