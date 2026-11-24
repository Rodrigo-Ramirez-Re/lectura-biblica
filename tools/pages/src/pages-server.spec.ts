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

async function serve(root: string) {
  const server = createPagesServer({ root, base: BASE });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  return {
    get: (path: string) => fetch(`http://localhost:${port}${path}`, { redirect: 'manual' }),
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

  it('serves nothing outside the base path', async () => {
    server = await serve(site(false));

    expect((await server.get('/main.js')).status).toBe(404);
  });

  it('never serves files outside the build folder', async () => {
    server = await serve(site(false));

    expect((await server.get(`${BASE}..%2F..%2Fetc%2Fpasswd`)).status).toBe(404);
  });
});
