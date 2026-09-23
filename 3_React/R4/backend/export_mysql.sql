-- SCRIPT DE MIGRACIÓN DE NEON POSTGRES A MYSQL / MARIADB / TIDB

CREATE DATABASE IF NOT EXISTS portfolio_db;
USE portfolio_db;

SET FOREIGN_KEY_CHECKS = 0;

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

-- Datos para admin_users (Contraseña: nacho87)
INSERT INTO admin_users (id, username, password_hash, created_at) 
VALUES (1, 'admin', '$2a$10$vy9wYf6ksF/JM0r4ni3Wwuk/QpID7Ix8Bfw1JAHKKYyBeT/bDMPv.', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

-- Datos para skill_categories
INSERT INTO skill_categories (id, category_key, title, icon, created_at) VALUES (1, 'programacion', 'Programación', 'code', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE title=VALUES(title);
INSERT INTO skill_categories (id, category_key, title, icon, created_at) VALUES (2, 'web-datos', 'Web y datos', 'react', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE title=VALUES(title);
INSERT INTO skill_categories (id, category_key, title, icon, created_at) VALUES (3, 'herramientas', 'Herramientas e intereses', 'microchip', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Datos para skills
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (1, 1, 'C++', 'cplusplus', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (2, 1, 'Python', 'python', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (3, 1, 'Algoritmos', 'code', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (4, 1, 'Programación competitiva', 'brain', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (5, 2, 'TypeScript', 'typescript', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (6, 2, 'React', 'react', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (7, 2, 'Node.js', 'node', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (8, 2, 'SQL', 'sql', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (9, 3, 'Git', 'git', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (10, 3, 'Docker', 'docker', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (11, 3, 'Linux', 'linux', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (12, 3, 'IA y hardware', 'microchip', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Datos para projects
INSERT INTO projects (id, title, description, accent, github_url, tags, created_at) VALUES (1, 'Snake en GitHub', 'Proyecto de juego Snake publicado en GitHub, usado como práctica de lógica, estado de juego y control de interacción.', 'Algoritmos', 'https://github.com/tizianomegnini/JS3Juegos/tree/main/Snake_1.2', 'Programación,Juego,GitHub', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE title=VALUES(title);
INSERT INTO projects (id, title, description, accent, github_url, tags, created_at) VALUES (2, 'Proyectos con Arduino/ESP32', 'Trabajos orientados a hardware, microcontroladores y conexión entre componentes físicos y software.', 'Electrónica', NULL, 'Arduino,ESP32,Hardware', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE title=VALUES(title);
INSERT INTO projects (id, title, description, accent, github_url, tags, created_at) VALUES (3, 'IA con Jetson, Ollama y Qwen', 'Proyecto de inteligencia artificial que combina Jetson, Ollama, Qwen y herramientas para experimentar con modelos y automatización local.', 'Inteligencia artificial', NULL, 'IA,Jetson,Ollama,Qwen', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Datos para experiences
INSERT INTO experiences (id, type, title, description, meta, created_at) VALUES (1, 'education', 'Tecnicatura en Informática Profesional y Personal', 'Estudiante de 6.º año.', 'Promedio: 9,15', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Datos para achievements
INSERT INTO achievements (id, title, description, created_at) VALUES (1, 'Olimpiada Informática Argentina', 'Participación en competencia de informática.', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE title=VALUES(title);
INSERT INTO achievements (id, title, description, created_at) VALUES (2, 'Olimpiadas de Matemática', 'Participación en olimpíadas de matemática.', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE title=VALUES(title);
INSERT INTO achievements (id, title, description, created_at) VALUES (3, 'CALICO', 'Participación en competencia CALICO.', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE title=VALUES(title);

SET FOREIGN_KEY_CHECKS = 1;
