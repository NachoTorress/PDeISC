/**
 * Punto de armado de la API para producción.
 * Lee la configuración, crea el pool de conexiones MySQL/TiDB y construye la
 * aplicación con los repositorios reales de cada dominio. Vercel importa este
 * módulo como función serverless; `server.mjs` lo usa para ejecutar localmente.
 */
import express from 'express';
import { createApp } from './create-app.mjs';
import { readConfig } from './config/env.mjs';
import { createDatabase } from './config/database.mjs';
import { createAuthRepository } from './repositories/auth.mjs';
import { createSpacesRepository } from './repositories/spaces.mjs';
import { createProjectsRepository } from './repositories/projects.mjs';
import { createInventoryRepository } from './repositories/inventory.mjs';
import { createLoansRepository } from './repositories/loans.mjs';
import { createGalleryRepository } from './repositories/gallery.mjs';
import { createSocialRepository } from './repositories/social.mjs';
import { createUploadsRepository } from './repositories/uploads.mjs';
import { createRecoveryRepository } from './repositories/recovery.mjs';

export const config = readConfig();
export const pool = createDatabase();
export default createApp(createAuthRepository(pool), config, console, express(), createSpacesRepository(pool), createProjectsRepository(pool), createInventoryRepository(pool), createLoansRepository(pool), createGalleryRepository(pool), createSocialRepository(pool), undefined, createUploadsRepository(pool), undefined, createRecoveryRepository(pool));
