CREATE TABLE IF NOT EXISTS loans (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  project_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  resource_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  day TINYINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  returned_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  recipient_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  delivered_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  note VARCHAR(1000) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (resource_id) REFERENCES resources(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id),
  FOREIGN KEY (delivered_by) REFERENCES users(id),
  UNIQUE KEY loan_daily_delivery (project_id, resource_id, day),
  INDEX loans_resource (resource_id),
  INDEX loans_day (day, created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_returns (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  loan_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  damaged_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  note VARCHAR(1000) NOT NULL DEFAULT '',
  received_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (loan_id) REFERENCES loans(id),
  FOREIGN KEY (received_by) REFERENCES users(id),
  INDEX loan_return_history (loan_id, created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resource_conditions (
  resource_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  unavailable INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (resource_id) REFERENCES resources(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_condition_events (
  event_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  previous_unavailable INT UNSIGNED NULL,
  unavailable INT UNSIGNED NOT NULL DEFAULT 0,
  note VARCHAR(1000) NOT NULL DEFAULT '',
  loan_return_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  FOREIGN KEY (event_id) REFERENCES inventory_events(id),
  FOREIGN KEY (loan_return_id) REFERENCES loan_returns(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
