// Generates the PWA icons from one SVG source: `node tools/icons/generate-icons.mjs`.
// The output is committed; rerun only when the icon or the primary color changes.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT = join(import.meta.dirname, '../../apps/reader/public/icons');
// Light-theme primary and surface (libs/ui/tokens/src/primitives.css: teal-800, paper-50).
const BACKGROUND = '#1f5e5b';
const GLYPH = '#fbf8f3';

// Open book after Lucide's book-open (ISC licence), drawn on a 24-unit grid.
const BOOK = [
  'M12 7v14',
  'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
];

/** `glyphScale` sets how much of the 512 px canvas the 24-unit glyph covers. */
function svg({ radius, glyphScale }) {
  const size = 24 * glyphScale;
  const offset = (512 - size) / 2;
  const paths = BOOK.map((d) => `<path d="${d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${radius}" fill="${BACKGROUND}"/>
  <g transform="translate(${offset} ${offset + glyphScale / 2}) scale(${glyphScale})" fill="none" stroke="${GLYPH}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
</svg>
`;
}

// Maskable icons keep the glyph inside the central 80 % safe zone; platforms crop the rest.
const standard = svg({ radius: 96, glyphScale: 14 });
const fullBleed = svg({ radius: 0, glyphScale: 14 });
const maskable = svg({ radius: 0, glyphScale: 10 });

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'icon.svg'), standard);

const outputs = [
  { file: 'icon-192.png', source: standard, size: 192 },
  { file: 'icon-512.png', source: standard, size: 512 },
  { file: 'icon-maskable-512.png', source: maskable, size: 512 },
  // iOS rounds the corners itself and shows transparency as black.
  { file: 'apple-touch-icon.png', source: fullBleed, size: 180 },
];

for (const { file, source, size } of outputs) {
  await sharp(Buffer.from(source)).resize(size, size).png().toFile(join(OUT, file));
}
