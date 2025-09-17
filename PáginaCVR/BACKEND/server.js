// server.js
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { emailConfig } from "./config.js";

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',  
  password: '1234',  
  database: 'CVR_LDD'
});

// Configuración de nodemailer para envío de correos
const transporter = nodemailer.createTransport(emailConfig);

// Función para generar URL de Gravatar
const getGravatarUrl = (email) => {
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
};

// Función para verificar si un correo es real
const isRealEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return emailConfig.realEmailDomains.includes(domain);
};

// Ruta de login unificada
app.post('/api/login', async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    // Buscar usuario en la tabla unificada
    const [usuarioRows] = await pool.query(
      `SELECT u.id_usuario, u.nombre_completo, u.correo, u.contrasena, u.tipo_usuario, u.foto_perfil,
              e.id_empleado, r.nombre_rol
       FROM Usuario u
       LEFT JOIN Empleado e ON u.id_empleado = e.id_empleado
       LEFT JOIN AsignacionRol ar ON e.id_empleado = ar.id_empleado
       LEFT JOIN Rol r ON ar.id_rol = r.id_rol
       WHERE u.correo = ? AND u.activo = TRUE LIMIT 1`,
      [correo]
    );

    if (usuarioRows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales incorrectas' 
      });
    }

    const usuario = usuarioRows[0];
    const passwordValida = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!passwordValida) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales incorrectas' 
      });
    }

    // Determinar el rol basado en el tipo de usuario
    let rol = usuario.tipo_usuario;
    if (usuario.tipo_usuario === 'empleado' && usuario.nombre_rol) {
      rol = usuario.nombre_rol;
    }

    // Generar foto de Gravatar si es un correo real
    let fotoPerfil = usuario.foto_perfil;
    const esCorreoReal = isRealEmail(correo);
    console.log(` Verificando correo: ${correo} - Es real: ${esCorreoReal}`);
    
    if (esCorreoReal) {
      fotoPerfil = getGravatarUrl(correo);
      console.log(` Foto de Gravatar generada: ${fotoPerfil}`);
      
      // Actualizar la foto en la base de datos si no existe
      if (!usuario.foto_perfil) {
        await pool.query(
          'UPDATE Usuario SET foto_perfil = ? WHERE id_usuario = ?',
          [fotoPerfil, usuario.id_usuario]
        );
        console.log(` Foto guardada en base de datos`);
      }
      
      // Enviar notificación de login para correos reales
      await enviarNotificacionLogin(correo, usuario.nombre_completo, rol);
    } else {
      console.log(` Correo no considerado "real", no se enviará notificación`);
    }

    const token = jwt.sign(
      { 
        id: usuario.id_usuario, 
        rol: rol, 
        tipo: usuario.tipo_usuario,
        foto: fotoPerfil
      },
      'secreto_super_seguro',
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      token,
      nombre: usuario.nombre_completo,
      rol: rol,
      tipo: usuario.tipo_usuario,
      foto: fotoPerfil
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor' 
    });
  }
});

