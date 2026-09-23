import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = "postgresql://neondb_owner:npg_HNxzIGEyrs87@ep-late-unit-ac3slnqw-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

async function setAdminPassword() {
  console.log('⚡ Conectando a Neon Postgres para actualizar contraseña...');
  
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('nacho87', salt);

  await sql`
    INSERT INTO admin_users (username, password_hash) 
    VALUES ('admin', ${hash})
    ON CONFLICT (username) 
    DO UPDATE SET password_hash = ${hash};
  `;

  console.log('✅ ¡Contraseña de admin actualizada exitosamente a "nacho87" en Neon Postgres!');
}

setAdminPassword().catch(err => console.error('Error:', err));
