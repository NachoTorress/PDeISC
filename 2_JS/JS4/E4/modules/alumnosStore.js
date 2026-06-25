/**
 * modules/alumnosStore.js
 * Almacenamiento persistente de alumnos en data/alumnos.json.
 * Cada operación lee y escribe el archivo, por lo que los datos
 * sobreviven reinicios del servidor.
 * Entrada: llamadas desde alumnosRouter.js
 * Salida: datos estructurados de alumnos con id y fecha de creación
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../data/alumnos.json");

// ── HELPERS ──────────────────────────────────────────
/**
 * Lee el archivo JSON y devuelve el array de alumnos.
 * @returns {Array}
 */
function leerDB() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

/**
 * Escribe el array de alumnos en el archivo JSON.
 * @param {Array} alumnos
 */
function escribirDB(alumnos) {
  fs.writeFileSync(DB_PATH, JSON.stringify(alumnos, null, 2), "utf-8");
}

/**
 * Calcula el próximo ID disponible (máximo actual + 1).
 * @param {Array} alumnos
 * @returns {number}
 */
function nextId(alumnos) {
  return alumnos.length ? Math.max(...alumnos.map((a) => a.id)) + 1 : 1;
}

/**
 * Formatea la fecha actual como DD/MM/AA.
 * @returns {string}
 */
function formatDate() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

// ── OPERACIONES ──────────────────────────────────────
/**
 * Devuelve todos los alumnos.
 * @returns {Array}
 */
export function getAlumnos() {
  return leerDB();
}

/**
 * Agrega un nuevo alumno y lo persiste en el JSON.
 * @param {{ nombre:string, email:string, materia:string }} data
 * @returns {object} El alumno creado
 */
export function addAlumno(data) {
  const alumnos = leerDB();
  const exists = alumnos.some(
    (a) => a.email.toLowerCase() === data.email.toLowerCase() && a.materia.toLowerCase() === data.materia.toLowerCase()
  );

  if (exists) return null;

  const alumno = { id: nextId(alumnos), ...data, createdAt: formatDate() };
  alumnos.push(alumno);
  escribirDB(alumnos);
  return alumno;
}

/**
 * Actualiza un alumno existente y persiste el cambio.
 * @param {number} id
 * @param {object} data
 * @returns {object|null}
 */
export function updateAlumno(id, data) {
  const alumnos = leerDB();
  const idx = alumnos.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  alumnos[idx] = { ...alumnos[idx], ...data };
  escribirDB(alumnos);
  return alumnos[idx];
}

/**
 * Elimina un alumno por id y persiste el cambio.
 * @param {number} id
 * @returns {object|null}
 */
export function deleteAlumno(id) {
  const alumnos = leerDB();
  const idx = alumnos.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const [eliminado] = alumnos.splice(idx, 1);
  escribirDB(alumnos);
  return eliminado;
}