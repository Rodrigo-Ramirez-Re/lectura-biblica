import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Theme } from '../lib/foundations';

export const tokensDir = join(import.meta.dirname, '..');

const read = (file: string) => readFileSync(join(tokensDir, file), 'utf8');
const declarations = (css: string) =>
  [...css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => ({
    name,
    value: value.trim(),
  }));

const LIGHT_DARK = /^light-dark\(var\((--lb-[\w-]+)\),\s*var\((--lb-[\w-]+)\)\)$/;

/** Primitive (`--lb-*`) and semantic (Tailwind theme) declarations, as written in the CSS. */
export function readTokens() {
  const primitives = new Map(declarations(read('primitives.css')).map((d) => [d.name, d.value]));
  const theme = declarations(read('theme.css')).filter((d) => d.value !== 'initial');

  /** Theme names in one Tailwind namespace, e.g. `color` → `primary`, `on-primary`… */
  const namesIn = (namespace: string) =>
    theme
      .map((d) => d.name.match(new RegExp(`^--${namespace}-([\\w-]+)$`))?.[1])
      .filter((name): name is string => !!name && !name.includes('--'));

  function resolveColor(name: string, mode: Theme): string {
    const semantic = theme.find((d) => d.name === `--color-${name}`);
    if (!semantic) throw new Error(`Unknown color token "${name}"`);
    const match = LIGHT_DARK.exec(semantic.value);
    const value = match && primitives.get(mode === 'light' ? match[1] : match[2]);
    if (!value)
      throw new Error(
        `Color token "${name}" must be light-dark() of two primitives, got "${semantic.value}"`,
      );
    return value;
  }

  return { primitives, theme, namesIn, resolveColor };
}
