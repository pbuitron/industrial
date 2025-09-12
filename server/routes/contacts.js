const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validaciones para crear contacto
const createContactValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder los 100 caracteres'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Por favor ingresa un email válido')
    .normalizeEmail(),
  
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El nombre de la empresa no puede exceder los 100 caracteres'),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('El teléfono no puede exceder los 20 caracteres'),
  
  body('productType')
    .notEmpty()
    .withMessage('El tipo de producto es obligatorio')
    .isIn(['abrazaderas', 'kits', 'epoxicos', 'Servicio de Recubrimiento', 'Fabricacion de Pernos', 'Reparación de bombas', 'otro'])
    .withMessage('Tipo de producto no válido'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('El mensaje es obligatorio')
    .isLength({ max: 1000 })
    .withMessage('El mensaje no puede exceder los 1000 caracteres')
];

// POST /api/contacts - Crear nuevo contacto
router.post('/', createContactValidation, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { name, email, company, phone, productType, message } = req.body;

    // Crear nuevo contacto
    const newContact = new Contact({
      name,
      email,
      company,
      phone,
      productType,
      message
    });

    const savedContact = await newContact.save();

    res.status(201).json({
      success: true,
      message: 'Solicitud enviada exitosamente',
      data: {
        id: savedContact._id,
        name: savedContact.name,
        email: savedContact.email,
        productType: savedContact.productType,
        status: savedContact.status,
        createdAt: savedContact.createdAt
      }
    });

  } catch (error) {
    console.error('Error al crear contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/contacts - Obtener todos los contactos (Solo admins)
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      productType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros
    const filters = {};
    if (status) filters.status = status;
    if (productType) filters.productType = productType;

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construir sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Ejecutar consulta con paginación
    const contacts = await Contact.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v'); // Excluir campo __v

    // Contar total de documentos
    const total = await Contact.countDocuments(filters);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error al obtener contactos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/contacts/:id - Obtener contacto por ID (Solo admins)
router.get('/:id', protect, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).select('-__v');
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Error al obtener contacto:', error);
    
    // Manejar errores de ObjectId inválido
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de contacto inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/contacts/:id/status - Actualizar estado del contacto (Solo admins)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pendiente', 'en_proceso', 'completado', 'archivado'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id, 
      { status, updatedAt: Date.now() }, 
      { new: true, runValidators: true }
    ).select('-__v');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: contact
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de contacto inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;