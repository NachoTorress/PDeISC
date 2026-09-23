import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const connectionString = process.env.MYSQL_URL || process.env.DATABASE_URL;
const isMysql = Boolean(connectionString);

let pool = null;
let sqliteDb = null;

if (isMysql) {
  pool = mysql.createPool({
    uri: connectionString,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 5
  });
}

export async function initDatabase() {
  if (isMysql) {
    console.log('✅ Base de datos MySQL / TiDB conectada.');
  } else {
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

    const adminPassword = process.env.ADMIN_PASSWORD || 'nacho87';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPassword, salt);
    const adminCheck = sqliteDb.prepare('SELECT COUNT(*) as count FROM admin_users').get();
    if (adminCheck.count === 0) {
      sqliteDb.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
    }
  }
}

export { isMysql, pool as sqlClient };
export default isMysql ? pool : sqliteDb;
