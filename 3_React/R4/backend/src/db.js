/**
 * Database module for SQLite backend.
 * Responsible for connection initialization, table creation, seed data populating,
 * and safe query executions.
 */
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'portfolio.db');

const db = new Database(dbPath);

export function initDatabase() {
  db.exec(`
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

  const adminCheck = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  if (adminCheck.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  }

  const categoryCheck = db.prepare('SELECT COUNT(*) as count FROM skill_categories').get();
  if (categoryCheck.count === 0) {
    const insertCat = db.prepare('INSERT INTO skill_categories (category_key, title, icon) VALUES (?, ?, ?)');
    const insertSkill = db.prepare('INSERT INTO skills (category_id, name, icon) VALUES (?, ?, ?)');

    const cat1 = insertCat.run('lenguajes', 'Lenguajes y runtime', 'code').lastInsertRowid;
    insertSkill.run(cat1, 'C++', 'cplusplus');
    insertSkill.run(cat1, 'TypeScript', 'typescript');
    insertSkill.run(cat1, 'Node.js', 'node');
    insertSkill.run(cat1, 'Python', 'python');

    const cat2 = insertCat.run('infraestructura', 'Bases de datos e infra', 'sql').lastInsertRowid;
    insertSkill.run(cat2, 'SQL / SQLite', 'sql');
    insertSkill.run(cat2, 'Docker', 'docker');
    insertSkill.run(cat2, 'Git', 'git');
    insertSkill.run(cat2, 'Linux', 'linux');

    const cat3 = insertCat.run('intereses', 'Intereses principales', 'brain').lastInsertRowid;
    insertSkill.run(cat3, 'Algoritmos', 'code');
    insertSkill.run(cat3, 'Inteligencia Artificial', 'brain');
    insertSkill.run(cat3, 'Hardware', 'microchip');
    insertSkill.run(cat3, 'React UI', 'react');
  }

  const projectCheck = db.prepare('SELECT COUNT(*) as count FROM projects').get();
  if (projectCheck.count === 0) {
    const insertProject = db.prepare(
      'INSERT INTO projects (title, description, accent, github_url, tags) VALUES (?, ?, ?, ?, ?)'
    );
    insertProject.run(
      'Resolución de Sudoku y N-Reinas',
      'Implementación en C++ de algoritmos de backtracking, optimización y análisis de complejidad sintáctica.',
      'C++ / Algoritmos',
      null,
      'C++,Algoritmos,Backtracking'
    );
    insertProject.run(
      'Compiladores y Parser de Gramáticas',
      'Procesamiento de lenguajes formales, análisis léxico, sintáctico y optimización de código intermedio.',
      'Teoría de Computación',
      null,
      'C++,Parser,Gramáticas'
    );
    insertProject.run(
      'Monitoreo de Hardware y Sistemas',
      'Herramientas de inspección de rendimiento, consumo de recursos y diagnóstico sobre entornos Linux.',
      'Sistemas Operativos',
      null,
      'Linux,Hardware,Python'
    );
  }

  const expCheck = db.prepare('SELECT COUNT(*) as count FROM experiences').get();
  if (expCheck.count === 0) {
    const insertExp = db.prepare('INSERT INTO experiences (type, title, description, meta) VALUES (?, ?, ?, ?)');
    insertExp.run('education', 'Colegio Nacional de Buenos Aires', 'Formación secundaria', '(2018 - 2023)');
    insertExp.run('education', 'Universidad de Buenos Aires', 'Ciencias de la Computación', '(2024 - Presente)');
  }

  const achCheck = db.prepare('SELECT COUNT(*) as count FROM achievements').get();
  if (achCheck.count === 0) {
    const insertAch = db.prepare('INSERT INTO achievements (title, description) VALUES (?, ?)');
    insertAch.run('Olimpíada Argentina de Informática (OAI)', 'Participación destacada en resolución de problemas algorítmicos.');
    insertAch.run('Olimpíada de Filosofía', 'Participación en instancias de debate y escritura ensayística.');
  }
}

export default db;
