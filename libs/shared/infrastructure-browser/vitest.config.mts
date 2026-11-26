import { defineConfig } from 'vitest/config';
import { coverage } from '../../../vitest.coverage';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/shared/infrastructure-browser',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'shared-infrastructure-browser',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: coverage('../../../coverage/libs/shared/infrastructure-browser'),
  },
}));
