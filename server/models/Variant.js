const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  // Referencia al producto padre
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  // Código único de la variante (para cotizaciones)
  code: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true // Permite múltiples documentos con code null/undefined
  },

  // Nombre de la variante (ej: "SEALPRO F - 2 pulgadas", "DN20", etc.)
  name: {
    type: String,
    required: true,
    trim: true
  },

  // Especificaciones técnicas de esta variante
  specs: [{
    type: String
  }],

  // Datos técnicos estructurados (reemplaza technicalData.rows)
  technicalSpecs: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Precio de la variante (opcional)
  price: {
    type: Number,
    min: 0
  },

  // Stock disponible (opcional)
  stock: {
    type: Number,
    min: 0,
    default: 0
  },

  // Información de disponibilidad
  isActive: {
    type: Boolean,
    default: true
  },

  // Orden de visualización dentro del producto
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'variants'
});

// Índices para optimización
variantSchema.index({ productId: 1 });
variantSchema.index({ code: 1 }, { sparse: true });
variantSchema.index({ isActive: 1 });
variantSchema.index({ productId: 1, sortOrder: 1 });

// Método para obtener la variante con el producto padre
variantSchema.methods.getWithProduct = function() {
  return this.populate('productId');
};

// Método estático para obtener variantes activas por producto
variantSchema.statics.getByProduct = function(productId) {
  return this.find({
    productId: productId,
    isActive: true
  }).sort({ sortOrder: 1, name: 1 });
};

// Método estático para buscar por código
variantSchema.statics.findByCode = function(code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true
  }).populate('productId');
};

// Generar código automático si no se proporciona
variantSchema.pre('save', async function(next) {
  if (!this.code && this.isNew) {
    // Obtener el producto padre para generar código basado en categoría
    const Product = mongoose.model('Product');
    const product = await Product.findById(this.productId);

    if (product) {
      let prefix = '';
      switch(product.category) {
        case 'abrazaderas':
          prefix = 'ABZ';
          break;
        case 'kits':
          prefix = 'KIT';
          break;
        case 'epoxicos':
          prefix = 'EPX';
          break;
        default:
          prefix = 'VAR';
      }

      // Generar número secuencial
      const count = await this.constructor.countDocuments({ productId: this.productId });
      this.code = `${prefix}-${String(count + 1).padStart(3, '0')}`;
    }
  }
  next();
});

module.exports = mongoose.model('Variant', variantSchema);