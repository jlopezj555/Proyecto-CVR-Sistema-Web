// Configuración de correo para CVR Asesoría
export const emailConfig = {
  // Configuración de Gmail
  service: 'gmail',
  auth: {
    user: 'joelslopezj@gmail.com', // CAMBIAR: Tu email de Gmail
    pass: 'tbza anbn gdhh taqw'      // CAMBIAR: Contraseña de aplicación de Gmail
  },
  
// tbza anbn gdhh taqw 
// contraseña para gmail joelslopezj@gmail.com (para pruebas)

  // Configuración de la empresa
  from: 'CVR Asesoría <joelslopezj@gmail.com>',
  
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

// INSTRUCCIONES PARA CONFIGURAR GMAIL:
// 1. Ve a tu cuenta de Gmail
// 2. Activa la verificación en 2 pasos
// 3. Ve a "Contraseñas de aplicación"
// 4. Genera una nueva contraseña para "CVR Asesoría"
// 5. Copia esa contraseña y reemplaza 'tu-app-password'
// 6. Cambia 'tu-email@gmail.com' por tu email real
