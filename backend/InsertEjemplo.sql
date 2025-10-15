-- ============================================
-- DATOS INICIALES
-- ============================================

-- Empresa por defecto
-- Cambiar tipos a valores comunes y permitir NULL (ejecuta en tu BD)
START TRANSACTION;

ALTER TABLE Empresa MODIFY direccion_empresa VARCHAR(255) NULL;
ALTER TABLE Empresa MODIFY telefono_empresa VARCHAR(100) NULL;
ALTER TABLE Empresa MODIFY correo_empresa VARCHAR(255) NULL;

COMMIT;

-- Roles base
INSERT INTO Rol (nombre_rol, descripcion) VALUES
('Administrador', 'Acceso completo al sistema'),
('Contador', 'Acceso a cuentas y empresas asignadas para su trabajo contable'),
('Digitador', 'Acceso a cuentas y empresas asignadas para ingreso de datos'),
('Revisor #1', 'Realiza la primera revisión'),
('Revisor #2', 'Realiza la segunda revisión'),
('Revisor #3', 'Realiza la tercera revisión'),
('Encargada de Impresión', 'Imprime los cuadernillos revisados'),
('Secretaria Recepcionista', 'Recibe la papelería y envía los cuadernillos impresos');

-- Usuario administrador inicial
INSERT INTO Usuario (nombre_completo, correo, contrasena, tipo_usuario, id_empleado, activo)
VALUES ('Admin CVR', 'admin@cvrasesoria.com', 'admin123', 'administrador', NULL, 1);

-- Hashear contraseña admin
SET SQL_SAFE_UPDATES = 0;

UPDATE Usuario
SET contrasena = '$2b$10$tmYxy8MitcaXLorfJLhkKey2QpbHtAuQUFimQi3bPzDJ1baXtir3S'
WHERE nombre_completo = 'Admin CVR';
SET SQL_SAFE_UPDATES = 1;

-- Etapas de proceso base
INSERT INTO EtapaCatalogo (nombre_etapa, descripcion, es_revision) VALUES
('Ingreso de papelería', 'Documentos recibidos de la empresa/cliente', FALSE),
('Operación Ventas/Compras', 'Digitación de datos del proceso', FALSE),
('Revisión Impuestos', 'Se revisa el impuesto de los procesos asignados', FALSE),
('Operación Cheques/Depósitos', 'Ingreso de Documentos contables', FALSE),
('Conciliaciones bancarias', 'Cuadrar los estados de cuenta', FALSE),
('Trabajo Contable', 'Se cuadran los cheques y depósitos', FALSE),
('Revisión #1', 'Se realiza la primera revisión', TRUE),
('Revisión #2', 'Se realiza la segunda revisión', TRUE),
('Revisión #3', 'Se realiza la tercera revisión', TRUE),
('Impresión de cuadernillo', 'Se imprime el cuadernillo revisado y autorizado', FALSE),
('Envío al cliente', 'Se envía al cliente el cuadernillo terminado', FALSE);


INSERT INTO Empresa (id_empresa, nombre_empresa)
VALUES
(1, 'AGROPECUARIA ARGELIA, S.A.'),
(2, 'ILEANA CAROLINA LOPEZ'),
(3, 'MEDIVISION, S.A.'),
(4, 'RECURSOS VISIBLES, S.A.'),
(5, 'DIVELSA'),
(6, 'DIVELCO'),
(7, 'AGROVETERINARIA EL ESTABLO'),
(8, 'LUZ MARIA TARRAGO HOENES'),
(9, 'COMERCIALIZADORA DE PASTELES Y MAS'),
(10, 'INVERSIONES OSOL'),
(11, 'REPSA'),
(12, 'CORSENESA'),
(13, 'ALMACA'),
(14, 'JORGE CASTAÑEDA'),
(15, 'IGDT'),
(16, 'JORGE C. ARMANY'),
(17, 'INVERSIONES OSOL, S.A.'),
(18, 'LASER VISION'),
(19, 'SERVICIO AGRIGENTO, S.A.'),
(20, 'RIGMO, S.A.'),
(21, 'GUATEMALA SHIPPING SERVICES, S.A.'),
(22, 'RES. 3-24, S.A.'),
(23, 'RES. SAN DIEGO, S.A.'),
(24, 'SILJO, S.A.'),
(25, 'WALTER SCHIEBER'),
(26, 'ASOVECA DIECISEIS'),
(27, 'CORPORACION SFERA'),
(28, 'TECNOSTAR'),
(29, 'GRUPO RASALPA'),
(30, 'SMART POINT'),
(31, 'DILAB'),
(32, 'CVR, S.A.'),
(33, 'CRITABEL VELASQUEZ'),
(34, 'PEÑAVEL'),
(35, 'ASOVECINOS 3-85'),
(36, 'ASOVECINOS DEL CERRO'),
(37, 'ASOVEP'),
(38, 'ASOVECINOS MERAKI 14'),
(39, 'LOS TECOLOTES');


