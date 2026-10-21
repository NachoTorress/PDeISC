ALTER TABLE social_flows ADD COLUMN binding_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER proof_hash;
