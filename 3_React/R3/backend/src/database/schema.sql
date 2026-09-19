CREATE DATABASE IF NOT EXISTS user_system_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE user_system_db;

CREATE TABLE IF NOT EXISTS roles (
  role_id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE,
  description VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS document_types (
  document_type_id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  label VARCHAR(60) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_accounts (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id TINYINT UNSIGNED NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_accounts_roles
    FOREIGN KEY (role_id)
    REFERENCES roles(role_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INT UNSIGNED PRIMARY KEY,
  document_type_id TINYINT UNSIGNED NOT NULL,
  document_number VARCHAR(12) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  birth_date DATE NOT NULL,
  phone VARCHAR(16) NULL,
  CONSTRAINT uq_user_profiles_document UNIQUE (document_type_id, document_number),
  CONSTRAINT fk_user_profiles_accounts
    FOREIGN KEY (user_id)
    REFERENCES user_accounts(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_profiles_document_types
    FOREIGN KEY (document_type_id)
    REFERENCES document_types(document_type_id),
  CONSTRAINT chk_user_profiles_document_number CHECK (document_number REGEXP '^[0-9]{6,12}$')
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_events (
  audit_event_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id INT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  entity_name VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_events_actor
    FOREIGN KEY (actor_user_id)
    REFERENCES user_accounts(user_id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO roles (name, description)
VALUES
  ('admin', 'Puede administrar usuarios del sistema'),
  ('user', 'Puede administrar sus propios datos')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO document_types (code, label)
VALUES
  ('DNI', 'Documento Nacional de Identidad'),
  ('PAS', 'Pasaporte'),
  ('LC', 'Libreta Civica')
ON DUPLICATE KEY UPDATE label = VALUES(label);

