import css from '@eslint/css';
import nx from '@nx/eslint-plugin';
import noPrimitiveTokens from './tools/quality/eslint/no-primitive-tokens.mjs';

const lb = { rules: { 'no-primitive-tokens': noPrimitiveTokens } };

// Bounded contexts may use their own libs and shared ones, plus the exceptions listed here
// (docs/architecture/overview.md).
const contexts = {
  catalog: [],
  reading: ['catalog'],
  insights: ['catalog', 'reading'],
  study: ['catalog'],
};

// Browser storage is an infrastructure detail: only `type:infrastructure` libs may import it.
const storage = ['idb'];

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vitest.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // Layers: dependencies point inward only.
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:infrastructure',
                'type:application',
                'type:domain',
                'type:ui',
                'type:util',
              ],
              bannedExternalImports: storage,
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:application', 'type:domain', 'type:ui', 'type:util'],
              bannedExternalImports: storage,
            },
            {
              sourceTag: 'type:infrastructure',
              onlyDependOnLibsWithTags: [
                'type:infrastructure',
                'type:application',
                'type:domain',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:application',
              onlyDependOnLibsWithTags: ['type:domain', 'type:util'],
              bannedExternalImports: storage,
            },
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:domain'],
              bannedExternalImports: ['@angular/*', 'rxjs', 'rxjs/*', ...storage],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util'],
              bannedExternalImports: storage,
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util'],
              bannedExternalImports: storage,
            },
            {
              sourceTag: 'type:e2e',
              onlyDependOnLibsWithTags: ['type:util'],
              bannedExternalImports: storage,
            },
            { sourceTag: 'type:tooling', onlyDependOnLibsWithTags: [] },
            // Scopes: the app wires every context; contexts stay isolated.
            { sourceTag: 'scope:reader', onlyDependOnLibsWithTags: ['*'] },
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
            ...Object.entries(contexts).map(([context, allowed]) => ({
              sourceTag: `scope:${context}`,
              onlyDependOnLibsWithTags: [
                `scope:${context}`,
                'scope:shared',
                ...allowed.map((other) => `scope:${other}`),
              ],
            })),
          ],
        },
      ],
    },
  },
  {
    // Same reason as below: idb must be banned before it is installed, everywhere but infrastructure.
    basePath: import.meta.dirname,
    files: ['apps/**/*.ts', 'libs/**/*.ts'],
    ignores: ['libs/*/infrastructure/**', 'libs/*/infrastructure-*/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['idb', 'idb/*'],
              message: 'Browser storage lives in infrastructure libs only (ADR 0003).',
            },
          ],
        },
      ],
    },
  },
  {
    // bannedExternalImports only knows installed packages; this also covers ones not added yet.
    // basePath keeps the globs rooted here when per-project configs spread this array.
    basePath: import.meta.dirname,
    files: ['libs/*/domain/**/*.ts', 'libs/shared/kernel/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@angular/*', 'rxjs', 'rxjs/*', 'idb', 'idb/*'],
              message: 'Domain libs are framework-free (docs/architecture/overview.md).',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'localStorage', 'indexedDB'].map((name) => ({
          name,
          message: 'Domain libs are framework-free; reach the browser through a port.',
        })),
      ],
    },
  },
  {
    // UI copy is Spanish source text extracted by @angular/localize (ADR 0005); custom IDs keep
    // translations stable when the text changes. Inline templates reach this as virtual .html files.
    basePath: import.meta.dirname,
    files: ['apps/**/*.html', 'libs/**/*.html'],
    // The host page is not a component template, and test stubs and Storybook demos never reach users.
    ignores: ['apps/*/src/index.html', '**/*.spec.ts/**', '**/*.stories.ts/**'],
    rules: {
      '@angular-eslint/template/i18n': [
        'error',
        {
          checkId: true,
          // The same text may reuse its ID; the extractor rejects real conflicts.
          checkDuplicateId: false,
          checkText: true,
          checkAttributes: true,
          requireDescription: false,
          // Technical attributes and component inputs that never carry user-facing text.
          ignoreAttributes: [
            'variant',
            'size',
            'tone',
            'accept',
            'scope',
            'd',
            'viewBox',
            'fill',
            'stroke',
            'stroke-width',
            'stroke-linecap',
            'stroke-linejoin',
            'loading',
            'decoding',
            'rel',
            'autocomplete',
            'inputmode',
            'aria-haspopup',
            'aria-controls',
            'aria-describedby',
            'aria-labelledby',
            'aria-current',
            'aria-live',
            'routerLink',
            'routerLinkActive',
            'ariaCurrentWhenActive',
          ],
        },
      ],
    },
  },
  {
    // Tolerant: Tailwind at-rules (@theme, @utility) are not standard CSS.
    files: ['**/*.css'],
    plugins: { css },
    language: 'css/css',
    languageOptions: { tolerant: true },
  },
  {
    basePath: import.meta.dirname,
    files: ['**/*.ts', '**/*.html', '**/*.css'],
    ignores: ['libs/ui/tokens/**', 'tools/**'],
    plugins: { lb },
    rules: { 'lb/no-primitive-tokens': 'error' },
  },
];
