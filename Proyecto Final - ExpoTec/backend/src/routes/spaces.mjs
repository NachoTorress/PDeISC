/**
 * Rutas de espacios (aulas, patio, sectores) y su plano de mobiliario.
 * Las consultas usan POST con sus datos en el cuerpo JSON: la API no usa GET.
 *
 * | Método | Ruta                   | Acceso         | Cuerpo JSON          | Descripción                         |
 * | ------ | ---------------------- | -------------- | -------------------- | ----------------------------------- |
 * | POST   | /api/spaces/query      | público        | `{}`                 | Lista los espacios activos.         |
 * | POST   | /api/spaces/:id/query  | público        | `{}`                 | Devuelve un espacio con su plano.   |
 * | POST   | /api/spaces            | administrador  | datos del espacio    | Crea un espacio vacío.              |
 * | PUT    | /api/spaces/:id        | administrador  | espacio completo     | Guarda datos, mobiliario y puestos. |
 * | DELETE | /api/spaces/:id        | administrador  | `{ version }`        | Da de baja el espacio.              |
 */
import { Router } from 'express';
import { requireAdmin, requireSession, rateLimit } from '../middleware/auth.mjs';
import { userId } from '../validators/auth.mjs';
import { createSpaceBody, saveSpaceBody, spaceVersion } from '../validators/spaces.mjs';
import { versionInput, noInput } from '../validators/query.mjs';

/**
 * Crea el enrutador de espacios.
 *
 * @param {object} repository Repositorio de espacios (consultas SQL).
 * @param {object} authRepository Repositorio de cuentas, usado por el límite de solicitudes.
 * @param {object} service Servicio de autenticación que valida el token de acceso.
 * @param {object} config Configuración del servidor.
 * @returns {import('express').Router}
 */
export function spacesRoutes(repository, authRepository, service, config) {
  const router = Router();

  // Lecturas públicas: los visitantes sin cuenta también consultan el plano.
  router.post('/query', async (req, res) => {
    noInput(req.body);
    res.json({ spaces: await repository.list() });
  });
  router.post('/:id/query', async (req, res) => {
    noInput(req.body);
    res.json({ space: await repository.get(userId(req.params.id)) });
  });

  // Desde aquí, solo administración con sesión válida y con límite de escrituras.
  router.use(requireSession(service), requireAdmin,
    rateLimit(authRepository, config, { scope: 'spaces-write', limit: 120, seconds: 900 }));
  router.post('/', async (req, res) => {
    res.status(201).json({ space: await repository.create(createSpaceBody(req.body), req.auth.user.id) });
  });
  router.put('/:id', async (req, res) => {
    res.json({ space: await repository.save(userId(req.params.id), saveSpaceBody(req.body), req.auth.user.id) });
  });
  router.delete('/:id', async (req, res) => {
    const { version } = versionInput(req.body);
    await repository.archive(userId(req.params.id), spaceVersion(version), req.auth.user.id);
    res.sendStatus(204);
  });
  return router;
}
