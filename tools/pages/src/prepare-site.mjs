import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Pages answers unknown paths with 404.html, so a copy of index.html boots the app on deep links.
 * @param {string | undefined} folder the build folder
 */
export function prepareForPages(folder) {
  if (!folder) throw new Error('Usage: prepare.mjs <build folder>');
  copyFileSync(join(folder, 'index.html'), join(folder, '404.html'));
}
