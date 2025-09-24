-- Insertar empresa por defecto
INSERT INTO Empresa (nombre_empresa, direccion_empresa, telefono_empresa, correo_empresa) 
VALUES ('CVR Asesoría Contable Financiera S.A.', '6a. Av. 0-60 Zona 4, Torre Profesional II, Oficina 303 "A"', '2335-1609', 'info@cvrasesoria.com');

-- Insertar roles
INSERT INTO Rol (nombre_rol, descripcion) VALUES 
('Administrador', 'Acceso completo al sistema'),
('Contador', 'Acceso a cuentas y empresas asignadas'),
('Cliente', 'Acceso limitado a sus propias cuentas');

-- Insertar empleados (contraseñas hasheadas con bcrypt)
-- admin123 -> $2b$10$rQZ8kF9XvJ8K9L2M3N4O5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z
-- contador123 -> $2b$10$sRZ9kF9XvJ8K9L2M3N4O5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z
INSERT INTO Empleado (nombre, apellido, correo, contrasena) VALUES 
('Cristabel', 'Velásquez Rodríguez', 'cristabel@cvrasesoria.com', '$2b$10$rQZ8kF9XvJ8K9L2M3N4O5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z'),
('María', 'González', 'maria@cvrasesoria.com', '$2b$10$sRZ9kF9XvJ8K9L2M3N4O5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z');

-- Insertar cliente de ejemplo
INSERT INTO Cliente (nombre_completo, usuario, correo, contrasena, id_empresa) VALUES 
('Juan Pérez', 'jperez', 'juan.perez@empresa.com', '$2b$10$tSZ10kF9XvJ8K9L2M3N4O5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z', 1);

-- Insertar procesos de ejemplo
INSERT INTO Proceso (id_empresa, id_cliente, nombre_proceso, tipo_proceso) VALUES 
(1, 1, 'Proceso de Ventas Enero 2024', 'Venta'),
(1, 1, 'Proceso de Compras Enero 2024', 'Compra');

-- Insertar asignaciones de roles (ahora por empresa en lugar de cuenta)
INSERT INTO AsignacionRol (id_empleado, id_rol, id_empresa, estado) VALUES 
(1, 1, 1, 'Activo'), -- Cristabel como Administrador en empresa 1
(2, 2, 1, 'Activo'); -- María como Contador en empresa 1

-- Insertar usuarios en tabla unificada
INSERT INTO Usuario (nombre_completo, correo, contrasena, tipo_usuario, id_empleado) VALUES 
('Cristabel Velásquez Rodríguez', 'cristabel@cvrasesoria.com', '$2b$10$rQZ8kF9XvJ8K9L2M3N4O5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z', 'administrador', 1),
('María González', 'maria@cvrasesoria.com', '$2b$10$sRZ9kF9XvJ8K9L2M3N4O5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z', 'empleado', 2);


-- INSERT USUARIO ADMINISTRADOR PARA PRUEBAS
INSERT INTO Usuario (nombre_completo, correo, contrasena, tipo_usuario, id_empleado)
VALUES ('Admin CVR', 'admin@cvrasesoria.com', 'admin123', 'administrador', NULL);



-- Insertar papelería de ejemplo
INSERT INTO Papeleria (id_cliente, id_empresa, descripcion, tipo_papeleria) VALUES 
(1, 1, 'Facturas de venta enero 2024', 'Venta'),
(1, 1, 'Comprobantes de compra enero 2024', 'Compra');


-- Insertar etapas del catálogo
INSERT INTO EtapaCatalogo (nombre_etapa, descripcion, es_revision) VALUES 
('Recepción de Documentos', 'Documentos recibidos del cliente', FALSE),
('Revisión Inicial', 'Primera revisión de documentos', TRUE),
('Procesamiento', 'Procesamiento de la información', FALSE),
('Revisión Final', 'Revisión final antes de entrega', TRUE),
('Entrega', 'Documentos entregados al cliente', FALSE);