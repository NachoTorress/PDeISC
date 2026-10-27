/**
 * Rutas REST de proyectos: muestra pública, presentación TV, propuestas de
 * alumnos y revisión de profesores.
 *
 * | Método | Ruta                          | Acceso              | Descripción                                   |
 * | ------ | ----------------------------- | ------------------- | --------------------------------------------- |
 * | GET    | /api/projects/presentation    | público             | Secuencia de la presentación TV.              |
 * | GET    | /api/projects/public          | público             | Proyectos confirmados (?limit&offset).        |
 * | GET    | /api/projects/public/:id      | público             | Ficha pública de un proyecto confirmado.      |
 * | GET    | /api/projects                 | sesión              | Proyectos visibles para la cuenta.            |
 * | GET    | /api/projects/people          | sesión              | Busca alumno o profesor (?email&role).        |
 * | GET    | /api/projects/:id             | sesión              | Detalle con datos privados permitidos.        |
 * | POST   | /api/projects                 | alumno              | Crea una propuesta pendiente.                 |
 * | PUT    | /api/projects/:id             | integrante          | Modifica la propuesta antes de confirmarla.   |
 * | POST   | /api/projects/:id/reviews     | profesor asignado   | Confirma, pide cambios o reabre.              |
 * | DELETE | /api/projects/:id             | integrante / admin  | Cancela el proyecto (?version=N).             |
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
import { queryInput, versionQuery, noQuery } from '../validators/query.mjs';

const pageTypes = { limit: 'int', offset: 'int' };

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
  router.get('/presentation', async (req, res) => {
    res.json(await repository.presentation(presentationQuery(queryInput(req.query, { limit: 'int' }))));
  });
  router.get('/public', async (req, res) => {
    res.json({ projects: await repository.list(pagination(queryInput(req.query, pageTypes))) });
  });
  router.get('/public/:id', async (req, res) => {
    noQuery(req.query);
    res.json({ project: await repository.get(userId(req.params.id)) });
  });

  // El resto requiere iniciar sesión.
  router.use(requireSession(service));
  router.get('/', async (req, res) => {
    res.json({ projects: await repository.list(pagination(queryInput(req.query, pageTypes)), req.auth.user.id) });
  });
  router.get('/people',
    rateLimit(authRepository, config, { scope: 'project-people', limit: 30, seconds: 900, byUser: true }),
    async (req, res) => {
      res.json({ person: await repository.person(personBody(queryInput(req.query)), req.auth.user.id) });
    });
  router.get('/:id', async (req, res) => {
    noQuery(req.query);
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
    const { version } = versionQuery(req.query);
    res.json({ project: await repository.cancel(userId(req.params.id), spaceVersion(version), req.auth.user.id) });
  });
  return router;
}
