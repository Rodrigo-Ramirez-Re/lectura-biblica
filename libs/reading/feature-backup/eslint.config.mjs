import nx from '@nx/eslint-plugin';
import baseConfig from '../../../eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'lb',
          style: 'camelCase',
        },
      ],
      // Attribute selectors keep native elements (button[lbButton], section[lbCard]).
      '@angular-eslint/component-selector': [
        'error',
        [
          { type: 'element', prefix: 'lb', style: 'kebab-case' },
          { type: 'attribute', prefix: 'lb', style: 'camelCase' },
        ],
      ],
    },
  },
];
