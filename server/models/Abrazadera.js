const mongoose = require('mongoose');

const abrazaderaSchema = new mongoose.Schema({
  // ID del producto (puede ser diferente del _id de MongoDB)
  productId: {
    type: Number,
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
  
  details: {
    type: String,
    required: true
  },
  
  // Imagen del producto
  image: {
    type: String,
    required: true
  },
  
  // Especificaciones técnicas
  specs: [{
    type: String,
    required: true
  }],
  
  // Aplicaciones del producto
  applications: [{
    type: String,
    required: true
  }],
  
  // Materiales disponibles
  materials: [{
    type: String,
    required: true
  }],
  
  // Datos técnicos para tablas
  technicalData: {
    headers: [{ type: String }],
    rows: [{ type: mongoose.Schema.Types.Mixed }]
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
  timestamps: true, // Automáticamente maneja createdAt y updatedAt
  collection: 'abrazaderas'
});

// Índices para optimización
abrazaderaSchema.index({ productId: 1 });
abrazaderaSchema.index({ name: 1 });
abrazaderaSchema.index({ isActive: 1 });
abrazaderaSchema.index({ sortOrder: 1 });

// Middleware pre-save para actualizar updatedAt
abrazaderaSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Métodos del esquema
abrazaderaSchema.methods.toJSON = function() {
  const abrazadera = this.toObject();
  
  // Remover campos internos si es necesario
  delete abrazadera.__v;
  
  return abrazadera;
};

// Método estático para buscar por productId
abrazaderaSchema.statics.findByProductId = function(productId) {
  return this.findOne({ productId: productId, isActive: true });
};

// Método estático para obtener productos activos ordenados
abrazaderaSchema.statics.getActiveProducts = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

module.exports = mongoose.model('Abrazadera', abrazaderaSchema);