INSERT INTO AsignacionRol (id_empleado, id_rol, id_empresa)
VALUES
(6, 8, 1),
(6, 8, 2),
(6, 8, 3),
(6, 8, 4),
(6, 8, 5),
(6, 8, 6),
(6, 8, 7),
(6, 8, 8),
(6, 8, 9),
(6, 8, 10),
(6, 8, 11),
(6, 8, 12),
(6, 8, 13),
(6, 8, 14),
(6, 8, 15),
(6, 8, 16),
(6, 8, 17),
(6, 8, 18),
(6, 8, 19),
(6, 8, 20),
(6, 8, 21),
(6, 8, 22),
(6, 8, 23),
(6, 8, 24),
(6, 8, 25),
(6, 8, 26),
(6, 8, 27),
(6, 8, 28),
(6, 8, 29),
(6, 8, 30),
(6, 8, 31),
(6, 8, 32),
(6, 8, 33),
(6, 8, 34),
(6, 8, 35),
(6, 8, 36),
(6, 8, 37),
(6, 8, 38),
(6, 8, 39);


INSERT INTO AsignacionRol (id_empleado, id_rol, id_empresa)
VALUES
(2, 4, 1),
(2, 4, 2),
(2, 4, 3),
(2, 4, 4),
(2, 4, 5),
(2, 4, 6),
(2, 4, 7),
(2, 4, 8),
(2, 4, 9),
(2, 4, 10),
(2, 4, 11),
(2, 4, 12),
(2, 4, 13),
(2, 4, 14),
(2, 4, 15),
(2, 4, 16),
(2, 4, 17),
(2, 4, 18),
(2, 4, 19),
(2, 4, 20),
(2, 4, 21),
(2, 4, 22),
(2, 4, 23),
(2, 4, 24),
(2, 4, 25),
(2, 4, 26),
(2, 4, 27),
(2, 4, 28),
(2, 4, 29),
(2, 4, 30),
(2, 4, 31),
(2, 4, 32),
(2, 4, 33),
(2, 4, 34),
(2, 4, 35),
(2, 4, 36),
(2, 4, 37),
(2, 4, 38),
(2, 4, 39);

INSERT INTO AsignacionRol (id_empleado, id_rol, id_empresa)
VALUES
(3, 5, 1),
(3, 5, 2),
(3, 5, 3),
(3, 5, 4),
(3, 5, 5),
(3, 5, 6),
(3, 5, 7),
(3, 5, 8),
(3, 5, 9),
(3, 5, 10),
(3, 5, 11),
(3, 5, 12),
(3, 5, 13),
(3, 5, 14),
(3, 5, 15),
(3, 5, 16),
(3, 5, 17),
(3, 5, 18),
(3, 5, 19),
(3, 5, 20),
(3, 5, 21),
(3, 5, 22),
(3, 5, 23),
(3, 5, 24),
(3, 5, 25),
(3, 5, 26),
(3, 5, 27),
(3, 5, 28),
(3, 5, 29),
(3, 5, 30),
(3, 5, 31),
(3, 5, 32),
(3, 5, 33),
(3, 5, 34),
(3, 5, 35),
(3, 5, 36),
(3, 5, 37),
(3, 5, 38),
(3, 5, 39);

INSERT INTO AsignacionRol (id_empleado, id_rol, id_empresa)
VALUES
(1, 6, 1),
(1, 6, 2),
(1, 6, 3),
(1, 6, 4),
(1, 6, 5),
(1, 6, 6),
(1, 6, 7),
(1, 6, 8),
(1, 6, 9),
(1, 6, 10),
(1, 6, 11),
(1, 6, 12),
(1, 6, 13),
(1, 6, 14),
(1, 6, 15),
(1, 6, 16),
(1, 6, 17),
(1, 6, 18),
(1, 6, 19),
(1, 6, 20),
(1, 6, 21),
(1, 6, 22),
(1, 6, 23),
(1, 6, 24),
(1, 6, 25),
(1, 6, 26),
(1, 6, 27),
(1, 6, 28),
(1, 6, 29),
(1, 6, 30),
(1, 6, 31),
(1, 6, 32),
(1, 6, 33),
(1, 6, 34),
(1, 6, 35),
(1, 6, 36),
(1, 6, 37),
(1, 6, 38),
(1, 6, 39);

INSERT INTO AsignacionRol (id_empleado, id_rol, id_empresa)
VALUES
(9, 7, 1),
(9, 7, 2),
(9, 7, 3),
(9, 7, 4),
(9, 7, 5),
(9, 7, 6),
(9, 7, 7),
(9, 7, 8),
(9, 7, 9),
(9, 7, 10),
(9, 7, 11),
(9, 7, 12),
(9, 7, 13),
(9, 7, 14),
(9, 7, 15),
(9, 7, 16),
(9, 7, 17),
(9, 7, 18),
(9, 7, 19),
(9, 7, 20),
(9, 7, 21),
(9, 7, 22),
(9, 7, 23),
(9, 7, 24),
(9, 7, 25),
(9, 7, 26),
(9, 7, 27),
(9, 7, 28),
(9, 7, 29),
(9, 7, 30),
(9, 7, 31),
(9, 7, 32),
(9, 7, 33),
(9, 7, 34),
(9, 7, 35),
(9, 7, 36),
(9, 7, 37),
(9, 7, 38),
(9, 7, 39);


