// server.js (inicio actualizado)
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import { emailConfig } from "./config.js";

dotenv.config(); // carga .env en desarrollo

const app = express();
app.use(cors());
app.use(express.json());

// Helper
const toNumber = (v, fallback) => (v ? Number(v) : fallback);

// Crear pool: usar DATABASE_URL si existe (Railway), si no, usar variables por piezas (local)
let pool;
if (process.env.DATABASE_URL) {
  console.log("🔌 Conectando a MySQL usando DATABASE_URL");
  pool = mysql.createPool(process.env.DATABASE_URL);
} else {
  console.log("🔧 DATABASE_URL no encontrada — usando configuración local por piezas");
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "CVR_LDD",
    port: toNumber(process.env.DB_PORT, 3306),
    waitForConnections: true,
    connectionLimit: toNumber(process.env.DB_CONN_LIMIT, 10),
    queueLimit: 0
  });
}

// Comprobar conexión (no aborta el proceso si falla)
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Conexión inicial a MySQL: OK");
  } catch (err) {
    console.error("⚠️ Error inicial al conectar a MySQL (se seguirá ejecutando la app):", err.message);
  }
})();

// Secret for JWT
const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro";

// Configuración de nodemailer para envío de correos (solo si hay credenciales)
let transporter = null;
let EMAIL_ENABLED = false;
try {
  if (emailConfig.auth.user && emailConfig.auth.pass) {
    transporter = nodemailer.createTransport(emailConfig);
    EMAIL_ENABLED = true;
    console.log('✉️ Email enabled: transporter configured');
  } else {
    console.log('✉️ Email disabled: EMAIL_USER or EMAIL_PASS not provided');
  }
} catch (err) {
  transporter = null;
  EMAIL_ENABLED = false;
  console.warn('✉️ Error configuring transporter, emails disabled:', err.message || err);
}

const sendMailSafe = async (mailOptions) => {
  if (!EMAIL_ENABLED || !transporter) {
    console.log('✉️ Skipping sendMail (disabled). mailOptions:', { to: mailOptions.to, subject: mailOptions.subject });
    return null;
  }
  return transporter.sendMail(mailOptions);
};



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
      JWT_SECRET,
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

    const result = await sendMailSafe(mailOptions);
    if (result) {
      console.log(` Correo de bienvenida enviado exitosamente a: ${correo}`);
      console.log(` Message ID: ${result.messageId}`);
    }
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

    const result = await sendMailSafe(mailOptions);
    if (result) {
      console.log(` Notificación de login enviada exitosamente a: ${correo}`);
      console.log(` Message ID: ${result.messageId}`);
    }
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
    const decoded = jwt.verify(token, JWT_SECRET);
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

// Middleware para permitir acceso a Secretarias o Administradores
const verificarSecretariaOrAdmin = (req, res, next) => {
  if (req.user.tipo === 'administrador') return next();
  const rol = String(req.user.rol || '').toLowerCase();
  if (rol.includes('secretaria')) return next();
  return res.status(403).json({ success: false, message: 'Acceso denegado. Solo secretarias o administradores.' });
};

// Middleware para verificar contraseña: admin o usuario actual
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

