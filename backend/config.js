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
    'protonmail.com',
    'cvrasesoria.com.gt' // Agregar el dominio de la empresa
  ]
};

// Función para verificar la configuración de correo
export const checkEmailConfig = () => {
  console.log('📧 Verificando configuración de correo:');
  console.log(`  - EMAIL_HOST: ${process.env.EMAIL_HOST || 'mx.stackmail.com (default)'}`);
  console.log(`  - EMAIL_PORT: ${process.env.EMAIL_PORT || '465 (default)'}`);
  console.log(`  - EMAIL_SECURE: ${process.env.EMAIL_SECURE || 'true (default)'}`);
  console.log(`  - EMAIL_USER: ${process.env.EMAIL_USER ? '***configurado***' : 'NO CONFIGURADO'}`);
  console.log(`  - EMAIL_PASS: ${process.env.EMAIL_PASS ? '***configurado***' : 'NO CONFIGURADO'}`);
  console.log(`  - EMAIL_FROM: ${process.env.EMAIL_FROM || 'usando EMAIL_USER'}`);
  
  const hasCredentials = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
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