/* A static server for browser gates, with no dependencies.

   Two things the file:// approach cannot do, and both matter:

   1. A real phone width. Chromium will not make a headless window narrower
      than about 485px, so a gate that passes --window-size=390 is quietly
      measuring at 485. An iframe gets a viewport of exactly its own width,
      but reading back from it needs a shared http origin — file:// origins
      are opaque to each other.

   2. A probe inside a page with a strict CSP. The workspace forbids inline
      script; a probe served from the same origin as a file is allowed.

   `routes` serves in-memory bodies at given paths; `rewrite` may transform an
   HTML response (used to append the probe's <script src>). */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.txt': 'text/plain',
};

export function serve(root, { routes = {}, rewrite } = {}) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    let path = decodeURIComponent(url.pathname);
    if (routes[path] !== undefined) {
      const [type, body] = routes[path];
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
      return res.end(body);
    }
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(root, path));
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    try {
      if ((await stat(file)).isDirectory()) { res.writeHead(301, { location: path + '/' }); return res.end(); }
      let body = await readFile(file);
      const type = TYPES[extname(file)] || 'application/octet-stream';
      if (rewrite && type.startsWith('text/html')) body = Buffer.from(rewrite(path, body.toString('utf8'), url));
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    resolve({ origin: `http://127.0.0.1:${port}`, close: () => new Promise(r => server.close(r)) });
  }));
}
