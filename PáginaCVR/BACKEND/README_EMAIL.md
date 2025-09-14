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

### 1. **Configurar Gmail**

1. Ve a tu cuenta de Gmail
2. Haz clic en tu foto de perfil (esquina superior derecha)
3. Selecciona "Gestionar tu cuenta de Google"
4. Ve a "Seguridad" en el menú lateral
5. Activa "Verificación en 2 pasos" si no está activada
6. Busca "Contraseñas de aplicación" y haz clic
7. Selecciona "Otra (nombre personalizado)"
8. Escribe "CVR Asesoría" y haz clic en "Generar"
9. **COPIA** la contraseña que aparece (16 caracteres)

### 2. **Actualizar Configuración**

Edita el archivo `config.js`:

```javascript
export const emailConfig = {
  service: 'gmail',
  auth: {
    user: 'tu-email-real@gmail.com', // ← Cambia por tu email
    pass: 'abcd-efgh-ijkl-mnop'      // ← Cambia por la contraseña de aplicación
  },
  from: 'CVR Asesoría <tu-email-real@gmail.com>',
  // ... resto de configuración
};
```

### 3. **Reiniciar el Servidor**

```bash
# Detener el servidor (Ctrl+C)
# Luego ejecutar:
node server.js
```

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
