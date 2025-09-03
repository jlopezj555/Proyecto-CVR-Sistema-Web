-- DROP DATABASE CVR_LDD;
CREATE DATABASE CVR_LDD;
USE  CVR_LDD;

-- Tabla de empleados
CREATE TABLE Empleado (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100)NOT NULL,
    correo VARCHAR(120) UNIQUE NOT NULL,
    contraseña VARCHAR(120) UNIQUE NOT NULL,
    cargo VARCHAR(100)
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
    nombre_empresa VARCHAR(120) NOT NULL
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