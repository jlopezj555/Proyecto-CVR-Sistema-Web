# Despliegue en Railway - Sistema CVR

## Configuración de Variables de Entorno

Configura las siguientes variables de entorno en Railway:

### Base de Datos
```
DB_HOST=tu_host_de_mysql
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=CVR_LDD
DB_PORT=3306
```

### JWT
```
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
JWT_EXPIRES_IN=24h
```

### Email (Stackmail)
```
EMAIL_HOST=mx.stackmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=impuestos@cvrasesoria.com.gt
EMAIL_PASS=tu_contraseña_del_correo
```

### Servidor
```
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tu-dominio.railway.app
```

## Pasos para Desplegar

1. **Conectar con Railway:**
   - Conecta tu repositorio de GitHub con Railway
   - Railway detectará automáticamente que es un proyecto Node.js

2. **Configurar Base de Datos:**
   - Agrega un servicio MySQL en Railway
   - Copia las credenciales de conexión a las variables de entorno

3. **Configurar Variables:**
   - Ve a la pestaña "Variables" en tu proyecto de Railway
   - Agrega todas las variables de entorno listadas arriba

4. **Desplegar:**
   - Railway construirá y desplegará automáticamente
   - El build incluye tanto frontend como backend

## Estructura del Proyecto

```
Proyecto-CVR-Sistema-Web/
├── PáginaCVR/           # Frontend React + Vite
│   ├── src/            # Código fuente React
│   ├── BACKEND/        # Backend Express
│   └── package.json    # Dependencias frontend
├── package.json        # Scripts principales
├── railway.json        # Configuración Railway
├── nixpacks.toml      # Configuración build
└── Procfile           # Comando de inicio
```

## Scripts Disponibles

- `npm run install:all` - Instala todas las dependencias
- `npm run build` - Construye el frontend
- `npm run start:prod` - Inicia el servidor en producción
- `npm run dev` - Modo desarrollo

## Notas Importantes

1. **Base de Datos:** Asegúrate de que tu base de datos MySQL esté accesible desde Railway
2. **CORS:** La configuración CORS se ajusta automáticamente según la variable FRONTEND_URL
3. **Health Check:** El endpoint `/api/health` está disponible para monitoreo
4. **Puerto:** Railway asigna automáticamente el puerto, se lee desde process.env.PORT

## Troubleshooting

- Si hay errores de build, revisa los logs en Railway
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que la base de datos esté accesible
- Revisa la configuración CORS si hay problemas de conexión frontend-backend
