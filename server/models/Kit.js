const mongoose = require('mongoose');

const kitSchema = new mongoose.Schema({
  // ID del producto
  productId: {
    type: Number,
    required: true,
    unique: true
  },

  // Código para cotizaciones (no visible en frontend público)
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^KIT-\d{3}$/.test(v); // Formato: KIT-001, KIT-002, etc.
      },
      message: 'Código debe tener el formato KIT-XXX donde XXX son 3 dígitos'
    }
  },

  // Información básica del producto
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  // Imagen del producto
  image: {
    type: String,
    required: true
  },
  
  // Especificaciones técnicas del kit
  specs: [{
    type: String,
    required: true
  }],
  
  // Aplicaciones del kit
  applications: [{
    type: String,
    required: true
  }],
  
  // Resistencia del kit (campo específico de kits)
  resistencia: [{
    type: String
  }],
  
  // Datos técnicos para tablas
  technicalData: {
    headers: [{ type: String }],
    rows: [{ type: mongoose.Schema.Types.Mixed }]
  },
  
  // Contenido del kit (si aplica)
  content: [{
    item: String,
    quantity: Number,
    description: String
  }],
  
  // Instrucciones de uso
  instructions: [{
    step: Number,
    description: String
  }],
  
  // Condiciones de uso
  usage_conditions: {
    max_pressure: String,
    max_temperature: String,
    min_temperature: String,
    application_time: String,
    cure_time: String
  },
  
  // Materiales compatibles
  compatible_materials: [{
    type: String
  }],
  
  // Tamaños disponibles
  available_sizes: [{
    size: String,
    description: String,
    coverage: String
  }],
  
  // Información de disponibilidad y estado
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadatos
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Campo para orden de visualización
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'kits'
});

// Índices para optimización
kitSchema.index({ productId: 1 });
kitSchema.index({ name: 1 });
kitSchema.index({ isActive: 1 });
kitSchema.index({ sortOrder: 1 });

// Middleware pre-save
kitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Métodos del esquema
kitSchema.methods.toJSON = function() {
  const kit = this.toObject();
  delete kit.__v;
  return kit;
};

// Método estático para buscar por productId
kitSchema.statics.findByProductId = function(productId) {
  return this.findOne({ productId: productId, isActive: true });
};

// Método estático para obtener productos activos ordenados
kitSchema.statics.getActiveProducts = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Método para buscar kits por aplicación específica
kitSchema.statics.findByApplication = function(application) {
  return this.find({ 
    applications: new RegExp(application, 'i'), 
    isActive: true 
  });
};

module.exports = mongoose.model('Kit', kitSchema);