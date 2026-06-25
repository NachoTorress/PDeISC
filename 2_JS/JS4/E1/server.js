/**
 * server.js — Ejercicio 1
 * Sirve la página del ejercicio 1: GET de usuarios con fetch y axios.
 * Puerto: 3001
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Servir archivos estáticos (scripts, styles)
app.use(express.static(__dirname));

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

app.listen(3001, () => console.log("E1 corriendo en http://localhost:3001"));
