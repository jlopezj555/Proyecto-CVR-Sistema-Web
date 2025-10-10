-- ============================================
-- CONFIGURACIÓN INICIAL
-- ============================================
DROP DATABASE IF EXISTS railway;
CREATE DATABASE railway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE railway;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE EMPLEADOS
-- ============================================
CREATE TABLE IF NOT EXISTS Empleado (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(120) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL, -- hash bcrypt
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA DE ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS Rol (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(200)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA DE EMPRESAS
-- ============================================
CREATE TABLE IF NOT EXISTS Empresa (
    id_empresa INT AUTO_INCREMENT PRIMARY KEY,
    nombre_empresa VARCHAR(120) NOT NULL,
    direccion_empresa VARCHAR(120) NOT NULL,
    telefono_empresa VARCHAR(20) NOT NULL,
    correo_empresa VARCHAR(120) UNIQUE NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA DE PROCESOS
-- ============================================
CREATE TABLE IF NOT EXISTS Proceso (
    id_proceso INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    nombre_proceso VARCHAR(100) NOT NULL,
    tipo_proceso ENUM('Venta', 'Compra') NOT NULL,
    estado ENUM('Activo', 'Completado', 'Cancelado') DEFAULT 'Activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completado TIMESTAMP NULL,
    FOREIGN KEY (id_empresa) REFERENCES Empresa(id_empresa)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA DE ASIGNACIONES (Empleado–Rol–Empresa)
-- ============================================
CREATE TABLE IF NOT EXISTS AsignacionRol (
    id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    id_rol INT NOT NULL,
    id_empresa INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Activo','Inactivo') DEFAULT 'Activo',
    FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_empresa) REFERENCES Empresa(id_empresa)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (id_empleado, id_rol, id_empresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA DE ETAPAS CATÁLOGO
-- ============================================
CREATE TABLE IF NOT EXISTS EtapaCatalogo (
    id_etapa INT AUTO_INCREMENT PRIMARY KEY,
    nombre_etapa VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200),
    es_revision BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA DE RELACIÓN DE ETAPAS POR ROL
-- ============================================
CREATE TABLE IF NOT EXISTS RolEtapaCatalogo (
    id_rol INT NOT NULL,
    id_etapa INT NOT NULL,
    orden INT NOT NULL,
    PRIMARY KEY (id_rol, id_etapa),
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_etapa) REFERENCES EtapaCatalogo(id_etapa)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA DE ETAPAS DE PROCESO
-- ============================================
CREATE TABLE IF NOT EXISTS EtapaProceso (
    id_etapa_proceso INT AUTO_INCREMENT PRIMARY KEY,
    id_proceso INT NOT NULL,
    id_rol INT NOT NULL,
    id_etapa INT NOT NULL,
    estado ENUM('Pendiente','En progreso','Completada','Rechazada') DEFAULT 'Pendiente',
    motivo_rechazo VARCHAR(300),
    etapa_origen_error INT,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL,
    FOREIGN KEY (id_proceso) REFERENCES Proceso(id_proceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_etapa) REFERENCES EtapaCatalogo(id_etapa)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (etapa_origen_error) REFERENCES EtapaCatalogo(id_etapa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA DE USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('administrador', 'empleado', 'cliente') NOT NULL,
    id_empleado INT NULL,
    foto_perfil VARCHAR(255) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA DE PAPELERÍA
-- ============================================
CREATE TABLE IF NOT EXISTS Papeleria (
    id_papeleria INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    tipo_papeleria ENUM('Venta', 'Compra') NOT NULL,
    fecha_recepcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP NULL,
    estado ENUM('Recibida','En proceso','Entregada') DEFAULT 'Recibida',
    id_proceso INT NULL,
    FOREIGN KEY (id_empresa) REFERENCES Empresa(id_empresa)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_proceso) REFERENCES Proceso(id_proceso)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
