INSERT IGNORE INTO roles (code) VALUES ('guest');

CREATE TABLE IF NOT EXISTS gallery_photos (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  author_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  image_url VARCHAR(2048) NOT NULL,
  caption VARCHAR(400) NOT NULL,
  status VARCHAR(16) CHARACTER SET ascii NOT NULL DEFAULT 'pending',
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (author_id) REFERENCES users(id),
  INDEX gallery_public (status, created_at, id),
  INDEX gallery_author (author_id, created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery_reviews (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  photo_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  actor_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  photo_version INT UNSIGNED NOT NULL,
  decision VARCHAR(16) CHARACTER SET ascii NOT NULL,
  note VARCHAR(1000) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (photo_id) REFERENCES gallery_photos(id),
  FOREIGN KEY (actor_id) REFERENCES users(id),
  UNIQUE KEY gallery_review_version (photo_id, photo_version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