// Función para enviar correo de bienvenida
const enviarCorreoBienvenida = async (correo, nombre) => {
  try {
    console.log(` Enviando correo de bienvenida a: ${correo}`);
    const mailOptions = {
      from: emailConfig.from,
      to: correo,
      subject: '¡Bienvenido a CVR Asesoría!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; background: #122745; padding: 20px; color: white;">
            <h1>¡Bienvenido a CVR Asesoría!</h1>
            <p>Asesoría y Soluciones Óptimas para tus Finanzas</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h2>Hola ${nombre},</h2>
            <p>Te damos la bienvenida a CVR Asesoría Contable Financiera S.A.</p>
            <p>Estamos comprometidos a brindarte servicios profesionales de calidad en las áreas administrativas, financieras, económicas, fiscales, tributarias y legales.</p>
            <div style="text-align: center; margin: 20px 0;">
              <div style="background: #122745; color: white; padding: 20px; border-radius: 10px; display: inline-block;">
                <h2 style="margin: 0; font-size: 24px;">CVR ASESORÍA</h2>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Asesoría y Soluciones Óptimas</p>
              </div>
            </div>
            <p>¡Gracias por confiar en nosotros!</p>
            <p>El equipo de CVR Asesoría</p>
          </div>
        </div>
      `,
      // attachments: [{
      //   filename: 'cvr-logo.png',
      //   path: './public/cvr-logo-color.svg',
      //   cid: 'logo'
      // }]
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(` Correo de bienvenida enviado exitosamente a: ${correo}`);
    console.log(` Message ID: ${result.messageId}`);
  } catch (error) {
    console.error(' Error enviando correo de bienvenida:', error);
  }
};

// Función para enviar notificación de login
const enviarNotificacionLogin = async (correo, nombre, tipoUsuario) => {
  try {
    console.log(` Enviando notificación de login a: ${correo}`);
    const mailOptions = {
      from: emailConfig.from,
      to: correo,
      subject: 'Inicio de sesión en CVR Asesoría',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; background: #122745; padding: 20px; color: white;">
            <h1>Inicio de Sesión Detectado</h1>
            <p>CVR Asesoría - Sistema de Seguridad</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h2>Hola ${nombre},</h2>
            <p>Se ha detectado un inicio de sesión en tu cuenta de CVR Asesoría.</p>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1976d2;">Detalles del acceso:</h3>
              <p><strong>Tipo de usuario:</strong> ${tipoUsuario}</p>
              <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-ES')}</p>
              <p><strong>Correo:</strong> ${correo}</p>
            </div>
            <p>Si no fuiste tú quien inició sesión, por favor contacta inmediatamente a nuestro equipo de soporte.</p>
            <div style="text-align: center; margin: 20px 0;">
              <div style="background: #122745; color: white; padding: 20px; border-radius: 10px; display: inline-block;">
                <h2 style="margin: 0; font-size: 24px;">CVR ASESORÍA</h2>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Asesoría y Soluciones Óptimas</p>
              </div>
            </div>
            <p>¡Gracias por mantener tu cuenta segura!</p>
            <p>El equipo de CVR Asesoría</p>
          </div>
        </div>
      `,
      // attachments: [{
      //   filename: 'cvr-logo.png',
      //   path: './public/cvr-logo-color.svg',
      //   cid: 'logo'
      // }]
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(` Notificación de login enviada exitosamente a: ${correo}`);
    console.log(` Message ID: ${result.messageId}`);
  } catch (error) {
    console.error(' Error enviando notificación de login:', error);
  }
};

// Ruta de registro de clientes
app.post('/api/register', async (req, res) => {
  const { nombre, correo, usuario, password } = req.body;

  try {
    // Verificar si el correo ya existe en cualquier tabla
    const [existingUser] = await pool.query(
      `SELECT correo FROM Usuario WHERE correo = ? 
       UNION 
       SELECT correo FROM Cliente WHERE correo = ? 
       UNION 
       SELECT correo FROM Empleado WHERE correo = ?`,
      [correo, correo, correo]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'El correo ya está registrado en el sistema.' 
      });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar en tabla Cliente (mantener para referencias)
    const [clienteResult] = await pool.query(
      `INSERT INTO Cliente (nombre_completo, correo, usuario, contrasena) VALUES (?, ?, ?, ?)`,
      [nombre, correo, usuario, hashedPassword]
    );

    // Generar foto de Gravatar si es un correo real
    let fotoPerfil = null;
    if (isRealEmail(correo)) {
      fotoPerfil = getGravatarUrl(correo);
    }

    // Insertar en tabla Usuario unificada
    const [usuarioResult] = await pool.query(
      `INSERT INTO Usuario (nombre_completo, correo, contrasena, tipo_usuario, id_cliente, foto_perfil) VALUES (?, ?, ?, 'cliente', ?, ?)`,
      [nombre, correo, hashedPassword, clienteResult.insertId, fotoPerfil]
    );

    // Enviar correo de bienvenida
    await enviarCorreoBienvenida(correo, nombre);

    // Crear token para login automático
    const token = jwt.sign(
      { 
        id: usuarioResult.insertId, 
        rol: 'Cliente', 
        tipo: 'cliente',
        foto: fotoPerfil
      },
      'secreto_super_seguro',
      { expiresIn: '2h' }
    );

    res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente.',
      id: usuarioResult.insertId,
      nombre,
      token,
      rol: 'Cliente',
      tipo: 'cliente',
      foto: fotoPerfil
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Error al registrar el cliente.' 
    });
  }
});

