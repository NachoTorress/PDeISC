import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderHomePage } from './pages/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = createServer((req, res) => {

  // CSS
  if (req.url === '/styles/styles.css') {
    const css = readFileSync(
      path.join(__dirname, 'styles', 'styles.css'),
      'utf-8'
    );

    res.writeHead(200, { 'Content-Type': 'text/css' });
    return res.end(css);
  }

  // JS
  if (req.url === '/scripts/theme.js') {
    const js = readFileSync(
      path.join(__dirname, 'scripts', 'theme.js'),
      'utf-8'
    );

    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    return res.end(js);
  }

  // HOME
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(renderHomePage());
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('<h1>404 - Página no encontrada</h1>');
});

server.listen(3004, '127.0.0.1', () => {
  console.log('http://127.0.0.1:3004');
});