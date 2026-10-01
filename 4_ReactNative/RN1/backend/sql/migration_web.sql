USE acceso_usuarios;
ALTER TABLE oauth_states ADD COLUMN return_target ENUM('native','web') NOT NULL DEFAULT 'native' AFTER provider;
