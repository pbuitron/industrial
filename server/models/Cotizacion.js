const mongoose = require('mongoose');

const itemCotizacionSchema = new mongoose.Schema({
  // Referencia al producto
  productoId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'tipoProducto', // Referencia dinámica
    required: true
  },

  tipoProducto: {
    type: String,
    enum: ['Abrazadera', 'Kit', 'Epoxico'],
    required: true
  },

  // Datos del producto (copiados para histórico)
  codigo: {
    type: String,
    required: true,
    trim: true
  },

  numeroParte: {
    type: String,
    trim: true
  },

  descripcion: {
    type: String,
    required: true,
    trim: true
  },

  especificaciones: {
    type: String,
    trim: true
  },

  // Datos de cotización
  cantidad: {
    type: Number,
    required: true,
    min: 0.01
  },

  unidad: {
    type: String,
    required: true,
    enum: ['UND', 'SET', 'KIT', 'M', 'M2', 'KG', 'LT', 'GL'],
    default: 'UND'
  },

  precioUnitario: {
    type: Number,
    required: true,
    min: 0
  },

  descuento: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // Porcentaje
  },

  // Campos calculados
  subtotal: {
    type: Number,
    default: 0
  },

  totalDescuento: {
    type: Number,
    default: 0
  },

  total: {
    type: Number,
    default: 0
  }
});

