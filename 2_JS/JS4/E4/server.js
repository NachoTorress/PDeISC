/**
 * server.js — Ejercicio 4
 * Sirve la página del ejercicio 4 y expone la API /api/alumnos.
 * Puerto: 3004
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import alumnosRouter from "./modules/alumnosRouter.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(__dirname));

// API propia de alumnos
app.use("/api/alumnos", alumnosRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

app.listen(3004, () => console.log("E4 corriendo en http://localhost:3004"));
