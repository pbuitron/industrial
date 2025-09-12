# Sistema de Autenticación - Industrial IOT

Este documento describe el sistema de autenticación implementado en la aplicación Industrial IOT.

## 🔐 Características del Sistema

- **Usuario Único**: Solo admins pueden acceder al panel de administración
- **JWT con HttpOnly Cookies**: Tokens seguros almacenados en cookies
- **Recuperación de Contraseña**: Sistema completo con envío de emails
- **Seguridad**: Hashing bcrypt, rate limiting, bloqueo de cuentas
- **Frontend Completo**: Componentes React con validación y UX

## 🏗️ Arquitectura

### Backend (Express + MongoDB)
- `server/models/Admin.js` - Modelo de usuario administrador
- `server/middleware/auth.js` - Middleware de autenticación JWT
- `server/routes/auth.js` - Endpoints de autenticación
- `server/utils/email.js` - Utilidad para envío de emails
- `server/scripts/setup-admin.js` - Script para crear admin inicial

### Frontend (Next.js + React)
- `contexts/AuthContext.tsx` - Context para gestión de estado global
- `components/auth/` - Componentes de autenticación
- `app/auth/` - Páginas de autenticación
- `app/admin/` - Páginas protegidas del panel admin

## 🚀 Setup e Instalación

### 1. Configurar Variables de Entorno

Actualiza el archivo `server/.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

# Email Configuration (Development - Mailtrap)
EMAIL_FROM=noreply@industrialiot.com
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USERNAME=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password

# Optional: Para producción con Gmail
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USERNAME=your-email@gmail.com
# EMAIL_PASSWORD=your-app-password

# Security Settings
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=30
```

### 2. Instalar Dependencias

```bash
# Backend
cd server
npm install

# Frontend (si es necesario)
cd ../
npm install
```

### 3. Crear Administrador Inicial

```bash
cd server
npm run setup-admin
```

Este comando creará un administrador con las siguientes credenciales por defecto:
- **Email**: `admin@industrialiot.com`
- **Contraseña**: `Admin123456`

### 4. Configurar Email (Opcional pero Recomendado)

Para la recuperación de contraseñas:

#### Desarrollo (Mailtrap)
1. Crea una cuenta en [Mailtrap.io](https://mailtrap.io)
2. Obtén las credenciales SMTP
3. Actualiza las variables EMAIL_* en `.env`

#### Producción (Gmail)
1. Habilita la verificación en 2 pasos en tu cuenta Gmail
2. Genera una contraseña de aplicación
3. Usa las credenciales comentadas en `.env`

### 5. Iniciar los Servicios

```bash
# Backend (Terminal 1)
cd server
npm run dev

# Frontend (Terminal 2)
cd ../
npm run dev
```

## 🔒 Endpoints de Autenticación

### POST `/api/auth/login`
Iniciar sesión con email y contraseña.

**Body:**
```json
{
  "email": "admin@industrialiot.com",
  "password": "Admin123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "admin": {
      "id": "...",
      "name": "Administrador",
      "email": "admin@industrialiot.com",
      "role": "admin",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### POST `/api/auth/request-reset`
Solicitar restablecimiento de contraseña.

**Body:**
```json
{
  "email": "admin@industrialiot.com"
}
```

### GET `/api/auth/validate-reset-token/:token`
Validar token de restablecimiento.

### POST `/api/auth/reset-password/:token`
Restablecer contraseña con token.

**Body:**
```json
{
  "password": "NuevaContraseña123",
  "confirmPassword": "NuevaContraseña123"
}
```

### GET `/api/auth/me`
Obtener información del usuario autenticado.

### POST `/api/auth/logout`
Cerrar sesión y limpiar cookies.

## 🛡️ Seguridad Implementada

1. **Rate Limiting**: 5 intentos por IP cada 15 minutos en login
2. **Account Locking**: Bloqueo después de 5 intentos fallidos
3. **Password Requirements**: 
   - Mínimo 6 caracteres
   - Al menos una mayúscula, minúscula y número
4. **JWT Security**: 
   - HttpOnly cookies
   - Secure en producción
   - Expiración configurable
5. **Password Reset**: 
   - Tokens únicos con expiración (10 minutos)
   - Un solo uso por token

## 📱 Uso de la Aplicación

### URLs Principales
- **Login**: `http://localhost:3000/auth/login`
- **Dashboard**: `http://localhost:3000/admin/dashboard`
- **Contactos**: `http://localhost:3000/admin/contacts`

### Flujo de Uso
1. Accede a `/auth/login`
2. Inicia sesión con las credenciales del admin
3. Serás redirigido al dashboard admin
4. Desde allí puedes gestionar contactos y otras funciones

### Recuperación de Contraseña
1. En login, click "¿Olvidaste tu contraseña?"
2. Ingresa tu email
3. Revisa tu email (o Mailtrap) por el enlace
4. Click en el enlace y establece nueva contraseña

## 🔧 Personalización

### Cambiar Datos del Admin Inicial
Edita las variables de entorno antes de ejecutar `setup-admin`:

```env
ADMIN_NAME="Tu Nombre"
ADMIN_EMAIL="tu-email@empresa.com"
ADMIN_PASSWORD="TuContraseñaSegura123"
```

### Modificar Configuración JWT
```env
JWT_SECRET="tu-clave-secreta-muy-larga-y-compleja"
JWT_EXPIRES_IN=30d  # Duración del token
JWT_COOKIE_EXPIRES_IN=30  # Días para expiración de cookie
```

### Configurar Email Templates
Edita `server/utils/email.js` para personalizar las plantillas de email.

## 🐛 Solución de Problemas

### Error: "Admin ya existe"
Si el script `setup-admin` dice que ya existe un admin, puedes:
1. Borrar el admin existente desde MongoDB
2. O cambiar el email en las variables de entorno

### Error: "Token inválido"
Los tokens expiran. Asegúrate de que:
1. El usuario esté autenticado
2. Las cookies estén habilitadas
3. El servidor esté ejecutándose

### Error: "No se puede enviar email"
Verifica la configuración de email en `.env`:
1. Credenciales correctas
2. Configuración SMTP válida
3. Firewall no bloquee el puerto

### Error: "CORS"
Asegúrate de que:
1. El frontend esté en `http://localhost:3000`
2. El backend esté en `http://localhost:5000`
3. Las URLs en `FRONTEND_URL` coincidan

## 📞 Contacto y Soporte

Si necesitas ayuda con la implementación o tienes problemas:
- Revisa los logs del servidor (`console.log`)
- Verifica la configuración de `.env`
- Asegúrate de que MongoDB esté conectado

---

**⚠️ Importante**: Este sistema está configurado para desarrollo. Para producción, asegúrate de:
- Cambiar `JWT_SECRET` a un valor seguro
- Configurar HTTPS
- Usar un servicio de email real
- Revisar todas las variables de entorno