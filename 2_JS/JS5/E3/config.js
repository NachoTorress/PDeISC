/**
 * config.js
 * Configuración del proyecto 2 (consumidor de la API).
 * De dónde viene: es el primer archivo importado por server.js.
 * A dónde va: SERVER_PORT define en qué puerto se sirve esta página;
 * API_URL apunta a la API REST expuesta por el proyecto 1 (alumnos-api).
 */

export const SERVER_PORT = process.env.PORT || 3002;
export const API_URL = process.env.API_URL || 'http://localhost:3001/api/alumnos';
