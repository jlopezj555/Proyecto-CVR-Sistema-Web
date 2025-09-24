 -- DROP DATABASE CVR_LDD;
 CREATE DATABASE CVR_LDD;
USE  CVR_LDD;

 -- Tabla de empleados
CREATE TABLE Empleado (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
   apellido VARCHAR(100)NOT NULL,
    correo VARCHAR(120) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL -- hash bcrypt
 );

-- Tabla de roles
CREATE TABLE Rol (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL,
    descripcion VARCHAR(200)
);

-- Tabla de empresas
CREATE TABLE Empresa (
    id_empresa INT AUTO_INCREMENT PRIMARY KEY,
    nombre_empresa VARCHAR(120) NOT NULL,
    direccion_empresa VARCHAR(120)NOT NULL,
    telefono_empresa VARCHAR(20)NOT NULL,
    correo_empresa VARCHAR(120) UNIQUE NOT NULL
);

CREATE TABLE Cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    correo VARCHAR(120) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL, -- hash bcrypt recomendado
    id_empresa INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_empresa) REFERENCES Empresa(id_empresa)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla de procesos
CREATE TABLE Proceso (
    id_proceso INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    id_cliente INT NOT NULL,
    nombre_proceso VARCHAR(100) NOT NULL,
    tipo_proceso ENUM('Venta', 'Compra') NOT NULL,
    estado ENUM('Activo', 'Completado', 'Cancelado') DEFAULT 'Activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completado TIMESTAMP NULL,
    FOREIGN KEY (id_empresa) REFERENCES Empresa(id_empresa)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Tabla de asignaciones (relación Empleado - Rol - Empresa)
CREATE TABLE AsignacionRol (
    id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    id_rol INT NOT NULL,
    id_empresa INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Activo','Inactivo') DEFAULT 'Activo',
    FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_empresa) REFERENCES Empresa(id_empresa)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    UNIQUE (id_empleado, id_rol, id_empresa) -- evita duplicados
);

CREATE TABLE EtapaCatalogo (
    id_etapa INT AUTO_INCREMENT PRIMARY KEY,
    nombre_etapa VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200),
    es_revision BOOLEAN DEFAULT FALSE -- para distinguir revisiones de otras etapas
);

-- Etapas base sugeridas (modificables por el administrador)
INSERT INTO EtapaCatalogo (nombre_etapa, descripcion, es_revision) VALUES
('Recepción', 'Recepción de documentos/insumos', FALSE),
('Clasificación', 'Clasificar y preparar la documentación', FALSE),
('Captura', 'Captura/registro de la información', FALSE),
('Revisión', 'Revisión técnica de la captura', TRUE),
('Validación', 'Validación por control de calidad', TRUE),
('Aprobación', 'Aprobación final del proceso', FALSE),
('Entrega', 'Entrega/cierre con el cliente', FALSE);


-- Relación de etapas por rol (plantillas por rol con orden)
CREATE TABLE RolEtapaCatalogo (
    id_rol INT NOT NULL,
    id_etapa INT NOT NULL,
    orden INT NOT NULL,
    PRIMARY KEY (id_rol, id_etapa),
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_etapa) REFERENCES EtapaCatalogo(id_etapa)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Etapas del proceso instanciadas para cada proceso por rol
CREATE TABLE EtapaProceso (
    id_etapa_proceso INT AUTO_INCREMENT PRIMARY KEY,
    id_proceso INT NOT NULL,
    id_rol INT NOT NULL, -- Asignación por rol (no por empleado)
    id_etapa INT NOT NULL,
    estado ENUM('Pendiente','En progreso','Completada','Rechazada') DEFAULT 'Pendiente',
    motivo_rechazo VARCHAR(300), -- si aplica
    etapa_origen_error INT,      -- id_etapa donde se detectó el error
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL,
    FOREIGN KEY (id_proceso) REFERENCES Proceso(id_proceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_etapa) REFERENCES EtapaCatalogo(id_etapa)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (etapa_origen_error) REFERENCES EtapaCatalogo(id_etapa)
);


-- ============================================
-- TABLA UNIFICADA DE USUARIOS
-- ============================================
CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(120) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL, -- hash bcrypt
    tipo_usuario ENUM('administrador', 'empleado', 'cliente') NOT NULL,
    id_empleado INT NULL, -- Referencia a tabla Empleado si es empleado
    id_cliente INT NULL,  -- Referencia a tabla Cliente si es cliente
    foto_perfil VARCHAR(255) NULL, -- URL de la foto de perfil
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- TABLA DE CLIENTES (MANTENER PARA REFERENCIAS)
-- ============================================


-- ============================================
-- TABLA DE PAPELERIA (documentación contable)
-- ============================================
CREATE TABLE Papeleria (
    id_papeleria INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_empresa INT NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    tipo_papeleria ENUM('Venta', 'Compra') NOT NULL,
    fecha_recepcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP NULL,
    estado ENUM('Recibida','En proceso','Entregada') DEFAULT 'Recibida',
    id_proceso INT NULL, -- Se asigna cuando se crea el proceso
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_empresa) REFERENCES Empresa(id_empresa)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_proceso) REFERENCES Proceso(id_proceso)
        ON DELETE SET NULL ON UPDATE CASCADE
);

