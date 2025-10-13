// Configuración de correo para CVR Asesoría (Stackmail)

// Configuración para SendGrid
export const emailConfig = {
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  from: process.env.EMAIL_FROM || `CVR Asesoría <${process.env.EMAIL_USER || ''}>`,
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
  console.log(`  - EMAIL_FROM: ${process.env.EMAIL_FROM || 'usando EMAIL_USER'}`);
  const hasCredentials = !!process.env.SENDGRID_API_KEY;
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