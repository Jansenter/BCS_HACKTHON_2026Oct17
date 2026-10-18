import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
import { createNearbyHandler } from './nearby.mjs';

// Values supplied by the host environment take priority over local files.
for (const name of ['.env.local', '.env']) {
  const file = new URL(`../${name}`, import.meta.url);
  if (existsSync(file)) process.loadEnvFile(file);
}
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const api = createNearbyHandler();
const server = createServer((req, res) => {
  void api(req, res, () => {
    void (async () => {
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
      let pathname;
      try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
      const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403).end(); return; }
      try {
        if (!(await stat(path)).isFile()) throw new Error('Not a file');
        res.writeHead(200, { 'Content-Type': types[extname(path).toLowerCase()] ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
        if (req.method === 'HEAD') res.end();
        else createReadStream(path).on('error', () => res.destroy()).pipe(res);
      } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); }
    })().catch(() => { if (!res.headersSent) res.writeHead(500).end(); else res.destroy(); });
  });
});
server.requestTimeout = 45000;
server.headersTimeout = 10000;
server.listen(Number(process.env.PORT || 4173), '0.0.0.0', () => console.log(`ArtWalk site and nearby API listening on port ${process.env.PORT || 4173}`));
