import { workspaceRoot } from '@nx/devkit';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const app = join(workspaceRoot, 'apps/reader');
const readJson = (file: string) => JSON.parse(readFileSync(join(app, file), 'utf8'));
const manifest = readJson('public/manifest.webmanifest');
const config = readJson('src/config.json');

// PNG stores width and height as big-endian integers at bytes 16 and 20 of the IHDR chunk.
function pngSize(file: string) {
  const header = readFileSync(join(app, 'public', file));
  return `${header.readUInt32BE(16)}x${header.readUInt32BE(20)}`;
}

describe('installable PWA (LB-007)', () => {
  it('names the app as config.json does', () => {
    expect(manifest.name).toBe(config.appName);
    expect(manifest.short_name).toBe(config.shortName);
  });

  it('starts and scopes the app relative to its sub-path', () => {
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    expect(manifest.display).toBe('standalone');
    expect(manifest.lang).toBe('es');
  });

  it('declares theme and background colors', () => {
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it.each([
    ['192x192', 'any'],
    ['512x512', 'any'],
    ['512x512', 'maskable'],
  ])('has a %s %s icon whose file matches its declared size', (sizes, purpose) => {
    const icon = manifest.icons.find(
      (i: { sizes: string; purpose: string }) => i.sizes === sizes && i.purpose === purpose,
    );
    expect(icon).toBeDefined();
    expect(pngSize(icon.src)).toBe(sizes);
  });

  it('has the iOS home-screen icon linked from the page', () => {
    const index = readFileSync(join(app, 'src/index.html'), 'utf8');
    const href = /<link rel="apple-touch-icon" href="([^"]+)"/.exec(index)?.[1];
    expect(href && existsSync(join(app, 'public', href))).toBe(true);
    expect(index).toContain('name="apple-mobile-web-app-capable"');
  });

  it('keeps every URL relative, so nothing assumes the site root', () => {
    const urls = [
      manifest.start_url,
      manifest.scope,
      ...manifest.icons.map((i: { src: string }) => i.src),
    ];
    expect(urls.filter((url: string) => url.startsWith('/') || url.startsWith('http'))).toEqual([]);
  });
});
