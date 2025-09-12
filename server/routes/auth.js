const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Admin = require('../models/Admin');
const { createSendToken, protect, logout } = require('../middleware/auth');
const Email = require('../utils/email');

const router = express.Router();

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por IP
  message: {
    success: false,
    message: 'Demasiados intentos de login. Inténtalo en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para reset de contraseña
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 intentos por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes de restablecimiento. Inténtalo en 1 hora'
  }
});

// Validaciones
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor ingresa un email válido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
];

const resetRequestValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor ingresa un email válido')
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return value;
    })
];

// POST /api/auth/login - Iniciar sesión
router.post('/login', loginLimiter, loginValidation, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar admin por email (incluir password para comparación)
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar si la cuenta está bloqueada
    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Cuenta bloqueada temporalmente debido a múltiples intentos fallidos. Inténtalo más tarde'
      });
    }

    // Verificar contraseña
    const isPasswordCorrect = await admin.comparePassword(password);

    if (!isPasswordCorrect) {
      // Incrementar intentos fallidos
      await admin.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    // Login exitoso - resetear intentos fallidos
    await admin.resetLoginAttempts();

    // Crear y enviar token
    createSendToken(admin, 200, res, 'Inicio de sesión exitoso');

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', logout);

// GET /api/auth/me - Obtener información del usuario autenticado
router.get('/me', protect, async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
        lastLogin: req.admin.lastLogin
      }
    }
  });
});

// POST /api/auth/request-reset - Solicitar reset de contraseña
router.post('/request-reset', resetLimiter, resetRequestValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Buscar admin por email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      // Por seguridad, siempre devolver el mismo mensaje
      return res.status(200).json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un correo con las instrucciones'
      });
    }

    // Verificar si la cuenta está activa
    if (!admin.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Esta cuenta está desactivada'
      });
    }

    // Generar token de reset
    const resetToken = admin.createPasswordResetToken();
    await admin.save({ validateBeforeSave: false });

    // Crear URL de reset
    const resetURL = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;

    try {
      // Enviar email
      await new Email(admin, resetURL).sendPasswordReset();

      res.status(200).json({
        success: true,
        message: 'Correo de recuperación enviado exitosamente'
      });

    } catch (error) {
      // Si falla el envío del email, limpiar tokens
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpires = undefined;
      await admin.save({ validateBeforeSave: false });

      console.error('Error enviando email de reset:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error enviando el correo. Inténtalo más tarde'
      });
    }

  } catch (error) {
    console.error('Error en request-reset:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/reset-password/:token - Restablecer contraseña
router.post('/reset-password/:token', resetPasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    // Hash del token recibido
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Buscar admin con el token válido y no expirado
    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Establecer nueva contraseña
    admin.password = req.body.password;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    admin.loginAttempts = undefined;
    admin.lockUntil = undefined;

    await admin.save();

    // Crear y enviar nuevo token (login automático)
    createSendToken(admin, 200, res, 'Contraseña restablecida exitosamente');

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/validate-reset-token/:token - Validar token de reset
router.get('/validate-reset-token/:token', async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        email: admin.email
      }
    });

  } catch (error) {
    console.error('Error validando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;