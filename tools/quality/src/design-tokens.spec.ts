import { workspaceRoot } from '@nx/devkit';
import { ESLint } from 'eslint';

const RULE = 'lb/no-primitive-tokens';
const PRIMITIVE = '--lb-teal-800';

async function messagesFor(filePath: string, code: string) {
  const eslint = new ESLint({ cwd: workspaceRoot, flags: ['v10_config_lookup_from_file'] });
  const [result] = await eslint.lintText(code, { filePath: `${workspaceRoot}/${filePath}` });
  return result.messages;
}

describe('primitive tokens stay inside ui-tokens (LB-003)', () => {
  it.each([
    ['apps/reader/src/styles.css', `.hero { color: var(${PRIMITIVE}); }\n`],
    ['libs/ui/components/src/lib/probe.css', `:host { background: var(${PRIMITIVE}); }\n`],
    ['libs/ui/components/src/lib/probe.ts', `export const style = 'color: var(${PRIMITIVE})';\n`],
    ['apps/reader/src/app/probe.html', `<p style="color: var(${PRIMITIVE})">Hola</p>\n`],
  ])('rejects a primitive in %s', async (file, code) => {
    const messages = await messagesFor(file, code);
    expect(messages.map((m) => m.ruleId)).toContain(RULE);
    expect(messages.find((m) => m.ruleId === RULE)).toMatchObject({
      line: 1,
      message: expect.stringContaining(PRIMITIVE),
    });
  });

  it.each([
    [
      'apps/reader/src/styles.css',
      `.a { color: var(--color-primary); }\n.b {\n  color: var(${PRIMITIVE});\n}\n`,
    ],
    [
      'libs/ui/components/src/lib/probe.ts',
      `export const a = 1;\n\nexport const b = '  color: var(${PRIMITIVE})';\n`,
    ],
  ])('points at the primitive in %s', async (file, code) => {
    const message = (await messagesFor(file, code)).find((m) => m.ruleId === RULE);
    expect(message).toMatchObject({ line: 3 });
    expect(code.split('\n')[2].slice((message?.column ?? 0) - 1)).toMatch(
      new RegExp(`^${PRIMITIVE}`),
    );
  });

  it('lets components use semantic tokens', async () => {
    const code = `.hero { color: var(--color-on-primary); background: var(--color-primary); }\n`;
    expect(await messagesFor('libs/ui/components/src/lib/probe.css', code)).toEqual([]);
  });

  it('lets the tokens lib define and reference primitives', async () => {
    const code = `@theme static {\n  --color-primary: var(${PRIMITIVE});\n}\n`;
    expect(await messagesFor('libs/ui/tokens/src/theme.css', code)).toEqual([]);
  });
});
