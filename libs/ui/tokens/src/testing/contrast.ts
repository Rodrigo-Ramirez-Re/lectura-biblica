// WCAG 2.2 relative luminance and contrast ratio for opaque `#RRGGBB` colors.
export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) throw new Error(`Expected an opaque #RRGGBB color, got "${hex}"`);
  const [r, g, b] = match.slice(1).map((channel) => linear(parseInt(channel, 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function linear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}
