/**
 * Rutas de proyectos: muestra pública, presentación TV, propuestas de alumnos
 * y revisión de profesores. Las consultas usan POST con sus datos en el
 * cuerpo JSON: la API no usa GET.
 *
 * | Método | Ruta                              | Acceso              | Cuerpo JSON                | Descripción                                 |
 * | ------ | --------------------------------- | ------------------- | -------------------------- | ------------------------------------------- |
 * | POST   | /api/projects/presentation/query  | público             | `{ limit?, after? }`       | Secuencia de la presentación TV.            |
 * | POST   | /api/projects/public/query        | público             | `{ limit?, offset? }`      | Proyectos confirmados.                      |
 * | POST   | /api/projects/public/:id/query    | público             | `{}`                       | Ficha pública de un proyecto confirmado.    |
 * | POST   | /api/projects/query               | sesión              | `{ limit?, offset? }`      | Proyectos visibles para la cuenta.          |
 * | POST   | /api/projects/people/find         | sesión              | `{ email, role }`          | Busca un alumno o profesor por correo.      |
 * | POST   | /api/projects/:id/query           | sesión              | `{}`                       | Detalle con datos privados permitidos.      |
 * | POST   | /api/projects                     | alumno              | propuesta                  | Crea una propuesta pendiente.               |
 * | PUT    | /api/projects/:id                 | integrante          | propuesta + `version`      | Modifica la propuesta antes de confirmarla. |
 * | POST   | /api/projects/:id/reviews         | profesor asignado   | `{ decision, note, version }` | Confirma, pide cambios o reabre.         |
 * | DELETE | /api/projects/:id                 | integrante / admin  | `{ version }`              | Cancela el proyecto.                        |
 *
 * Los permisos finos (integrante, profesor asignado) se comprueban en el
 * repositorio dentro de la misma transacción que modifica los datos.
 */
import { Router } from 'express';
import { requireSession, rateLimit } from '../middleware/auth.mjs';
import { userId, pagination } from '../validators/auth.mjs';
import { spaceVersion } from '../validators/spaces.mjs';
import { proposalBody, reviewBody, personBody } from '../validators/projects.mjs';
import { presentationQuery } from '../validators/presentation.mjs';
import { queryInput, versionInput, noInput } from '../validators/query.mjs';


/**
 * Crea el enrutador de proyectos.
 *
 * @param {object} repository Repositorio de proyectos.
 * @param {object} authRepository Repositorio de cuentas (límite de solicitudes).
 * @param {object} service Servicio de autenticación.
 * @param {object} config Configuración del servidor.
 * @returns {import('express').Router}
 */
export function projectsRoutes(repository, authRepository, service, config) {
  const router = Router();

  // Consultas públicas: no exponen correos ni datos privados de las cuentas.
  router.post('/presentation/query', async (req, res) => {
    res.json(await repository.presentation(presentationQuery(queryInput(req.body))));
  });
  router.post('/public/query', async (req, res) => {
    res.json({ projects: await repository.list(pagination(queryInput(req.body))) });
  });
  router.post('/public/:id/query', async (req, res) => {
    noInput(req.body);
    res.json({ project: await repository.get(userId(req.params.id)) });
  });

  // El resto requiere iniciar sesión.
  router.use(requireSession(service));
  router.post('/query', async (req, res) => {
    res.json({ projects: await repository.list(pagination(queryInput(req.body)), req.auth.user.id) });
  });
  router.post('/people/find',
    rateLimit(authRepository, config, { scope: 'project-people', limit: 30, seconds: 900, byUser: true }),
    async (req, res) => {
      res.json({ person: await repository.person(personBody(queryInput(req.body)), req.auth.user.id) });
    });
  router.post('/:id/query', async (req, res) => {
    noInput(req.body);
    res.json({ project: await repository.get(userId(req.params.id), req.auth.user.id) });
  });

  // Escrituras con límite por usuario.
  router.use(rateLimit(authRepository, config, { scope: 'projects-write', limit: 120, seconds: 900, byUser: true }));
  router.post('/', async (req, res) => {
    res.status(201).json({ project: await repository.create(proposalBody(req.body), req.auth.user.id) });
  });
  router.put('/:id', async (req, res) => {
    res.json({ project: await repository.save(userId(req.params.id), proposalBody(req.body, true), req.auth.user.id) });
  });
  router.post('/:id/reviews', async (req, res) => {
    res.json({ project: await repository.review(userId(req.params.id), reviewBody(req.body), req.auth.user.id) });
  });
  router.delete('/:id', async (req, res) => {
    const { version } = versionInput(req.body);
    res.json({ project: await repository.cancel(userId(req.params.id), spaceVersion(version), req.auth.user.id) });
  });
  return router;
}
