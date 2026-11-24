import lint from '@commitlint/lint';
import load from '@commitlint/load';
import { workspaceRoot } from '@nx/devkit';

async function check(message: string) {
  const config = await load({}, { cwd: workspaceRoot });
  const result = await lint(message, config.rules, {
    plugins: config.plugins,
    defaultIgnores: config.defaultIgnores,
  });
  return { valid: result.valid, failedRules: result.errors.map((e) => e.name) };
}

describe('commit message rules (LB-002)', () => {
  it('accepts a Conventional Commit with an allowed scope', async () => {
    expect(await check('feat(reading): log the chapters read today')).toEqual({
      valid: true,
      failedRules: [],
    });
  });

  it('rejects a message without type and subject, naming the failed rules', async () => {
    const { valid, failedRules } = await check('added stuff');
    expect(valid).toBe(false);
    expect(failedRules).toEqual(expect.arrayContaining(['type-empty', 'subject-empty']));
  });

  it('rejects a scope outside the allowed list', async () => {
    expect(await check('feat(storefront): add posts')).toEqual({
      valid: false,
      failedRules: ['scope-enum'],
    });
  });

  it('rejects a message without scope', async () => {
    expect((await check('chore: bump deps')).failedRules).toContain('scope-empty');
  });

  it.each([
    'Co-Authored-By: Someone <someone@example.com>',
    'co-authored-by: someone <someone@example.com>',
    '🤖 Generated with [Some Tool](https://example.com)',
  ])('rejects attribution line "%s"', async (line) => {
    const message = `fix(repo): tighten config\n\nExplain why.\n\n${line}`;
    expect(await check(message)).toEqual({ valid: false, failedRules: ['no-attribution'] });
  });

  it('allows long body lines so squash commits can carry the PR description', async () => {
    const body = 'x'.repeat(200);
    expect((await check(`docs(repo): describe setup\n\n${body}`)).valid).toBe(true);
  });
});
