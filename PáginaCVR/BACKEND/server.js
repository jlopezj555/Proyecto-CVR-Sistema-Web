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

app.listen(4000, () => console.log('Servidor corriendo en http://localhost:4000'));
