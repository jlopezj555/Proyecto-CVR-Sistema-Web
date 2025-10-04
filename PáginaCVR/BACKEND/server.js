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
    }
    
    // Enviar notificación de login SIEMPRE
    await enviarNotificacionLogin(correo, usuario.nombre_completo, rol);

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
      //  attachments: [{
      //    filename: 'cvr-logo-color.svg',
      //    path: 'PáginaCVR/public/cvr-logo-color.svg',
      //    cid: 'logo'
      //  }]
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
      //   filename: 'cvr-logo-color.svg',
       //  path: 'PáginaCVR/public/cvr-logo-color.svg',
       //  cid: 'logo'
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
    // Verificar si el correo ya existe en Usuario o Empleado
    const [existingUser] = await pool.query(
      `SELECT correo FROM Usuario WHERE correo = ? 
       UNION 
       SELECT correo FROM Empleado WHERE correo = ?`,
      [correo, correo]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'El correo ya está registrado en el sistema.' 
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Usuario unificado tipo empleado por omisión si se requiere auto-registro, o limitar a admin más adelante
    const [usuarioResult] = await pool.query(
      `INSERT INTO Usuario (nombre_completo, correo, contrasena, tipo_usuario) VALUES (?, ?, ?, 'cliente')`,
      [nombre, correo, hashedPassword]
    );

    let fotoPerfil = null;
    if (isRealEmail(correo)) {
      fotoPerfil = getGravatarUrl(correo);
      await pool.query('UPDATE Usuario SET foto_perfil = ? WHERE id_usuario = ?', [fotoPerfil, usuarioResult.insertId]);
    }

    await enviarCorreoBienvenida(correo, nombre);
    // También notificar un primer acceso/creación
    await enviarNotificacionLogin(correo, nombre, 'Cliente');

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
      message: 'Usuario registrado exitosamente.',
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
      message: 'Error al registrar el usuario.' 
    });
  }
});

