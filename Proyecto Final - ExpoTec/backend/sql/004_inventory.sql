CREATE TABLE IF NOT EXISTS resources (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(250) NOT NULL DEFAULT '',
  total INT UNSIGNED NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  archived_at DATETIME(3) NULL,
  INDEX resources_active (archived_at, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_resource_requests (
  project_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  resource_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  PRIMARY KEY (project_id, resource_id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (resource_id) REFERENCES resources(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resource_allocations (
  project_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  resource_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  PRIMARY KEY (project_id, resource_id),
  FOREIGN KEY (project_id, resource_id) REFERENCES project_resource_requests(project_id, resource_id),
  INDEX allocations_resource (resource_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_events (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  resource_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  actor_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  action VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  previous_total INT UNSIGNED NULL,
  total INT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (resource_id) REFERENCES resources(id),
  FOREIGN KEY (actor_id) REFERENCES users(id),
  INDEX inventory_history (resource_id, created_at, id)
) ENGINE=InnoDB;
