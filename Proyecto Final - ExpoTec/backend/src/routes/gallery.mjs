/**
 * Rutas REST de la galería de fotos de la ExpoTec.
 *
 * | Método | Ruta                     | Acceso         | Descripción                                          |
 * | ------ | ------------------------ | -------------- | ---------------------------------------------------- |
 * | GET    | /api/gallery             | público        | Fotos aprobadas (?limit&offset).                     |
 * | GET    | /api/gallery/mine        | sesión         | Aportes propios con su estado.                       |
 * | POST   | /api/gallery             | sesión         | Envía una foto; queda pendiente de moderación.       |
 * | GET    | /api/gallery/moderation  | administrador  | Cola de moderación (?status=pending|approved|...).   |
 * | PATCH  | /api/gallery/:id         | administrador  | Aprueba, rechaza o retira una foto.                  |
 */
import { Router } from 'express';
import { requireSession, requireAdmin, rateLimit } from '../middleware/auth.mjs';
import { userId } from '../validators/auth.mjs';
import { galleryQuery, galleryPhoto, galleryReview } from '../validators/gallery.mjs';
import { queryInput } from '../validators/query.mjs';

const pageTypes = { limit: 'int', offset: 'int' };

/**
 * Crea el enrutador de la galería.
 *
 * @param {object} repository Repositorio de la galería.
 * @param {object} authRepository Repositorio de cuentas (límite de solicitudes).
 * @param {object} service Servicio de autenticación.
 * @param {object} config Configuración del servidor.
 * @returns {import('express').Router}
 */
export function galleryRoutes(repository, authRepository, service, config) {
  const router = Router();

  // Galería pública: solo fotos aprobadas, sin correos de los autores.
  router.get('/', async (req, res) => {
    res.json({ photos: await repository.publicList(galleryQuery(queryInput(req.query, pageTypes))) });
  });

  router.use(requireSession(service));
  router.get('/mine', async (req, res) => {
    res.json({ photos: await repository.mine(galleryQuery(queryInput(req.query, pageTypes)), req.auth.user.id) });
  });
  router.post('/',
    rateLimit(authRepository, config, { scope: 'gallery-submit', limit: 10, seconds: 3600, byUser: true }),
    async (req, res) => {
      res.status(201).json({ photo: await repository.submit(galleryPhoto(req.body), req.auth.user.id) });
    });

  // Moderación: exclusiva de administración.
  router.use(requireAdmin);
  router.get('/moderation', async (req, res) => {
    res.json({ photos: await repository.moderation(galleryQuery(queryInput(req.query, pageTypes), true)) });
  });
  router.patch('/:id',
    rateLimit(authRepository, config, { scope: 'gallery-review', limit: 120, seconds: 900, byUser: true }),
    async (req, res) => {
      res.json({ photo: await repository.review(userId(req.params.id), galleryReview(req.body), req.auth.user.id) });
    });
  return router;
}
