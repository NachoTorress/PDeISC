import http from 'http';
import fs from 'fs';

const server = http.createServer((req, res) => {
  

  if (req.url === '/') {
    fs.readFile('./pages/index2.html', (err, data) => {
      if (err) {
        console.error(err);
        res.end('Error HTML');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }

  else if (req.url === '/styles/style2.css') {
    fs.readFile('./styles/style2.css', (err, data) => {
      if (err) {
        console.error(err);
        res.end('Error CSS');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(data);
    });
  }

  else {
    res.writeHead(404);
    res.end('No encontrado');
  }
});

server.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});