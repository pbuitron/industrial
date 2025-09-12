const mongoose = require('mongoose');

const epoxicoSchema = new mongoose.Schema({
  // ID del producto (puede ser string como "s-26")
  productId: {
    type: String,
    required: true,
    unique: true
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
  
  // Tipo genérico del producto
  generic_type: {
    type: String,
    required: true
  },
  
  // URLs de imagen y producto
  image_url: {
    type: String,
    required: true
  },
  
  product_url: {
    type: String
  },
  
  // Especificaciones de espesor de película
  film_thickness: {
    hand_application: String,
    spray_application: String,
    max_without_slump_hand: String,
    max_without_slump_spray: String
  },
  
  // Flexibilidad del producto
  flexibility: {
    type: String
  },
  
  // Aplicaciones del producto
  applications: [{
    type: String,
    required: true
  }],
  
  // Colores disponibles
  colores: [{
    type: String
  }],
  
  // Relación de mezcla
  relacion_de_mezcla: {
    type: String
  },
  
  // Tiempo de vida útil
  pot_life: {
    type: String
  },
  
  // Tiempo de curado
  cure_time: {
    type: String
  },
  
  // Resistencia química
  chemical_resistance: [{
    type: String
  }],
  
  // Temperatura de servicio
  service_temperature: {
    type: String
  },
  
  // Propiedades físicas
  physical_properties: {
    tensile_strength: String,
    compressive_strength: String,
    flexural_strength: String,
    shore_d_hardness: String
  },
  
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
  collection: 'epoxicos'
});

// Índices para optimización
epoxicoSchema.index({ productId: 1 });
epoxicoSchema.index({ name: 1 });
epoxicoSchema.index({ generic_type: 1 });
epoxicoSchema.index({ isActive: 1 });
epoxicoSchema.index({ sortOrder: 1 });

// Middleware pre-save
epoxicoSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Métodos del esquema
epoxicoSchema.methods.toJSON = function() {
  const epoxico = this.toObject();
  delete epoxico.__v;
  return epoxico;
};

// Método estático para buscar por productId
epoxicoSchema.statics.findByProductId = function(productId) {
  return this.findOne({ productId: productId, isActive: true });
};

// Método estático para obtener productos activos ordenados
epoxicoSchema.statics.getActiveProducts = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Método para buscar por tipo genérico
epoxicoSchema.statics.findByGenericType = function(type) {
  return this.find({ generic_type: new RegExp(type, 'i'), isActive: true });
};

module.exports = mongoose.model('Epoxico', epoxicoSchema);