import { workspaceRoot } from '@nx/devkit';
import { ESLint } from 'eslint';

const RULE = '@angular-eslint/template/i18n';

async function ruleIdsFor(filePath: string, code: string) {
  const eslint = new ESLint({ cwd: workspaceRoot, flags: ['v10_config_lookup_from_file'] });
  const [result] = await eslint.lintText(code, { filePath: `${workspaceRoot}/${filePath}` });
  return result.messages.map((m) => m.ruleId);
}

const TEMPLATE = 'apps/reader/src/app/probe.html';

describe('user-facing text is marked for translation (LB-004)', () => {
  it.each([
    ['text without a marker', '<p>Hola</p>\n'],
    ['a marker without a custom id', '<p i18n>Hola</p>\n'],
    ['an attribute without a marker', '<button aria-label="Cerrar"></button>\n'],
  ])('flags %s', async (_, code) => {
    expect(await ruleIdsFor(TEMPLATE, code)).toContain(RULE);
  });

  it('flags text in an inline component template', async () => {
    const code = [
      `import { Component } from '@angular/core';`,
      `@Component({ selector: 'lb-probe', template: '<p>Hola</p>' })`,
      `export class Probe {}`,
      '',
    ].join('\n');
    expect(await ruleIdsFor('apps/reader/src/app/probe.ts', code)).toContain(RULE);
  });

  it('ignores test stubs in spec files', async () => {
    const code = [
      `import { Component } from '@angular/core';`,
      `@Component({ template: '<p>routed page</p>' })`,
      `class Stub {}`,
      `export const stub = Stub;`,
      '',
    ].join('\n');
    expect(await ruleIdsFor('apps/reader/src/app/probe.spec.ts', code)).not.toContain(RULE);
  });

  it.each([
    ['marked text with a custom id', '<p i18n="@@reader.probe.greeting">Hola</p>\n'],
    [
      'a marked attribute with a custom id',
      '<button aria-label="Cerrar" i18n-aria-label="@@reader.probe.close"></button>\n',
    ],
    ['markup without text', '<div class="grid"><span></span></div>\n'],
    ['technical attributes', '<svg viewBox="0 0 24 24"><path d="M0 0h24" /></svg>\n'],
  ])('accepts %s', async (_, code) => {
    expect(await ruleIdsFor(TEMPLATE, code)).not.toContain(RULE);
  });
});
