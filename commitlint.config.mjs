// Keep in sync with docs/conventions/git-workflow.md.
const scopes = [
  'reader',
  'catalog',
  'reading',
  'insights',
  'study',
  'shared',
  'ui',
  'pwa',
  'deps',
  'repo',
];

const ERROR = 2;
const OFF = 0;

const ATTRIBUTION = /^\W*(co-authored-by:|generated (with|by)\b)/im;

/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'no-attribution': ({ raw }) => [
          !ATTRIBUTION.test(raw ?? ''),
          'attribution lines (Co-Authored-By, "Generated with") are not allowed',
        ],
      },
    },
  ],
  rules: {
    'scope-enum': [ERROR, 'always', scopes],
    'scope-empty': [ERROR, 'never'],
    // Squash commits carry the PR description, whose tables and links exceed any line limit.
    'body-max-line-length': [OFF],
    'footer-max-line-length': [OFF],
    'no-attribution': [ERROR, 'always'],
  },
};
