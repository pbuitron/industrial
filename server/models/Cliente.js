const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  // Datos del cliente
  ruc: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{11}$/.test(v); // RUC debe tener 11 dígitos
      },
      message: 'RUC debe tener 11 dígitos numéricos'
    }
  },

  razonSocial: {
    type: String,
    required: true,
    trim: true
  },

  nombreComercial: {
    type: String,
    trim: true
  },

  // Dirección
  direccion: {
    type: String,
    required: true,
    trim: true
  },

  distrito: {
    type: String,
    trim: true
  },

  provincia: {
    type: String,
    trim: true
  },

  departamento: {
    type: String,
    trim: true
  },

  // Contacto
  telefono: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Email debe tener un formato válido'
    }
  },

  // Datos de contacto específicos
  contacto: {
    nombre: { type: String, trim: true },
    cargo: { type: String, trim: true },
    telefono: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true }
  },

  // Datos SUNAT (obtenidos de la API)
  estado: {
    type: String,
    enum: ['ACTIVO', 'INACTIVO', 'BAJA DE OFICIO', 'BAJA PROVISIONAL', 'SUSPENSION TEMPORAL'],
    default: 'ACTIVO'
  },

  condicion: {
    type: String,
    enum: ['HABIDO', 'NO HABIDO']
  },

  fechaInscripcion: {
    type: Date
  },

  fechaInicioActividades: {
    type: Date
  },

  actividadEconomica: {
    type: String,
    trim: true
  },

  sistemaEmision: {
    type: String,
    trim: true
  },

  sistemaContabilidad: {
    type: String,
    trim: true
  },

  // Configuración comercial
  condicionPago: {
    type: String,
    enum: ['CONTADO', 'CREDITO_15', 'CREDITO_30', 'CREDITO_45', 'CREDITO_60', 'CREDITO_90'],
    default: 'CONTADO'
  },

  limiteCredito: {
    type: Number,
    default: 0,
    min: 0
  },

  // Metadatos
  ultimaConsultaRUC: {
    type: Date
  },

  // Control de registro
  isActive: {
    type: Boolean,
    default: true
  },

  // Observaciones
  observaciones: {
    type: String,
    trim: true
  }

}, {
  timestamps: true, // Crea automáticamente createdAt y updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimización
clienteSchema.index({ ruc: 1 });
clienteSchema.index({ razonSocial: 1 });
clienteSchema.index({ estado: 1 });
clienteSchema.index({ isActive: 1 });
clienteSchema.index({ createdAt: -1 });

// Virtual para dirección completa
clienteSchema.virtual('direccionCompleta').get(function() {
  const partes = [this.direccion, this.distrito, this.provincia, this.departamento]
    .filter(parte => parte && parte.trim());
  return partes.join(', ');
});

// Virtual para nombre completo
clienteSchema.virtual('nombreCompleto').get(function() {
  return this.nombreComercial || this.razonSocial;
});

// Método para verificar si el cliente está activo
clienteSchema.methods.estaActivo = function() {
  return this.isActive && this.estado === 'ACTIVO';
};

// Método para formatear RUC
clienteSchema.methods.formatearRUC = function() {
  const ruc = this.ruc;
  return `${ruc.substring(0, 2)}-${ruc.substring(2, 10)}-${ruc.substring(10)}`;
};

// Método estático para buscar por RUC
clienteSchema.statics.buscarPorRUC = function(ruc) {
  return this.findOne({ ruc: ruc.replace(/\D/g, '') }); // Remover caracteres no numéricos
};

// Middleware pre-save para limpiar RUC
clienteSchema.pre('save', function(next) {
  if (this.ruc) {
    this.ruc = this.ruc.replace(/\D/g, ''); // Solo números
  }
  next();
});

// Middleware pre-validate para normalizar datos
clienteSchema.pre('validate', function(next) {
  // Capitalizar razón social
  if (this.razonSocial) {
    this.razonSocial = this.razonSocial.toUpperCase();
  }

  // Capitalizar nombre comercial
  if (this.nombreComercial) {
    this.nombreComercial = this.nombreComercial.toUpperCase();
  }

  next();
});

module.exports = mongoose.model('Cliente', clienteSchema);