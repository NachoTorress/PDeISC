// server.js COMPLETO
// versión con import + carga directa del index

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

// ─── __dirname para ES Modules ─────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Middleware ────────────────────────────────────────────

app.use(express.json());

// Servir archivos estáticos
app.use("/styles", express.static(path.join(__dirname, "styles")));
app.use("/scripts", express.static(path.join(__dirname, "scripts")));
app.use("/pages", express.static(path.join(__dirname, "pages")));

// ─── Carpeta de guardado ───────────────────────────────────

const carpetaGuardado = path.join(__dirname, "descargados");

if (!fs.existsSync(carpetaGuardado)) {
    fs.mkdirSync(carpetaGuardado);
}

// ─── Ruta principal → abre index.html ──────────────────────

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "index.html"));
});

// ─── Guardar archivo TXT en servidor ───────────────────────

app.post("/guardar-archivo", (req, res) => {
    const { nombre, contenido } = req.body;

    if (!nombre || !contenido) {
        return res.status(400).json({
            error: "Faltan datos"
        });
    }

    const rutaArchivo = path.join(carpetaGuardado, nombre);

    fs.writeFile(rutaArchivo, contenido, "utf8", (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Error al guardar archivo"
            });
        }

        res.json({
            mensaje: "Archivo guardado correctamente"
        });
    });
});

// ─── Inicio servidor ───────────────────────────────────────

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});