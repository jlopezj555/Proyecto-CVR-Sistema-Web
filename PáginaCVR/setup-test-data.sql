-- setup-test-data.sql
-- Datos de prueba para testing

-- Usuario administrador de prueba
INSERT INTO Usuario (nombre_completo, correo, contrasena, tipo_usuario, activo) 
VALUES ('Admin Test', 'admin@test.com', '$2b$10$rQZ8K9vLxYzA1B2C3D4E5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z', 'administrador', 1);

-- Usuario empleado de prueba
INSERT INTO Usuario (nombre_completo, correo, contrasena, tipo_usuario, activo) 
VALUES ('Empleado Test', 'empleado@test.com', '$2b$10$rQZ8K9vLxYzA1B2C3D4E5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z', 'empleado', 1);

-- Usuario cliente de prueba
INSERT INTO Usuario (nombre_completo, correo, contrasena, tipo_usuario, activo) 
VALUES ('Cliente Test', 'cliente@test.com', '$2b$10$rQZ8K9vLxYzA1B2C3D4E5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z', 'cliente', 1);

-- Empresa de prueba
INSERT INTO Empresa (nombre_empresa, direccion_empresa, telefono_empresa, correo_empresa) 
VALUES ('Empresa Test', 'Dirección Test 123', '555-0123', 'empresa@test.com');

-- Procesos de prueba (múltiples para testing)
INSERT INTO Proceso (id_empresa, id_cliente, nombre_proceso, tipo_proceso) 
VALUES 
(1, 1, 'Proceso Test 1', 'Contabilidad'),
(1, 1, 'Proceso Test 2', 'Auditoría'),
(1, 1, 'Proceso Test 3', 'Fiscal');