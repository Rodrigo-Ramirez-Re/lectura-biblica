import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('is 21:1 for black on white, in either order', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('is 1:1 for the same color', () => {
    expect(contrastRatio('#623412', '#623412')).toBe(1);
  });

  it('matches the WCAG reference value for #777777 on white', () => {
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });

  it('rejects colors it cannot evaluate', () => {
    expect(() => contrastRatio('rgb(0 0 0)', '#FFFFFF')).toThrow(/#RRGGBB/);
    expect(() => contrastRatio('#FFFFFF80', '#FFFFFF')).toThrow(/#RRGGBB/);
  });
});
