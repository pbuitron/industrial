# 📦 Sistema de Productos - Industrial IOT

Documentación del sistema de gestión de productos migrado a MongoDB con API REST.

## 🚀 Características del Sistema

### **✅ Migración Completada**
- ✅ **19 productos** migrados desde JSON a MongoDB
- ✅ **3 categorías** con estructuras específicas
- ✅ **APIs RESTful** para cada categoría
- ✅ **Panel de administración** integrado
- ✅ **Búsqueda avanzada** entre todas las categorías

### **📊 Productos por Categoría**
- 📦 **Abrazaderas**: 6 productos (SEALPRO A-E, CE)
- 🧪 **Epóxicos**: 11 productos (ARCOR series)
- 🛠️ **Kits**: 2 productos (Reparación con/sin presión)

## 🔗 URLs del Sistema

### **Frontend (Público)**
```
http://localhost:3000/productos          # Catálogo general
http://localhost:3000/productos/abrazaderas   # Abrazaderas
http://localhost:3000/productos/epoxicos      # Epóxicos  
http://localhost:3000/productos/kits          # Kits
```

### **Panel Admin (Protegido)**
```
http://localhost:3000/admin/products     # Gestión de productos
http://localhost:3000/admin/dashboard    # Dashboard principal
```

### **API REST**
```
http://localhost:5000/api/products/abrazaderas    # API Abrazaderas
http://localhost:5000/api/products/epoxicos       # API Epóxicos
http://localhost:5000/api/products/kits           # API Kits
http://localhost:5000/api/products/search?q=term  # Búsqueda general
```

## 🗄️ Estructura de Base de Datos

### **Colecciones MongoDB**
```
industrial-iot/
├── abrazaderas    (6 documentos)
├── epoxicos       (11 documentos) 
├── kits           (2 documentos)
├── contacts       (sistema de contactos)
└── admins         (usuarios admin)
```

### **Campos Comunes**
```javascript
{
  productId: Number|String,  // ID único por categoría
  name: String,              // Nombre del producto
  description: String,       // Descripción breve
  applications: [String],    // Lista de aplicaciones
  isActive: Boolean,         // Estado del producto
  sortOrder: Number,         // Orden de visualización
  createdAt: Date,          // Fecha de creación
  updatedAt: Date           // Última actualización
}
```

### **Campos Específicos por Categoría**

#### **Abrazaderas**
```javascript
{
  details: String,           // Descripción detallada
  image: String,            // Ruta de imagen local
  specs: [String],          // Especificaciones técnicas
  materials: [String]       // Materiales disponibles
}
```

#### **Epóxicos**
```javascript
{
  generic_type: String,     // Tipo genérico del epóxico
  image_url: String,        // URL externa de imagen
  product_url: String,      // URL del producto original
  film_thickness: Object,   // Espesores de aplicación
  flexibility: String,      // Información de flexibilidad
  colores: [String],        // Colores disponibles
  relacion_de_mezcla: String, // Ratio de mezcla
  pot_life: String,         // Tiempo de vida útil
  cure_time: String,        // Tiempo de curado
  chemical_resistance: [String], // Resistencias químicas
  service_temperature: String,   // Temperatura de servicio
  physical_properties: Object    // Propiedades físicas
}
```

#### **Kits**
```javascript
{
  image: String,            // Ruta de imagen local
  specs: [String],          // Especificaciones del kit
  content: [Object],        // Contenido del kit
  instructions: [Object],   // Instrucciones de uso
  usage_conditions: Object, // Condiciones de uso
  compatible_materials: [String], // Materiales compatibles
  available_sizes: [Object] // Tamaños disponibles
}
```

## 🔧 Comandos de Gestión

### **Migración de Datos**
```bash
cd server

# Migrar todos los productos
npm run migrate-products

# Migrar solo una categoría
npm run migrate-abrazaderas
npm run migrate-epoxicos  
npm run migrate-kits
```

### **Gestión del Servidor**
```bash
# Iniciar servidor de desarrollo
npm run dev

# Verificar conexión a APIs
curl http://localhost:5000/api/products/abrazaderas
curl http://localhost:5000/api/products/search?q=reparacion
```

## 📋 Funcionalidades Disponibles

### **✅ APIs Públicas**
- [x] Listar productos por categoría
- [x] Obtener producto específico por ID
- [x] Búsqueda general en todas las categorías
- [x] Filtros por tipo/aplicación
- [x] Paginación y límites

### **✅ APIs Administrativas (Requieren Auth)**
- [x] Crear nuevos productos
- [x] Actualizar productos existentes
- [x] Desactivar productos (soft delete)
- [x] Gestión de orden de visualización

### **✅ Panel de Administración**
- [x] Vista de resumen con estadísticas
- [x] Gestión por categorías separadas
- [x] Búsqueda y filtros
- [x] Vista previa de productos
- [x] Enlaces directos al catálogo público

### **🔄 Próximamente**
- [ ] Editor visual de productos
- [ ] Carga masiva de imágenes
- [ ] Exportación de catálogos
- [ ] Análisis de popularidad
- [ ] Versionado de productos

## 🔍 Ejemplos de Uso

### **Buscar Productos**
```javascript
// Buscar "reparación" en todas las categorías
const response = await fetch('/api/products/search?q=reparacion');
const results = await response.json();

// results.data contiene: { abrazaderas: [...], epoxicos: [...], kits: [...] }
```

### **Obtener Abrazaderas**
```javascript
// Todas las abrazaderas activas
const response = await fetch('/api/products/abrazaderas');
const abrazaderas = await response.json();

// Abrazadera específica
const response = await fetch('/api/products/abrazaderas/1');
const abrazadera = await response.json();
```

### **Crear Nuevo Producto (Admin)**
```javascript
const newProduct = await fetch('/api/products/abrazaderas', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin-token>'
  },
  credentials: 'include',
  body: JSON.stringify({
    name: "Nueva Abrazadera",
    description: "Descripción...",
    details: "Detalles completos...",
    image: "/nueva-abrazadera.jpg",
    specs: ["Especificación 1", "Especificación 2"],
    applications: ["Aplicación 1", "Aplicación 2"],
    materials: ["Material 1"]
  })
});
```

## 🎯 Ventajas del Nuevo Sistema

### **Antes (Archivos JSON)**
- ❌ Datos estáticos sin gestión
- ❌ Sin búsqueda unificada
- ❌ Sin panel de administración
- ❌ Actualizaciones manuales
- ❌ Sin versionado ni auditoría

### **Ahora (MongoDB + API)**
- ✅ Datos dinámicos gestionables
- ✅ Búsqueda avanzada en tiempo real
- ✅ Panel admin completo y protegido
- ✅ Actualizaciones automáticas vía API
- ✅ Historial de cambios y auditoría
- ✅ Escalable y mantenible
- ✅ APIs RESTful documentadas

## 📚 Documentación Adicional

- **`API-PRODUCTS.md`** - Documentación completa de APIs
- **`README-AUTH.md`** - Sistema de autenticación  
- **`SECURITY.md`** - Guía de seguridad

---

**🎉 Sistema de productos completamente funcional con 19 productos migrados y APIs operativas!**