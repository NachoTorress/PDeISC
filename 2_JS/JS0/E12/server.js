// Importar módulos necesarios para crear un servidor HTTP
import http from "http";
import fs from "fs";
import path from "path";

const PORT = 3011;

// Crear servidor HTTP que responde a las solicitudes
const server = http.createServer((req, res) => {
  let filePath;  // Verificar ruta y elegir el archivo que se va a servir


  if (req.url === "/") {
    filePath = "./html/index.html";
  } else {
    filePath = "." + req.url;
  }

  const ext = path.extname(filePath);
  let contentType = "text/html";

  if (ext === ".css") contentType = "text/css";
  if (ext === ".js") contentType = "application/javascript";    // Leer el archivo solicitado del disco


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

// Iniciar el servidor en el puerto configurado
server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});