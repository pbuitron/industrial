const mongoose = require('mongoose');

const VarianteSchema = new mongoose.Schema({
  codigo: { type: String, required: true },
  descripcion: { type: String, required: true },
  precio: { type: Number, required: true },
  unidad: { type: String, required: true }
});

const productSchema = new mongoose.Schema({
  // Información básica del producto
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  // Imagen del producto
  image: {
    type: String
  },

  // Categoría del producto (abrazaderas, kits, epoxicos, etc.)
  category: {
    type: String,
    required: true,
    enum: ['abrazaderas', 'kits', 'epoxicos'],
    lowercase: true
  },

  // Variantes embebidas del producto
  variantes: [VarianteSchema],

  // Información de disponibilidad y estado
  isActive: {
    type: Boolean,
    default: true
  },

  // Campo para orden de visualización
  sortOrder: {
    type: Number,
    default: 0
  },

  // Metadatos adicionales específicos por categoría
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'products'
});

// Índices para optimización
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ sortOrder: 1 });

// Método para obtener producto con sus variantes (ya embebidas)
productSchema.methods.getWithVariants = function() {
  return this;
};

// Método estático para obtener productos activos por categoría
productSchema.statics.getByCategory = function(category) {
  return this.find({
    category: category,
    isActive: true
  }).sort({ sortOrder: 1, name: 1 });
};

// Método estático para obtener todos los productos activos con variantes
productSchema.statics.getActiveWithVariants = function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 });
};

// Método para buscar variante por código
productSchema.methods.getVariantByCode = function(codigo) {
  return this.variantes.find(variante => variante.codigo === codigo);
};

// Método estático para buscar producto por código de variante
productSchema.statics.findByVariantCode = function(codigo) {
  return this.findOne({
    'variantes.codigo': codigo,
    isActive: true
  });
};

module.exports = mongoose.model('Product', productSchema);