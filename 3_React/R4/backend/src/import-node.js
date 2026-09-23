import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.join(__dirname, '../export_mysql.sql');
const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

async function runNodeImport() {
  console.log('⚡ Conectando a Aiven MySQL vía Node.js (mysql2)...');
  
  const connection = await mysql.createConnection({
    host: 'mysql-3ac80aa-ignaciogatorres-ae57.c.aivencloud.com',
    port: 13512,
    user: 'avnadmin',
    password: 'AVNS_9gnYSujlNRaXOxMpmkO',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
  });

  console.log('✅ Conectado exitosamente a Aiven MySQL.');

  const statements = sqlScript
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await connection.query(stmt);
      console.log('Ejecutado:', stmt.slice(0, 45).replace(/\n/g, ' ') + '...');
    } catch (err) {
      console.error('Error en statement:', stmt.slice(0, 45), err.message);
    }
  }

  console.log('\n🎉 ¡MIGRACIÓN COMPLETA! Usuario admin con contraseña "nacho87" creado.');
  await connection.end();
}

runNodeImport().catch(err => {
  console.error('❌ Error al migrar:', err);
  process.exit(1);
});
