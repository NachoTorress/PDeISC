/**
 * Rutas REST de carga de fotos a almacenamiento privado (Vercel Blob).
 *
 * Flujo: el cliente pide permiso (`POST /api/uploads`), sube el archivo
 * directamente al almacenamiento con el token temporal recibido y luego pide
 * procesarlo (`POST /api/uploads/:id/complete`). El servidor valida el
 * contenido real, lo optimiza a JPEG y devuelve la URL definitiva.
 *
 * | Método | Ruta                            | Acceso  | Descripción                                        |
 * | ------ | ------------------------------- | ------- | -------------------------------------------------- |
 * | GET    | /api/uploads/:id/image          | público | Imagen publicada (404 si todavía es privada).      |
 * | GET    | /api/uploads/preview?imageUrl=  | sesión  | Vista previa privada para su autor o moderación.   |
 * | POST   | /api/uploads                    | sesión  | Prepara una carga y entrega un token temporal.     |
 * | POST   | /api/uploads/:id/complete       | sesión  | Valida, optimiza y guarda la imagen subida.        |
 */
import { Router } from 'express';
import { requireSession, rateLimit } from '../middleware/auth.mjs';
import { createUploadsService } from '../services/uploads.mjs';
import { queryInput } from '../validators/query.mjs';

/**
 * Crea el enrutador de cargas.
 *
 * @param {object} repository Repositorio de imágenes.
 * @param {object} authRepository Repositorio de cuentas (límite de solicitudes).
 * @param {object} authService Servicio de autenticación.
 * @param {object} config Configuración del servidor.
 * @param {object} [storage] Almacenamiento alternativo (se usa en pruebas).
 * @returns {import('express').Router}
 */
export function uploadsRoutes(repository, authRepository, authService, config, storage) {
  const router = Router(), service = createUploadsService(repository, config, storage);

  // Imagen pública: solo se entrega si su proyecto o foto de galería está publicado.
  router.get('/:id/image', async (req, res) => {
    const image = await service.publicImage(req.params.id);
    res.set({ 'Content-Type': 'image/jpeg', 'Content-Disposition': 'inline; filename="expotec.jpg"', 'Cross-Origin-Resource-Policy': 'cross-origin', 'Cache-Control': 'no-store' });
    res.send(image);
  });

  router.use(requireSession(authService));
  router.get('/preview',
    rateLimit(authRepository, config, { scope: 'image-preview', limit: 200, seconds: 900, byUser: true }),
    async (req, res) => {
      res.json(await service.preview(queryInput(req.query), req.auth.user));
    });
  router.post('/',
    rateLimit(authRepository, config, { scope: 'image-upload', limit: 20, seconds: 3600, byUser: true }),
    async (req, res) => {
      res.status(201).json(await service.prepare(req.body, req.auth.user));
    });
  router.post('/:id/complete',
    rateLimit(authRepository, config, { scope: 'image-complete', limit: 40, seconds: 3600, byUser: true }),
    async (req, res) => {
      res.json(await service.complete({ id: req.params.id }, req.auth.user));
    });
  return router;
}
