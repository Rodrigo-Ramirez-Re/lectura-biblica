// Primitive tokens (`--lb-*`) are private to ui-tokens, so a redesign only touches that lib
// (docs/conventions/design-system.md). Scans raw text so it works for TS, templates and CSS.
const PRIMITIVE = /--lb-[\w-]+/g;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow primitive design tokens outside the ui-tokens lib' },
    messages: {
      primitive:
        '"{{name}}" is a primitive token. Use a semantic token instead (docs/conventions/design-system.md).',
    },
    schema: [],
  },
  create(context) {
    const check = () => {
      const { sourceCode } = context;
      for (const match of sourceCode.text.matchAll(PRIMITIVE)) {
        context.report({
          // Each language's own conversion: JS columns are 0-based, CSS columns 1-based.
          loc: {
            start: sourceCode.getLocFromIndex(match.index),
            end: sourceCode.getLocFromIndex(match.index + match[0].length),
          },
          messageId: 'primitive',
          data: { name: match[0] },
        });
      }
    };
    // Root node per language: JS/TS and Angular templates (Program), CSS (StyleSheet).
    return { Program: check, StyleSheet: check };
  },
};
