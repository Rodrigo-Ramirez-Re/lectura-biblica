import { contrastRatio } from '../testing/contrast';
import { readTokens } from '../testing/token-sources';
import {
  colorTokens,
  containerTokens,
  contrastPairs,
  fontTokens,
  minimumContrast,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  themes,
  typeScale,
} from './foundations';

const tokens = readTokens();
const names = (list: readonly { name: string }[]) => list.map((t) => t.name).sort();

describe('foundations catalogue (LB-003)', () => {
  it.each([
    ['color', colorTokens],
    ['font', fontTokens],
    ['text', typeScale],
    ['spacing', spacingTokens],
    ['container', containerTokens],
    ['radius', radiusTokens],
    ['shadow', shadowTokens],
  ] as const)('lists exactly the %s tokens defined in theme.css', (namespace, catalogue) => {
    expect(names(catalogue)).toEqual(tokens.namesIn(namespace).sort());
  });

  it.each(themes)('maps every semantic color to a primitive in the %s theme', (theme) => {
    for (const { name } of colorTokens)
      expect(tokens.resolveColor(name, theme)).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('keeps raw color values out of theme.css', () => {
    const colors = tokens.theme.filter((d) => d.name.startsWith('--color-'));
    expect(colors.filter((d) => !d.value.startsWith('light-dark(var(--lb-'))).toEqual([]);
  });
});

describe('accessible contrast in both themes (LB-003)', () => {
  const cases = themes.flatMap((theme) =>
    contrastPairs.map((p) => [p.foreground, p.background, theme, p.level] as const),
  );

  it.each(cases)('%s on %s in the %s theme meets the %s minimum', (fg, bg, theme, level) => {
    const ratio = contrastRatio(tokens.resolveColor(fg, theme), tokens.resolveColor(bg, theme));
    expect(ratio).toBeGreaterThanOrEqual(minimumContrast[level]);
  });

  it('checks every on-* color against the surface it is named after', () => {
    const onColors = colorTokens.map((t) => t.name).filter((name) => name.startsWith('on-'));
    for (const on of onColors) {
      const background = on.replace(/^on-/, '').replace(/-muted$/, '');
      expect(contrastPairs).toContainEqual(expect.objectContaining({ foreground: on, background }));
    }
  });

  it('only pairs tokens that exist', () => {
    const known = new Set(names(colorTokens));
    for (const { foreground, background } of contrastPairs) {
      expect(known).toContain(foreground);
      expect(known).toContain(background);
    }
  });
});
