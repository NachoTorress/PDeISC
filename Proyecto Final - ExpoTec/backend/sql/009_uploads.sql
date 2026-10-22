CREATE TABLE IF NOT EXISTS image_uploads (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  owner_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  purpose VARCHAR(16) CHARACTER SET ascii NOT NULL,
  raw_path VARCHAR(256) CHARACTER SET ascii NOT NULL,
  image_path VARCHAR(256) CHARACTER SET ascii NOT NULL,
  image_url VARCHAR(512) NOT NULL,
  status VARCHAR(16) CHARACTER SET ascii NOT NULL DEFAULT 'started',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (owner_id) REFERENCES users(id),
  UNIQUE KEY upload_image_url (image_url),
  INDEX uploads_owner (owner_id, created_at),
  INDEX uploads_cleanup (updated_at, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
