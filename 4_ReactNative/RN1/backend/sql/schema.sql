CREATE DATABASE IF NOT EXISTS acceso_usuarios CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE acceso_usuarios;

CREATE TABLE IF NOT EXISTS roles (
  id TINYINT UNSIGNED PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE
);
INSERT INTO roles (id, name) VALUES (1, 'admin'), (2, 'user')
ON DUPLICATE KEY UPDATE name = VALUES(name);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id TINYINT UNSIGNED NOT NULL DEFAULT 2,
  email VARCHAR(254) NOT NULL UNIQUE,
  username VARCHAR(40) NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NULL,
  email_verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS oauth_identities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('google','discord','github') NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_provider_identity (provider, provider_user_id),
  UNIQUE KEY uq_user_provider (user_id, provider),
  CONSTRAINT fk_identity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS security_questions (
  id TINYINT UNSIGNED PRIMARY KEY,
  prompt VARCHAR(180) NOT NULL UNIQUE
);
INSERT INTO security_questions (id, prompt) VALUES
  (1, '¿Cuál era el nombre de tu primera mascota?'),
  (2, '¿En qué ciudad naciste?'),
  (3, '¿Cuál era el nombre de tu escuela primaria?'),
  (4, '¿Cuál era tu apodo de infancia?')
ON DUPLICATE KEY UPDATE prompt = VALUES(prompt);

CREATE TABLE IF NOT EXISTS user_security_answers (
  user_id BIGINT UNSIGNED NOT NULL,
  question_id TINYINT UNSIGNED NOT NULL,
  answer_hash VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id, question_id),
  CONSTRAINT fk_answer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES security_questions(id)
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  purpose ENUM('verify_email','activate_local','reset_password') NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  consumed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code_user (user_id, purpose, consumed_at, expires_at),
  CONSTRAINT fk_code_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash CHAR(64) PRIMARY KEY,
  provider ENUM('google','discord','github') NOT NULL,
  return_target ENUM('native','web') NOT NULL DEFAULT 'native',
  code_verifier VARCHAR(128) NOT NULL,
  expires_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_device_flows (
  state_hash CHAR(64) PRIMARY KEY,
  poll_token_hash CHAR(64) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NULL,
  error_message VARCHAR(255) NULL,
  expires_at DATETIME NOT NULL,
  INDEX idx_device_flow_expiry (expires_at),
  CONSTRAINT fk_device_flow_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_tickets (
  ticket_hash CHAR(64) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  CONSTRAINT fk_ticket_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cuenta administradora inicial. Definí su contraseña localmente con CAMBIAR_CLAVE_ADMIN.bat.
INSERT INTO users (role_id, email, username, display_name, password_hash, email_verified_at)
VALUES (1, 'nacho@admin.local', NULL, 'nacho', NULL, NOW())
ON DUPLICATE KEY UPDATE role_id = 1, username = NULL;
