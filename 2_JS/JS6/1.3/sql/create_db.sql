-- =========================================================
--  Script de creacion de la Base de Datos "Score"
--  Incluye las 3 tablas del sistema: score, palabras y usuarios
--  Ejecutar en MySQL local antes de levantar el servidor
--  (por ejemplo, abriendo este archivo en MySQL Workbench y
--  ejecutandolo completo con el boton de rayo ⚡)
-- =========================================================

CREATE DATABASE IF NOT EXISTS Score
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE Score;

-- ---------------------------------------------------------
-- Tabla: score
-- Guarda los puntajes de las partidas jugadas.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS score (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nombre   VARCHAR(50)  NOT NULL,
    tiempo   INT          NOT NULL COMMENT 'Tiempo que tardo en resolver, en segundos',
    puntos   INT          NOT NULL COMMENT 'Puntaje obtenido en la partida',
    fecha    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- Tabla: palabras
-- Banco de palabras del ahorcado. Reemplaza el listado que
-- antes estaba hardcodeado en el codigo.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS palabras (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    palabra         VARCHAR(50)  NOT NULL UNIQUE,
    categoria       VARCHAR(50)  NOT NULL,
    pista           VARCHAR(150) NOT NULL,
    fecha_creacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- Tabla: usuarios
-- Solo se usa para el/los usuarios administradores que
-- pueden entrar al panel de administracion.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    usuario         VARCHAR(50)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt, nunca texto plano',
    fecha_creacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- Tabla: log_descargas
-- Registra cada archivo (PDF) que descarga cualquier usuario:
-- el comprobante de una partida o la tabla de posiciones
-- historica completa.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS log_descargas (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    tipo     VARCHAR(30)  NOT NULL COMMENT 'score_pdf o tabla_posiciones_pdf',
    detalle  VARCHAR(150) NULL COMMENT 'Info adicional, ej: nombre del jugador o cantidad de filas',
    fecha    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- Tabla: log_logins_admin
-- Registra cada inicio de sesion exitoso al panel de
-- administracion (quien entro y cuando).
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS log_logins_admin (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    usuario  VARCHAR(50) NOT NULL,
    fecha    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- Seed: usuario administrador por defecto
-- Usuario: admin
-- Contraseña: admin123   (¡cambiarla apenas puedan!)
-- El hash de abajo corresponde a "admin123" con bcrypt.
-- Para generar un hash nuevo (otra contraseña), correr:
--   node -e "console.log(require('bcryptjs').hashSync('TU_PASSWORD', 10))"
-- y reemplazar el valor de password_hash con un UPDATE.
-- ---------------------------------------------------------
INSERT IGNORE INTO usuarios (usuario, password_hash)
VALUES ('admin', '$2b$10$UA13VbO2GDy.XJVZYpmN5.yB6lD6/m0X5WN9823dIdGTBd5Q9Z7sC');

-- ---------------------------------------------------------
-- Seed: banco de palabras inicial (mismo listado que tenia
-- el codigo antes, ahora movido a la base de datos)
-- ---------------------------------------------------------
INSERT IGNORE INTO palabras (palabra, categoria, pista) VALUES
    ('ELEFANTE', 'Animales', 'Mamifero enorme con trompa'),
    ('JIRAFA', 'Animales', 'El animal terrestre mas alto'),
    ('TIBURON', 'Animales', 'Depredador marino con muchos dientes'),
    ('CANGURO', 'Animales', 'Animal australiano que salta'),
    ('PINGUINO', 'Animales', 'Ave que no vuela y vive en el frio'),
    ('COMPUTADORA', 'Objetos', 'La usas para programar'),
    ('TELEFONO', 'Objetos', 'Sirve para llamar y enviar mensajes'),
    ('BICICLETA', 'Objetos', 'Vehiculo de dos ruedas a pedal'),
    ('PARAGUAS', 'Objetos', 'Te protege de la lluvia'),
    ('MOCHILA', 'Objetos', 'Se lleva en la espalda con utiles'),
    ('MONTAÑA', 'Naturaleza', 'Elevacion natural del terreno'),
    ('VOLCAN', 'Naturaleza', 'Puede hacer erupcion con lava'),
    ('CASCADA', 'Naturaleza', 'Caida de agua desde una altura'),
    ('DESIERTO', 'Naturaleza', 'Zona muy seca y arenosa'),
    ('BOSQUE', 'Naturaleza', 'Lugar con muchos arboles'),
    ('MILANESA', 'Comida', 'Carne rebozada tipica argentina'),
    ('EMPANADA', 'Comida', 'Masa rellena, tipica en Argentina'),
    ('ALFAJOR', 'Comida', 'Dulce con dulce de leche entre galletas'),
    ('SANDIA', 'Comida', 'Fruta grande, verde por fuera y roja por dentro'),
    ('BOMBERO', 'Profesiones', 'Apaga incendios'),
    ('ASTRONAUTA', 'Profesiones', 'Viaja al espacio'),
    ('PROGRAMADOR', 'Profesiones', 'Escribe codigo para crear software'),
    ('ARQUITECTO', 'Profesiones', 'Diseña edificios y planos');
