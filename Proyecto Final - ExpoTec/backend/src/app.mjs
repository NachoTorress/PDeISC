import express from 'express';
import { createApp } from './create-app.mjs';
import { readConfig } from './config/env.mjs';
import { createDatabase } from './config/database.mjs';
import { createAuthRepository } from './repositories/auth.mjs';
import { createSpacesRepository } from './repositories/spaces.mjs';
import { createProjectsRepository } from './repositories/projects.mjs';
import { createInventoryRepository } from './repositories/inventory.mjs';
import { createLoansRepository } from './repositories/loans.mjs';

export const config = readConfig();
export const pool = createDatabase();
export default createApp(createAuthRepository(pool), config, console, express(), createSpacesRepository(pool), createProjectsRepository(pool), createInventoryRepository(pool), createLoansRepository(pool));
