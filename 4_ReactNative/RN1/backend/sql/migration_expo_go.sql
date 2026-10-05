USE acceso_usuarios;

CREATE TABLE IF NOT EXISTS oauth_device_flows (
  state_hash CHAR(64) PRIMARY KEY,
  poll_token_hash CHAR(64) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NULL,
  error_message VARCHAR(255) NULL,
  expires_at DATETIME NOT NULL,
  INDEX idx_device_flow_expiry (expires_at),
  CONSTRAINT fk_device_flow_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
