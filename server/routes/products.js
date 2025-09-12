const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { protect } = require('../middleware/auth');

// Importar modelos
const Abrazadera = require('../models/Abrazadera');
const Epoxico = require('../models/Epoxico');
const Kit = require('../models/Kit');

const router = express.Router();

// ========================================
// RUTAS PÚBLICAS - ABRAZADERAS
// ========================================

// GET /api/products/abrazaderas - Obtener todas las abrazaderas
router.get('/abrazaderas', async (req, res) => {
  try {
    const { includeInactive } = req.query;
    
    let abrazaderas;
    if (includeInactive === 'true') {
      // Para admin: mostrar todos los productos
      abrazaderas = await Abrazadera.find({}).sort({ sortOrder: 1, name: 1 });
    } else {
      // Para público: solo activos
      abrazaderas = await Abrazadera.getActiveProducts();
    }
    
    res.json({
      success: true,
      data: abrazaderas,
      count: abrazaderas.length
    });
  } catch (error) {
    console.error('Error al obtener abrazaderas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/products/abrazaderas/:id - Obtener una abrazadera específica
router.get('/abrazaderas/:id', [
  param('id').isNumeric().withMessage('ID debe ser numérico')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: errors.array()
      });
    }

    const abrazadera = await Abrazadera.findByProductId(parseInt(req.params.id));
    
    if (!abrazadera) {
      return res.status(404).json({
        success: false,
        message: 'Abrazadera no encontrada'
      });
    }

    res.json({
      success: true,
      data: abrazadera
    });
  } catch (error) {
    console.error('Error al obtener abrazadera:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ========================================
// RUTAS PÚBLICAS - EPÓXICOS
// ========================================

// GET /api/products/epoxicos - Obtener todos los epóxicos
router.get('/epoxicos', async (req, res) => {
  try {
    const { type, includeInactive } = req.query;
    let epoxicos;
    
    if (includeInactive === 'true') {
      // Para admin: mostrar todos los productos
      epoxicos = await Epoxico.find({}).sort({ sortOrder: 1, name: 1 });
    } else if (type) {
      epoxicos = await Epoxico.findByGenericType(type);
    } else {
      // Para público: solo activos
      epoxicos = await Epoxico.getActiveProducts();
    }
    
    res.json({
      success: true,
      data: epoxicos,
      count: epoxicos.length
    });
  } catch (error) {
    console.error('Error al obtener epóxicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/products/epoxicos/:id - Obtener un epóxico específico
router.get('/epoxicos/:id', async (req, res) => {
  try {
    const epoxico = await Epoxico.findByProductId(req.params.id);
    
    if (!epoxico) {
      return res.status(404).json({
        success: false,
        message: 'Epóxico no encontrado'
      });
    }

    res.json({
      success: true,
      data: epoxico
    });
  } catch (error) {
    console.error('Error al obtener epóxico:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ========================================
// RUTAS PÚBLICAS - KITS
// ========================================

// GET /api/products/kits - Obtener todos los kits
router.get('/kits', async (req, res) => {
  try {
    const { application, includeInactive } = req.query;
    let kits;
    
    if (includeInactive === 'true') {
      // Para admin: mostrar todos los productos
      kits = await Kit.find({}).sort({ sortOrder: 1, name: 1 });
    } else if (application) {
      kits = await Kit.findByApplication(application);
    } else {
      // Para público: solo activos
      kits = await Kit.getActiveProducts();
    }
    
    res.json({
      success: true,
      data: kits,
      count: kits.length
    });
  } catch (error) {
    console.error('Error al obtener kits:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/products/kits/:id - Obtener un kit específico
router.get('/kits/:id', [
  param('id').isNumeric().withMessage('ID debe ser numérico')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: errors.array()
      });
    }

    const kit = await Kit.findByProductId(parseInt(req.params.id));
    
    if (!kit) {
      return res.status(404).json({
        success: false,
        message: 'Kit no encontrado'
      });
    }

    res.json({
      success: true,
      data: kit
    });
  } catch (error) {
    console.error('Error al obtener kit:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ========================================
// RUTAS PROTEGIDAS - ADMINISTRACIÓN
// ========================================

// Validaciones para crear/actualizar abrazaderas
const abrazaderaValidation = [
  body('name').notEmpty().withMessage('Nombre es obligatorio'),
  body('description').notEmpty().withMessage('Descripción es obligatoria'),
  body('details').notEmpty().withMessage('Detalles son obligatorios'),
  body('image').notEmpty().withMessage('Imagen es obligatoria'),
  body('specs').isArray({ min: 1 }).withMessage('Especificaciones deben ser un array con al menos un elemento'),
  body('applications').isArray({ min: 1 }).withMessage('Aplicaciones deben ser un array con al menos un elemento')
];

// POST /api/products/abrazaderas - Crear nueva abrazadera (Admin)
router.post('/abrazaderas', protect, abrazaderaValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    // Encontrar el siguiente ID disponible
    const lastAbrazadera = await Abrazadera.findOne().sort({ productId: -1 });
    const nextId = lastAbrazadera ? lastAbrazadera.productId + 1 : 1;

    const abrazadera = new Abrazadera({
      ...req.body,
      productId: nextId
    });

    await abrazadera.save();

    res.status(201).json({
      success: true,
      message: 'Abrazadera creada exitosamente',
      data: abrazadera
    });

  } catch (error) {
    console.error('Error al crear abrazadera:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una abrazadera con ese ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/products/abrazaderas/:id - Actualizar abrazadera (Admin)
router.put('/abrazaderas/:id', protect, abrazaderaValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const abrazadera = await Abrazadera.findOneAndUpdate(
      { productId: parseInt(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    );

    if (!abrazadera) {
      return res.status(404).json({
        success: false,
        message: 'Abrazadera no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Abrazadera actualizada exitosamente',
      data: abrazadera
    });

  } catch (error) {
    console.error('Error al actualizar abrazadera:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/products/abrazaderas/:id - Eliminar abrazadera (Admin)
router.delete('/abrazaderas/:id', protect, async (req, res) => {
  try {
    const abrazadera = await Abrazadera.findOneAndUpdate(
      { productId: parseInt(req.params.id) },
      { isActive: false },
      { new: true }
    );

    if (!abrazadera) {
      return res.status(404).json({
        success: false,
        message: 'Abrazadera no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Abrazadera eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar abrazadera:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ========================================
// RUTA GENERAL DE BÚSQUEDA
// ========================================

// GET /api/products/search - Buscar productos en todas las categorías
router.get('/search', async (req, res) => {
  try {
    const { q, category } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La búsqueda debe tener al menos 2 caracteres'
      });
    }

    const searchRegex = new RegExp(q, 'i');
    const results = {};

    // Buscar en abrazaderas si no se especifica categoría o es 'abrazaderas'
    if (!category || category === 'abrazaderas') {
      results.abrazaderas = await Abrazadera.find({
        $and: [
          { isActive: true },
          {
            $or: [
              { name: searchRegex },
              { description: searchRegex },
              { applications: searchRegex }
            ]
          }
        ]
      }).limit(10);
    }

    // Buscar en epóxicos
    if (!category || category === 'epoxicos') {
      results.epoxicos = await Epoxico.find({
        $and: [
          { isActive: true },
          {
            $or: [
              { name: searchRegex },
              { description: searchRegex },
              { applications: searchRegex },
              { generic_type: searchRegex }
            ]
          }
        ]
      }).limit(10);
    }

    // Buscar en kits
    if (!category || category === 'kits') {
      results.kits = await Kit.find({
        $and: [
          { isActive: true },
          {
            $or: [
              { name: searchRegex },
              { description: searchRegex },
              { applications: searchRegex }
            ]
          }
        ]
      }).limit(10);
    }

    res.json({
      success: true,
      data: results,
      query: q
    });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;