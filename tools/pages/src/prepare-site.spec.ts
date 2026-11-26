import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareForPages } from './prepare-site.mjs';

describe('prepareForPages (LB-008)', () => {
  let folder: string;

  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), 'pages-'));
  });
  afterEach(() => rmSync(folder, { recursive: true, force: true }));

  it('copies index.html to 404.html so deep links boot the app', () => {
    writeFileSync(join(folder, 'index.html'), '<lb-root></lb-root>');

    prepareForPages(folder);

    expect(readFileSync(join(folder, '404.html'), 'utf8')).toBe('<lb-root></lb-root>');
  });

  it('asks for the build folder when it is missing', () => {
    expect(() => prepareForPages(undefined)).toThrow('Usage: prepare.mjs <build folder>');
  });
});
