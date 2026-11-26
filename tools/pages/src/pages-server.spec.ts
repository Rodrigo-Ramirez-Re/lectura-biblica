import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPagesServer } from './pages-server.mjs';

const BASE = '/lectura-biblica/';

function site(with404 = true) {
  const root = mkdtempSync(join(tmpdir(), 'pages-'));
  mkdirSync(join(root, 'icons'));
  writeFileSync(join(root, 'index.html'), '<p>index</p>');
  writeFileSync(join(root, 'main.js'), 'console.log(1)');
  writeFileSync(join(root, 'icons', 'icon.svg'), '<svg/>');
  if (with404) writeFileSync(join(root, '404.html'), '<p>index</p>');
  return root;
}

async function serve(root: string, deepLinkStatus?: 200 | 404) {
  const server = createPagesServer({ root, base: BASE, deepLinkStatus });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  return {
    root,
    get: (path: string, headers: Record<string, string> = {}) =>
      fetch(`http://localhost:${port}${path}`, { redirect: 'manual', headers }),
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

describe('GitHub Pages emulation (LB-008)', () => {
  let server: Awaited<ReturnType<typeof serve>>;
  afterEach(() => server.close());

  it('serves files under the base path with their type', async () => {
    server = await serve(site());

    const script = await server.get(`${BASE}main.js`);
    expect(script.status).toBe(200);
    expect(script.headers.get('content-type')).toContain('text/javascript');
    expect((await server.get(`${BASE}icons/icon.svg`)).headers.get('content-type')).toBe(
      'image/svg+xml',
    );
  });

  it('answers the base path with index.html', async () => {
    server = await serve(site());

    expect(await (await server.get(BASE)).text()).toBe('<p>index</p>');
  });

  it('redirects the base path without its trailing slash', async () => {
    server = await serve(site());

    const response = await server.get('/lectura-biblica');
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(BASE);
  });

  it('answers a deep link with 404.html and status 404, as Pages does', async () => {
    server = await serve(site());

    const response = await server.get(`${BASE}libros/salmos`);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('<p>index</p>');
  });

  it('can answer a deep link with status 200, for tools that refuse a 404 page (LB-033)', async () => {
    server = await serve(site(), 200);

    const response = await server.get(`${BASE}avance`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('<p>index</p>');
  });

  it('still answers 404 outside the base path when deep links get 200 (LB-033)', async () => {
    server = await serve(site(), 200);

    expect((await server.get('/otro-sitio/')).status).toBe(404);
  });

  it('compresses text with gzip when the browser accepts it, as Pages does (LB-033)', async () => {
    server = await serve(site());

    const response = await server.get(`${BASE}main.js`, { 'accept-encoding': 'gzip' });
    expect(response.headers.get('content-encoding')).toBe('gzip');
    expect(response.headers.get('vary')).toBe('accept-encoding');
    // fetch decodes gzip by itself: the body arrives as the original text.
    expect(await response.text()).toBe('console.log(1)');
  });

  it('sends text as is to a client that does not accept gzip (LB-033)', async () => {
    server = await serve(site());

    const response = await server.get(`${BASE}main.js`, { 'accept-encoding': 'identity' });
    expect(response.headers.get('content-encoding')).toBeNull();
  });

  it('never compresses images (LB-033)', async () => {
    server = await serve(site());
    writeFileSync(join(server.root, 'icons', 'icon.png'), 'png');

    const response = await server.get(`${BASE}icons/icon.png`, { 'accept-encoding': 'gzip' });
    expect(response.headers.get('content-encoding')).toBeNull();
  });

  it('serves nothing outside the base path', async () => {
    server = await serve(site(false));

    expect((await server.get('/main.js')).status).toBe(404);
  });

  it('never serves files outside the build folder', async () => {
    server = await serve(site(false));

    expect((await server.get(`${BASE}..%2F..%2Fetc%2Fpasswd`)).status).toBe(404);
  });
});
