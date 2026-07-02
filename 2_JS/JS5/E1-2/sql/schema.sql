-- ============================================================
-- schema.sql
-- Crea la base de datos alumnosDB, la tabla "alumnos" y carga
-- 5 registros de ejemplo. Ejecutar una sola vez con:
--   mysql -u root -p < sql/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS alumnosDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE alumnosDB;

CREATE TABLE IF NOT EXISTS alumnos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100)  NOT NULL,
  apellido       VARCHAR(100)  NOT NULL,
  edad           INT           NOT NULL,
  fecha_creacion DATETIME      DEFAULT CURRENT_TIMESTAMP
);

-- 5 alumnos de ejemplo (solo se insertan si la tabla está vacía)
INSERT INTO alumnos (nombre, apellido, edad)
SELECT * FROM (
  SELECT 'Juan'    AS nombre, 'Pérez'      AS apellido, 21 AS edad UNION ALL
  SELECT 'María',             'Gómez',        23 UNION ALL
  SELECT 'Lucas',             'Fernández',    19 UNION ALL
  SELECT 'Ana',               'Rodríguez',    25 UNION ALL
  SELECT 'Sofía',             'López',        20
) AS ejemplo
WHERE NOT EXISTS (SELECT 1 FROM alumnos);
