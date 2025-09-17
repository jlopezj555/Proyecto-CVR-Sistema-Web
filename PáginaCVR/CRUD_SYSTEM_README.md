# Sistema CRUD para CVR Asesoría

## Descripción General

Se ha implementado un sistema CRUD completo para la gestión de todas las tablas de la base de datos CVR_LDD. El sistema está diseñado exclusivamente para administradores y requiere verificación de contraseña para todas las operaciones de modificación.

## Características Principales

### 🔐 Seguridad
- **Autenticación JWT**: Todos los endpoints requieren token válido
- **Autorización de Administrador**: Solo usuarios con tipo 'administrador' pueden acceder
- **Verificación de Contraseña**: Cada operación de creación, edición o eliminación requiere la contraseña del administrador
- **Middleware de Seguridad**: Verificación automática en cada endpoint

### 📊 Tablas Gestionadas

1. **Empleados** (`/api/empleados`)
   - Crear, leer, actualizar, eliminar empleados
   - Gestión de estado activo/inactivo
   - Sincronización automática con tabla Usuario

2. **Empresas** (`/api/empresas`)
   - Gestión completa de empresas
   - Validación de correos únicos
   - Verificación de dependencias antes de eliminar

3. **Roles** (`/api/roles`)
   - Creación y gestión de roles del sistema
   - Validación de asignaciones activas

4. **Cuentas** (`/api/cuentas`)
   - Gestión de cuentas por empresa
   - Relación con empresas
   - Verificación de etapas asociadas

5. **Papelería** (`/api/papeleria`)
   - Control de documentación contable
   - Estados: Recibida, En proceso, Entregada
   - Seguimiento de fechas

6. **Etapas Catálogo** (`/api/etapas-catalogo`)
   - Configuración de etapas del sistema
   - Marcado de etapas de revisión

7. **Etapas de Cuentas** (`/api/cuentas/:id/etapas`)
   - Visualización del progreso de cuentas
   - Timeline de etapas completadas
   - Seguimiento de responsables

8. **Asignaciones de Roles** (`/api/asignaciones`)
   - Gestión de asignaciones empleado-rol-cuenta
   - Estados de asignación

## Componentes Frontend

### 🎨 Interfaz de Usuario

#### AdminView
- **Sidebar de Navegación**: Acceso rápido a todas las secciones
- **Dashboard Principal**: Vista general con acciones rápidas
- **Diseño Responsive**: Adaptable a dispositivos móviles

#### CRUDTable (Componente Genérico)
- **Tabla Dinámica**: Configurable para cualquier entidad
- **Formularios Modales**: Creación y edición en ventanas emergentes
- **Validación de Datos**: Campos requeridos y tipos de datos
- **Confirmaciones**: Diálogos de confirmación para eliminaciones

#### PasswordVerificationModal
- **Verificación Segura**: Modal para confirmar contraseña de administrador
- **Feedback Visual**: Indicadores de carga y errores
- **UX Optimizada**: Interfaz intuitiva y clara

### 📱 Componentes Específicos

- `EmpleadosCRUD`: Gestión de empleados con campos específicos
- `EmpresasCRUD`: Administración de empresas
- `RolesCRUD`: Configuración de roles
- `CuentasCRUD`: Gestión de cuentas con selector de empresas
- `PapeleriaCRUD`: Control de documentación
- `EtapasCatalogoCRUD`: Configuración de etapas
- `EtapasCuentaView`: Visualización de progreso con timeline

## Endpoints de la API

### Autenticación
```
POST /api/login - Inicio de sesión
POST /api/register - Registro de clientes
```

### CRUD Endpoints
```
GET    /api/{entidad}           - Listar registros
POST   /api/{entidad}           - Crear registro
PUT    /api/{entidad}/:id       - Actualizar registro
DELETE /api/{entidad}/:id       - Eliminar registro
```

### Endpoints Especiales
```
GET /api/cuentas/:id/etapas     - Etapas de una cuenta específica
GET /api/clientes               - Lista de clientes (para papelería)
```

## Flujo de Trabajo

### 1. Acceso al Sistema
- El administrador inicia sesión
- Se valida el token JWT
- Se verifica el tipo de usuario

### 2. Navegación
- Acceso al panel de administración
- Navegación por sidebar
- Selección de sección a gestionar

### 3. Operaciones CRUD
- **Crear**: Formulario modal → Verificación de contraseña → Creación
- **Editar**: Selección de registro → Formulario prellenado → Verificación → Actualización
- **Eliminar**: Confirmación → Verificación de contraseña → Eliminación
- **Leer**: Visualización automática en tabla

### 4. Verificación de Seguridad
- Cada operación de modificación requiere contraseña
- Validación en tiempo real
- Feedback inmediato al usuario

## Características Técnicas

### Backend (Node.js + Express)
- **Middleware de Autenticación**: Verificación automática de tokens
- **Validación de Datos**: Verificación de integridad referencial
- **Manejo de Errores**: Respuestas consistentes y descriptivas
- **Base de Datos**: MySQL con pool de conexiones

### Frontend (React + TypeScript)
- **Componentes Reutilizables**: CRUDTable genérico
- **Estado Global**: Gestión de autenticación
- **Responsive Design**: Adaptable a todos los dispositivos
- **UX Optimizada**: Feedback visual y confirmaciones

## Seguridad Implementada

1. **Autenticación JWT**: Tokens con expiración de 2 horas
2. **Autorización por Roles**: Solo administradores pueden acceder
3. **Verificación de Contraseña**: Doble verificación para operaciones críticas
4. **Validación de Datos**: Sanitización y validación en backend
5. **Integridad Referencial**: Verificación de dependencias antes de eliminar

## Uso del Sistema

### Para Administradores
1. Iniciar sesión con credenciales de administrador
2. Acceder al panel de administración
3. Navegar por las diferentes secciones
4. Realizar operaciones CRUD según necesidades
5. Verificar progreso de cuentas en la sección de etapas

### Operaciones Disponibles
- ✅ **Crear**: Nuevos registros en cualquier tabla
- ✅ **Leer**: Visualización de todos los datos
- ✅ **Actualizar**: Modificación de registros existentes
- ✅ **Eliminar**: Eliminación con verificación de dependencias
- ✅ **Ver Etapas**: Seguimiento del progreso de cuentas
- ✅ **Gestionar Papelería**: Control de documentación

## Consideraciones de Desarrollo

- **Escalabilidad**: Componentes modulares y reutilizables
- **Mantenibilidad**: Código bien estructurado y documentado
- **Seguridad**: Múltiples capas de validación
- **UX**: Interfaz intuitiva y responsive
- **Performance**: Consultas optimizadas y carga eficiente

El sistema está listo para uso en producción y puede ser extendido fácilmente para nuevas funcionalidades.
