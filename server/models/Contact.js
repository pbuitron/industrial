const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'El nombre de la empresa no puede exceder los 100 caracteres']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'El teléfono no puede exceder los 20 caracteres']
  },
  productType: {
    type: String,
    required: [true, 'El tipo de producto es obligatorio'],
    enum: [
      'abrazaderas',
      'kits',
      'epoxicos',
      'Servicio de Recubrimiento',
      'Fabricacion de Pernos',
      'Reparación de bombas',
      'otro'
    ]
  },
  message: {
    type: String,
    required: [true, 'El mensaje es obligatorio'],
    trim: true,
    maxlength: [1000, 'El mensaje no puede exceder los 1000 caracteres']
  },
  status: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'completado', 'archivado'],
    default: 'pendiente'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Actualizar updatedAt antes de guardar
contactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Contact', contactSchema);