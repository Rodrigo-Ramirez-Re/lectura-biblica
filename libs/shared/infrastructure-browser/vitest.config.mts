import { defineConfig } from 'vitest/config';

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
    coverage: {
      reportsDirectory: '../../../coverage/libs/shared/infrastructure-browser',
      provider: 'v8' as const,
    },
  },
}));
