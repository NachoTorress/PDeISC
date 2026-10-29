/**
 * Rutas de la galería de fotos de la ExpoTec.
 * Las consultas usan POST con sus datos en el cuerpo JSON: la API no usa GET.
 *
 * | Método | Ruta                           | Acceso         | Cuerpo JSON                       | Descripción                                    |
 * | ------ | ------------------------------ | -------------- | --------------------------------- | ---------------------------------------------- |
 * | POST   | /api/gallery/public/query      | público        | `{ limit?, offset? }`             | Fotos aprobadas.                               |
 * | POST   | /api/gallery/mine/query        | sesión         | `{ limit?, offset? }`             | Aportes propios con su estado.                 |
 * | POST   | /api/gallery                   | sesión         | foto                              | Envía una foto; queda pendiente de moderación. |
 * | POST   | /api/gallery/moderation/query  | administrador  | `{ status?, limit?, offset? }`    | Cola de moderación.                            |
 * | PATCH  | /api/gallery/:id               | administrador  | `{ decision, note?, version }`    | Aprueba, rechaza o retira una foto.            |
 */
import { Router } from 'express';
import { requireSession, requireAdmin, rateLimit } from '../middleware/auth.mjs';
import { userId } from '../validators/auth.mjs';
import { galleryQuery, galleryPhoto, galleryReview } from '../validators/gallery.mjs';
import { queryInput } from '../validators/query.mjs';


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
  router.post('/public/query', async (req, res) => {
    res.json({ photos: await repository.publicList(galleryQuery(queryInput(req.body))) });
  });

  router.use(requireSession(service));
  router.post('/mine/query', async (req, res) => {
    res.json({ photos: await repository.mine(galleryQuery(queryInput(req.body)), req.auth.user.id) });
  });
  router.post('/',
    rateLimit(authRepository, config, { scope: 'gallery-submit', limit: 10, seconds: 3600, byUser: true }),
    async (req, res) => {
      res.status(201).json({ photo: await repository.submit(galleryPhoto(req.body), req.auth.user.id) });
    });

  // Moderación: exclusiva de administración.
  router.use(requireAdmin);
  router.post('/moderation/query', async (req, res) => {
    res.json({ photos: await repository.moderation(galleryQuery(queryInput(req.body), true)) });
  });
  router.patch('/:id',
    rateLimit(authRepository, config, { scope: 'gallery-review', limit: 120, seconds: 900, byUser: true }),
    async (req, res) => {
      res.json({ photo: await repository.review(userId(req.params.id), galleryReview(req.body), req.auth.user.id) });
    });
  return router;
}
