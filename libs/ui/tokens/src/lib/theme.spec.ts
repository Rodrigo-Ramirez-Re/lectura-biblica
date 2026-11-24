import tailwind from '@tailwindcss/postcss';
import { join } from 'node:path';
import postcss from 'postcss';
import { tokensDir } from '../testing/token-sources';

// Compiles the tokens the way the app does: Tailwind first, then the tokens entry point.
async function compile(candidates: string[] = []) {
  const source = [
    `@import 'tailwindcss' source(none);`,
    `@import './index.css';`,
    `@source inline(${JSON.stringify(candidates.join(' '))});`,
  ].join('\n');
  const result = await postcss([tailwind()]).process(source, {
    from: join(tokensDir, 'probe.css'),
  });
  return result.css;
}

const hasRule = (css: string, utility: string) =>
  new RegExp(`\\.${utility.replace(/[^\w-]/g, '\\$&')}\\s*\\{`).test(css);

describe('Tailwind theme (LB-003)', () => {
  const semantic = [
    'bg-surface',
    'bg-primary',
    'text-on-primary',
    'text-on-surface-muted',
    'font-display',
    'font-body',
    'text-display',
    'text-heading-1',
    'text-body',
    'px-gutter',
    'min-h-touch',
    'max-w-content',
    'rounded-card',
    'shadow-card',
    'border-border-strong',
    'text-danger',
  ];
  const tailwindDefaults = [
    'bg-red-500',
    'text-white',
    'text-lg',
    'font-sans',
    'rounded-lg',
    'shadow-md',
  ];
  let css: string;

  beforeAll(async () => {
    css = await compile([...semantic, ...tailwindDefaults, 'focus-visible:focus-ring']);
  });

  it.each(semantic)('generates the semantic utility %s', (utility) => {
    expect(hasRule(css, utility)).toBe(true);
  });

  it.each(tailwindDefaults)('does not generate the Tailwind default %s', (utility) => {
    expect(hasRule(css, utility)).toBe(false);
  });

  it('draws the focus ring with the focus token', () => {
    expect(css).toMatch(
      /\.focus-visible\\:focus-ring[\s\S]*?outline: 2px solid var\(--color-focus\)/,
    );
  });

  it('applies line height and weight with the type scale', () => {
    const rule = css.match(/\.text-heading-1\s*\{[^}]*\}/)?.[0];
    expect(rule).toContain('var(--text-heading-1--line-height)');
    expect(rule).toContain('var(--text-heading-1--font-weight)');
  });

  it('exposes every semantic token as a CSS variable even when no utility uses it', async () => {
    const unused = await compile();
    expect(unused).toMatch(
      /--color-primary:\s*light-dark\(var\(--lb-teal-800\),\s*var\(--lb-teal-300\)\)/,
    );
    expect(unused).toMatch(/--lb-teal-800:\s*#1f5e5b/);
  });

  it('follows the device theme unless data-theme forces one', async () => {
    const unused = await compile();
    expect(unused).toMatch(/:root\s*\{[^}]*color-scheme:\s*light dark/);
    expect(unused).toMatch(/:root\[data-theme=["']light["']\]\s*\{[^}]*color-scheme:\s*light;/);
    expect(unused).toMatch(/:root\[data-theme=["']dark["']\]\s*\{[^}]*color-scheme:\s*dark;/);
  });

  it('sets the page defaults from tokens', async () => {
    const unused = await compile();
    expect(unused).toMatch(/--default-font-family:\s*var\(--font-body\)/);
    expect(unused).toMatch(/body\s*\{[^}]*background-color:\s*var\(--color-surface\)/);
    expect(unused).toMatch(/body\s*\{[^}]*color:\s*var\(--color-on-surface\)/);
  });

  it('loads no web font, so nothing is fetched from a CDN', async () => {
    expect(await compile()).not.toMatch(/@font-face|url\(["']?https?:/);
  });
});
