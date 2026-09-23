import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = "postgresql://neondb_owner:npg_HNxzIGEyrs87@ep-late-unit-ac3slnqw-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function generateMySQLDump() {
  console.log('📦 Conectando a Neon Postgres y exportando para MySQL...');
  
  let output = `-- SCRIPT DE MIGRACIÓN DE NEON POSTGRES A MYSQL / MARIADB\n\n`;
  output += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  output += `
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS skill_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_key VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  icon VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES skill_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  accent VARCHAR(255) NOT NULL,
  github_url VARCHAR(255),
  tags TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS experiences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('education', 'work') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  meta VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS download_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

  const tables = [
    { name: 'admin_users', fetch: () => sql`SELECT * FROM admin_users ORDER BY id ASC` },
    { name: 'skill_categories', fetch: () => sql`SELECT * FROM skill_categories ORDER BY id ASC` },
    { name: 'skills', fetch: () => sql`SELECT * FROM skills ORDER BY id ASC` },
    { name: 'projects', fetch: () => sql`SELECT * FROM projects ORDER BY id ASC` },
    { name: 'experiences', fetch: () => sql`SELECT * FROM experiences ORDER BY id ASC` },
    { name: 'achievements', fetch: () => sql`SELECT * FROM achievements ORDER BY id ASC` },
    { name: 'download_logs', fetch: () => sql`SELECT * FROM download_logs ORDER BY id ASC` },
  ];

  for (const table of tables) {
    const rows = await table.fetch();
    if (rows.length > 0) {
      output += `-- Datos para ${table.name}\n`;
      for (const row of rows) {
        const keys = Object.keys(row);
        const cols = keys.join(', ');
        const vals = keys.map(k => escapeValue(row[k])).join(', ');
        output += `INSERT INTO ${table.name} (${cols}) VALUES (${vals});\n`;
      }
      output += `\n`;
    }
  }

  output += `SET FOREIGN_KEY_CHECKS = 1;\n`;

  const outputPath = path.join(__dirname, '../export_mysql.sql');
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`✅ ¡Exportación completada con éxito! Archivo creado en: ${outputPath}`);
}

generateMySQLDump().catch(err => console.error('Error al exportar:', err));