// (Se movieron endpoints de USUARIOS más abajo, después de definir middlewares)

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
  const contrasena = req.body?.adminContrasena || req.body?.contrasena;
  
  if (!contrasena) {
    return res.status(400).json({ success: false, message: 'Contraseña requerida' });
  }

  try {
    console.log('Verificando contraseña admin para usuario ID:', req.user.id);
    
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
// ENDPOINTS CRUD PARA USUARIOS
// ============================================

// Obtener todos los usuarios
app.get('/api/usuarios', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id_usuario, nombre_completo, correo, tipo_usuario, foto_perfil, activo
      FROM Usuario
      ORDER BY id_usuario ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear usuario (hash de contraseña; si es empleado, crear Empleado enlazado)
app.post('/api/usuarios', verificarToken, verificarAdmin, async (req, res) => {
  const { nombre_completo, correo, contrasena, tipo_usuario = 'cliente', activo = true } = req.body;

  try {
    // Verificar correo duplicado
    const [existing] = await pool.query('SELECT id_usuario FROM Usuario WHERE correo = ?', [correo]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);
    let id_empleado = null;

    if (tipo_usuario === 'empleado') {
      // Crear empleado básico
      const partes = nombre_completo.split(' ');
      const nombre = partes.slice(0, -1).join(' ') || nombre_completo;
      const apellido = partes.slice(-1).join(' ');
      const [empResult] = await pool.query(
        'INSERT INTO Empleado (nombre, apellido, correo, contrasena) VALUES (?, ?, ?, ?)',
        [nombre, apellido, correo, hashedPassword]
      );
      id_empleado = empResult.insertId;
    }

    const [result] = await pool.query(
      'INSERT INTO Usuario (nombre_completo, correo, contrasena, tipo_usuario, id_empleado, activo) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre_completo, correo, hashedPassword, tipo_usuario, id_empleado, !!activo]
    );

    res.status(201).json({ success: true, message: 'Usuario creado exitosamente', data: { id: result.insertId } });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar usuario (sin permitir cambio de contraseña ni tipo_usuario por admin)
app.put('/api/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, correo, /* tipo_usuario, contrasena, */ activo } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM Usuario WHERE id_usuario = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    await pool.query(
      'UPDATE Usuario SET nombre_completo = ?, correo = ?, activo = ? WHERE id_usuario = ?',
      [nombre_completo, correo, activo !== undefined ? !!activo : existing[0].activo, id]
    );

    // Si está enlazado a empleado o cliente, actualizar nombre/correo espejo
    if (existing[0].id_empleado) {
      const partes = nombre_completo.split(' ');
      const nombre = partes.slice(0, -1).join(' ') || nombre_completo;
      const apellido = partes.slice(-1).join(' ');
      await pool.query('UPDATE Empleado SET nombre = ?, apellido = ?, correo = ? WHERE id_empleado = ?', [nombre, apellido, correo, existing[0].id_empleado]);
    }

    res.json({ success: true, message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar usuario (requiere contraseña de admin)
app.delete('/api/usuarios/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await pool.query('SELECT * FROM Usuario WHERE id_usuario = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    await pool.query('DELETE FROM Usuario WHERE id_usuario = ?', [id]);
    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Convertir usuario a empleado
app.post('/api/usuarios/:id/convertir-empleado', verificarToken, verificarAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [userRows] = await pool.query('SELECT * FROM Usuario WHERE id_usuario = ? LIMIT 1', [id]);
    if (userRows.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const user = userRows[0];
    if (user.tipo_usuario === 'empleado' && user.id_empleado) {
      return res.json({ success: true, message: 'El usuario ya es empleado' });
    }

    // Crear empleado básico usando nombre completo y correo del usuario
    const partes = String(user.nombre_completo || '').split(' ');
    const nombre = partes.slice(0, -1).join(' ') || user.nombre_completo;
    const apellido = partes.slice(-1).join(' ') || '';

    const [empResult] = await pool.query(
      'INSERT INTO Empleado (nombre, apellido, correo, contrasena) VALUES (?, ?, ?, ?)',
      [nombre, apellido, user.correo, user.contrasena]
    );

    await pool.query('UPDATE Usuario SET tipo_usuario = "empleado", id_empleado = ? WHERE id_usuario = ?', [empResult.insertId, id]);

    res.json({ success: true, message: 'Usuario convertido a empleado', data: { id_empleado: empResult.insertId } });
  } catch (error) {
    console.error('Error convirtiendo usuario a empleado:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

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
      ORDER BY e.id_empleado ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo empleados:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear empleado
app.post('/api/empleados', verificarToken, verificarAdmin, async (req, res) => {
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

// Actualizar empleado (sin cambio de contraseña por admin)
app.put('/api/empleados/:id', verificarToken, verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, correo, /* contrasena */ activo } = req.body;

  try {
    // Verificar si el empleado existe
    const [existing] = await pool.query('SELECT id_empleado FROM Empleado WHERE id_empleado = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    let updateQuery = 'UPDATE Empleado SET nombre = ?, apellido = ?, correo = ?';
    let updateParams = [nombre, apellido, correo];

    // No permitir cambio de contraseña desde edición por administrador

    updateQuery += ' WHERE id_empleado = ?';
    updateParams.push(id);

    await pool.query(updateQuery, updateParams);

    // Actualizar tabla Usuario
    let usuarioUpdateQuery = 'UPDATE Usuario SET nombre_completo = ?, correo = ?';
    let usuarioUpdateParams = [`${nombre} ${apellido}`, correo];

    // No permitir cambio de contraseña desde edición por administrador

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
    const [rows] = await pool.query('SELECT * FROM Empresa ORDER BY id_empresa ASC');
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
    const [rows] = await pool.query('SELECT * FROM Rol ORDER BY id_rol ASC');
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
// ENDPOINTS CRUD PARA PROCESOS
// ============================================

// Obtener todos los procesos con información de empresa
app.get('/api/procesos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { empresa, year, month } = req.query;
    const params = [];
    let where = ' WHERE 1=1';
    if (empresa) { where += ' AND p.id_empresa = ?'; params.push(Number(empresa)); }
    if (year) { where += ' AND YEAR(p.fecha_creacion) = ?'; params.push(Number(year)); }
    if (month) { where += ' AND MONTH(p.fecha_creacion) = ?'; params.push(Number(month)); }
    const [rows] = await pool.query(
      `SELECT p.*, e.nombre_empresa, e.correo_empresa
       FROM Proceso p
       LEFT JOIN Empresa e ON p.id_empresa = e.id_empresa
       ${where}
       ORDER BY p.id_proceso ASC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo procesos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear proceso (sin cliente)
app.post('/api/procesos', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id_empresa, nombre_proceso, tipo_proceso } = req.body;

  try {
    const [empresa] = await pool.query('SELECT id_empresa FROM Empresa WHERE id_empresa = ?', [id_empresa]);
    if (empresa.length === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }

    // Si no viene nombre_proceso, generar con mes anterior
    let finalNombre = nombre_proceso;
    if (!finalNombre || !String(finalNombre).trim()) {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const mes = prev.toLocaleString('es-ES', { month: 'long' });
      const anio = prev.getFullYear();
      finalNombre = `Proceso de ${mes.charAt(0).toUpperCase() + mes.slice(1)} ${anio}`;
    }

    const [result] = await pool.query(
      'INSERT INTO Proceso (id_empresa, nombre_proceso, tipo_proceso) VALUES (?, ?, ?)',
      [id_empresa, finalNombre, tipo_proceso]
    );

    await instanciarEtapasParaProceso(result.insertId, id_empresa);

    res.status(201).json({ 
      success: true, 
      message: 'Proceso creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando proceso:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar proceso (sin cliente)
app.put('/api/procesos/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;
  const { id_empresa, nombre_proceso, tipo_proceso, estado } = req.body;

  try {
    const [existing] = await pool.query('SELECT id_proceso FROM Proceso WHERE id_proceso = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Proceso no encontrado' });
    }

    const [empresa] = await pool.query('SELECT id_empresa FROM Empresa WHERE id_empresa = ?', [id_empresa]);
    if (empresa.length === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }

    let updateQuery = 'UPDATE Proceso SET id_empresa = ?, nombre_proceso = ?, tipo_proceso = ?';
    let updateParams = [id_empresa, nombre_proceso, tipo_proceso];

    if (estado) {
      updateQuery += ', estado = ?';
      updateParams.push(estado);
      if (estado === 'Completado') {
        updateQuery += ', fecha_completado = NOW()';
      }
    }

    updateQuery += ' WHERE id_proceso = ?';
    updateParams.push(id);

    await pool.query(updateQuery, updateParams);

    res.json({ success: true, message: 'Proceso actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando proceso:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar proceso
app.delete('/api/procesos/:id', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si el proceso existe
    const [existing] = await pool.query('SELECT id_proceso FROM Proceso WHERE id_proceso = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Proceso no encontrado' });
    }

    // Verificar si tiene etapas asociadas
    const [etapas] = await pool.query('SELECT COUNT(*) as count FROM EtapaProceso WHERE id_proceso = ?', [id]);
    if (etapas[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar el proceso porque tiene etapas asociadas' 
      });
    }

    await pool.query('DELETE FROM Proceso WHERE id_proceso = ?', [id]);

    res.json({ success: true, message: 'Proceso eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando proceso:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ============================================
// ENDPOINTS PARA ETAPAS DE PROCESOS
// ============================================

// Obtener etapas de un proceso específico (admin)
app.get('/api/procesos/:id/etapas', verificarToken, verificarAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    let [rows] = await pool.query(`
      SELECT ep.*, 
             r.nombre_rol,
             et.nombre_etapa, et.descripcion as etapa_descripcion,
             eto.nombre_etapa as etapa_origen_nombre,
             (
               SELECT GROUP_CONCAT(CONCAT(e.nombre, ' ', e.apellido) SEPARATOR ', ')
               FROM AsignacionRol ar
               INNER JOIN Empleado e ON e.id_empleado = ar.id_empleado
               INNER JOIN Proceso p2 ON p2.id_proceso = ep.id_proceso
               WHERE ar.id_rol = ep.id_rol AND ar.id_empresa = p2.id_empresa AND ar.estado = 'Activo'
             ) AS responsable_nombres,
             rec.orden AS orden_definido
      FROM EtapaProceso ep
      LEFT JOIN Rol r ON ep.id_rol = r.id_rol
      LEFT JOIN EtapaCatalogo et ON ep.id_etapa = et.id_etapa
      LEFT JOIN EtapaCatalogo eto ON ep.etapa_origen_error = eto.id_etapa
      LEFT JOIN Proceso p ON p.id_proceso = ep.id_proceso
      LEFT JOIN RolEtapaCatalogo rec ON rec.id_rol = ep.id_rol AND rec.id_etapa = ep.id_etapa
      WHERE ep.id_proceso = ?
      ORDER BY rec.orden ASC, ep.fecha_inicio ASC, ep.id_etapa_proceso ASC
    `, [id]);
    if (rows.length === 0) {
      const [proc] = await pool.query('SELECT id_empresa FROM Proceso WHERE id_proceso = ? LIMIT 1', [id]);
      if (proc.length > 0) {
        await instanciarEtapasParaProceso(id, proc[0].id_empresa);
        const [rows2] = await pool.query(`
          SELECT ep.*, 
                 r.nombre_rol,
                 et.nombre_etapa, et.descripcion as etapa_descripcion,
                 eto.nombre_etapa as etapa_origen_nombre,
                 (
                   SELECT GROUP_CONCAT(CONCAT(e.nombre, ' ', e.apellido) SEPARATOR ', ')
                   FROM AsignacionRol ar
                   INNER JOIN Empleado e ON e.id_empleado = ar.id_empleado
                   INNER JOIN Proceso p2 ON p2.id_proceso = ep.id_proceso
                   WHERE ar.id_rol = ep.id_rol AND ar.id_empresa = p2.id_empresa AND ar.estado = 'Activo'
                 ) AS responsable_nombres,
                 rec.orden AS orden_definido
          FROM EtapaProceso ep
          LEFT JOIN Rol r ON ep.id_rol = r.id_rol
          LEFT JOIN EtapaCatalogo et ON ep.id_etapa = et.id_etapa
          LEFT JOIN EtapaCatalogo eto ON ep.etapa_origen_error = eto.id_etapa
          LEFT JOIN Proceso p ON p.id_proceso = ep.id_proceso
          LEFT JOIN RolEtapaCatalogo rec ON rec.id_rol = ep.id_rol AND rec.id_etapa = ep.id_etapa
          WHERE ep.id_proceso = ?
          ORDER BY rec.orden ASC, ep.fecha_inicio ASC, ep.id_etapa_proceso ASC
        `, [id]);
        rows = rows2;
      }
    }
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo etapas de proceso:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ============================================
// ENDPOINTS CRUD PARA PAPELERÍA
// ============================================

// Obtener toda la papelería con información de empresa y proceso
app.get('/api/papeleria', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, 
             e.nombre_empresa, pr.nombre_proceso
      FROM Papeleria p
      LEFT JOIN Empresa e ON p.id_empresa = e.id_empresa
      LEFT JOIN Proceso pr ON p.id_proceso = pr.id_proceso
      ORDER BY p.id_papeleria ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo papelería:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear papelería (sin cliente)
app.post('/api/papeleria', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id_empresa, descripcion, tipo_papeleria } = req.body;

  try {
    const [empresa] = await pool.query('SELECT id_empresa FROM Empresa WHERE id_empresa = ?', [id_empresa]);
    if (empresa.length === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }

    const [result] = await pool.query(
      'INSERT INTO Papeleria (id_empresa, descripcion, tipo_papeleria) VALUES (?, ?, ?)',
      [id_empresa, descripcion, tipo_papeleria]
    );

    // Crear proceso automáticamente y vincular
    const nuevoProcesoId = await crearProcesoDesdePapeleria(id_empresa, tipo_papeleria);
    if (nuevoProcesoId) {
      await pool.query('UPDATE Papeleria SET id_proceso = ? WHERE id_papeleria = ?', [nuevoProcesoId, result.insertId]);
    }

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
  const { descripcion, estado, fecha_entrega, tipo_papeleria } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM Papeleria WHERE id_papeleria = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Papelería no encontrada' });
    }

    await pool.query(
      'UPDATE Papeleria SET descripcion = ?, estado = ?, fecha_entrega = ?, tipo_papeleria = ? WHERE id_papeleria = ?',
      [descripcion, estado, fecha_entrega, tipo_papeleria, id]
    );

    if (estado === 'Entregada' && tipo_papeleria) {
      const nuevoProcesoId = await crearProcesoDesdePapeleria(existing[0].id_empresa, tipo_papeleria);
      if (nuevoProcesoId) {
        await pool.query('UPDATE Papeleria SET id_proceso = ? WHERE id_papeleria = ?', [nuevoProcesoId, id]);
      }
    }

    res.json({ success: true, message: 'Papelería actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando papelería:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Función auxiliar para crear proceso desde papelería (sin cliente)
const crearProcesoDesdePapeleria = async (id_empresa, tipo_papeleria) => {
  try {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const mes = prev.toLocaleString('es-ES', { month: 'long' });
    const anio = prev.getFullYear();
    const nombreProceso = `Proceso de ${mes.charAt(0).toUpperCase() + mes.slice(1)} ${anio}`;
    const [result] = await pool.query(
      'INSERT INTO Proceso (id_empresa, nombre_proceso, tipo_proceso) VALUES (?, ?, ?)',
      [id_empresa, nombreProceso, tipo_papeleria]
    );
    await instanciarEtapasParaProceso(result.insertId, id_empresa);
    return result.insertId;
  } catch (error) {
    console.error('Error creando proceso desde papelería:', error);
    return null;
  }
};

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
    const [rows] = await pool.query('SELECT * FROM EtapaCatalogo ORDER BY id_etapa ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo etapas del catálogo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear etapa en catálogo
app.post('/api/etapas-catalogo', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { nombre_etapa, descripcion, es_revision, id_rol, orden } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO EtapaCatalogo (nombre_etapa, descripcion, es_revision) VALUES (?, ?, ?)',
      [nombre_etapa, descripcion, es_revision || false]
    );

    // Si se envió id_rol, crear relación en RolEtapaCatalogo
    if (id_rol) {
      await pool.query(
        'INSERT INTO RolEtapaCatalogo (id_rol, id_etapa, orden) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE orden = VALUES(orden)',
        [id_rol, result.insertId, Number(orden) || 1]
      );
    }

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
  const { nombre_etapa, descripcion, es_revision, id_rol, orden } = req.body;

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

    if (id_rol) {
      await pool.query(
        'INSERT INTO RolEtapaCatalogo (id_rol, id_etapa, orden) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE orden = VALUES(orden)',
        [id_rol, id, Number(orden) || 1]
      );
    }

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

    // Verificar si está referenciada por RolEtapaCatalogo
    const [rolRefs] = await pool.query('SELECT COUNT(*) as count FROM RolEtapaCatalogo WHERE id_etapa = ?', [id]);
    if (rolRefs[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar la etapa porque está asignada a uno o más roles' 
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

// Crear cliente

// Actualizar cliente

// Eliminar cliente

// ============================================
// ENDPOINTS PARA ASIGNACIONES DE ROLES
// ============================================

// Obtener todas las asignaciones
app.get('/api/asignaciones', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { empresa, year, month } = req.query;
    const params = [];
    let where = ' WHERE 1=1';
    if (empresa) { where += ' AND ar.id_empresa = ?'; params.push(Number(empresa)); }
    if (year) { where += ' AND YEAR(ar.fecha_asignacion) = ?'; params.push(Number(year)); }
    if (month) { where += ' AND MONTH(ar.fecha_asignacion) = ?'; params.push(Number(month)); }

    const [rows] = await pool.query(
      `SELECT ar.*, 
              e.nombre, e.apellido, e.correo,
              r.nombre_rol,
              emp.nombre_empresa
       FROM AsignacionRol ar
       LEFT JOIN Empleado e ON ar.id_empleado = e.id_empleado
       LEFT JOIN Rol r ON ar.id_rol = r.id_rol
       LEFT JOIN Empresa emp ON ar.id_empresa = emp.id_empresa
       ${where}
       ORDER BY ar.id_asignacion ASC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo asignaciones:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear asignación
app.post('/api/asignaciones', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id_empleado, id_rol, id_empresa } = req.body;

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

    // Verificar si la empresa existe
    const [empresa] = await pool.query('SELECT id_empresa FROM Empresa WHERE id_empresa = ?', [id_empresa]);
    if (empresa.length === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }

    // Verificar si ya existe la asignación
    const [existing] = await pool.query(
      'SELECT id_asignacion FROM AsignacionRol WHERE id_empleado = ? AND id_rol = ? AND id_empresa = ?',
      [id_empleado, id_rol, id_empresa]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Esta asignación ya existe' });
    }

    const [result] = await pool.query(
      'INSERT INTO AsignacionRol (id_empleado, id_rol, id_empresa) VALUES (?, ?, ?)',
      [id_empleado, id_rol, id_empresa]
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
 
// ============================================
// ENDPOINTS PARA USUARIOS AUTENTICADOS (EMPLEADOS)
// ============================================

// Utilidad: Instanciar etapas para un proceso dado según plantillas por rol y asignaciones a la empresa
const instanciarEtapasParaProceso = async (id_proceso, id_empresa) => {
  // Para todos los roles que tengan etapas definidas y asignaciones en la empresa, crear EtapaProceso
  // Nota: Evitar duplicados si ya existen
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [plantilla] = await conn.query(
      `SELECT DISTINCT rec.id_rol, rec.id_etapa, rec.orden
       FROM RolEtapaCatalogo rec
       WHERE EXISTS (
         SELECT 1 FROM AsignacionRol ar WHERE ar.id_rol = rec.id_rol AND ar.id_empresa = ?
       )
       ORDER BY rec.id_rol, rec.orden ASC`,
      [id_empresa]
    );

    for (const row of plantilla) {
      await conn.query(
        `INSERT INTO EtapaProceso (id_proceso, id_rol, id_etapa)
         SELECT ?, ?, ? FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM EtapaProceso WHERE id_proceso = ? AND id_rol = ? AND id_etapa = ?
         )`,
        [id_proceso, row.id_rol, row.id_etapa, id_proceso, row.id_rol, row.id_etapa]
      );
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error('Error instanciando etapas del proceso:', e);
  } finally {
    conn.release();
  }
};

// Obtener info del usuario actual (incluye id_empleado si aplica)
app.get('/api/me', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.nombre_completo, u.correo, u.tipo_usuario, u.foto_perfil,
              u.id_empleado
       FROM Usuario u
       WHERE u.id_usuario = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Verificar contraseña del usuario actual (no restringido a admin)
app.post('/api/verify-password', verificarToken, async (req, res) => {
  const { contrasena } = req.body;
  if (!contrasena) {
    return res.status(400).json({ success: false, message: 'Contraseña requerida' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT contrasena FROM Usuario WHERE id_usuario = ? LIMIT 1',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    const ok = await bcrypt.compare(contrasena, rows[0].contrasena);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error verificando contraseña de usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener procesos asignados al empleado autenticado (sin cliente)
app.get('/api/mis-procesos', verificarToken, async (req, res) => {
  try {
    const [usrRows] = await pool.query(
      'SELECT id_empleado FROM Usuario WHERE id_usuario = ? LIMIT 1',
      [req.user.id]
    );
    const empleadoId = usrRows?.[0]?.id_empleado || null;
    if (!empleadoId) {
      return res.status(403).json({ success: false, message: 'Solo empleados pueden acceder a sus procesos' });
    }

    const { empresa, rol, from, to, month, year } = req.query;

    const params = [empleadoId];
    let whereFecha = '';
    if (from && to) {
      whereFecha = ' AND p.fecha_creacion BETWEEN ? AND ?';
      params.push(from, to);
    } else if (month && year) {
      whereFecha = ' AND MONTH(p.fecha_creacion) = ? AND YEAR(p.fecha_creacion) = ?';
      params.push(Number(month), Number(year));
    }

    let whereEmpresa = '';
    if (empresa) {
      whereEmpresa = ' AND p.id_empresa = ?';
      params.push(Number(empresa));
    }

    let whereRol = '';
    if (rol) {
      whereRol = ' AND r.nombre_rol = ?';
      params.push(String(rol));
    }

    const [rows] = await pool.query(
      `SELECT DISTINCT p.*, e.nombre_empresa, e.correo_empresa,
              r.nombre_rol
       FROM Proceso p
       INNER JOIN Empresa e ON p.id_empresa = e.id_empresa
       INNER JOIN AsignacionRol ar ON ar.id_empresa = p.id_empresa
       INNER JOIN Rol r ON ar.id_rol = r.id_rol
       WHERE ar.id_empleado = ?${whereFecha}${whereEmpresa}${whereRol}
       ORDER BY p.fecha_creacion DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo mis procesos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener etapas de un proceso para el empleado autenticado
app.get('/api/mis-procesos/:id/etapas', verificarToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Obtener id_empleado del usuario autenticado
    const [usrRows] = await pool.query('SELECT id_empleado FROM Usuario WHERE id_usuario = ? LIMIT 1', [req.user.id]);
    const empleadoId = usrRows?.[0]?.id_empleado || null;
    if (!empleadoId) {
      return res.status(403).json({ success: false, message: 'Solo empleados pueden acceder a sus etapas' });
    }

    // Verificar empresa del proceso
    const [proc] = await pool.query('SELECT id_empresa FROM Proceso WHERE id_proceso = ? LIMIT 1', [id]);
    if (proc.length === 0) {
      return res.status(404).json({ success: false, message: 'Proceso no encontrado' });
    }

    // Traer solo etapas cuyos roles estén asignados al empleado en la empresa del proceso
    const [rows] = await pool.query(
      `SELECT ep.*, r.nombre_rol, et.nombre_etapa, et.descripcion AS etapa_descripcion
       FROM EtapaProceso ep
       INNER JOIN Proceso p ON p.id_proceso = ep.id_proceso
       LEFT JOIN Rol r ON ep.id_rol = r.id_rol
       LEFT JOIN EtapaCatalogo et ON ep.id_etapa = et.id_etapa
       WHERE ep.id_proceso = ?
         AND EXISTS (
           SELECT 1 FROM AsignacionRol ar
           WHERE ar.id_empleado = ? AND ar.id_rol = ep.id_rol AND ar.id_empresa = p.id_empresa AND ar.estado = 'Activo'
         )
       ORDER BY ep.fecha_inicio ASC, ep.id_etapa_proceso ASC`,
      [id, empleadoId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo etapas del proceso del empleado:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar estado de una etapa del proceso por el empleado autenticado (requiere contraseña)
app.put('/api/etapas-proceso/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { estado, contrasena } = req.body;

  if (!estado) {
    return res.status(400).json({ success: false, message: 'Estado requerido' });
  }
  if (!contrasena) {
    return res.status(400).json({ success: false, message: 'Contraseña requerida' });
  }

  try {
    // Validar contraseña del usuario actual
    const [usrRows] = await pool.query('SELECT contrasena, id_empleado FROM Usuario WHERE id_usuario = ? LIMIT 1', [req.user.id]);
    if (usrRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    const ok = await bcrypt.compare(contrasena, usrRows[0].contrasena);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    const empleadoId = usrRows[0].id_empleado;
    if (!empleadoId) {
      return res.status(403).json({ success: false, message: 'Solo empleados pueden actualizar etapas' });
    }

    // Verificar que el empleado tenga asignación al rol de la etapa en la empresa del proceso
    const [etapaRows] = await pool.query(
      `SELECT ep.id_etapa_proceso, ep.estado, ep.id_rol, p.id_empresa
       FROM EtapaProceso ep
       INNER JOIN Proceso p ON p.id_proceso = ep.id_proceso
       WHERE ep.id_etapa_proceso = ?
       LIMIT 1`,
      [id]
    );

    if (etapaRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Etapa no encontrada para este empleado' });
    }

    const etapa = etapaRows[0];
    const [authRows] = await pool.query(
      `SELECT 1 FROM AsignacionRol WHERE id_empleado = ? AND id_rol = ? AND id_empresa = ? LIMIT 1`,
      [empleadoId, etapa.id_rol, etapa.id_empresa]
    );
    if (authRows.length === 0) {
      return res.status(403).json({ success: false, message: 'No autorizado para actualizar esta etapa' });
    }

    // Actualizar estado y fecha_fin si se completa
    const setFechaFin = estado === 'Completada' ? ', fecha_fin = NOW()' : '';
    await pool.query(
      `UPDATE EtapaProceso SET estado = ?${setFechaFin} WHERE id_etapa_proceso = ?`,
      [estado, id]
    );

    res.json({ success: true, message: 'Etapa actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando etapa del proceso:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ============================================
// ENDPOINTS CRUD PARA ETAPAS POR ROL (RolEtapaCatalogo)
// ============================================

// Obtener asignaciones de etapas por rol
app.get('/api/rol-etapas', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT rec.id_rol, r.nombre_rol, rec.id_etapa, et.nombre_etapa, rec.orden
      FROM RolEtapaCatalogo rec
      INNER JOIN Rol r ON rec.id_rol = r.id_rol
      INNER JOIN EtapaCatalogo et ON rec.id_etapa = et.id_etapa
      ORDER BY rec.id_rol ASC, rec.orden ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo etapas por rol:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear asignación etapa-rol
app.post('/api/rol-etapas', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { id_rol } = req.body;
  try {
    const idEtapas = Array.isArray(req.body.id_etapas) ? req.body.id_etapas : (req.body.id_etapas ? [req.body.id_etapas] : []);
    const orden = Number(req.body.orden) || 1;
    if (!id_rol || idEtapas.length === 0) {
      return res.status(400).json({ success: false, message: 'id_rol e id_etapas son requeridos' });
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const id_etapa of idEtapas) {
        await conn.query(
          'INSERT INTO RolEtapaCatalogo (id_rol, id_etapa, orden) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE orden = VALUES(orden)',
          [id_rol, Number(id_etapa), orden]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    res.status(201).json({ success: true, message: 'Etapas asignadas al rol' });
  } catch (error) {
    console.error('Error creando etapa por rol:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar orden de una asignación etapa-rol
app.put('/api/rol-etapas/:idRol/:idEtapa', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { idRol, idEtapa } = req.params;
  const { orden } = req.body;
  try {
    await pool.query(
      'UPDATE RolEtapaCatalogo SET orden = ? WHERE id_rol = ? AND id_etapa = ?',
      [Number(orden), idRol, idEtapa]
    );
    res.json({ success: true, message: 'Orden actualizado' });
  } catch (error) {
    console.error('Error actualizando etapa por rol:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar una asignación etapa-rol
app.delete('/api/rol-etapas/:idRol/:idEtapa', verificarToken, verificarAdmin, verificarPasswordAdmin, async (req, res) => {
  const { idRol, idEtapa } = req.params;
  try {
    await pool.query('DELETE FROM RolEtapaCatalogo WHERE id_rol = ? AND id_etapa = ?', [idRol, idEtapa]);
    res.json({ success: true, message: 'Asignación eliminada' });
  } catch (error) {
    console.error('Error eliminando etapa por rol:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Hook: si en crear/editar etapa se envía id_rol, registrar/actualizar en RolEtapaCatalogo