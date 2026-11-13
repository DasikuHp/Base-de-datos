-- =====================================================
-- Diagrama E/R: Vecino - Taller - Monitor - Parcela
-- =====================================================

-- Eliminar base de datos si existe y crearla de nuevo
DROP DATABASE IF EXISTS huertos_comunitarios;
CREATE DATABASE huertos_comunitarios;
USE huertos_comunitarios;

-- =====================================================
-- CREACIÓN DE TABLAS
-- =====================================================

CREATE TABLE Vecino (
    dni_vecino VARCHAR(9) PRIMARY KEY,
    nombre_v_vecino VARCHAR(50) NOT NULL,
    apellido1_vecino VARCHAR(50) NOT NULL,
    apellido2_vecino VARCHAR(50),
    CONSTRAINT chk_dni_vecino CHECK (dni_vecino REGEXP '^[0-9]{8}[A-Z]$')
);

CREATE TABLE Monitor (
    dni_monitor VARCHAR(9) PRIMARY KEY,
    nombre_monitor VARCHAR(50) NOT NULL,
    apellido1_monitor VARCHAR(50) NOT NULL,
    apellido2_monitor VARCHAR(50) NOT NULL,
    CONSTRAINT chk_dni_monitor CHECK (dni_monitor REGEXP '^[0-9]{8}[A-Z]$')
);

CREATE TABLE Taller (
    id_taller INT AUTO_INCREMENT PRIMARY KEY,
    equipo VARCHAR(100) NOT NULL,
    fecha_celebrado DATE NOT NULL,
    dni_monitor VARCHAR(9) NOT NULL,
    CONSTRAINT fk_taller_monitor FOREIGN KEY (dni_monitor)
        REFERENCES Monitor(dni_monitor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


CREATE TABLE Parcela (
    id_parcela INT AUTO_INCREMENT PRIMARY KEY,
    metros DECIMAL(6,2) NOT NULL,
    orientacion ENUM('Norte', 'Sur', 'Este', 'Oeste', 'Noreste', 'Noroeste', 'Sureste', 'Suroeste') NOT NULL,
    dni_vecino VARCHAR(9) NOT NULL,
    CONSTRAINT fk_parcela_vecino FOREIGN KEY (dni_vecino)
        REFERENCES Vecino(dni_vecino)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_metros CHECK (metros > 0 AND metros <= 1000)
);

CREATE TABLE Se_Apunta_A (
    dni_vecino VARCHAR(9) NOT NULL,
    id_taller INT NOT NULL,
    fecha_alta DATE NOT NULL,
    PRIMARY KEY (dni_vecino, id_taller),
    CONSTRAINT fk_apunta_vecino FOREIGN KEY (dni_vecino)
        REFERENCES Vecino(dni_vecino)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_apunta_taller FOREIGN KEY (id_taller)
        REFERENCES Taller(id_taller)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =====================================================
-- INSERCIÓN DE DATOS DE EJEMPLO
-- =====================================================

INSERT INTO Vecino (dni_vecino, nombre_v_vecino, apellido1_vecino, apellido2_vecino) VALUES
('12345678A', 'María', 'García', 'López'),
('23456789B', 'Juan', 'Martínez', 'Sánchez'),
('34567890C', 'Ana', 'Rodríguez', 'Fernández'),
('45678901D', 'Carlos', 'Pérez', 'González'),
('56789012E', 'Laura', 'Jiménez', 'Ruiz');

INSERT INTO Monitor (dni_monitor, nombre_monitor, apellido1_monitor, apellido2_monitor) VALUES
('11111111A', 'Pedro', 'Romero', 'Díaz'),
('22222222B', 'Carmen', 'Moreno', 'Álvarez'),
('33333333C', 'Luis', 'Navarro', 'Torres'),
('44444444D', 'Isabel', 'Ramos', 'Vázquez'),
('55555555E', 'Miguel', 'Castro', 'Serrano');

INSERT INTO Taller (equipo, fecha_celebrado, dni_monitor) VALUES
('Compostaje básico', '2024-03-15', '11111111A'),
('Riego por goteo', '2024-03-20', '22222222B'),
('Cultivo ecológico', '2024-04-10', '11111111A'),
('Control de plagas natural', '2024-04-15', '33333333C'),
('Semilleros y trasplantes', '2024-05-05', '22222222B');

INSERT INTO Parcela (metros, orientacion, dni_vecino) VALUES
(25.50, 'Sur', '12345678A'),
(30.00, 'Este', '23456789B'),
(20.75, 'Sureste', '12345678A'),
(35.00, 'Sur', '34567890C'),
(28.50, 'Oeste', '45678901D');

INSERT INTO Se_Apunta_A (dni_vecino, id_taller, fecha_alta) VALUES
('12345678A', 1, '2024-02-15'),
('12345678A', 2, '2024-02-20'),
('23456789B', 1, '2024-02-18'),
('34567890C', 3, '2024-03-25'),
('45678901D', 4, '2024-03-28');
