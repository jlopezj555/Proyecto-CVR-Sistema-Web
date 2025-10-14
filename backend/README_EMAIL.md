# 📧 Configuración de Correo para CVR Asesoría

## 🚀 Funcionalidades Implementadas

### ✅ **Notificación por Correo al Iniciar Sesión**
- Se envía automáticamente un correo cada vez que alguien inicia sesión
- Solo para correos "reales" (Gmail, Hotmail, Outlook, Yahoo, etc.)
- Incluye detalles de seguridad: fecha, hora, tipo de usuario

### ✅ **Foto de Perfil Real del Correo**
- Integración con Gravatar para obtener fotos de perfil reales
- Se genera automáticamente basada en el correo electrónico
- Se guarda en la base de datos para futuros accesos
- Se muestra centrada en el botón "Cerrar sesión"

## ⚙️ Configuración Paso a Paso

### 1. Nuevas variables soportadas (Nodemailer SMTP y SendGrid)

Este backend ahora soporta dos métodos de envío:

- SMTP por Nodemailer (recomendado si tienes credenciales SMTP en Railway)
- SendGrid (si tienes `SENDGRID_API_KEY` configurada)

Variables de entorno que puedes configurar en Railway (o localmente):

- Para SMTP / Nodemailer (preferible cuando usas SMTP de tu proveedor):
  - `SMTP_HOST` (ej. mx.stackmail.com)
  - `SMTP_PORT` (ej. 465 o 587)
  - `SMTP_USER` (usuario / email)
  - `SMTP_PASS` (contraseña)
  - `SMTP_SECURE` (true o false) — si se usa SSL (465) usar true
  - `SMTP_REJECT_UNAUTHORIZED` (opcional) — establecer `false` si necesitas aceptar certificados auto-firmados

- Para SendGrid (opcional, si prefieres SendGrid):
  - `SENDGRID_API_KEY`

- Opciones comunes:
  - `EMAIL_FROM` (opcional) — la dirección "from" que aparecerá en los correos

Si ambas opciones existen, la app dará preferencia a SendGrid. Si quieres forzar SMTP, elimina `SENDGRID_API_KEY` de las variables.

### 2. Reiniciar el servidor

Después de añadir las variables en Railway o en tu `.env` local, reinicia el servidor:

```powershell
cd backend
npm install
node server.js
```

> Nota: `npm install` es necesario la primera vez para instalar dependencias (`nodemailer`, `@sendgrid/mail`, etc.).

## 🧪 Probar las Funcionalidades

### **Prueba de Notificación de Login**
1. Regístrate con un correo real (Gmail, Hotmail, etc.)
2. Inicia sesión con ese correo
3. Revisa tu bandeja de entrada
4. Deberías recibir un correo de "Inicio de Sesión Detectado"

### **Prueba de Foto de Perfil**
1. Inicia sesión con un correo real
2. Mira el botón "Cerrar sesión" en el header
3. Deberías ver la foto de perfil de Gravatar centrada
4. Si no tienes foto en Gravatar, verás un avatar generado

## 🔧 Dominios de Correo Soportados

Los siguientes dominios se consideran "reales" y activan las funcionalidades:

- `gmail.com`
- `hotmail.com`
- `outlook.com`
- `yahoo.com`
- `live.com`
- `msn.com`
- `icloud.com`
- `protonmail.com`

## 🐛 Solución de Problemas

### **Error: "Invalid login"**
- Verifica que la contraseña de aplicación sea correcta
- Asegúrate de que la verificación en 2 pasos esté activada

### **No se envían correos**
- Revisa la consola del servidor para errores
- Verifica que el correo esté en la lista de dominios reales
- Comprueba que la configuración de Gmail sea correcta

### **No aparece la foto de perfil**
- Verifica que el correo sea de un dominio real
- La foto se genera automáticamente con Gravatar
- Si no tienes foto en Gravatar, aparecerá un avatar generado

## 📱 Personalización

### **Agregar Más Dominios de Correo**
Edita `config.js` y agrega dominios a `realEmailDomains`:

```javascript
realEmailDomains: [
  'gmail.com', 
  'hotmail.com',
  'tu-dominio-custom.com' // ← Agregar aquí
]
```

### **Personalizar Plantillas de Correo**
Edita las funciones `enviarCorreoBienvenida` y `enviarNotificacionLogin` en `server.js`

## 🎯 Resultado Final

Una vez configurado correctamente:

1. **Al registrarse**: Recibe correo de bienvenida + foto de perfil automática
2. **Al iniciar sesión**: Recibe notificación de seguridad + foto de perfil en el botón
3. **Experiencia visual**: Foto de perfil real centrada en el botón cerrar sesión
4. **Seguridad**: Notificaciones automáticas de accesos

¡El sistema está listo para funcionar con correos reales! 🚀
