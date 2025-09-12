# 📦 API de Productos - Industrial IOT

Documentación de la API REST para gestión de productos por categorías.

## 🔗 Base URL
```
http://localhost:5000/api/products
```

---

## 📦 Abrazaderas

### **GET** `/abrazaderas` - Obtener todas las abrazaderas
Obtiene una lista de todas las abrazaderas activas.

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "productId": 1,
      "name": "SEALPRO A - CONECTOR MULTIFUNCIONAL DE TUBERIAS",
      "description": "Acople flexible tipo Slip - DN20 a DN500",
      "details": "Descripción detallada...",
      "image": "/sealproA.webp",
      "specs": ["Material: Acero inoxidable", "Presión: Hasta 30 BAR"],
      "applications": ["Petroquímica", "Minería"],
      "materials": ["Acero 304", "Acero 316"],
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 10
}
```

### **GET** `/abrazaderas/:id` - Obtener abrazadera específica
Obtiene los detalles de una abrazadera por su ID.

**Parámetros:**
- `id` (number) - ID numérico de la abrazadera

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "name": "SEALPRO A",
    "description": "...",
    // ... resto de campos
  }
}
```

### **POST** `/abrazaderas` 🔒 *(Admin)*
Crea una nueva abrazadera.

**Headers requeridos:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Nombre del producto",
  "description": "Descripción breve",
  "details": "Descripción detallada",
  "image": "/ruta/imagen.jpg",
  "specs": ["Especificación 1", "Especificación 2"],
  "applications": ["Aplicación 1", "Aplicación 2"],
  "materials": ["Material 1", "Material 2"]
}
```

### **PUT** `/abrazaderas/:id` 🔒 *(Admin)*
Actualiza una abrazadera existente.

### **DELETE** `/abrazaderas/:id` 🔒 *(Admin)*
Marca una abrazadera como inactiva (soft delete).

---

## 🧪 Epóxicos

### **GET** `/epoxicos` - Obtener todos los epóxicos
Obtiene una lista de todos los epóxicos activos.

**Query Parameters:**
- `type` (string, opcional) - Filtrar por tipo genérico

**Ejemplo:**
```
GET /epoxicos?type=RECUBRIMIENTO
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "productId": "s-26",
      "name": "ARCOR S-26",
      "description": "Recubrimiento epóxico libre de solventes...",
      "generic_type": "RECUBRIMIENTO EPÓXICO; CURADO CON AMINAS",
      "image_url": "https://...",
      "product_url": "https://...",
      "film_thickness": {
        "hand_application": "10-30 mils por capa",
        "spray_application": "15-40 mils por capa"
      },
      "flexibility": "Buena",
      "applications": ["Tanques petroquímicos", "Diesel"],
      "colores": ["Gris", "Verde"],
      "relacion_de_mezcla": "2:1 por volumen",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 5
}
```

### **GET** `/epoxicos/:id` - Obtener epóxico específico
Obtiene los detalles de un epóxico por su ID.

**Parámetros:**
- `id` (string) - ID del epóxico (ej: "s-26")

---

## 🛠️ Kits

### **GET** `/kits` - Obtener todos los kits
Obtiene una lista de todos los kits activos.

**Query Parameters:**
- `application` (string, opcional) - Filtrar por aplicación

**Ejemplo:**
```
GET /kits?application=fugas
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "productId": 1,
      "name": "KIT PARA REPARACIÓN DE FUGAS CON PRESIÓN SEALPRO",
      "description": "Kit completo para reparación de fugas en 15 minutos",
      "image": "/kitrf.png",
      "specs": ["Reparaciones bajo fuga activa hasta 150 psi"],
      "applications": ["Juntas de expansión", "Fugas activas"],
      "content": [
        {
          "item": "Compuesto sellante",
          "quantity": 1,
          "description": "Tubo de 500ml"
        }
      ],
      "instructions": [
        {
          "step": 1,
          "description": "Limpiar la superficie"
        }
      ],
      "usage_conditions": {
        "max_pressure": "150 psi",
        "max_temperature": "200°C",
        "application_time": "15 minutos"
      },
      "isActive": true
    }
  ],
  "count": 3
}
```

### **GET** `/kits/:id` - Obtener kit específico
Obtiene los detalles de un kit por su ID.

---

## 🔍 Búsqueda General

### **GET** `/search` - Buscar productos
Busca productos en todas las categorías o en una específica.

**Query Parameters:**
- `q` (string, requerido) - Término de búsqueda (mín. 2 caracteres)
- `category` (string, opcional) - Categoría específica: 'abrazaderas', 'epoxicos', 'kits'

**Ejemplo:**
```
GET /search?q=reparación&category=kits
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "abrazaderas": [...],
    "epoxicos": [...],
    "kits": [...]
  },
  "query": "reparación"
}
```

---

## 🔒 Autenticación

Las rutas marcadas con 🔒 requieren autenticación de administrador.

**Headers requeridos:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

El token se obtiene del login de administrador:
```
POST /api/auth/login
```

---

## 📊 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `200` | Operación exitosa |
| `201` | Recurso creado exitosamente |
| `400` | Datos de entrada inválidos |
| `401` | No autenticado |
| `403` | No autorizado |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |

---

## 🚀 Comandos de Migración

Para importar los datos existentes desde los archivos JSON:

```bash
# Migrar todos los productos
cd server
npm run migrate-products

# Migrar solo una categoría
npm run migrate-abrazaderas
npm run migrate-epoxicos  
npm run migrate-kits
```

---

## 🔧 Estructura de Base de Datos

### Colecciones:
- `abrazaderas` - Productos de abrazaderas industriales
- `epoxicos` - Productos epóxicos y recubrimientos  
- `kits` - Kits de reparación y herramientas

### Índices creados:
- Por `productId` (único por colección)
- Por `name` (para búsquedas)
- Por `isActive` (para filtros)
- Por `sortOrder` (para ordenamiento)

---

## 📝 Notas Importantes

1. **Soft Delete**: Los productos eliminados se marcan como `isActive: false`
2. **Ordenamiento**: Los productos se ordenan por `sortOrder` y luego por `name`
3. **Búsqueda**: La búsqueda es case-insensitive y busca en múltiples campos
4. **Validación**: Todos los endpoints validan los datos de entrada
5. **Límites**: Las búsquedas están limitadas a 10 resultados por categoría