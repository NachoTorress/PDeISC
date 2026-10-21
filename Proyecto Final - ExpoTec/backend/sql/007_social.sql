CREATE TABLE IF NOT EXISTS social_providers (
  code VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY
) ENGINE=InnoDB;
INSERT IGNORE INTO social_providers (code) VALUES ('google'), ('discord'), ('github');

CREATE TABLE IF NOT EXISTS social_identities (
  provider VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  subject VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (provider, subject),
  UNIQUE KEY social_user_provider (user_id, provider),
  FOREIGN KEY (provider) REFERENCES social_providers(code),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS social_flows (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  provider VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  state_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  proof_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  verifier VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  status VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'started',
  subject VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
  email VARCHAR(254) CHARACTER SET ascii COLLATE ascii_bin NULL,
  expires_at DATETIME(3) NOT NULL,
  FOREIGN KEY (provider) REFERENCES social_providers(code),
  INDEX social_expiration (expires_at)
) ENGINE=InnoDB;
