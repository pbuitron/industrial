const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Generar JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Verificar JWT Token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Middleware para proteger rutas
const protect = async (req, res, next) => {
  try {
    let token;

    console.log('🔍 Middleware auth - cookies:', req.cookies);
    console.log('🔍 Middleware auth - headers:', req.headers.authorization);

    // Obtener token de las cookies o del header Authorization
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
      console.log('✅ Token encontrado en cookies');
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token encontrado en headers');
    }

    // Verificar si existe el token
    if (!token) {
      console.log('❌ No se encontró token');
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. No se proporcionó token de autenticación'
      });
    }

    // Verificar el token
    const decoded = verifyToken(token);

    // Buscar el administrador y verificar si aún existe
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'El token pertenece a un usuario que ya no existe'
      });
    }

    // Verificar si la cuenta está activa
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta al soporte'
      });
    }

    // Verificar si la cuenta no está bloqueada
    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Cuenta bloqueada temporalmente debido a múltiples intentos de acceso fallidos'
      });
    }

    // Agregar el admin al request
    req.admin = admin;
    next();

  } catch (error) {
    console.error('Error en middleware de autenticación:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar rol de administrador (redundante pero útil para futuro)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }
    next();
  };
};

// Crear y enviar token con cookie
const createSendToken = (admin, statusCode, res, message = 'Operación exitosa') => {
  const token = generateToken(admin._id);

  // Configurar cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Prevenir ataques XSS
    secure: false, // Siempre false en desarrollo para localhost
    sameSite: 'lax', // Lax para compatibilidad localhost
    path: '/' // Asegurar que esté disponible en todas las rutas
  };

  // Enviar cookie
  res.cookie('jwt', token, cookieOptions);

  // Remover password del output
  admin.password = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    }
  });
};

// Logout - limpiar cookie
const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
};

module.exports = {
  generateToken,
  verifyToken,
  protect,
  restrictTo,
  createSendToken,
  logout
};