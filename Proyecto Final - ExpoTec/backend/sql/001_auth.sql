CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  email VARCHAR(254) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  password_hash VARCHAR(255) CHARACTER SET ascii NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
  code VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (code) VALUES ('student'), ('teacher'), ('loans'), ('admin');

CREATE TABLE IF NOT EXISTS user_roles (
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  role_code VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (user_id, role_code),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_code) REFERENCES roles(code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX sessions_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  session_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  used_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  INDEX refresh_session (session_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  attempts INT UNSIGNED NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  INDEX rate_expiration (expires_at)
) ENGINE=InnoDB;
