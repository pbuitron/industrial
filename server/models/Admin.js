const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres']
  },
  role: {
    type: String,
    default: 'admin',
    immutable: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
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

// Virtual para verificar si la cuenta está bloqueada
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Middleware pre-save para encriptar contraseña
adminSchema.pre('save', async function(next) {
  // Solo encriptar si la contraseña ha sido modificada
  if (!this.isModified('password')) return next();

  try {
    // Hash password con costo de 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware pre-save para actualizar updatedAt
adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Método para comparar contraseña
adminSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para generar token de reset de contraseña
adminSchema.methods.createPasswordResetToken = function() {
  // Generar token aleatorio
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash del token y guardarlo en la base de datos
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Establecer expiración (10 minutos)
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  
  // Retornar token sin encriptar
  return resetToken;
};

// Método para incrementar intentos de login
adminSchema.methods.incLoginAttempts = function() {
  // Si tenemos un bloqueo previo y ha expirado, reiniciar
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        lockUntil: 1
      },
      $set: {
        loginAttempts: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Si llegamos al máximo de intentos y no estamos bloqueados, bloquear cuenta
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // Bloquear por 2 horas
    };
  }
  
  return this.updateOne(updates);
};

// Método para resetear intentos de login exitosos
adminSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    },
    $set: {
      lastLogin: Date.now()
    }
  });
};

// Método estático para crear admin inicial
adminSchema.statics.createInitialAdmin = async function(adminData) {
  const existingAdmin = await this.findOne();
  if (existingAdmin) {
    throw new Error('Ya existe un administrador en el sistema');
  }
  
  return this.create(adminData);
};

// Índices
adminSchema.index({ email: 1 });
adminSchema.index({ resetPasswordToken: 1 });
adminSchema.index({ resetPasswordExpires: 1 });

module.exports = mongoose.model('Admin', adminSchema);