// Middleware para verificar token JWT
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, 'secreto_super_seguro');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

// Middleware para verificar que sea administrador
const verificarAdmin = (req, res, next) => {
  if (req.user.tipo !== 'administrador') {
    return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores.' });
  }
  next();
};

// Middleware para verificar contraseña de administrador
const verificarPasswordAdmin = async (req, res, next) => {
  const { contrasena } = req.body;
  
  if (!contrasena) {
    return res.status(400).json({ success: false, message: 'Contraseña requerida' });
  }

  try {
    console.log('Verificando contraseña para usuario ID:', req.user.id);
    console.log('Tipo de usuario:', req.user.tipo);
    
    // Buscar el administrador actual
    const [adminRows] = await pool.query(
      'SELECT contrasena FROM Usuario WHERE id_usuario = ? AND tipo_usuario = "administrador"',
      [req.user.id]
    );

    console.log('Resultado de consulta admin:', adminRows.length);

    if (adminRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Administrador no encontrado' });
    }

    const passwordValida = await bcrypt.compare(contrasena, adminRows[0].contrasena);
    console.log('Contraseña válida:', passwordValida);
    
    if (!passwordValida) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    next();
  } catch (error) {
    console.error('Error verificando contraseña:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ============================================
// ENDPOINTS CRUD PARA EMPLEADOS
// ============================================

// Obtener todos los empleados
app.get('/api/empleados', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, u.foto_perfil, u.activo
      FROM Empleado e
      LEFT JOIN Usuario u ON e.id_empleado = u.id_empleado
      ORDER BY e.nombre, e.apellido
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo empleados:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear empleado
app.post('/api/empleados', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { nombre, apellido, correo, contrasena } = req.body;

  try {
    // Verificar si el correo ya existe
    const [existing] = await pool.query('SELECT id_empleado FROM Empleado WHERE correo = ?', [correo]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'El correo ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar empleado
    const [result] = await pool.query(
      'INSERT INTO Empleado (nombre, apellido, correo, contrasena) VALUES (?, ?, ?, ?)',
      [nombre, apellido, correo, hashedPassword]
    );

    // Insertar en tabla Usuario
    const [usuarioResult] = await pool.query(
      'INSERT INTO Usuario (nombre_completo, correo, contrasena, tipo_usuario, id_empleado) VALUES (?, ?, ?, "empleado", ?)',
      [`${nombre} ${apellido}`, correo, hashedPassword, result.insertId]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Empleado creado exitosamente',
      data: { id: result.insertId, id_usuario: usuarioResult.insertId }
    });
  } catch (error) {
    console.error('Error creando empleado:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar empleado
app.put('/api/empleados/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, correo, contrasena, activo } = req.body;

  try {
    // Verificar si el empleado existe
    const [existing] = await pool.query('SELECT id_empleado FROM Empleado WHERE id_empleado = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    let updateQuery = 'UPDATE Empleado SET nombre = ?, apellido = ?, correo = ?';
    let updateParams = [nombre, apellido, correo];

    // Si se proporciona nueva contraseña
    if (contrasena) {
      const hashedPassword = await bcrypt.hash(contrasena, 10);
      updateQuery += ', contrasena = ?';
      updateParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id_empleado = ?';
    updateParams.push(id);

    await pool.query(updateQuery, updateParams);

    // Actualizar tabla Usuario
    let usuarioUpdateQuery = 'UPDATE Usuario SET nombre_completo = ?, correo = ?';
    let usuarioUpdateParams = [`${nombre} ${apellido}`, correo];

    if (contrasena) {
      const hashedPassword = await bcrypt.hash(contrasena, 10);
      usuarioUpdateQuery += ', contrasena = ?';
      usuarioUpdateParams.push(hashedPassword);
    }

    if (activo !== undefined) {
      usuarioUpdateQuery += ', activo = ?';
      usuarioUpdateParams.push(activo);
    }

    usuarioUpdateQuery += ' WHERE id_empleado = ?';
    usuarioUpdateParams.push(id);

    await pool.query(usuarioUpdateQuery, usuarioUpdateParams);

    res.json({ success: true, message: 'Empleado actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando empleado:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar empleado
app.delete('/api/empleados/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si el empleado existe
    const [existing] = await pool.query('SELECT id_empleado FROM Empleado WHERE id_empleado = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    // Eliminar empleado (cascada eliminará registros relacionados)
    await pool.query('DELETE FROM Empleado WHERE id_empleado = ?', [id]);

    res.json({ success: true, message: 'Empleado eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando empleado:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ============================================
// ENDPOINTS CRUD PARA EMPRESAS
// ============================================

// Obtener todas las empresas
app.get('/api/empresas', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Empresa ORDER BY nombre_empresa');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo empresas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear empresa
app.post('/api/empresas', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { nombre_empresa, direccion_empresa, telefono_empresa, correo_empresa } = req.body;

  try {
    // Verificar si el correo ya existe
    const [existing] = await pool.query('SELECT id_empresa FROM Empresa WHERE correo_empresa = ?', [correo_empresa]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'El correo de la empresa ya está registrado' });
    }

    const [result] = await pool.query(
      'INSERT INTO Empresa (nombre_empresa, direccion_empresa, telefono_empresa, correo_empresa) VALUES (?, ?, ?, ?)',
      [nombre_empresa, direccion_empresa, telefono_empresa, correo_empresa]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Empresa creada exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando empresa:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar empresa
app.put('/api/empresas/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre_empresa, direccion_empresa, telefono_empresa, correo_empresa } = req.body;

  try {
    // Verificar si la empresa existe
    const [existing] = await pool.query('SELECT id_empresa FROM Empresa WHERE id_empresa = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }

    await pool.query(
      'UPDATE Empresa SET nombre_empresa = ?, direccion_empresa = ?, telefono_empresa = ?, correo_empresa = ? WHERE id_empresa = ?',
      [nombre_empresa, direccion_empresa, telefono_empresa, correo_empresa, id]
    );

    res.json({ success: true, message: 'Empresa actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando empresa:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar empresa
app.delete('/api/empresas/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si la empresa existe
    const [existing] = await pool.query('SELECT id_empresa FROM Empresa WHERE id_empresa = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }

    // Verificar si tiene cuentas asociadas
    const [cuentas] = await pool.query('SELECT COUNT(*) as count FROM Cuenta WHERE id_empresa = ?', [id]);
    if (cuentas[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar la empresa porque tiene cuentas asociadas' 
      });
    }

    await pool.query('DELETE FROM Empresa WHERE id_empresa = ?', [id]);

    res.json({ success: true, message: 'Empresa eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando empresa:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ============================================
// ENDPOINTS CRUD PARA ROLES
// ============================================

// Obtener todos los roles
app.get('/api/roles', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Rol ORDER BY nombre_rol');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear rol
app.post('/api/roles', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { nombre_rol, descripcion } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO Rol (nombre_rol, descripcion) VALUES (?, ?)',
      [nombre_rol, descripcion]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Rol creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando rol:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar rol
app.put('/api/roles/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre_rol, descripcion } = req.body;

  try {
    // Verificar si el rol existe
    const [existing] = await pool.query('SELECT id_rol FROM Rol WHERE id_rol = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Rol no encontrado' });
    }

    await pool.query(
      'UPDATE Rol SET nombre_rol = ?, descripcion = ? WHERE id_rol = ?',
      [nombre_rol, descripcion, id]
    );

    res.json({ success: true, message: 'Rol actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar rol
app.delete('/api/roles/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si el rol existe
    const [existing] = await pool.query('SELECT id_rol FROM Rol WHERE id_rol = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Rol no encontrado' });
    }

    // Verificar si tiene asignaciones
    const [asignaciones] = await pool.query('SELECT COUNT(*) as count FROM AsignacionRol WHERE id_rol = ?', [id]);
    if (asignaciones[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar el rol porque tiene asignaciones activas' 
      });
    }

    await pool.query('DELETE FROM Rol WHERE id_rol = ?', [id]);

    res.json({ success: true, message: 'Rol eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando rol:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ============================================
// ENDPOINTS CRUD PARA CUENTAS
// ============================================

// Obtener todas las cuentas con información de empresa
app.get('/api/cuentas', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, e.nombre_empresa, e.correo_empresa
      FROM Cuenta c
      LEFT JOIN Empresa e ON c.id_empresa = e.id_empresa
      ORDER BY c.nombre_cuenta
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo cuentas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear cuenta
app.post('/api/cuentas', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id_empresa, nombre_cuenta } = req.body;

  try {
    // Verificar si la empresa existe
    const [empresa] = await pool.query('SELECT id_empresa FROM Empresa WHERE id_empresa = ?', [id_empresa]);
    if (empresa.length === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }

    const [result] = await pool.query(
      'INSERT INTO Cuenta (id_empresa, nombre_cuenta) VALUES (?, ?)',
      [id_empresa, nombre_cuenta]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Cuenta creada exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando cuenta:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar cuenta
app.put('/api/cuentas/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;
  const { id_empresa, nombre_cuenta } = req.body;

  try {
    // Verificar si la cuenta existe
    const [existing] = await pool.query('SELECT id_cuenta FROM Cuenta WHERE id_cuenta = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    }

    // Verificar si la empresa existe
    const [empresa] = await pool.query('SELECT id_empresa FROM Empresa WHERE id_empresa = ?', [id_empresa]);
    if (empresa.length === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }

    await pool.query(
      'UPDATE Cuenta SET id_empresa = ?, nombre_cuenta = ? WHERE id_cuenta = ?',
      [id_empresa, nombre_cuenta, id]
    );

    res.json({ success: true, message: 'Cuenta actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando cuenta:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar cuenta
app.delete('/api/cuentas/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si la cuenta existe
    const [existing] = await pool.query('SELECT id_cuenta FROM Cuenta WHERE id_cuenta = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    }

    // Verificar si tiene etapas asociadas
    const [etapas] = await pool.query('SELECT COUNT(*) as count FROM EtapaCuenta WHERE id_cuenta = ?', [id]);
    if (etapas[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar la cuenta porque tiene etapas asociadas' 
      });
    }

    await pool.query('DELETE FROM Cuenta WHERE id_cuenta = ?', [id]);

    res.json({ success: true, message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ============================================
// ENDPOINTS PARA ETAPAS DE CUENTAS
// ============================================

// Obtener etapas de una cuenta específica
app.get('/api/cuentas/:id/etapas', verificarToken, verificarAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(`
      SELECT ec.*, 
             e.nombre, e.apellido,
             r.nombre_rol,
             et.nombre_etapa, et.descripcion as etapa_descripcion,
             eto.nombre_etapa as etapa_origen_nombre
      FROM EtapaCuenta ec
      LEFT JOIN AsignacionRol ar ON ec.id_asignacion = ar.id_asignacion
      LEFT JOIN Empleado e ON ar.id_empleado = e.id_empleado
      LEFT JOIN Rol r ON ar.id_rol = r.id_rol
      LEFT JOIN EtapaCatalogo et ON ec.id_etapa = et.id_etapa
      LEFT JOIN EtapaCatalogo eto ON ec.etapa_origen_error = eto.id_etapa
      WHERE ec.id_cuenta = ?
      ORDER BY ec.fecha_inicio DESC
    `, [id]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo etapas de cuenta:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ============================================
// ENDPOINTS CRUD PARA PAPELERÍA
// ============================================

// Obtener toda la papelería con información de cliente y cuenta
app.get('/api/papeleria', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, 
             c.nombre_completo as cliente_nombre, c.correo as cliente_correo,
             cu.nombre_cuenta, e.nombre_empresa
      FROM Papeleria p
      LEFT JOIN Cliente c ON p.id_cliente = c.id_cliente
      LEFT JOIN Cuenta cu ON p.id_cuenta = cu.id_cuenta
      LEFT JOIN Empresa e ON cu.id_empresa = e.id_empresa
      ORDER BY p.fecha_recepcion DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo papelería:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear papelería
app.post('/api/papeleria', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id_cliente, id_cuenta, descripcion } = req.body;

  try {
    // Verificar si el cliente existe
    const [cliente] = await pool.query('SELECT id_cliente FROM Cliente WHERE id_cliente = ?', [id_cliente]);
    if (cliente.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    // Verificar si la cuenta existe
    const [cuenta] = await pool.query('SELECT id_cuenta FROM Cuenta WHERE id_cuenta = ?', [id_cuenta]);
    if (cuenta.length === 0) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    }

    const [result] = await pool.query(
      'INSERT INTO Papeleria (id_cliente, id_cuenta, descripcion) VALUES (?, ?, ?)',
      [id_cliente, id_cuenta, descripcion]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Papelería creada exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando papelería:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar papelería
app.put('/api/papeleria/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;
  const { descripcion, estado, fecha_entrega } = req.body;

  try {
    // Verificar si la papelería existe
    const [existing] = await pool.query('SELECT id_papeleria FROM Papeleria WHERE id_papeleria = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Papelería no encontrada' });
    }

    await pool.query(
      'UPDATE Papeleria SET descripcion = ?, estado = ?, fecha_entrega = ? WHERE id_papeleria = ?',
      [descripcion, estado, fecha_entrega, id]
    );

    res.json({ success: true, message: 'Papelería actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando papelería:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar papelería
app.delete('/api/papeleria/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si la papelería existe
    const [existing] = await pool.query('SELECT id_papeleria FROM Papeleria WHERE id_papeleria = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Papelería no encontrada' });
    }

    await pool.query('DELETE FROM Papeleria WHERE id_papeleria = ?', [id]);

    res.json({ success: true, message: 'Papelería eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando papelería:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ============================================
// ENDPOINTS CRUD PARA ETAPA CATÁLOGO
// ============================================

// Obtener todas las etapas del catálogo
app.get('/api/etapas-catalogo', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM EtapaCatalogo ORDER BY nombre_etapa');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo etapas del catálogo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear etapa en catálogo
app.post('/api/etapas-catalogo', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { nombre_etapa, descripcion, es_revision } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO EtapaCatalogo (nombre_etapa, descripcion, es_revision) VALUES (?, ?, ?)',
      [nombre_etapa, descripcion, es_revision || false]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Etapa creada exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando etapa:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar etapa en catálogo
app.put('/api/etapas-catalogo/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre_etapa, descripcion, es_revision } = req.body;

  try {
    // Verificar si la etapa existe
    const [existing] = await pool.query('SELECT id_etapa FROM EtapaCatalogo WHERE id_etapa = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Etapa no encontrada' });
    }

    await pool.query(
      'UPDATE EtapaCatalogo SET nombre_etapa = ?, descripcion = ?, es_revision = ? WHERE id_etapa = ?',
      [nombre_etapa, descripcion, es_revision, id]
    );

    res.json({ success: true, message: 'Etapa actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando etapa:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar etapa en catálogo
app.delete('/api/etapas-catalogo/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si la etapa existe
    const [existing] = await pool.query('SELECT id_etapa FROM EtapaCatalogo WHERE id_etapa = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Etapa no encontrada' });
    }

    // Verificar si tiene etapas de cuenta asociadas
    const [etapas] = await pool.query('SELECT COUNT(*) as count FROM EtapaCuenta WHERE id_etapa = ?', [id]);
    if (etapas[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar la etapa porque tiene cuentas asociadas' 
      });
    }

    await pool.query('DELETE FROM EtapaCatalogo WHERE id_etapa = ?', [id]);

    res.json({ success: true, message: 'Etapa eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando etapa:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ============================================
// ENDPOINTS CRUD PARA CLIENTES
// ============================================

// Obtener todos los clientes
app.get('/api/clientes', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, u.foto_perfil, u.activo
      FROM Cliente c
      LEFT JOIN Usuario u ON c.id_cliente = u.id_cliente
      ORDER BY c.nombre_completo
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ============================================
// ENDPOINTS PARA ASIGNACIONES DE ROLES
// ============================================

// Obtener todas las asignaciones
app.get('/api/asignaciones', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ar.*, 
             e.nombre, e.apellido, e.correo,
             r.nombre_rol,
             c.nombre_cuenta,
             emp.nombre_empresa
      FROM AsignacionRol ar
      LEFT JOIN Empleado e ON ar.id_empleado = e.id_empleado
      LEFT JOIN Rol r ON ar.id_rol = r.id_rol
      LEFT JOIN Cuenta c ON ar.id_cuenta = c.id_cuenta
      LEFT JOIN Empresa emp ON c.id_empresa = emp.id_empresa
      ORDER BY ar.fecha_asignacion DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo asignaciones:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear asignación
app.post('/api/asignaciones', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id_empleado, id_rol, id_cuenta } = req.body;

  try {
    // Verificar si el empleado existe
    const [empleado] = await pool.query('SELECT id_empleado FROM Empleado WHERE id_empleado = ?', [id_empleado]);
    if (empleado.length === 0) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    // Verificar si el rol existe
    const [rol] = await pool.query('SELECT id_rol FROM Rol WHERE id_rol = ?', [id_rol]);
    if (rol.length === 0) {
      return res.status(404).json({ success: false, message: 'Rol no encontrado' });
    }

    // Verificar si la cuenta existe
    const [cuenta] = await pool.query('SELECT id_cuenta FROM Cuenta WHERE id_cuenta = ?', [id_cuenta]);
    if (cuenta.length === 0) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    }

    // Verificar si ya existe la asignación
    const [existing] = await pool.query(
      'SELECT id_asignacion FROM AsignacionRol WHERE id_empleado = ? AND id_rol = ? AND id_cuenta = ?',
      [id_empleado, id_rol, id_cuenta]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Esta asignación ya existe' });
    }

    const [result] = await pool.query(
      'INSERT INTO AsignacionRol (id_empleado, id_rol, id_cuenta) VALUES (?, ?, ?)',
      [id_empleado, id_rol, id_cuenta]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Asignación creada exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando asignación:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar estado de asignación
app.put('/api/asignaciones/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    // Verificar si la asignación existe
    const [existing] = await pool.query('SELECT id_asignacion FROM AsignacionRol WHERE id_asignacion = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
    }

    await pool.query(
      'UPDATE AsignacionRol SET estado = ? WHERE id_asignacion = ?',
      [estado, id]
    );

    res.json({ success: true, message: 'Asignación actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando asignación:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar asignación
app.delete('/api/asignaciones/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si la asignación existe
    const [existing] = await pool.query('SELECT id_asignacion FROM AsignacionRol WHERE id_asignacion = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
    }

    await pool.query('DELETE FROM AsignacionRol WHERE id_asignacion = ?', [id]);

    res.json({ success: true, message: 'Asignación eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando asignación:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.listen(4000, () => console.log('Servidor corriendo en http://localhost:4000'));
