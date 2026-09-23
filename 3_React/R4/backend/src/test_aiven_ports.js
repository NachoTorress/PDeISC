import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.join(__dirname, '../export_mysql.sql');
const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

async function testPorts() {
  const ports = [13512, 3306];
  for (const port of ports) {
    console.log(`\nTesting port ${port}...`);
    try {
      const conn = await mysql.createConnection({
        host: 'mysql-3ac80aa-ignaciogatorres-ae57.c.aivencloud.com',
        port: port,
        user: 'avnadmin',
        password: 'AVNS_9gnYSujlNRaXOxMpmkO',
        database: 'defaultdb',
        ssl: { rejectUnauthorized: false }
      });
      console.log(`✅ EXITO EN PUERTO ${port}! Conectado a Aiven.`);
      
      const statements = sqlScript
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const stmt of statements) {
        await conn.query(stmt);
      }
      console.log('🎉 ¡TODAS LAS TABLAS Y DATOS SE MIGRARON EXITOSAMENTE A AIVEN MYSQL!');
      await conn.end();
      return;
    } catch (err) {
      console.error(`❌ Falló puerto ${port}:`, err.message);
    }
  }
}

testPorts();
