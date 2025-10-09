// Configuración de correo para CVR Asesoría (Stackmail)
export const emailConfig = {
  // Configuración de Stackmail
  host: process.env.EMAIL_HOST || 'mx.stackmail.com',
  port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465,
  secure: (typeof process.env.EMAIL_SECURE !== 'undefined') ? (process.env.EMAIL_SECURE === 'true') : true,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },

  // Configuración de la empresa
  from: process.env.EMAIL_FROM || `CVR Asesoría <${process.env.EMAIL_USER || ''}>`,

  // Dominios de correo considerados "reales"
  realEmailDomains: [
    'gmail.com', 
    'hotmail.com', 
    'outlook.com', 
    'yahoo.com', 
    'live.com', 
    'msn.com',
    'icloud.com',
    'protonmail.com'
  ]
};

/*
INSTRUCCIONES PARA CONFIGURAR STACKMAIL:
1. Verifica que tu cuenta impuestos@cvrasesoria.com.gt esté activa y tengas la contraseña correcta.
2. Asegúrate de usar el servidor SMTP: mx.stackmail.com
3. El puerto recomendado para SSL es 465. Para TLS/STARTTLS usa 587 y secure: false
4. Reemplaza 'TU_CONTRASEÑA_DEL_CORREO' por la contraseña real del correo.
5. No es necesaria una contraseña de aplicación como en Gmail.
6. Opcional: configura SPF y DMARC en tu dominio para evitar que los correos lleguen a SPAM.
*/