import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Error: POSTGRES_URL no está definido en el archivo .env');
  process.exit(1);
}

const sql = neon(connectionString);

async function seedCloud() {
  console.log('Conectando a Neon Postgres...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS skill_categories (
      id SERIAL PRIMARY KEY,
      category_key VARCHAR(255) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      icon VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      icon VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
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

  await sql`
    CREATE TABLE IF NOT EXISTS experiences (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) CHECK (type IN ('education', 'work')) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      meta VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS download_logs (
      id SERIAL PRIMARY KEY,
      file_name VARCHAR(255) NOT NULL,
      downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(255)
    );
  `;

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(adminPassword, salt);

  await sql`DELETE FROM admin_users;`;
  await sql`INSERT INTO admin_users (username, password_hash) VALUES ('admin', ${hash});`;
  console.log('✅ Usuario admin sembrado exitosamente.');

  await sql`DELETE FROM skills;`;
  await sql`DELETE FROM skill_categories;`;
  
  const cat1 = await sql`INSERT INTO skill_categories (category_key, title, icon) VALUES ('programacion', 'Programación', 'code') RETURNING id;`;
  const cat1Id = cat1[0].id;
  await sql`INSERT INTO skills (category_id, name, icon) VALUES (${cat1Id}, 'C++', 'cplusplus');`;
  await sql`INSERT INTO skills (category_id, name, icon) VALUES (${cat1Id}, 'Python', 'python');`;
  await sql`INSERT INTO skills (category_id, name, icon) VALUES (${cat1Id}, 'Algoritmos', 'code');`;
  await sql`INSERT INTO skills (category_id, name, icon) VALUES (${cat1Id}, 'Programación competitiva', 'brain');`;

  const cat2 = await sql`INSERT INTO skill_categories (category_key, title, icon) VALUES ('web-datos', 'Web y datos', 'react') RETURNING id;`;
  const cat2Id = cat2[0].id;
  await sql`INSERT INTO skills (category_id, name, icon) VALUES (${cat2Id}, 'TypeScript', 'typescript');`;
  await sql`INSERT INTO skills (category_id, name, icon) VALUES (${cat2Id}, 'React', 'react');`;
  await sql`INSERT INTO skills (category_id, name, icon) VALUES (${cat2Id}, 'Node.js', 'node');`;
  await sql`INSERT INTO skills (category_id, name, icon) VALUES (${cat2Id}, 'SQL', 'sql');`;

  const cat3 = await sql`INSERT INTO skill_categories (category_key, title, icon) VALUES ('herramientas', 'Herramientas e intereses', 'microchip') RETURNING id;`;
  const cat3Id = cat3[0].id;
  await sql`INSERT INTO skills (category_id, name, icon) VALUES (${cat3Id}, 'Git', 'git');`;
  await sql`INSERT INTO skills (category_id, name, icon) VALUES (${cat3Id}, 'Docker', 'docker');`;
  await sql`INSERT INTO skills (category_id, name, icon) VALUES (${cat3Id}, 'Linux', 'linux');`;
  await sql`INSERT INTO skills (category_id, name, icon) VALUES (${cat3Id}, 'IA y hardware', 'microchip');`;

  await sql`DELETE FROM projects;`;
  await sql`
    INSERT INTO projects (title, description, accent, github_url, tags) VALUES 
    ('Snake en GitHub', 'Proyecto de juego Snake publicado en GitHub, usado como práctica de lógica, estado de juego y control de interacción.', 'Algoritmos', 'https://github.com/tizianomegnini/JS3Juegos/tree/main/Snake_1.2', 'Programación,Juego,GitHub'),
    ('Proyectos con Arduino/ESP32', 'Trabajos orientados a hardware, microcontroladores y conexión entre componentes físicos y software.', 'Electrónica', NULL, 'Arduino,ESP32,Hardware'),
    ('IA con Jetson, Ollama y Qwen', 'Proyecto de inteligencia artificial que combina Jetson, Ollama, Qwen y herramientas para experimentar con modelos y automatización local.', 'Inteligencia artificial', NULL, 'IA,Jetson,Ollama,Qwen');
  `;

  await sql`DELETE FROM experiences;`;
  await sql`
    INSERT INTO experiences (type, title, description, meta) VALUES
    ('education', 'Tecnicatura en Informática Profesional y Personal', 'Estudiante de 6.º año.', 'Promedio: 9,15');
  `;

  await sql`DELETE FROM achievements;`;
  await sql`
    INSERT INTO achievements (title, description) VALUES
    ('Olimpiada Informática Argentina', 'Participación en competencia de informática.'),
    ('Olimpiadas de Matemática', 'Participación en olimpíadas de matemática.'),
    ('CALICO', 'Participación en competencia CALICO.');
  `;

  console.log('✅ ¡Base de datos de Neon sembrada con éxito!');
}

seedCloud().catch(err => {
  console.error('Error al poblar Neon Postgres:', err);
});
