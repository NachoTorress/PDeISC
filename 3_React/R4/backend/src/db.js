/**
 * Database module supporting Neon / Vercel Postgres and fallback dynamic import for SQLite.
 * Avoids top-level import of 'better-sqlite3' to prevent Vercel Serverless Function build errors.
 */
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const isPostgres = Boolean(connectionString);

let sqlClient = null;
let sqliteDb = null;

if (isPostgres) {
  sqlClient = neon(connectionString);
}

export async function initDatabase() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(adminPassword, salt);

  if (isPostgres) {
    await sqlClient`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS skill_categories (
        id SERIAL PRIMARY KEY,
        category_key VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        icon VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        accent VARCHAR(255) NOT NULL,
        github_url VARCHAR(255),
        tags TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS experiences (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) CHECK (type IN ('education', 'work')) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        meta VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS download_logs (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(255)
      );
    `;

    // Seed Admin
    const adminRows = await sqlClient`SELECT COUNT(*)::int as count FROM admin_users;`;
    if (adminRows[0].count === 0) {
      await sqlClient`INSERT INTO admin_users (username, password_hash) VALUES ('admin', ${hash});`;
    }

    // Seed Skill Categories & Skills
    const catRows = await sqlClient`SELECT COUNT(*)::int as count FROM skill_categories;`;
    if (catRows[0].count === 0) {
      const cat1 = await sqlClient`INSERT INTO skill_categories (category_key, title, icon) VALUES ('programacion', 'Programación', 'code') RETURNING id;`;
      const cat1Id = cat1[0].id;
      await sqlClient`INSERT INTO skills (category_id, name, icon) VALUES (${cat1Id}, 'C++', 'cplusplus');`;
      await sqlClient`INSERT INTO skills (category_id, name, icon) VALUES (${cat1Id}, 'Python', 'python');`;
      await sqlClient`INSERT INTO skills (category_id, name, icon) VALUES (${cat1Id}, 'Algoritmos', 'code');`;
      await sqlClient`INSERT INTO skills (category_id, name, icon) VALUES (${cat1Id}, 'Programación competitiva', 'brain');`;

      const cat2 = await sqlClient`INSERT INTO skill_categories (category_key, title, icon) VALUES ('web-datos', 'Web y datos', 'react') RETURNING id;`;
      const cat2Id = cat2[0].id;
      await sqlClient`INSERT INTO skills (category_id, name, icon) VALUES (${cat2Id}, 'TypeScript', 'typescript');`;
      await sqlClient`INSERT INTO skills (category_id, name, icon) VALUES (${cat2Id}, 'React', 'react');`;
      await sqlClient`INSERT INTO skills (category_id, name, icon) VALUES (${cat2Id}, 'Node.js', 'node');`;
      await sqlClient`INSERT INTO skills (category_id, name, icon) VALUES (${cat2Id}, 'SQL', 'sql');`;

      const cat3 = await sqlClient`INSERT INTO skill_categories (category_key, title, icon) VALUES ('herramientas', 'Herramientas e intereses', 'microchip') RETURNING id;`;
      const cat3Id = cat3[0].id;
      await sqlClient`INSERT INTO skills (category_id, name, icon) VALUES (${cat3Id}, 'Git', 'git');`;
      await sqlClient`INSERT INTO skills (category_id, name, icon) VALUES (${cat3Id}, 'Docker', 'docker');`;
      await sqlClient`INSERT INTO skills (category_id, name, icon) VALUES (${cat3Id}, 'Linux', 'linux');`;
      await sqlClient`INSERT INTO skills (category_id, name, icon) VALUES (${cat3Id}, 'IA y hardware', 'microchip');`;
    }

    // Seed Projects
    const projRows = await sqlClient`SELECT COUNT(*)::int as count FROM projects;`;
    if (projRows[0].count === 0) {
      await sqlClient`
        INSERT INTO projects (title, description, accent, github_url, tags) VALUES 
        ('Snake en GitHub', 'Proyecto de juego Snake publicado en GitHub, usado como práctica de lógica, estado de juego y control de interacción.', 'Algoritmos', 'https://github.com/tizianomegnini/JS3Juegos/tree/main/Snake_1.2', 'Programación,Juego,GitHub'),
        ('Proyectos con Arduino/ESP32', 'Trabajos orientados a hardware, microcontroladores y conexión entre componentes físicos y software.', 'Electrónica', NULL, 'Arduino,ESP32,Hardware'),
        ('IA con Jetson, Ollama y Qwen', 'Proyecto de inteligencia artificial que combina Jetson, Ollama, Qwen y herramientas para experimentar con modelos y automatización local.', 'Inteligencia artificial', NULL, 'IA,Jetson,Ollama,Qwen');
      `;
    }

    // Seed Education
    const expRows = await sqlClient`SELECT COUNT(*)::int as count FROM experiences;`;
    if (expRows[0].count === 0) {
      await sqlClient`
        INSERT INTO experiences (type, title, description, meta) VALUES
        ('education', 'Tecnicatura en Informática Profesional y Personal', 'Estudiante de 6.º año.', 'Promedio: 9,15');
      `;
    }

    // Seed Achievements
    const achRows = await sqlClient`SELECT COUNT(*)::int as count FROM achievements;`;
    if (achRows[0].count === 0) {
      await sqlClient`
        INSERT INTO achievements (title, description) VALUES
        ('Olimpiada Informática Argentina', 'Participación en competencia de informática.'),
        ('Olimpiadas de Matemática', 'Participación en olimpíadas de matemática.'),
        ('CALICO', 'Participación en competencia CALICO.');
      `;
    }
  } else {
    // Dynamic import for local SQLite fallback
    const { default: Database } = await import('better-sqlite3');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dbPath = path.join(__dirname, 'portfolio.db');
    sqliteDb = new Database(dbPath);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS skill_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_key TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES skill_categories(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        accent TEXT NOT NULL,
        github_url TEXT,
        tags TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS experiences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT CHECK(type IN ('education', 'work')) NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        meta TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS download_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT
      );
    `);

    const adminCheck = sqliteDb.prepare('SELECT COUNT(*) as count FROM admin_users').get();
    if (adminCheck.count === 0) {
      sqliteDb.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
    }
  }
}

export { isPostgres, sqlClient };
export default isPostgres ? sqlClient : sqliteDb;
