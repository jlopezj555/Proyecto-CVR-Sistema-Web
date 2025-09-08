-- DROP DATABASE CVR_LDD;
CREATE DATABASE CVR_LDD;
USE  CVR_LDD;

-- Tabla de empleados
CREATE TABLE Empleado (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100)NOT NULL,
    correo VARCHAR(120) UNIQUE NOT NULL,
    contraseña VARCHAR(120) NOT NULL
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

-- Tabla de cuentas
CREATE TABLE Cuenta (
    id_cuenta INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    nombre_cuenta VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_empresa) REFERENCES Empresa(id_empresa)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Tabla de asignaciones (relación Empleado - Rol - Cuenta)
CREATE TABLE AsignacionRol (
    id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    id_rol INT NOT NULL,
    id_cuenta INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Activo','Inactivo') DEFAULT 'Activo',
    FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_cuenta) REFERENCES Cuenta(id_cuenta)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    UNIQUE (id_empleado, id_rol, id_cuenta) -- evita duplicados
);

CREATE TABLE EtapaCatalogo (
    id_etapa INT AUTO_INCREMENT PRIMARY KEY,
    nombre_etapa VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200),
    es_revision BOOLEAN DEFAULT FALSE -- para distinguir revisiones de otras etapas
);


CREATE TABLE EtapaCuenta (
    id_etapa_cuenta INT AUTO_INCREMENT PRIMARY KEY,
    id_cuenta INT NOT NULL,
    id_asignacion INT NOT NULL, -- Empleado+Rol asignado
    id_etapa INT NOT NULL,
    estado ENUM('Pendiente','En progreso','Completada','Rechazada') DEFAULT 'Pendiente',
    motivo_rechazo VARCHAR(300), -- si aplica
    etapa_origen_error INT,      -- id_etapa donde se detectó el error
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL,
    FOREIGN KEY (id_cuenta) REFERENCES Cuenta(id_cuenta)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_asignacion) REFERENCES AsignacionRol(id_asignacion)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_etapa) REFERENCES EtapaCatalogo(id_etapa)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (etapa_origen_error) REFERENCES EtapaCatalogo(id_etapa)
);

