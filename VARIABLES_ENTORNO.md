# Variables de Entorno Requeridas

Para que las notificaciones de correo funcionen correctamente, asegúrate de configurar las siguientes variables de entorno:

## Variables de Email (Stackmail) - OBLIGATORIAS

```bash
EMAIL_HOST=mx.stackmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=impuestos@cvrasesoria.com.gt
EMAIL_PASS=tu_contraseña_del_correo
EMAIL_FROM=CVR Asesoría <impuestos@cvrasesoria.com.gt>
```

## Variables de Base de Datos

```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=cvr_asesoria
```

## Variables de JWT

```bash
JWT_SECRET=tu_jwt_secret_muy_seguro
```

## Variables del Servidor

```bash
PORT=3001
NODE_ENV=development
```

## Cómo configurar

### Para desarrollo local:

1. **Crea un archivo `.env` en la raíz del proyecto** (mismo nivel que package.json)
2. **Copia las variables de arriba** y reemplaza los valores con tus credenciales reales
3. **IMPORTANTE**: Asegúrate de que `EMAIL_USER` y `EMAIL_PASS` estén configurados correctamente
4. **Reinicia el servidor**

### Para Railway (producción):

Las variables se configuran directamente en el panel de Railway:
1. Ve a tu proyecto en Railway
2. Ve a la pestaña "Variables"
3. Agrega cada variable con su valor correspondiente
4. Railway reiniciará automáticamente el servidor

### Estructura del archivo .env:

```
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=cvr_asesoria

# Correo (OBLIGATORIO)
EMAIL_USER=impuestos@cvrasesoria.com.gt
EMAIL_PASS=tu_contraseña_del_correo
EMAIL_FROM=CVR Asesoría <impuestos@cvrasesoria.com.gt>

# JWT (OBLIGATORIO)
JWT_SECRET=tu_jwt_secret_muy_seguro

# Servidor
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Verificación

Para verificar que el correo está funcionando, revisa los logs del servidor. Deberías ver:

### ✅ Configuración correcta:
```
📧 Verificando configuración de correo:
  - EMAIL_HOST: mx.stackmail.com (default)
  - EMAIL_PORT: 465 (default)
  - EMAIL_SECURE: true (default)
  - EMAIL_USER: ***configurado***
  - EMAIL_PASS: ***configurado***
  - EMAIL_FROM: CVR Asesoría <impuestos@cvrasesoria.com.gt>
  - Estado: ✅ LISTO PARA ENVIAR
✉️ Email enabled: transporter configured successfully
✉️ Email server connection verified successfully
```

### ❌ Configuración incorrecta:
```
📧 Verificando configuración de correo:
  - EMAIL_USER: NO CONFIGURADO
  - EMAIL_PASS: NO CONFIGURADO
  - Estado: ❌ FALTAN CREDENCIALES
✉️ Email disabled: EMAIL_USER or EMAIL_PASS not provided
```

## Notas importantes

- Las notificaciones solo se envían a correos "reales" (gmail.com, hotmail.com, cvrasesoria.com.gt, etc.)
- Los correos de prueba no reciben notificaciones
- Si no ves las notificaciones, verifica la carpeta de spam
- El sistema ahora incluye el dominio `cvrasesoria.com.gt` como correo real
- Si hay errores de conexión, verifica que las credenciales de Stackmail sean correctas