const cotizacionSchema = new mongoose.Schema({
  // Número de cotización (auto-generado)
  numeroCotizacion: {
    type: String,
    unique: true,
    required: true
  },

  // Datos de la empresa emisora (configurables)
  empresaEmisor: {
    ruc: {
      type: String,
      required: true,
      default: '20123456789' // Configurar en env
    },
    razonSocial: {
      type: String,
      required: true,
      default: 'INDUSTRIAL IOT SAC'
    },
    direccion: {
      type: String,
      required: true,
      default: 'Av. Industrial 123, Lima, Perú'
    },
    telefono: {
      type: String,
      default: '+51 936 312 086'
    },
    email: {
      type: String,
      default: 'info@industrial-iot.us'
    },
    web: {
      type: String,
      default: 'www.industrial-iot.us'
    }
  },

  // Cliente
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },

  // Datos del cliente (copiados para histórico)
  datosCliente: {
    ruc: { type: String, required: true },
    razonSocial: { type: String, required: true },
    direccion: { type: String, required: true },
    contacto: {
      nombre: String,
      telefono: String,
      email: String
    },
    atencion: { type: String, trim: true },
    referencia: { type: String, trim: true }
  },

  // Fechas
  fechaCotizacion: {
    type: Date,
    default: Date.now,
    required: true
  },

  fechaValidez: {
    type: Date,
    required: true
  },

  // Estados de la cotización
  estado: {
    type: String,
    enum: ['BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA', 'CANCELADA'],
    default: 'BORRADOR'
  },

  // Configuraciones comerciales
  moneda: {
    type: String,
    enum: ['PEN', 'USD'],
    default: 'PEN'
  },

  tipoCambio: {
    type: Number,
    default: 1,
    min: 0.01
  },

  condicionPago: {
    type: String,
    enum: ['CONTADO', 'CREDITO_15', 'CREDITO_30', 'CREDITO_45', 'CREDITO_60', 'CREDITO_90'],
    default: 'CONTADO'
  },

  validezOferta: {
    type: Number,
    default: 15, // días
    min: 1
  },

  tiempoEntrega: {
    type: String,
    default: '15 días hábiles',
    trim: true
  },

  // Items de la cotización
  items: [itemCotizacionSchema],

  // Totales
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },

  totalDescuento: {
    type: Number,
    default: 0,
    min: 0
  },

  baseImponible: {
    type: Number,
    default: 0,
    min: 0
  },

  igv: {
    type: Number,
    default: 0,
    min: 0
  },

  total: {
    type: Number,
    default: 0,
    min: 0
  },

  // IGV configuración
  porcentajeIGV: {
    type: Number,
    default: 18,
    min: 0,
    max: 25
  },

  incluirIGV: {
    type: Boolean,
    default: true
  },

  // Observaciones y términos
  observaciones: {
    type: String,
    trim: true
  },

  terminos: {
    type: String,
    default: 'Precios no incluyen IGV. Oferta sujeta a disponibilidad de stock.',
    trim: true
  },

  // Control de versiones
  version: {
    type: Number,
    default: 1,
    min: 1
  },

  // Usuario que creó/modificó
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },

  modificadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

  // Control de estado
  isActive: {
    type: Boolean,
    default: true
  },

  // Metadatos
  fechaAprobacion: Date,
  fechaRechazo: Date,
  motivoRechazo: String,

  // Archivos adjuntos
  archivos: [{
    nombre: String,
    url: String,
    tipo: String,
    tamaño: Number,
    fechaSubida: { type: Date, default: Date.now }
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimización
cotizacionSchema.index({ numeroCotizacion: 1 });
cotizacionSchema.index({ cliente: 1 });
cotizacionSchema.index({ estado: 1 });
cotizacionSchema.index({ fechaCotizacion: -1 });
cotizacionSchema.index({ fechaValidez: 1 });
cotizacionSchema.index({ isActive: 1 });
cotizacionSchema.index({ creadoPor: 1 });

// Virtual para estado de validez
cotizacionSchema.virtual('estaVigente').get(function() {
  return new Date() <= this.fechaValidez &&
         ['ENVIADA', 'APROBADA'].includes(this.estado);
});

// Virtual para total en letras
cotizacionSchema.virtual('totalEnLetras').get(function() {
  return this.convertirNumeroALetras(this.total, this.moneda);
});

// Virtual para código QR de la cotización
cotizacionSchema.virtual('urlQR').get(function() {
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(this.numeroCotizacion)}`;
});

// Métodos de instancia
cotizacionSchema.methods.calcularTotales = function() {
  let subtotal = 0;
  let totalDescuento = 0;

  // Calcular totales de items
  this.items.forEach(item => {
    const subtotalItem = item.cantidad * item.precioUnitario;
    const descuentoItem = (subtotalItem * item.descuento) / 100;
    const totalItem = subtotalItem - descuentoItem;

    item.subtotal = subtotalItem;
    item.totalDescuento = descuentoItem;
    item.total = totalItem;

    subtotal += subtotalItem;
    totalDescuento += descuentoItem;
  });

  // Asignar totales a la cotización
  this.subtotal = subtotal;
  this.totalDescuento = totalDescuento;
  this.baseImponible = subtotal - totalDescuento;

  if (this.incluirIGV) {
    this.igv = (this.baseImponible * this.porcentajeIGV) / 100;
  } else {
    this.igv = 0;
  }

  this.total = this.baseImponible + this.igv;

  return this;
};

// Método para generar número de cotización
cotizacionSchema.methods.generarNumero = function() {
  const año = new Date().getFullYear();
  const mes = String(new Date().getMonth() + 1).padStart(2, '0');
  const contador = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  this.numeroCotizacion = `COT-${año}${mes}-${contador}`;
  return this.numeroCotizacion;
};

// Método para convertir número a letras (simplificado)
cotizacionSchema.methods.convertirNumeroALetras = function(numero, moneda) {
  // Implementación simplificada - en producción usar librería como numero-a-letras
  const entero = Math.floor(numero);
  const decimal = Math.round((numero - entero) * 100);

  const monedaTexto = moneda === 'USD' ? 'DÓLARES AMERICANOS' : 'SOLES';

  if (decimal > 0) {
    return `${entero} CON ${decimal}/100 ${monedaTexto}`;
  } else {
    return `${entero} CON 00/100 ${monedaTexto}`;
  }
};

// Método para cambiar estado
cotizacionSchema.methods.cambiarEstado = function(nuevoEstado, motivo = '') {
  const estadosValidos = ['BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA', 'CANCELADA'];

  if (!estadosValidos.includes(nuevoEstado)) {
    throw new Error('Estado no válido');
  }

  this.estado = nuevoEstado;

  if (nuevoEstado === 'APROBADA') {
    this.fechaAprobacion = new Date();
  } else if (nuevoEstado === 'RECHAZADA') {
    this.fechaRechazo = new Date();
    this.motivoRechazo = motivo;
  }

  return this;
};

// Método estático para buscar por número
cotizacionSchema.statics.buscarPorNumero = function(numero) {
  return this.findOne({ numeroCotizacion: numero, isActive: true });
};

// Método estático para obtener estadísticas
cotizacionSchema.statics.obtenerEstadisticas = async function(fechaInicio, fechaFin) {
  const pipeline = [
    {
      $match: {
        isActive: true,
        fechaCotizacion: {
          $gte: fechaInicio,
          $lte: fechaFin
        }
      }
    },
    {
      $group: {
        _id: '$estado',
        cantidad: { $sum: 1 },
        totalMonto: { $sum: '$total' }
      }
    }
  ];

  return await this.aggregate(pipeline);
};

// Middleware pre-save
cotizacionSchema.pre('save', function(next) {
  // Generar número si es nuevo documento
  if (this.isNew && !this.numeroCotizacion) {
    this.generarNumero();
  }

  // Calcular fechaValidez si no existe
  if (this.isNew && !this.fechaValidez) {
    const fechaValidez = new Date(this.fechaCotizacion);
    fechaValidez.setDate(fechaValidez.getDate() + this.validezOferta);
    this.fechaValidez = fechaValidez;
  }

  // Calcular totales
  this.calcularTotales();

  next();
});

// Middleware para actualizar estado vencido
cotizacionSchema.pre('find', function() {
  // Actualizar cotizaciones vencidas
  const ahora = new Date();
  this.model.updateMany(
    {
      fechaValidez: { $lt: ahora },
      estado: { $in: ['ENVIADA'] }
    },
    {
      $set: { estado: 'VENCIDA' }
    }
  ).exec();
});

module.exports = mongoose.model('Cotizacion', cotizacionSchema);