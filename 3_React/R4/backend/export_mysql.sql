-- SCRIPT DE MIGRACIÓN DE NEON POSTGRES A MYSQL / MARIADB

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

-- Datos para admin_users
INSERT INTO admin_users (id, username, password_hash, created_at) VALUES (2, 'admin', '$2a$10$GRWL0jqI3PDFEv.O6aDYE.nonkB1S19Uei2U0NoYGI1yR78bqC.yu', '2026-09-23 23:36:18');

-- Datos para skill_categories
INSERT INTO skill_categories (id, category_key, title, icon, created_at) VALUES (4, 'programacion', 'Programación', 'code', '2026-09-23 23:36:18');
INSERT INTO skill_categories (id, category_key, title, icon, created_at) VALUES (5, 'web-datos', 'Web y datos', 'react', '2026-09-23 23:36:18');
INSERT INTO skill_categories (id, category_key, title, icon, created_at) VALUES (6, 'herramientas', 'Herramientas e intereses', 'microchip', '2026-09-23 23:36:19');

-- Datos para skills
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (13, 4, 'C++', 'cplusplus', '2026-09-23 23:36:18');
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (14, 4, 'Python', 'python', '2026-09-23 23:36:18');
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (15, 4, 'Algoritmos', 'code', '2026-09-23 23:36:18');
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (16, 4, 'Programación competitiva', 'brain', '2026-09-23 23:36:18');
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (17, 5, 'TypeScript', 'typescript', '2026-09-23 23:36:19');
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (18, 5, 'React', 'react', '2026-09-23 23:36:19');
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (19, 5, 'Node.js', 'node', '2026-09-23 23:36:19');
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (20, 5, 'SQL', 'sql', '2026-09-23 23:36:19');
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (21, 6, 'Git', 'git', '2026-09-23 23:36:19');
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (22, 6, 'Docker', 'docker', '2026-09-23 23:36:19');
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (23, 6, 'Linux', 'linux', '2026-09-23 23:36:19');
INSERT INTO skills (id, category_id, name, icon, created_at) VALUES (24, 6, 'IA y hardware', 'microchip', '2026-09-23 23:36:19');

-- Datos para projects
INSERT INTO projects (id, title, description, accent, github_url, tags, created_at) VALUES (5, 'Snake en GitHub', 'Proyecto de juego Snake publicado en GitHub, usado como práctica de lógica, estado de juego y control de interacción.', 'Algoritmos', 'https://github.com/tizianomegnini/JS3Juegos/tree/main/Snake_1.2', 'Programación,Juego,GitHub', '2026-09-23 23:36:19');
INSERT INTO projects (id, title, description, accent, github_url, tags, created_at) VALUES (6, 'Proyectos con Arduino/ESP32', 'Trabajos orientados a hardware, microcontroladores y conexión entre componentes físicos y software.', 'Electrónica', NULL, 'Arduino,ESP32,Hardware', '2026-09-23 23:36:19');
INSERT INTO projects (id, title, description, accent, github_url, tags, created_at) VALUES (7, 'IA con Jetson, Ollama y Qwen', 'Proyecto de inteligencia artificial que combina Jetson, Ollama, Qwen y herramientas para experimentar con modelos y automatización local.', 'Inteligencia artificial', NULL, 'IA,Jetson,Ollama,Qwen', '2026-09-23 23:36:19');

-- Datos para experiences
INSERT INTO experiences (id, type, title, description, meta, created_at) VALUES (3, 'education', 'Tecnicatura en Informática Profesional y Personal', 'Estudiante de 6.º año.', 'Promedio: 9,15', '2026-09-23 23:36:19');

-- Datos para achievements
INSERT INTO achievements (id, title, description, created_at) VALUES (4, 'Olimpiada Informática Argentina', 'Participación en competencia de informática.', '2026-09-23 23:36:19');
INSERT INTO achievements (id, title, description, created_at) VALUES (5, 'Olimpiadas de Matemática', 'Participación en olimpíadas de matemática.', '2026-09-23 23:36:19');
INSERT INTO achievements (id, title, description, created_at) VALUES (6, 'CALICO', 'Participación en competencia CALICO.', '2026-09-23 23:36:19');

SET FOREIGN_KEY_CHECKS = 1;
