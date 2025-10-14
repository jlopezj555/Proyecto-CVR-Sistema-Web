// Configuración de correo para CVR Asesoría (Stackmail)

// Configuración para SendGrid
export const emailConfig = {
  // SendGrid (optional)
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  // SMTP / Nodemailer settings (Railway SMTP variables expected)
  // Allow both SMTP_* and EMAIL_* prefixes (EMAIL_* for backward compatibility)
  smtpHost: process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.EMAIL_SMTP_HOST || '',
  smtpPort: process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.EMAIL_SMTP_PORT || '',
  smtpUser: process.env.SMTP_USER || process.env.EMAIL_USER || '',
  smtpPass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
  secure: ((process.env.SMTP_SECURE || process.env.EMAIL_SECURE || process.env.EMAIL_SMTP_SECURE || 'true') === 'true'),
  from: process.env.EMAIL_FROM || `CVR Asesoría <${process.env.SMTP_USER || process.env.EMAIL_USER || ''}>`,
  realEmailDomains: [
    'gmail.com', 
    'hotmail.com', 
    'outlook.com', 
    'yahoo.com', 
    'live.com', 
    'msn.com',
    'icloud.com',
    'protonmail.com',
    'miumg.edu.gt',
    'cvrasesoria.com.gt'
  ]
};

// Función para verificar la configuración de correo
export const checkEmailConfig = () => {
  console.log('📧 Verificando configuración de correo:');
  console.log(`  - SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '***configurado***' : 'NO CONFIGURADO'}`);
  console.log(`  - SMTP_HOST: ${process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.EMAIL_SMTP_HOST ? '***configurado***' : 'NO CONFIGURADO'}`);
  console.log(`  - SMTP_USER: ${process.env.SMTP_USER || process.env.EMAIL_USER ? '***configurado***' : 'NO CONFIGURADO'}`);
  console.log(`  - EMAIL_FROM: ${process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || '(no definido)'} `);

  const hasSendgrid = !!process.env.SENDGRID_API_KEY;
  const hasSmtp = !!(process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.EMAIL_SMTP_HOST) && !!(process.env.SMTP_USER || process.env.EMAIL_USER) && !!(process.env.SMTP_PASS || process.env.EMAIL_PASS);

  const hasCredentials = hasSendgrid || hasSmtp;
  console.log(`  - Estado: ${hasCredentials ? '✅ LISTO PARA ENVIAR' : '❌ FALTAN CREDENCIALES'}`);
  return hasCredentials;
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