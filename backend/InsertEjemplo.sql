-- Insertar empresa por defecto
INSERT INTO Empresa (nombre_empresa, direccion_empresa, telefono_empresa, correo_empresa) 
VALUES ('El Punto', '6a. Av. 0-60 Zona 4, Torre Profesional II, Oficina 303 "A"', '2335-1609', 'info@cvrasesoria.com');

-- Insertar roles
INSERT INTO Rol (nombre_rol, descripcion) VALUES 
('Administrador', 'Acceso completo al sistema'),
('Contador', 'Acceso a cuentas y empresas asignadas para su trabajo contable'),
('Digitador', 'Acceso a cuentas y empresas asignadas para ingreso de datos'),
('Revisor #1', 'Realiza la primera revisión'),
('Revisor #2', 'Realiza la segunda revisión'),
('Revisor #3', 'Realiza la tercera revisión'),
('Encargada de Impresión', 'Imprime los cuadernillos revisados'),
('Secretaria Recepcionista', 'Recibe la papelería y envía los cuadernillos impresos');


INSERT INTO Usuario (nombre_completo, correo, contrasena, tipo_usuario, id_empleado)
VALUES ('Admin CVR', 'admin@cvrasesoria.com', 'admin123', 'administrador', NULL);

SET SQL_SAFE_UPDATES = 0;

UPDATE Usuario
SET contrasena = '$2b$10$tmYxy8MitcaXLorfJLhkKey2QpbHtAuQUFimQi3bPzDJ1baXtir3S'
WHERE nombre_completo = 'Admin CVR';

SET SQL_SAFE_UPDATES = 1;


-- Insertar etapas del catálogo
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
('Envío al cliente', 'Se envía al cliente el cuadernillo terminado', FALSE)
