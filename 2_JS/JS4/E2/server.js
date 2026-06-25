/**
 * server.js — Ejercicio 2
 * Sirve la página del ejercicio 2: POST de formulario con fetch y axios.
 * Puerto: Variable (default 3002)
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`E2 corriendo en http://localhost:${PORT}`));
