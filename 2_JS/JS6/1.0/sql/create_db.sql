-- =========================================================
--  Script de creacion de la Base de Datos "Score"
--  Ejecutar en MySQL local antes de levantar el servidor:
--      mysql -u root -p < sql/create_db.sql
-- =========================================================

CREATE DATABASE IF NOT EXISTS Score
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE Score;

CREATE TABLE IF NOT EXISTS score (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nombre   VARCHAR(50)  NOT NULL,
    tiempo   INT          NOT NULL COMMENT 'Tiempo que tardo en resolver, en segundos',
    puntos   INT          NOT NULL COMMENT 'Puntaje obtenido en la partida',
    fecha    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
