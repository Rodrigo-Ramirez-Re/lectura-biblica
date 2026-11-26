import { RuleTester } from 'eslint';
import rule from '../eslint/no-primitive-tokens.mjs';

// The design-tokens spec checks the rule through the real ESLint config; this one exercises the
// rule module itself, so its own code is measured (LB-034).
new RuleTester().run('no-primitive-tokens (LB-003)', rule, {
  valid: [{ code: "export const style = 'color: var(--color-primary)';" }],
  invalid: [
    {
      code: "export const style = 'color: var(--lb-teal-800)';",
      errors: [{ messageId: 'primitive', data: { name: '--lb-teal-800' }, line: 1, column: 34 }],
    },
    {
      code: "const a = '--lb-a';\nconst b = '--lb-b';",
      errors: [
        { messageId: 'primitive', line: 1 },
        { messageId: 'primitive', line: 2 },
      ],
    },
  ],
});
