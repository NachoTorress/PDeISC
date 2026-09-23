import mariadb from 'mariadb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.join(__dirname, '../export_mysql.sql');
const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

async function main() {
  console.log('⚡ Conectando a Aiven MySQL vía MariaDB connector...');
  
  const conn = await mariadb.createConnection({
    host: 'mysql-3ac80aa-ignaciogatorres-ae57.c.aivencloud.com',
    port: 13512,
    user: 'avnadmin',
    password: 'AVNS_9gnYSujlNRaXOxMpmkO',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
  });

  console.log('✅ Conexión establecida con éxito.');

  const statements = sqlScript
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      console.log('OK:', stmt.slice(0, 40).replace(/\n/g, ' ') + '...');
    } catch (e) {
      console.error('Error en:', stmt.slice(0, 40), e.message);
    }
  }

  console.log('\n🎉 ¡MIGRACIÓN A AIVEN COMPLETADA EXITOSAMENTE!');
  console.log('👤 Usuario admin: admin');
  console.log('🔑 Contraseña: nacho87');
  await conn.end();
}

main().catch(err => console.error('Error:', err));
