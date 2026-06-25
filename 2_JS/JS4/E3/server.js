/**
 * server.js — Ejercicio 3
 * Sirve la página del ejercicio 3: búsqueda de usuarios por nombre.
 * Puerto: Variable (default 3003)
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`E3 corriendo en http://localhost:${PORT}`));
