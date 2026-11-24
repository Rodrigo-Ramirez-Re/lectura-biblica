import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Serves a static build the way GitHub Pages serves a project site: only under `base`, a folder
 * answers with its index.html, and a missing file answers with 404.html and status 404.
 */
export function createPagesServer({ root, base }) {
  const send = (response, status, file) => {
    response.writeHead(status, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    createReadStream(file).pipe(response);
  };

  const notFound = (response) => {
    const page = join(root, '404.html');
    if (existsSync(page)) return send(response, 404, page);
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
  };

  return createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url ?? '/', 'http://local').pathname);
    if (path === base.slice(0, -1)) {
      response.writeHead(301, { location: base }).end();
      return;
    }
    if (!path.startsWith(base)) return notFound(response);

    const file = normalize(join(root, path.slice(base.length)));
    if (!file.startsWith(normalize(root + sep)) && file !== normalize(root))
      return notFound(response);

    const target =
      existsSync(file) && statSync(file).isDirectory() ? join(file, 'index.html') : file;
    if (!existsSync(target)) return notFound(response);
    send(response, 200, target);
  });
}