const verificarPasswordActualOAdmin = async (req, res, next) => {
  const contrasena = req.body?.adminContrasena || req.body?.contrasena;
  if (!contrasena) {
    return res.status(400).json({ success: false, message: 'Contraseña requerida' });
  }
  try {
    if (req.user.tipo === 'administrador') {
      // reutilizar lógica admin
      const [adminRows] = await pool.query(
        'SELECT contrasena FROM Usuario WHERE id_usuario = ? AND tipo_usuario = "administrador" LIMIT 1',
        [req.user.id]
      );
      if (adminRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Administrador no encontrado' });
      }
      const ok = await bcrypt.compare(contrasena, adminRows[0].contrasena);
      if (!ok) return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
      return next();
    }
    // validar password del usuario actual (empleado/secretaria)
    const [rows] = await pool.query('SELECT contrasena FROM Usuario WHERE id_usuario = ? LIMIT 1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const ok = await bcrypt.compare(contrasena, rows[0].contrasena);
    if (!ok) return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
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

    // Importante: los filtros de mes/año se aplican al "mes asignado" del proceso,
    // que es el mes anterior a la fecha de creación
    if (year) { where += ' AND YEAR(DATE_SUB(p.fecha_creacion, INTERVAL 1 MONTH)) = ?'; params.push(Number(year)); }
    if (month) { where += ' AND MONTH(DATE_SUB(p.fecha_creacion, INTERVAL 1 MONTH)) = ?'; params.push(Number(month)); }

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
app.get('/api/papeleria', verificarToken, verificarSecretariaOrAdmin, async (req, res) => {
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
app.post('/api/papeleria', verificarToken, verificarSecretariaOrAdmin, verificarPasswordActualOAdmin, async (req, res) => {
  const { id_empresa, descripcion, tipo_papeleria } = req.body;

  try {
    const [empresa] = await pool.query('SELECT id_empresa FROM Empresa WHERE id_empresa = ?', [id_empresa]);
    if (empresa.length === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }

    // Validar unicidad por empresa/mes asignado/tipo (solo un proceso de Venta y uno de Compra por mes)
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prev.getMonth() + 1; // 1-12
    const prevYear = prev.getFullYear();

    const [[dup]] = await pool.query(
      `SELECT COUNT(*) AS cnt
       FROM Proceso p
       WHERE p.id_empresa = ? AND p.tipo_proceso = ?
         AND YEAR(DATE_SUB(p.fecha_creacion, INTERVAL 1 MONTH)) = ?
         AND MONTH(DATE_SUB(p.fecha_creacion, INTERVAL 1 MONTH)) = ?`,
      [id_empresa, tipo_papeleria, prevYear, prevMonth]
    );
    if (Number(dup?.cnt || 0) > 0) {
      const alterno = tipo_papeleria === 'Venta' ? 'Compra' : 'Venta';
      return res.status(400).json({ success: false, message: `Ya existe un proceso de ${tipo_papeleria} para este mes asignado. Solo puedes registrar ${alterno}.` });
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
app.put('/api/papeleria/:id', verificarToken, verificarSecretariaOrAdmin, verificarPasswordActualOAdmin, async (req, res) => {
  const { id } = req.params;
  const { descripcion, estado, fecha_entrega, tipo_papeleria } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM Papeleria WHERE id_papeleria = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Papelería no encontrada' });
    }

    // Si se intenta cambiar el tipo, validar unicidad en el mes asignado
    if (tipo_papeleria && tipo_papeleria !== existing[0].tipo_papeleria) {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonth = prev.getMonth() + 1;
      const prevYear = prev.getFullYear();
      const [[dup]] = await pool.query(
        `SELECT COUNT(*) AS cnt
         FROM Proceso p
         WHERE p.id_empresa = ? AND p.tipo_proceso = ?
           AND YEAR(DATE_SUB(p.fecha_creacion, INTERVAL 1 MONTH)) = ?
           AND MONTH(DATE_SUB(p.fecha_creacion, INTERVAL 1 MONTH)) = ?`,
        [existing[0].id_empresa, tipo_papeleria, prevYear, prevMonth]
      );
      if (Number(dup?.cnt || 0) > 0) {
        const alterno = tipo_papeleria === 'Venta' ? 'Compra' : 'Venta';
        return res.status(400).json({ success: false, message: `Ya existe un proceso de ${tipo_papeleria} para este mes asignado. Solo puedes usar ${alterno}.` });
      }
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
    // Marcar la etapa "Ingreso de papelería" como completada para este proceso
    try {
      await pool.query(
        `UPDATE EtapaProceso ep
         JOIN EtapaCatalogo ec ON ep.id_etapa = ec.id_etapa
         SET ep.estado = 'Completada', ep.fecha_inicio = NOW(), ep.fecha_fin = NOW()
         WHERE ep.id_proceso = ? AND ec.nombre_etapa LIKE 'Ingreso de papeler%'
        `,
        [result.insertId]
      );
    } catch (err) {
      console.error('Error marcando ingreso de papelería como completada:', err);
    }

    // Enviar notificaciones por email a empleados asignados
    enviarNotificacionNuevoProceso(result.insertId, id_empresa);

    return result.insertId;
  } catch (error) {
    console.error('Error creando proceso desde papelería:', error);
    return null;
  }
};

// Eliminar papelería
app.delete('/api/papeleria/:id', verificarToken, verificarSecretariaOrAdmin, verificarPasswordActualOAdmin, async (req, res) => {
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
// FUNCIONES PARA NOTIFICACIONES POR CORREO
// ============================================

// Función para enviar email cuando se crea un nuevo proceso
const enviarNotificacionNuevoProceso = async (idProceso, idEmpresa) => {
  try {
    // Obtener información del proceso y empresa
    const [[proc]] = await pool.query(`
      SELECT p.nombre_proceso, e.nombre_empresa, e.correo_empresa
      FROM Proceso p
      INNER JOIN Empresa e ON e.id_empresa = p.id_empresa
      WHERE p.id_proceso = ?
    `, [idProceso]);
    
    if (!proc) return;

    // Obtener empleados asignados a roles en esta empresa
    const [empleados] = await pool.query(`
      SELECT DISTINCT u.correo, u.nombre_completo,
             GROUP_CONCAT(DISTINCT ec.nombre_etapa ORDER BY rec.orden SEPARATOR ', ') as etapas_responsabilidades
      FROM AsignacionRol ar
      INNER JOIN Usuario u ON u.id_empleado = ar.id_empleado
      INNER JOIN Rol r ON r.id_rol = ar.id_rol
      INNER JOIN RolEtapaCatalogo rec ON rec.id_rol = r.id_rol
      INNER JOIN EtapaCatalogo ec ON ec.id_etapa = rec.id_etapa
      WHERE ar.id_empresa = ? AND u.correo IS NOT NULL AND LENGTH(u.correo) > 0
      GROUP BY u.correo, u.nombre_completo
    `, [idEmpresa]);

    // Enviar email a cada empleado
    for (const emp of empleados) {
      const mailOptions = {
        from: emailConfig.from,
        to: emp.correo,
        subject: `Nuevo Proceso Asignado: ${proc.nombre_proceso}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; background: #122745; padding: 20px; color: white;">
              <h1>Nuevo Proceso Asignado</h1>
              <p>CVR Asesoría - Sistema de Procesos</p>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
              <h2>Hola ${emp.nombre_completo},</h2>
              <p>Te ha sido asignado un nuevo proceso en la empresa <strong>${proc.nombre_empresa}</strong>.</p>
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1976d2;">Detalles del Proceso:</h3>
                <p><strong>Proceso:</strong> ${proc.nombre_proceso}</p>
                <p><strong>Empresa:</strong> ${proc.nombre_empresa}</p>
                <p><strong>Tus responsabilidades:</strong> ${emp.etapas_responsabilidades || 'Sin etapas definidas'}</p>
              </div>
              <p>Por favor, revisa el sistema para comenzar con tus tareas asignadas.</p>
              <div style="text-align: center; margin: 20px 0;">
                <div style="background: #122745; color: white; padding: 20px; border-radius: 10px; display: inline-block;">
                  <h2 style="margin: 0; font-size: 24px;">CVR ASESORÍA</h2>
                  <p style="margin: 5px 0 0 0; font-size: 14px;">Asesoría y Soluciones Óptimas</p>
                </div>
              </div>
              <p>¡Gracias por tu dedicación!</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    console.log(`Notificaciones enviadas para nuevo proceso ${proc.nombre_proceso}`);
  } catch (error) {
    console.error('Error enviando notificación de nuevo proceso:', error);
  }
};

// Función para enviar email cuando una etapa clave se completa: notifica al siguiente revisor elegible
const enviarNotificacionEtapaCompletada = async (idProceso) => {
  try {
    // Obtener el proceso y empresa
    const [[proc]] = await pool.query(`
      SELECT p.nombre_proceso, e.nombre_empresa, e.id_empresa
      FROM Proceso p
      INNER JOIN Empresa e ON e.id_empresa = p.id_empresa
      WHERE p.id_proceso = ?
    `, [idProceso]);

    if (!proc) return;

    // Revisores completados (por número)
    const [etapasCompletadas] = await pool.query(`
      SELECT r.nombre_rol
      FROM EtapaProceso ep
      INNER JOIN Rol r ON ep.id_rol = r.id_rol
      WHERE ep.id_proceso = ? AND ep.estado = 'Completada' AND r.nombre_rol LIKE 'Revisor %'
    `, [idProceso]);
    const revisoresCompletados = etapasCompletadas
      .map(e => parseInt(String(e.nombre_rol).replace(/[^0-9]/g, ''), 10))
      .filter(n => !isNaN(n));

    // Determinar siguiente revisor pendiente (1..3)
    let siguienteRevisor = null;
    for (let i = 1; i <= 3; i++) {
      if (!revisoresCompletados.includes(i)) { siguienteRevisor = i; break; }
    }
    if (siguienteRevisor === null) {
      // No hay siguiente revisor; probablemente ya terminaron todos
      return;
    }

    // Verificar elegibilidad por ORDEN: todas las etapas anteriores (no de revisión) deben estar completadas
    const [[ordenRevRow]] = await pool.query(`
      SELECT MIN(rec.orden) AS minOrden
      FROM EtapaProceso ep
      INNER JOIN Rol r ON r.id_rol = ep.id_rol
      INNER JOIN RolEtapaCatalogo rec ON rec.id_rol = ep.id_rol AND rec.id_etapa = ep.id_etapa
      WHERE ep.id_proceso = ? AND r.nombre_rol = ?
    `, [idProceso, `Revisor ${siguienteRevisor}`]);
    const minOrdenRevisor = Number(ordenRevRow?.minOrden || 0);

    if (minOrdenRevisor > 0) {
      const [[pendPrev]] = await pool.query(`
        SELECT COUNT(*) AS pendientes
        FROM EtapaProceso ep2
        INNER JOIN RolEtapaCatalogo rec2 ON rec2.id_rol = ep2.id_rol AND rec2.id_etapa = ep2.id_etapa
        INNER JOIN EtapaCatalogo ec2 ON ec2.id_etapa = ep2.id_etapa
        WHERE ep2.id_proceso = ?
          AND rec2.orden < ?
          AND ep2.estado <> 'Completada'
          AND ec2.es_revision = FALSE
      `, [idProceso, minOrdenRevisor]);
      if (Number(pendPrev?.pendientes || 0) > 0) {
        // Aún hay etapas previas (no de revisión) sin completar; no notificar todavía
        return;
      }
    }

    // Obtener el empleado asignado al siguiente revisor
    const [empleados] = await pool.query(`
      SELECT DISTINCT u.correo, u.nombre_completo
      FROM AsignacionRol ar
      INNER JOIN Usuario u ON u.id_empleado = ar.id_empleado
      INNER JOIN Rol r ON r.id_rol = ar.id_rol
      WHERE ar.id_empresa = ? AND r.nombre_rol = ? AND u.correo IS NOT NULL AND LENGTH(u.correo) > 0
      LIMIT 1
    `, [proc.id_empresa, `Revisor ${siguienteRevisor}`]);

    if (!empleados || empleados.length === 0) return;

    const emp = empleados[0];

    const mailOptions = {
      from: emailConfig.from,
      to: emp.correo,
      subject: `Proceso listo para tu revisión (Revisor ${siguienteRevisor}): ${proc.nombre_proceso}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; background: #122745; padding: 20px; color: white;">
            <h1>Revisión requerida</h1>
            <p>CVR Asesoría - Sistema de Procesos</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h2>Hola ${emp.nombre_completo},</h2>
            <p>El proceso <strong>${proc.nombre_proceso}</strong> de la empresa <strong>${proc.nombre_empresa}</strong> está listo para tu nivel de revisión (Revisor ${siguienteRevisor}).</p>
            <p>Ingresa al sistema para continuar con tu revisión.</p>
            <div style="text-align: center; margin: 20px 0;">
              <div style="background: #122745; color: white; padding: 20px; border-radius: 10px; display: inline-block;">
                <h2 style="margin: 0; font-size: 24px;">CVR ASESORÍA</h2>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Asesoría y Soluciones Óptimas</p>
              </div>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Notificación enviada al siguiente revisor (${siguienteRevisor}) -> ${emp.correo}`);
  } catch (error) {
    console.error('Error enviando notificación al siguiente revisor:', error);
  }
};

// Función para enviar email cuando todas las revisiones se completan
const enviarNotificacionProcesocompletado = async (idProceso) => {
  try {
    // Obtener información del proceso
    const [[proc]] = await pool.query(`
      SELECT p.nombre_proceso, e.nombre_empresa, e.correo_empresa
      FROM Proceso p
      INNER JOIN Empresa e ON e.id_empresa = p.id_empresa
      WHERE p.id_proceso = ?
    `, [idProceso]);

    if (!proc) return;

    // Obtener secretaria (usuario con rol que incluye 'secretaria')
    const [secretarias] = await pool.query(`
      SELECT DISTINCT u.correo, u.nombre_completo
      FROM AsignacionRol ar
      INNER JOIN Usuario u ON u.id_empleado = ar.id_empleado
      INNER JOIN Rol r ON r.id_rol = ar.id_rol
      WHERE ar.id_empresa = (SELECT id_empresa FROM Proceso WHERE id_proceso = ?)
        AND r.nombre_rol LIKE '%secretaria%' AND u.correo IS NOT NULL
    `, [idProceso]);

    // Obtener jefe de revisión (usuario con rol 'Jefe de Revisión' o similar, asumiendo 'Revisor 3' o nombre específico)
    const [jefesRevision] = await pool.query(`
      SELECT DISTINCT u.correo, u.nombre_completo
      FROM AsignacionRol ar
      INNER JOIN Usuario u ON u.id_empleado = ar.id_empleado
      INNER JOIN Rol r ON r.id_rol = ar.id_rol
      WHERE ar.id_empresa = (SELECT id_empresa FROM Proceso WHERE id_proceso = ?)
        AND (r.nombre_rol LIKE '%jefe%' OR r.nombre_rol LIKE '%revision%' OR r.nombre_rol = 'Administrador')
        AND u.correo IS NOT NULL
    `, [idProceso]);

    // Lista de destinatarios únicos
    const destinatarios = [];
    const emailsVistos = new Set();

    // Añadir secretarias
    for (const sec of secretarias) {
      if (sec.correo && !emailsVistos.has(sec.correo)) {
        emailsVistos.add(sec.correo);
        destinatarios.push({ correo: sec.correo, nombre: sec.nombre_completo });
      }
    }

    // Añadir jefes de revisión
    for (const jefe of jefesRevision) {
      if (jefe.correo && !emailsVistos.has(jefe.correo)) {
        emailsVistos.add(jefe.correo);
        destinatarios.push({ correo: jefe.correo, nombre: jefe.nombre_completo });
      }
    }

    // Enviar email a cada destinatario
    for (const dest of destinatarios) {
      const mailOptions = {
        from: emailConfig.from,
        to: dest.correo,
        subject: `Proceso Completado: ${proc.nombre_proceso}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; background: #122745; padding: 20px; color: white;">
              <h1>Proceso Completado</h1>
              <p>CVR Asesoría - Sistema de Procesos</p>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
              <h2>Hola ${dest.nombre},</h2>
              <p>El proceso <strong>${proc.nombre_proceso}</strong> de la empresa <strong>${proc.nombre_empresa}</strong> ha sido completado exitosamente tras la aprobación de todas las revisiones.</p>
              <div style="text-align: center; margin: 20px 0;">
                <div style="background: #122745; color: white; padding: 20px; border-radius: 10px; display: inline-block;">
                  <h2 style="margin: 0; font-size: 24px;">CVR ASESORÍA</h2>
                  <p style="margin: 5px 0 0 0; font-size: 14px;">Asesoría y Soluciones Óptimas</p>
                </div>
              </div>
              <p>El proceso está listo para los siguientes pasos.</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    console.log(`Notificaciones enviadas por proceso completado ${proc.nombre_proceso}`);
  } catch (error) {
    console.error('Error enviando notificación de proceso completado:', error);
  }
};

// Función para enviar email cuando el proceso es enviado por secretaria (finalizado 100%)
// Requerimiento: NO enviar a la empresa; enviar a administradores y al titular de config.js
const enviarNotificacionProcesoEnviado = async (idProceso) => {
  try {
    // Obtener información del proceso
    const [[proc]] = await pool.query(`
      SELECT p.nombre_proceso, e.nombre_empresa
      FROM Proceso p
      INNER JOIN Empresa e ON e.id_empresa = p.id_empresa
      WHERE p.id_proceso = ?
    `, [idProceso]);

    if (!proc) return;

    // Obtener administradores
    const [admins] = await pool.query(`
      SELECT correo, nombre_completo
      FROM Usuario
      WHERE tipo_usuario = 'administrador' AND correo IS NOT NULL AND LENGTH(correo) > 0
    `);

    const destinatarios = [];
    const emailsVistos = new Set();

    // Añadir administradores
    for (const admin of admins) {
      if (admin.correo && !emailsVistos.has(admin.correo)) {
        emailsVistos.add(admin.correo);
        destinatarios.push({ correo: admin.correo, nombre: admin.nombre_completo });
      }
    }

    // Añadir titular definido en config.js (auth.user)
    if (emailConfig?.auth?.user && !emailsVistos.has(emailConfig.auth.user)) {
      emailsVistos.add(emailConfig.auth.user);
      destinatarios.push({ correo: emailConfig.auth.user, nombre: 'Titular CVR' });
    }

    // Enviar email a cada destinatario
    for (const dest of destinatarios) {
      const mailOptions = {
        from: emailConfig.from,
        to: dest.correo,
        subject: `Proceso Terminado: ${proc.nombre_proceso}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; background: #122745; padding: 20px; color: white;">
              <h1>Proceso Terminado</h1>
              <p>CVR Asesoría - Sistema de Procesos</p>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
              <h2>Hola ${dest.nombre || ''}</h2>
              <p>El proceso <strong>${proc.nombre_proceso}</strong> de la empresa <strong>${proc.nombre_empresa}</strong> ha sido completado al 100% y enviado por Secretaría.</p>
              <div style="text-align: center; margin: 20px 0;">
                <div style="background: #122745; color: white; padding: 20px; border-radius: 10px; display: inline-block;">
                  <h2 style="margin: 0; font-size: 24px;">CVR ASESORÍA</h2>
                  <p style="margin: 5px 0 0 0; font-size: 14px;">Asesoría y Soluciones Óptimas</p>
                </div>
              </div>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    console.log(`Notificaciones enviadas por proceso terminado ${proc.nombre_proceso}`);
  } catch (error) {
    console.error('Error enviando notificación de proceso enviado:', error);
  }
};

// ============================================
// ENDPOINTS CRUD PARA CLIENTES
// ============================================

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
      // Rango explícito sobre fecha de creación
      whereFecha = ' AND p.fecha_creacion BETWEEN ? AND ?';
      params.push(from, to);
    } else if (month && year) {
      // Mes + año aplicados al "mes asignado" (fecha_creacion - 1 mes)
      whereFecha = ' AND MONTH(DATE_SUB(p.fecha_creacion, INTERVAL 1 MONTH)) = ? AND YEAR(DATE_SUB(p.fecha_creacion, INTERVAL 1 MONTH)) = ?';
      params.push(Number(month), Number(year));
    } else if (year) {
      // Solo año del mes asignado
      whereFecha = ' AND YEAR(DATE_SUB(p.fecha_creacion, INTERVAL 1 MONTH)) = ?';
      params.push(Number(year));
    } else if (month) {
      // Solo mes del mes asignado (asumir año actual)
      const currentYear = new Date().getFullYear();
      whereFecha = ' AND MONTH(DATE_SUB(p.fecha_creacion, INTERVAL 1 MONTH)) = ? AND YEAR(DATE_SUB(p.fecha_creacion, INTERVAL 1 MONTH)) = ?';
      params.push(Number(month), currentYear);
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
       AND p.estado <> 'Completado'
       ORDER BY p.fecha_creacion DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo mis procesos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Empresas asignadas al empleado autenticado
app.get('/api/mis-empresas', verificarToken, async (req, res) => {
  try {
    const [usrRows] = await pool.query('SELECT id_empleado FROM Usuario WHERE id_usuario = ? LIMIT 1', [req.user.id]);
    const empleadoId = usrRows?.[0]?.id_empleado || null;
    if (!empleadoId) {
      return res.status(403).json({ success: false, message: 'Solo empleados pueden acceder a sus empresas' });
    }

    const [rows] = await pool.query(
      `SELECT DISTINCT emp.id_empresa, emp.nombre_empresa
       FROM AsignacionRol ar
       INNER JOIN Empresa emp ON emp.id_empresa = ar.id_empresa
       WHERE ar.id_empleado = ? AND ar.estado = 'Activo'
       ORDER BY emp.nombre_empresa ASC`,
      [empleadoId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo mis empresas:', error);
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

// ==========================
// ENDPOINTS PARA REVISOR
// ==========================

// Lista procesos disponibles para el revisor (solo su rol)
app.get('/api/revisor/procesos-terminados', verificarToken, async (req, res) => {
  try {
    // obtener id_empleado
    const [usrRows] = await pool.query('SELECT id_empleado, nombre_completo FROM Usuario WHERE id_usuario = ? LIMIT 1', [req.user.id]);
    const empleadoId = usrRows?.[0]?.id_empleado || null;
    if (!empleadoId) return res.status(403).json({ success: false, message: 'Solo empleados pueden acceder a revisiones' });

    // Obtener roles asignados al empleado que son revisores
    const [roles] = await pool.query(
      `SELECT ar.id_rol, r.nombre_rol FROM AsignacionRol ar INNER JOIN Rol r ON ar.id_rol = r.id_rol WHERE ar.id_empleado = ? AND ar.estado = 'Activo' AND r.nombre_rol LIKE 'Revisor %'`,
      [empleadoId]
    );
    if (!roles || roles.length === 0) return res.status(403).json({ success: false, message: 'No tienes un rol de revisor asignado' });

    // Si tiene varios roles de revisor, considerar todos
    const roleIds = roles.map(r => r.id_rol);

    // Buscar procesos donde exista una etapa para este rol pendiente/en progreso
    // y además todas las etapas con orden menor estén completadas, considerando es_revision
    const [rows] = await pool.query(
      `SELECT DISTINCT p.* , e.nombre_empresa
       FROM Proceso p
       INNER JOIN EtapaProceso ep ON ep.id_proceso = p.id_proceso
       INNER JOIN RolEtapaCatalogo rec ON rec.id_rol = ep.id_rol AND rec.id_etapa = ep.id_etapa
       INNER JOIN EtapaCatalogo ec ON ec.id_etapa = ep.id_etapa
       INNER JOIN Empresa e ON e.id_empresa = p.id_empresa
       WHERE ep.id_rol IN (?) AND ep.estado IN ('Pendiente','En progreso')
         AND NOT EXISTS (
           SELECT 1 FROM EtapaProceso ep2
           INNER JOIN RolEtapaCatalogo rec2 ON rec2.id_rol = ep2.id_rol AND rec2.id_etapa = ep2.id_etapa
           INNER JOIN EtapaCatalogo ec2 ON ec2.id_etapa = ep2.id_etapa
           WHERE ep2.id_proceso = p.id_proceso AND rec2.orden < rec.orden
             AND ep2.estado <> 'Completada'
             AND NOT (ec2.es_revision = true AND rec2.orden < rec.orden)
         )
       ORDER BY p.fecha_creacion DESC`,
      [roleIds]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error en revisor/procesos-terminados:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener etapas de un proceso (para revisar y seleccionar etapa con error)
app.get('/api/revisor/procesos/:id/etapas', verificarToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [usrRows] = await pool.query('SELECT id_empleado, nombre_completo FROM Usuario WHERE id_usuario = ? LIMIT 1', [req.user.id]);
    const empleadoId = usrRows?.[0]?.id_empleado || null;
    if (!empleadoId) return res.status(403).json({ success: false, message: 'Solo empleados pueden acceder a revisiones' });

    // verificar que el revisor tenga asignación de rol revisor para este proceso
    const [roleRows] = await pool.query(
      `SELECT DISTINCT r.id_rol FROM AsignacionRol ar INNER JOIN Rol r ON ar.id_rol = r.id_rol WHERE ar.id_empleado = ? AND ar.estado = 'Activo' AND r.nombre_rol LIKE 'Revisor %'`,
      [empleadoId]
    );
    if (!roleRows || roleRows.length === 0) return res.status(403).json({ success: false, message: 'No tienes un rol de revisor asignado' });
    const roleIds = roleRows.map(r => r.id_rol);

    // devolver todas las etapas del proceso con info de catálogo
    const [rows] = await pool.query(
      `SELECT ep.id_etapa_proceso, ep.id_proceso, ep.id_rol, ep.id_etapa, ep.estado, ep.motivo_rechazo, ep.etapa_origen_error,
              ep.fecha_inicio, ep.fecha_fin, ec.nombre_etapa, ec.descripcion AS etapa_descripcion
       FROM EtapaProceso ep
       INNER JOIN EtapaCatalogo ec ON ec.id_etapa = ep.id_etapa
       WHERE ep.id_proceso = ?
       ORDER BY ep.id_etapa_proceso ASC`,
      [id]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error en revisor/procesos/:id/etapas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Rechazar un proceso (marcar etapa específica como con error y desmarcar posteriores hasta el nivel del revisor)
app.post('/api/revisor/procesos/:id/rechazar', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { etapasFallidas = [], motivo, contrasena } = req.body;
  if (!contrasena) return res.status(400).json({ success: false, message: 'Contraseña requerida' });
  if (!Array.isArray(etapasFallidas) || etapasFallidas.length === 0) return res.status(400).json({ success: false, message: 'Etapas fallidas requeridas' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // validar contraseña y obtener empleado
    const [[usr]] = await conn.query('SELECT contrasena, id_empleado, nombre_completo FROM Usuario WHERE id_usuario = ? LIMIT 1', [req.user.id]);
    if (!usr) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Usuario no encontrado' }); }
    const ok = await bcrypt.compare(contrasena, usr.contrasena);
    if (!ok) { await conn.rollback(); return res.status(401).json({ success: false, message: 'Contraseña incorrecta' }); }
    const empleadoId = usr.id_empleado;
    const revisorNombre = usr.nombre_completo;

    // obtener roles revisor asignados al empleado y determinar su nivel
    const [roleRows] = await conn.query(
      `SELECT ar.id_rol, r.nombre_rol 
       FROM AsignacionRol ar 
       INNER JOIN Rol r ON ar.id_rol = r.id_rol 
       WHERE ar.id_empleado = ? AND ar.estado = 'Activo' AND r.nombre_rol LIKE 'Revisor %'
       ORDER BY r.nombre_rol DESC
       LIMIT 1`, 
      [empleadoId]
    );
    if (!roleRows || roleRows.length === 0) { 
      await conn.rollback(); 
      return res.status(403).json({ success: false, message: 'No tienes rol de revisor' }); 
    }
    
    // Extraer el nivel del revisor del nombre del rol (ejemplo: 'Revisor 2' -> nivel 2)
    const nivelRevisor = parseInt(roleRows[0].nombre_rol.replace('Revisor ', '')) || 1;
    const roleIds = roleRows.map(r => r.id_rol);

    // verificar que el revisor esté autorizado para este proceso (exista al menos una etapa de su rol en el proceso)
    const [auth] = await conn.query('SELECT 1 FROM EtapaProceso WHERE id_proceso = ? AND id_rol IN (?) LIMIT 1', [id, roleIds]);
    if (!auth || auth.length === 0) { await conn.rollback(); return res.status(403).json({ success: false, message: 'No autorizado para revisar este proceso' }); }

    // obtener orden mínimo y etapa de catálogo de las etapas fallidas
    const [minOrderRow] = await conn.query(
      `SELECT 
         MIN(rec.orden) AS minOrden,
         ep.id_etapa AS catalog_etapa_id
       FROM EtapaProceso ep
       INNER JOIN RolEtapaCatalogo rec ON rec.id_rol = ep.id_rol AND rec.id_etapa = ep.id_etapa
       WHERE ep.id_etapa_proceso IN (?)
       GROUP BY ep.id_etapa
       HAVING minOrden = MIN(rec.orden)
       LIMIT 1`,
      [etapasFallidas.map(e => e.id_etapa_proceso)]
    );
    const minOrden = minOrderRow?.[0]?.minOrden;
    const catalogEtapaId = minOrderRow?.[0]?.catalog_etapa_id;
    if (!minOrden) { await conn.rollback(); return res.status(400).json({ success: false, message: 'No se pudo determinar orden de las etapas fallidas' }); }

    // determinar orden del nivel del revisor (mínimo orden de sus etapas en este proceso)
    const [revOrderRow] = await conn.query(
      `SELECT MIN(rec.orden) AS revOrden
       FROM EtapaProceso ep
       INNER JOIN RolEtapaCatalogo rec ON rec.id_rol = ep.id_rol AND rec.id_etapa = ep.id_etapa
       WHERE ep.id_proceso = ? AND ep.id_rol IN (?)`,
      [id, roleIds]
    );
    const revOrden = revOrderRow?.[0]?.revOrden || null;

    // 1. Marcar solo las etapas seleccionadas como Rechazadas, pero solo si tienen motivo
    const etapasFallidasValidas = etapasFallidas.filter(e => e.motivo && String(e.motivo).trim().length > 0);
    if (etapasFallidasValidas.length === 0) {
      // nada para hacer (ya validamos en cliente, pero doble chequeo)
    }

    for (const etapa of etapasFallidasValidas) {
      const motivoFull = `${revisorNombre}: ${etapa.motivo}`.trim();
      await conn.query(
        `UPDATE EtapaProceso 
         SET estado = 'Rechazada', 
             motivo_rechazo = ?, 
             fecha_fin = NOW() 
         WHERE id_etapa_proceso = ?`, 
        [motivoFull, etapa.id_etapa_proceso]
      );
    }

    // 2. Identificar la revisión exacta (nivel) que realizó el rechazo — usar el rol(es) del revisor autenticado
    // nivelRevisor ya calculado antes


    // Responder
    await conn.commit();
    res.json({ success: true, message: 'Proceso rechazado y etapas posteriores reiniciadas' });
  } catch (error) {
    await conn.rollback();
    console.error('Error en revisor/rechazar:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
});

// Aprobar un proceso desde el revisor (completar sus etapas y si corresponde marcar proceso completado)
app.post('/api/revisor/procesos/:id/aprobar', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { contrasena } = req.body;
  if (!contrasena) return res.status(400).json({ success: false, message: 'Contraseña requerida' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[usr]] = await conn.query('SELECT contrasena, id_empleado, nombre_completo FROM Usuario WHERE id_usuario = ? LIMIT 1', [req.user.id]);
    if (!usr) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Usuario no encontrado' }); }
    const ok = await bcrypt.compare(contrasena, usr.contrasena);
    if (!ok) { await conn.rollback(); return res.status(401).json({ success: false, message: 'Contraseña incorrecta' }); }
    const empleadoId = usr.id_empleado;

    const [roleRows] = await conn.query(`SELECT ar.id_rol FROM AsignacionRol ar INNER JOIN Rol r ON ar.id_rol = r.id_rol WHERE ar.id_empleado = ? AND ar.estado = 'Activo' AND r.nombre_rol LIKE 'Revisor %'`, [empleadoId]);
    if (!roleRows || roleRows.length === 0) { await conn.rollback(); return res.status(403).json({ success: false, message: 'No tienes rol de revisor' }); }
    const roleIds = roleRows.map(r => r.id_rol);

    // Marcar como completadas las etapas de este revisor en el proceso
    await conn.query(`UPDATE EtapaProceso SET estado = 'Completada', fecha_fin = NOW() WHERE id_proceso = ? AND id_rol IN (?)`, [id, roleIds]);

    // Notificar al siguiente revisor (no al mismo que aprobó)
    await enviarNotificacionEtapaCompletada(id);

    // Si ya no quedan revisiones pendientes (Revisor 1-3), notificar a Encargada de Impresión
    const [[pendRevisiones]] = await conn.query(`
      SELECT COUNT(*) AS pendientes
      FROM EtapaProceso ep
      INNER JOIN Rol r ON ep.id_rol = r.id_rol
      WHERE ep.id_proceso = ? AND r.nombre_rol LIKE 'Revisor %' AND ep.estado <> 'Completada'
    `, [id]);
    if (Number(pendRevisiones?.pendientes || 0) === 0) {
      const [[pinfo]] = await conn.query(`SELECT p.id_empresa, p.nombre_proceso, e.nombre_empresa FROM Proceso p INNER JOIN Empresa e ON e.id_empresa = p.id_empresa WHERE p.id_proceso = ?`, [id]);
      if (pinfo) {
        const [impList] = await conn.query(`
          SELECT DISTINCT u.correo, u.nombre_completo
          FROM AsignacionRol ar
          INNER JOIN Usuario u ON u.id_empleado = ar.id_empleado
          INNER JOIN Rol r ON r.id_rol = ar.id_rol
          WHERE ar.id_empresa = ? AND r.nombre_rol = 'Encargada de Impresión' AND u.correo IS NOT NULL AND LENGTH(u.correo) > 0
        `, [pinfo.id_empresa]);
        for (const imp of impList) {
          await transporter.sendMail({
            from: emailConfig.from,
            to: imp.correo,
            subject: `Proceso listo para impresión: ${pinfo.nombre_proceso}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; background: #122745; padding: 20px; color: white;">
                  <h1>Impresión requerida</h1>
                  <p>CVR Asesoría - Sistema de Procesos</p>
                </div>
                <div style="padding: 20px; background: #f8f9fa;">
                  <h2>Hola ${imp.nombre_completo},</h2>
                  <p>El proceso <strong>${pinfo.nombre_proceso}</strong> de la empresa <strong>${pinfo.nombre_empresa}</strong> completó todas las revisiones y está listo para impresión.</p>
                </div>
              </div>
            `
          });
        }
      }
    }

    // Si todas las etapas del proceso están completadas, marcar proceso como completado y enviar notificación
    const [[compRow]] = await conn.query('SELECT COUNT(*) AS pendientes FROM EtapaProceso WHERE id_proceso = ? AND estado <> "Completada"', [id]);
    if (compRow && compRow.pendientes === 0) {
      await conn.query('UPDATE Proceso SET estado = "Completado", fecha_completado = NOW() WHERE id_proceso = ?', [id]);
      // Enviar notificación de proceso completado
      enviarNotificacionProcesocompletado(id);
    }

    await conn.commit();
    res.json({ success: true, message: 'Proceso aprobado por revisor' });
  } catch (error) {
    await conn.rollback();
    console.error('Error en revisor/aprobar:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
});

// Progreso de un proceso (empleados y admin): porcentaje sobre total del catálogo
app.get('/api/procesos/:id/progreso', verificarToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [[totalRow]] = await pool.query('SELECT COUNT(*) AS total FROM EtapaCatalogo');
    const total = Number(totalRow?.total || 0);
    if (total === 0) {
      return res.json({ success: true, data: { porcentaje: 0, total: 0, completadas: 0 } });
    }
    const [[compRow]] = await pool.query('SELECT COUNT(*) AS completadas FROM EtapaProceso WHERE id_proceso = ? AND estado = "Completada"', [id]);
    const completadas = Number(compRow?.completadas || 0);
    const porcentaje = Math.max(0, Math.min(100, Math.round((completadas / total) * 100)));
    res.json({ success: true, data: { porcentaje, total, completadas } });
  } catch (error) {
    console.error('Error obteniendo progreso de proceso:', error);
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

    // Notificaciones según transición a 'Completada'
    if (estado === 'Completada') {
      // Obtener información básica de la etapa y proceso
      const [[infoEtapa]] = await pool.query(`
        SELECT ep.id_proceso, r.nombre_rol
        FROM EtapaProceso ep
        LEFT JOIN Rol r ON r.id_rol = ep.id_rol
        WHERE ep.id_etapa_proceso = ?
        LIMIT 1
      `, [id]);

      if (infoEtapa && infoEtapa.id_proceso) {
        // 1) Avisar al siguiente revisor elegible (incluye caso inicial para Revisor 1 si ya están listas las etapas previas)
        await enviarNotificacionEtapaCompletada(infoEtapa.id_proceso);

        // 2) Si la etapa pertenece a 'Encargada de Impresión' y ya no quedan pendientes de ese rol, avisar a Secretaría
        if (String(infoEtapa.nombre_rol || '').toLowerCase().includes('impresi')) {
          const [[pendImp]] = await pool.query(`
            SELECT COUNT(*) AS pendientes
            FROM EtapaProceso ep
            INNER JOIN Rol r ON r.id_rol = ep.id_rol
            WHERE ep.id_proceso = ? AND r.nombre_rol = 'Encargada de Impresión' AND ep.estado <> 'Completada'
          `, [infoEtapa.id_proceso]);

          if (Number(pendImp?.pendientes || 0) === 0) {
            const [[pinfo]] = await pool.query(`
              SELECT p.nombre_proceso, e.nombre_empresa, p.id_empresa
              FROM Proceso p
              INNER JOIN Empresa e ON e.id_empresa = p.id_empresa
              WHERE p.id_proceso = ?
            `, [infoEtapa.id_proceso]);

            if (pinfo) {
              const [secretarias] = await pool.query(`
                SELECT DISTINCT u.correo, u.nombre_completo
                FROM AsignacionRol ar
                INNER JOIN Usuario u ON u.id_empleado = ar.id_empleado
                INNER JOIN Rol r ON r.id_rol = ar.id_rol
                WHERE ar.id_empresa = ? AND r.nombre_rol LIKE '%Secretaria%'
                  AND u.correo IS NOT NULL AND LENGTH(u.correo) > 0
              `, [pinfo.id_empresa]);

              for (const sec of secretarias) {
                await transporter.sendMail({
                  from: emailConfig.from,
                  to: sec.correo,
                  subject: `Proceso listo para envío: ${pinfo.nombre_proceso}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <div style="text-align: center; background: #122745; padding: 20px; color: white;">
                        <h1>Envío requerido</h1>
                        <p>CVR Asesoría - Sistema de Procesos</p>
                      </div>
                      <div style="padding: 20px; background: #f8f9fa;">
                        <h2>Hola ${sec.nombre_completo},</h2>
                        <p>El proceso <strong>${pinfo.nombre_proceso}</strong> de la empresa <strong>${pinfo.nombre_empresa}</strong> ha concluido la impresión y está listo para el envío.</p>
                        <p>Por favor, ingresa al sistema y confirma el envío cuando corresponda.</p>
                      </div>
                    </div>
                  `
                });
              }
            }
          }
        }
      }
    }

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

// Confirmar envío de proceso (secretaria completa el proceso si está casi listo)
app.post('/api/procesos/:id/confirmar-envio', verificarToken, verificarSecretariaOrAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Verificar que el proceso existe y no esté completado
    const [proc] = await pool.query('SELECT id_proceso, estado, id_empresa FROM Proceso WHERE id_proceso = ? LIMIT 1', [id]);
    if (!proc.length) return res.status(404).json({ success: false, message: 'Proceso no encontrado' });
    if (proc[0].estado === 'Completado') return res.status(400).json({ success: false, message: 'El proceso ya está completado' });

    // Verificar que solo queda una etapa pendiente
    const [[progress]] = await pool.query('SELECT COUNT(*) AS total, SUM(CASE WHEN estado = "Completada" THEN 1 ELSE 0 END) AS completadas FROM EtapaProceso WHERE id_proceso = ?', [id]);
    if (!progress || progress.total - progress.completadas !== 1) {
      return res.status(400).json({ success: false, message: 'No se puede confirmar envío: debe permanecer solo una etapa pendiente' });
    }

    // Marcar la etapa pendiente como completada
    await pool.query('UPDATE EtapaProceso SET estado = "Completada", fecha_fin = NOW() WHERE id_proceso = ? AND estado <> "Completada"', [id]);

    // Marcar el proceso como completado
    await pool.query('UPDATE Proceso SET estado = "Completado", fecha_completado = NOW() WHERE id_proceso = ?', [id]);

    // Enviar notificación de proceso enviado
    enviarNotificacionProcesoEnviado(id);

    res.json({ success: true, message: 'Proceso enviado y completado exitosamente' });
  } catch (error) {
    console.error('Error confirmando envío:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar perfil del usuario actual (nombre, correo y/o contraseña)
app.put('/api/me', verificarToken, async (req, res) => {
  const { nombre, correo, nuevaContrasena, contrasenaActual } = req.body;

  if (!contrasenaActual) {
    return res.status(400).json({ success: false, message: 'Contraseña actual requerida' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Obtener usuario actual
    const [[usr]] = await conn.query(
      'SELECT id_usuario, id_empleado, nombre_completo, correo, contrasena, foto_perfil FROM Usuario WHERE id_usuario = ? LIMIT 1',
      [req.user.id]
    );
    if (!usr) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const ok = await bcrypt.compare(contrasenaActual, usr.contrasena);
    if (!ok) {
      await conn.rollback();
      return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
    }

    // Validar correo duplicado si cambió
    if (correo && correo !== usr.correo) {
      const [[dup]] = await conn.query('SELECT COUNT(*) AS cnt FROM Usuario WHERE correo = ? AND id_usuario <> ?', [correo, usr.id_usuario]);
      if (Number(dup?.cnt || 0) > 0) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'El correo ya está registrado' });
      }
    }

    // Preparar actualización
    const nuevoNombre = typeof nombre === 'string' && nombre.trim() ? nombre.trim() : usr.nombre_completo;
    const nuevoCorreo = typeof correo === 'string' && correo.trim() ? correo.trim() : usr.correo;

    let setPasswordSql = '';
  let setPasswordParams = [];

    if (typeof nuevaContrasena === 'string' && nuevaContrasena.trim()) {
      const hashed = await bcrypt.hash(nuevaContrasena.trim(), 10);
      setPasswordSql = ', contrasena = ?';
      setPasswordParams.push(hashed);
    }

    // Foto de perfil por Gravatar si el correo es real
    let fotoPerfil = usr.foto_perfil;
    if (nuevoCorreo && isRealEmail(nuevoCorreo)) {
      fotoPerfil = getGravatarUrl(nuevoCorreo);
    }

    await conn.query(
      `UPDATE Usuario SET nombre_completo = ?, correo = ?, foto_perfil = ?${setPasswordSql} WHERE id_usuario = ?`,
      [nuevoNombre, nuevoCorreo, fotoPerfil, ...setPasswordParams, usr.id_usuario]
    );

    // Si está enlazado a empleado, mantener espejo de nombre/correo básicos
    if (usr.id_empleado) {
      const partes = String(nuevoNombre).split(' ');
      const nombreEmp = partes.slice(0, -1).join(' ') || nuevoNombre;
      const apellidoEmp = partes.slice(-1).join(' ') || '';
      await conn.query(
        'UPDATE Empleado SET nombre = ?, apellido = ?, correo = ? WHERE id_empleado = ?',
        [nombreEmp, apellidoEmp, nuevoCorreo, usr.id_empleado]
      );
    }

    await conn.commit();

    return res.json({
      success: true,
      message: 'Perfil actualizado',
      data: {
        id_usuario: usr.id_usuario,
        nombre_completo: nuevoNombre,
        correo: nuevoCorreo,
        foto_perfil: fotoPerfil,
        tipo_usuario: req.user.tipo
      }
    });
  } catch (error) {
    await conn.rollback();
    console.error('Error actualizando perfil:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
});

// Endpoint para formulario de contacto (página pública)
app.post('/api/contact', async (req, res) => {
  try {
    const { nombre, telefono, correo, empresa, mensaje } = req.body || {};

    if (!nombre || !correo || !mensaje) {
      return res.status(400).json({ success: false, message: 'Nombre, correo y mensaje son requeridos' });
    }

    const destinatario = (emailConfig && (emailConfig.contactRecipient || emailConfig.to)) || 'impuestos@cvrasesoria.com.gt';
    const asunto = `Nuevo mensaje de contacto - ${nombre}${empresa ? ' (' + empresa + ')' : ''}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background:#122745;color:#fff;padding:16px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;">Contacto desde la web CVR Asesoría</h2>
        </div>
        <div style="background:#fff;padding:16px;border:1px solid #e9ecef;border-top:none;border-radius:0 0 8px 8px;">
          <p><strong>Nombre:</strong> ${nombre}</p>
          <p><strong>Correo:</strong> ${correo}</p>
          ${telefono ? `<p><strong>Teléfono:</strong> ${telefono}</p>` : ''}
          ${empresa ? `<p><strong>Empresa:</strong> ${empresa}</p>` : ''}
          <div style="margin-top:12px;">
            <p><strong>Mensaje:</strong></p>
            <div style="background:#f8f9fa;padding:12px;border-radius:8px;white-space:pre-wrap;">${String(mensaje || '').replace(/[<>]/g, '')}</div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: emailConfig.from,
      to: destinatario,
      subject: asunto,
      html,
      replyTo: correo
    });

    return res.json({ success: true, message: 'Mensaje enviado' });
  } catch (error) {
    console.error('Error enviando contacto:', error);
    return res.status(500).json({ success: false, message: 'Error enviando mensaje' });
  }
});

// Hook: si en crear/editar etapa se envía id_rol, registrar/actualizar en RolEtapaCatalogo

// Root route
app.get('/', (req, res) => {
  res.status(200).send('CVR Sistema Web - Backend');
});

// Health check endpoint para Railway
app.get('/api/health', async (req, res) => {
  const info = { status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() };
  // Intentar un ping ligero a la base de datos para dar información útil, pero no fallar el healthcheck si DB no está lista
  try {
    const [rows] = await pool.query('SELECT 1');
    info.db = { ok: true };
  } catch (err) {
    info.db = { ok: false, error: String(err.message || err) };
  }
  res.status(200).json(info);
});

// Configurar CORS para producción
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor CVR ejecutándose en puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});
