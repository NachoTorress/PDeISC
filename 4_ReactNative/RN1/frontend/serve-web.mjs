import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const host = '127.0.0.1';
const port = Number(process.env.FRONTEND_PORT || 8084);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

async function regularFile(file) {
  const details = await stat(file).catch(() => null);
  return details?.isFile() ? details : null;
}

http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { allow: 'GET, HEAD' });
    response.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }

  const requested = path.resolve(root, `.${pathname}`);
  if (requested !== root && !requested.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403);
    response.end();
    return;
  }

  let file = requested === root ? path.join(root, 'index.html') : requested;
  let details = await regularFile(file);
  if (!details && !path.extname(pathname) && request.headers.accept?.includes('text/html')) {
    file = path.join(root, 'index.html');
    details = await regularFile(file);
  }
  if (!details) {
    response.writeHead(404);
    response.end();
    return;
  }

  response.writeHead(200, {
    'content-type': contentTypes[path.extname(file)] || 'application/octet-stream',
    'content-length': details.size,
    'cache-control': 'no-store'
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(file).pipe(response);
}).listen(port, host, () => console.log(`Expo Web exportada en http://${host}:${port}`));
