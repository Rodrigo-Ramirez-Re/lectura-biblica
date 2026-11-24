import { workspaceRoot } from '@nx/devkit';
import { ESLint, type Linter } from 'eslint';

// Lints in-memory sources as if they lived in a real lib, so the probe never touches the repo.
async function ruleIdsFor(filePath: string, code: string) {
  const eslint = new ESLint({ cwd: workspaceRoot, flags: ['v10_config_lookup_from_file'] });
  const [result] = await eslint.lintText(code, { filePath: `${workspaceRoot}/${filePath}` });
  return result.messages.map((m) => m.ruleId);
}

const BOUNDARY_RULES = ['@nx/enforce-module-boundaries', 'no-restricted-imports'];
const reportsBoundaryViolation = (ruleIds: (string | null)[]) =>
  ruleIds.some((id) => id !== null && BOUNDARY_RULES.includes(id));

const DOMAIN_FILE = 'libs/shared/kernel/src/probe.ts';
const FUTURE_DOMAIN_FILE = 'libs/reading/domain/src/probe.ts';
const APP_FILE = 'apps/reader/src/probe.ts';

describe('layer boundaries (LB-002)', () => {
  it('lets a domain lib stay framework-free', async () => {
    expect(await ruleIdsFor(DOMAIN_FILE, 'export const answer = 42;\n')).toEqual([]);
  });

  it.each([
    [DOMAIN_FILE, '@angular/core'],
    [DOMAIN_FILE, 'rxjs'],
    [DOMAIN_FILE, 'rxjs/operators'],
    [DOMAIN_FILE, 'idb'],
    [FUTURE_DOMAIN_FILE, '@angular/core'],
    [FUTURE_DOMAIN_FILE, 'idb'],
  ])('rejects in %s an import of %s', async (file, pkg) => {
    const code = `import * as banned from '${pkg}';\nexport const x = banned;\n`;
    expect(reportsBoundaryViolation(await ruleIdsFor(file, code))).toBe(true);
  });

  it.each(['window', 'navigator', 'indexedDB', 'localStorage'])(
    'rejects the browser global %s in a domain lib',
    async (global) => {
      const code = `export const x = ${global};\n`;
      expect(await ruleIdsFor(FUTURE_DOMAIN_FILE, code)).toContain('no-restricted-globals');
    },
  );

  it('rejects browser storage outside infrastructure', async () => {
    const code = `import { openDB } from 'idb';\nexport const x = openDB;\n`;
    expect(reportsBoundaryViolation(await ruleIdsFor(APP_FILE, code))).toBe(true);
  });
});

type BoundaryOptions = {
  depConstraints: { sourceTag: string; onlyDependOnLibsWithTags?: string[] }[];
};

// Context libs are created by later stories, so the scope rules are checked on the config itself.
async function allowedTagsFor(sourceTag: string) {
  const { default: config } = (await import(`${workspaceRoot}/eslint.config.mjs`)) as {
    default: Linter.Config[];
  };
  const rule = config.find((entry) => entry.rules?.['@nx/enforce-module-boundaries'])?.rules?.[
    '@nx/enforce-module-boundaries'
  ] as [string, BoundaryOptions];
  return rule[1].depConstraints.find((c) => c.sourceTag === sourceTag)?.onlyDependOnLibsWithTags;
}

describe('context boundaries (LB-002)', () => {
  it('keeps the catalog independent of reading', async () => {
    expect(await allowedTagsFor('scope:catalog')).toEqual(['scope:catalog', 'scope:shared']);
  });

  it('lets reading use the catalog', async () => {
    expect(await allowedTagsFor('scope:reading')).toEqual([
      'scope:reading',
      'scope:shared',
      'scope:catalog',
    ]);
  });

  it('lets insights read catalog and reading', async () => {
    expect(await allowedTagsFor('scope:insights')).toEqual(
      expect.arrayContaining(['scope:catalog', 'scope:reading']),
    );
  });

  it('keeps shared libs free of contexts', async () => {
    expect(await allowedTagsFor('scope:shared')).toEqual(['scope:shared']);
  });

  it('lets the app wire every context', async () => {
    expect(await allowedTagsFor('scope:reader')).toEqual(['*']);
  });
});
