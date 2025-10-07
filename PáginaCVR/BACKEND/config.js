// Configuración de correo para CVR Asesoría (Stackmail)
export const emailConfig = {
  // Configuración de Stackmail
  host: 'mx.stackmail.com', // Servidor SMTP de tu correo
  port: 465,                // 465 para SSL, 587 para TLS
  secure: true,             // true para SSL, false para TLS
  auth: {
    user: 'impuestos@cvrasesoria.com.gt', // Tu correo corporativo
    pass: 'Puesto2025!'      // Contraseña normal del correo
  },

  // Configuración de la empresa
  from: 'CVR Asesoría <impuestos@cvrasesoria.com.gt>',

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
