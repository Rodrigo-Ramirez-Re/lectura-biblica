/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/reading/feature-plan',
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [angular()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  test: {
    // The editor lists the 66 books; role queries over that many controls take seconds in jsdom.
    testTimeout: 20_000,
    name: 'reading-feature-plan',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/reading/feature-plan',
      provider: 'v8' as const,
    },
  },
}));
