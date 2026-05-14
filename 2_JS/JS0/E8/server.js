import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Configuración de constantes y corrección de __dirname para ES Modules
const PORT = 3007;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
    let filePath = "";

    // Lógica de ruteo
    if (req.url === "/") {
        filePath = path.join(__dirname, "html", "index.html");
    } else {
        // Esto permite cargar archivos desde /styles o /scripts correctamente
        filePath = path.join(__dirname, req.url);
    }

    // Leer el archivo solicitado
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 - Archivo no encontrado");
            return;
        }

        // Definir el tipo de contenido según la extensión
        const ext = path.extname(filePath);
        let contentType = "text/html";

        switch (ext) {
            case ".css":
                contentType = "text/css";
                break;
            case ".js":
                contentType = "text/javascript";
                break;
        }

        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
    });
});

// Iniciar el servidor usando la variable PORT
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});