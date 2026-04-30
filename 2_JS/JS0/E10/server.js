const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3009;

const server = http.createServer((req, res) => {
  let filePath;

  if (req.url === "/") {
    filePath = "./html/index.html";
  } else {
    filePath = "." + req.url;
  }

  const ext = path.extname(filePath);
  let contentType = "text/html";

  if (ext === ".css") contentType = "text/css";
  if (ext === ".js") contentType = "application/javascript";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Archivo no encontrado");
    }

    res.writeHead(200, {
      "Content-Type": contentType + "; charset=utf-8"
    });

    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});