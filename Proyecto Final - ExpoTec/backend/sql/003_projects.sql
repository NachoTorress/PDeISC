CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  creator_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  requested_booth_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  course VARCHAR(100) NOT NULL,
  image_url VARCHAR(2048) NOT NULL,
  video_url VARCHAR(2048) NOT NULL DEFAULT '',
  is_software BOOLEAN NOT NULL DEFAULT FALSE,
  github_url VARCHAR(2048) NOT NULL DEFAULT '',
  website_url VARCHAR(2048) NOT NULL DEFAULT '',
  status VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'pending',
  feedback VARCHAR(2000) NOT NULL DEFAULT '',
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (requested_booth_id) REFERENCES booths(id),
  INDEX projects_booth_status (requested_booth_id, status),
  INDEX projects_status (status, created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_members (
  project_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX members_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_teachers (
  project_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX teachers_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subjects (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_subjects (
  project_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  subject_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (project_id, subject_id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booth_allocations (
  booth_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  project_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  FOREIGN KEY (booth_id) REFERENCES booths(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_reviews (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  project_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  actor_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  action VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  note VARCHAR(2000) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (actor_id) REFERENCES users(id),
  INDEX reviews_project (project_id, created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
