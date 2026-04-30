const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
  let filePath = "";

  if (req.url === "/") {
    filePath = path.join(__dirname, "html", "index.html");
  } else if (req.url.endsWith(".css")) {
    filePath = path.join(__dirname, req.url);
  } else if (req.url.endsWith(".js")) {
    filePath = path.join(__dirname, req.url);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 - Página no encontrada");
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end("Error interno del servidor");
      return;
    }

    let contentType = "text/html";

    if (filePath.endsWith(".css")) {
      contentType = "text/css";
    }

    if (filePath.endsWith(".js")) {
      contentType = "text/javascript";
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
});

server.listen(3001, "127.0.0.1", () => {
  console.log("Servidor corriendo en http://127.0.0.1:3001");
});