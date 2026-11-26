import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { pipeline } from 'node:stream';
import { createGzip } from 'node:zlib';

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

/** Whether an `accept-encoding` header allows gzip: listed, and not with `q=0`. */
function acceptsGzip(header = '') {
  return header.split(',').some((part) => {
    const [name, ...params] = part.trim().split(';');
    if (name?.trim().toLowerCase() !== 'gzip') return false;
    const q = params.map((param) => param.trim()).find((param) => param.startsWith('q='));
    return q === undefined || Number(q.slice(2)) > 0;
  });
}

/**
 * Serves a static build the way GitHub Pages serves a project site: only under `base`, a folder
 * answers with its index.html, and a missing file answers with 404.html and status 404.
 * `deepLinkStatus: 200` answers deep links under `base` with the same page and status 200, for
 * tools such as Lighthouse that refuse to measure a 404 page (LB-033); browsers render both alike.
 */
export function createPagesServer({ root, base, deepLinkStatus = 404 }) {
  // Pages compresses text for browsers that accept it; without it, measured load times are wrong.
  const send = (request, response, status, file) => {
    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    const compressible = /^(text\/|application\/(json|manifest)|image\/svg)/.test(type);
    const gzip = compressible && acceptsGzip(request.headers['accept-encoding']);
    response.writeHead(status, {
      'content-type': type,
      'cache-control': 'no-cache',
      ...(compressible ? { vary: 'accept-encoding' } : {}),
      ...(gzip ? { 'content-encoding': 'gzip' } : {}),
    });
    if (request.method === 'HEAD') return response.end();
    const streams = gzip ? [createReadStream(file), createGzip()] : [createReadStream(file)];
    // A file removed mid-rebuild ends the response instead of leaving it hanging.
    pipeline(...streams, response, () => response.destroy());
  };

  const notFound = (request, response, status = 404) => {
    const page = join(root, '404.html');
    if (existsSync(page)) return send(request, response, status, page);
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
  };

  return createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url ?? '/', 'http://local').pathname);
    if (path === base.slice(0, -1)) {
      response.writeHead(301, { location: base }).end();
      return;
    }
    if (!path.startsWith(base)) return notFound(request, response);

    const file = normalize(join(root, path.slice(base.length)));
    if (!file.startsWith(normalize(root + sep)) && file !== normalize(root))
      return notFound(request, response);

    const target =
      existsSync(file) && statSync(file).isDirectory() ? join(file, 'index.html') : file;
    // Only app routes (no extension) are deep links; a missing script or icon stays a 404.
    if (!existsSync(target))
      return notFound(request, response, extname(path) ? 404 : deepLinkStatus);
    send(request, response, 200, target);
  });
}
