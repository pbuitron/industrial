# Backend API - Industrial IOT Website

## Descripción
Backend REST API para el manejo de formularios de contacto del sitio web Industrial IOT, desarrollado con Express.js y MongoDB.

## Características
- API RESTful completa para gestión de contactos
- Validación de datos con express-validator
- Integración con MongoDB usando Mongoose
- Middleware de seguridad con Helmet
- Soporte CORS configurado
- Paginación y filtros en consultas
- Manejo robusto de errores
- Variables de entorno para configuración

## Estructura del Proyecto
```
server/
├── config/
│   └── database.js          # Configuración de MongoDB
├── models/
│   └── Contact.js           # Modelo de datos Contact
├── routes/
│   └── contacts.js          # Rutas API para contactos
├── .env                     # Variables de entorno
├── package.json             # Dependencias y scripts
├── server.js                # Archivo principal del servidor
└── README.md                # Este archivo
```

## Prerequisitos
- Node.js (versión 16 o superior)
- MongoDB (local o MongoDB Atlas)
- npm o yarn

## Instalación y Configuración

### 1. Instalar dependencias
```bash
cd server
npm install
```

### 2. Configurar variables de entorno
Edita el archivo `.env` con tus configuraciones:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/industrial-iot
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Para MongoDB local:**
- Asegúrate de tener MongoDB corriendo en tu máquina
- La URI por defecto es: `mongodb://localhost:27017/industrial-iot`

**Para MongoDB Atlas:**
- Reemplaza `MONGODB_URI` con tu string de conexión de Atlas
- Ejemplo: `mongodb+srv://usuario:password@cluster.mongodb.net/industrial-iot`

### 3. Iniciar MongoDB (si usas instalación local)
```bash
# En macOS con Homebrew
brew services start mongodb/brew/mongodb-community

# En Linux/Ubuntu
sudo systemctl start mongod

# En Windows (como servicio)
net start MongoDB
```

### 4. Iniciar el servidor

**Modo desarrollo (con nodemon):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

El servidor estará disponible en: `http://localhost:5000`

## Endpoints de la API

### Health Check
- **GET** `/api/health` - Verificar estado del servidor

### Contactos
- **POST** `/api/contacts` - Crear nuevo contacto
- **GET** `/api/contacts` - Listar contactos (con paginación y filtros)
- **GET** `/api/contacts/:id` - Obtener contacto específico
- **PUT** `/api/contacts/:id/status` - Actualizar estado de contacto

### Ejemplos de Uso

#### Crear contacto (POST)
```bash
curl -X POST http://localhost:5000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@empresa.com",
    "company": "Mi Empresa",
    "phone": "+51 999 888 777",
    "productType": "abrazaderas",
    "message": "Necesito cotización para abrazaderas industriales"
  }'
```

#### Listar contactos (GET)
```bash
# Básico
curl http://localhost:5000/api/contacts

# Con filtros y paginación
curl "http://localhost:5000/api/contacts?page=1&limit=10&status=pendiente&productType=abrazaderas"
```

#### Actualizar estado (PUT)
```bash
curl -X PUT http://localhost:5000/api/contacts/[ID]/status \
  -H "Content-Type: application/json" \
  -d '{"status": "en_proceso"}'
```

## Modelo de Datos

### Contact Schema
```javascript
{
  name: String (requerido, máx 100 chars),
  email: String (requerido, formato email),
  company: String (opcional, máx 100 chars),
  phone: String (opcional, máx 20 chars),
  productType: String (requerido, enum),
  message: String (requerido, máx 1000 chars),
  status: String (enum: 'pendiente', 'en_proceso', 'completado', 'archivado'),
  createdAt: Date,
  updatedAt: Date
}
```

### Tipos de Producto Válidos
- `abrazaderas` - Abrazaderas Industriales
- `kits` - Kits de Reparación
- `epoxicos` - Epóxicos para Metales
- `Servicio de Recubrimiento`
- `Fabricacion de Pernos`
- `Reparación de bombas`
- `otro` - Otro

## Validaciones
- **Nombre**: Obligatorio, máximo 100 caracteres
- **Email**: Obligatorio, formato válido
- **Empresa**: Opcional, máximo 100 caracteres
- **Teléfono**: Opcional, máximo 20 caracteres
- **Tipo de Producto**: Obligatorio, debe ser uno de los valores permitidos
- **Mensaje**: Obligatorio, máximo 1000 caracteres

## Respuestas de la API

### Respuesta exitosa
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { /* datos */ },
  "pagination": { /* info de paginación */ }
}
```

### Respuesta de error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [ /* detalles de validación */ ]
}
```

## Scripts NPM
- `npm start` - Iniciar servidor en modo producción
- `npm run dev` - Iniciar servidor en modo desarrollo con nodemon

## Logs y Debugging
- Los logs se muestran en consola
- En modo desarrollo se muestran detalles adicionales de errores
- Se registran todas las solicitudes HTTP en desarrollo

## Seguridad
- Helmet para headers de seguridad
- CORS configurado para el frontend
- Validación de entrada en todas las rutas
- Sanitización de datos de entrada

## Conexión con Frontend
El servidor está configurado para recibir peticiones desde:
- `http://localhost:3000` (Next.js dev server)
- La URL configurada en `FRONTEND_URL`

Para usar en producción, actualiza las URLs en las variables de entorno.

## Troubleshooting

### Error de conexión a MongoDB
- Verifica que MongoDB esté corriendo
- Revisa la URI de conexión en `.env`
- Para MongoDB Atlas, verifica credenciales y whitelist de IP

### Error de CORS
- Verifica que `FRONTEND_URL` esté configurado correctamente
- El frontend debe hacer peticiones desde una URL permitida

### Puerto en uso
- Cambia el `PORT` en `.env` si el 5000 está ocupado
- Actualiza la URL en el frontend si cambias el puerto

 ### URLs importantes:

  - Frontend: http://localhost:3000
  - Backend API: http://localhost:5000
  - Panel Admin: http://localhost:3000/admin/contacts
  - Health Check: http://localhost:5000/api/health

 ### Flujo completo funcionando:

  1. Usuario llena formulario en /contacto
  2. Datos se envían via POST a /api/contacts
  3. Se guardan en MongoDB con validaciones
  4. Admin puede ver/gestionar en /admin/contacts
  5. Estados actualizables desde panel admin