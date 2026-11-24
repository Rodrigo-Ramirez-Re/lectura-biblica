// Prepares the build for GitHub Pages: `node tools/pages/src/prepare.mjs <build folder>`.
// Pages answers unknown paths with 404.html, so a copy of index.html boots the app on deep links.
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

const folder = process.argv[2];
if (!folder) throw new Error('Usage: prepare.mjs <build folder>');

copyFileSync(join(folder, 'index.html'), join(folder, '404.html'));
