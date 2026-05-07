// Importar módulos necesarios para crear un servidor HTTP
import http from "http";
import fs from "fs";
import path from "path";

// Crear servidor HTTP que responde a las solicitudes
const server = http.createServer((req, res) => {
  let filePath = "";

  // Determinar qué archivo servir según la URL solicitada  // Verificar ruta y elegir el archivo que se va a servir

  if (req.url === "/") {
    filePath = path.join(__dirname, "html", "index.html");
  } else if (req.url.endsWith(".css")) {
    filePath = path.join(__dirname, req.url);
  } else if (req.url.endsWith(".js")) {
    filePath = path.join(__dirname, req.url);
  } else {
    // Si no existe la ruta, devolver error 404
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 - Página no encontrada");
    return;
  }

  // Leer el archivo solicitado del disco
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end("Error interno del servidor");
      return;
    }

    // Definir el tipo de contenido según la extensión del archivo
    let contentType = "text/html";

    if (filePath.endsWith(".css")) {
      contentType = "text/css";
    }

    if (filePath.endsWith(".js")) {
      contentType = "text/javascript";
    }

    // Enviar el archivo con el tipo de contenido correcto
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
});

// Iniciar el servidor en el puerto 3015
// Iniciar el servidor en el puerto configurado
server.listen(3015, "127.0.0.1", () => {
  console.log("Servidor corriendo en http://127.0.0.1:3015");
});