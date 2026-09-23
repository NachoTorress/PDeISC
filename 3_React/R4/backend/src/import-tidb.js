import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.join(__dirname, '../export_mysql.sql');
const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

async function testTiDB() {
  console.log('⚡ Conectando a TiDB Cloud MySQL...');
  
  const passwordsToTry = ['nacho87', ''];

  for (const pass of passwordsToTry) {
    try {
      console.log(`Intentando contraseña: "${pass}"...`);
      const connection = await mysql.createConnection({
        host: 'gateway01.us-west-2.prod.aws.tidbcloud.com',
        port: 4000,
        user: '22tae9VZHa3tv9t.root',
        password: pass,
        database: 'test',
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
      });

      console.log('✅ ¡CONEXIÓN EXITOSA A TiDB CLOUD!');

      const statements = sqlScript
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const stmt of statements) {
        await connection.query(stmt);
      }

      console.log('🎉 ¡TODAS LAS TABLAS Y DATOS SE MIGRARON EXITOSAMENTE A TiDB CLOUD!');
      console.log('🔑 La contraseña correcta fue:', pass);
      await connection.end();
      return;
    } catch (err) {
      console.error('❌ Falló con esa contraseña:', err.message);
    }
  }
}

testTiDB();
