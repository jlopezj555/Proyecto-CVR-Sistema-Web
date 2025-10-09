# 🚀 Instrucciones para Desplegar en Railway

## ✅ Preparación Completada

Tu proyecto ya está configurado para Railway. Aquí están los archivos creados/modificados:

### Archivos de Configuración Creados:
- `railway.json` - Configuración específica de Railway
- `nixpacks.toml` - Configuración del proceso de build
- `Procfile` - Comando de inicio
- `.gitignore` - Archivos a ignorar en Git
- `RAILWAY_DEPLOYMENT.md` - Documentación técnica

### Archivos Modificados:
- `package.json` (raíz) - Scripts para Railway
- `PáginaCVR/package.json` - Scripts del frontend
- `PáginaCVR/BACKEND/package.json` - Scripts del backend
- `PáginaCVR/BACKEND/server.js` - Variables de entorno y CORS
- `PáginaCVR/BACKEND/config.js` - Configuración de email con env vars
- `PáginaCVR/vite.config.ts` - Configuración para producción

## 🚀 Pasos para Desplegar

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "Configuración para Railway"
git branch -M main
git remote add origin https://github.com/tu-usuario/tu-repositorio.git
git push -u origin main
```

### 2. Conectar con Railway
1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Haz clic en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Elige tu repositorio

### 3. Configurar Base de Datos
1. En Railway, haz clic en "New Service"
2. Selecciona "Database" → "MySQL"
3. Railway creará automáticamente las variables de entorno de la DB

### 4. Configurar Variables de Entorno
Ve a la pestaña "Variables" y agrega:

```env
# Base de Datos (Railway las crea automáticamente)
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_PORT=${{MySQL.MYSQL_PORT}}

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_y_largo_aqui
JWT_EXPIRES_IN=24h

# Email
EMAIL_HOST=mx.stackmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=impuestos@cvrasesoria.com.gt
EMAIL_PASS=tu_contraseña_real_del_correo

# Servidor
NODE_ENV=production
FRONTEND_URL=https://tu-proyecto.railway.app

# Frontend (opcional)
VITE_API_URL=https://tu-proyecto.railway.app
```

### 5. Importar Base de Datos
1. Usa las credenciales de Railway para conectar a tu MySQL
2. Importa el archivo `CVRScriptBD.sql` que está en `PáginaCVR/BACKEND/`

### 6. Desplegar
Railway detectará automáticamente la configuración y comenzará el despliegue.

## 🔧 Scripts Disponibles

```bash
# Instalar todas las dependencias
npm run install:all

# Desarrollo local
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm run start:prod
```

## 🌐 URLs Importantes

- **Aplicación:** `https://tu-proyecto.railway.app`
- **Health Check:** `https://tu-proyecto.railway.app/api/health`
- **API:** `https://tu-proyecto.railway.app/api/`

## ⚠️ Notas Importantes

1. **Base de Datos:** Asegúrate de importar el script SQL antes del primer uso
2. **Email:** Verifica que las credenciales de Stackmail sean correctas
3. **CORS:** Se configura automáticamente según la URL de Railway
4. **SSL:** Railway maneja automáticamente los certificados SSL

## 🐛 Troubleshooting

### Error de Build
- Revisa los logs en Railway
- Verifica que todas las dependencias estén en package.json

### Error de Base de Datos
- Verifica las variables de entorno de MySQL
- Asegúrate de que la base de datos esté importada

### Error de CORS
- Verifica que FRONTEND_URL esté configurada correctamente
- Debe ser la URL completa de tu proyecto en Railway

### Error de Email
- Verifica las credenciales de Stackmail
- Asegúrate de que el puerto 465 esté abierto

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Railway
2. Verifica la configuración de variables de entorno
3. Asegúrate de que la base de datos esté configurada correctamente

¡Tu proyecto está listo para Railway! 🎉
