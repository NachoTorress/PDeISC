import mysql from 'mysql2/promise';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const connectionString = process.env.MYSQL_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

const isPg = Boolean(
  connectionString &&
    (connectionString.startsWith('postgres://') ||
      connectionString.startsWith('postgresql://') ||
      Boolean(process.env.POSTGRES_URL))
);

const isMysql = Boolean(
  (process.env.MYSQL_URL || connectionString) &&
    !isPg &&
    (connectionString ? connectionString.startsWith('mysql://') || connectionString.startsWith('mysql2://') : false)
);

const isRemote = isPg || isMysql;
const useDirectMysqlConnection = process.env.VERCEL === '1';

let pool = null;
let pgSql = null;
let sqliteDb = null;

if (isPg) {
  console.log('✅ Inicializando conexión a Neon Postgres (vía HTTP Serverless).');
  pgSql = neon(connectionString);
} else if (isMysql) {
  console.log('✅ Inicializando conexión a TiDB / MySQL (mysql2 pool).');
  pool = mysql.createPool({
    uri: connectionString,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
}

export async function initDatabase() {
  if (isRemote) {
    console.log(`✅ Base de datos remota activa (${isPg ? 'Neon Postgres' : 'TiDB MySQL'}).`);
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

const safeSqlClient = {
  async query(sqlStr, params = []) {
    if (isPg) {
      let paramIdx = 1;
      const pgQuery = sqlStr.replace(/\?/g, () => `$${paramIdx++}`);
      const rows = await pgSql(pgQuery, params);
      return [rows];
    } else if (isMysql) {
      if (useDirectMysqlConnection) {
        const conn = await mysql.createConnection({
          uri: connectionString,
          ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
          connectTimeout: 10000,
          enableKeepAlive: false
        });
        try {
          return await conn.query(sqlStr, params);
        } finally {
          await conn.end().catch(() => {});
        }
      }

      try {
        return await pool.query(sqlStr, params);
      } catch (err) {
        if (
          err.code === 'ERR_OUT_OF_RANGE' ||
          (err.message && err.message.includes('out of range'))
        ) {
          console.warn('⚠️ Conexión congelada detectada en Vercel. Reintentando con conexión directa...');
          const conn = await mysql.createConnection({
            uri: connectionString,
            ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
          });
          try {
            const res = await conn.query(sqlStr, params);
            await conn.end().catch(() => {});
            return res;
          } catch (retryErr) {
            await conn.end().catch(() => {});
            throw retryErr;
          }
        }
        throw err;
      }
    } else {
      throw new Error('No hay base de datos remota configurada.');
    }
  }
};

export { isRemote as isMysql, safeSqlClient as sqlClient };
export default isRemote ? safeSqlClient : sqliteDb;
