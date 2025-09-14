const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { protect } = require('../middleware/auth');

// Importar nuevos modelos
const Product = require('../models/Product');
const Variant = require('../models/Variant');

// Mantener modelos legacy para compatibilidad durante migración
const Abrazadera = require('../models/Abrazadera');
const Epoxico = require('../models/Epoxico');
const Kit = require('../models/Kit');

const router = express.Router();

// ========================================
// NUEVAS RUTAS - SISTEMA PRODUCT + VARIANT
// ========================================

// GET /api/products/v2 - Obtener todos los productos con variantes embebidas
router.get('/v2', async (req, res) => {
  try {
    const { category, includeInactive } = req.query;

    let query = {};
    if (!includeInactive || includeInactive !== 'true') {
      query.isActive = true;
    }
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/products/v2/:id - Obtener un producto específico con variantes embebidas
router.get('/v2/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/products/v2 - Crear nuevo producto
router.post('/v2',
  protect,
  [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('category').isIn(['abrazaderas', 'kits', 'epoxicos']).withMessage('Categoría inválida')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: errors.array()
        });
      }

      const product = new Product(req.body);
      await product.save();

      res.status(201).json({
        success: true,
        data: product,
        message: 'Producto creado exitosamente'
      });
    } catch (error) {
      console.error('Error al crear producto:', error);
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un producto con ese nombre'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// POST /api/products/v2/:id/variants - Agregar variante embebida a producto
router.post('/v2/:id/variants',
  protect,
  [
    body('codigo').notEmpty().withMessage('El código de la variante es requerido'),
    body('descripcion').notEmpty().withMessage('La descripción de la variante es requerida'),
    body('precio').isNumeric().withMessage('El precio debe ser un número'),
    body('unidad').notEmpty().withMessage('La unidad es requerida')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Verificar que el código de la variante no exista ya
      const existingVariant = product.variantes.find(v => v.codigo === req.body.codigo);
      if (existingVariant) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una variante con ese código'
        });
      }

      // Agregar variante embebida
      const newVariant = {
        codigo: req.body.codigo,
        descripcion: req.body.descripcion,
        precio: req.body.precio,
        unidad: req.body.unidad
      };

      product.variantes.push(newVariant);
      await product.save();

      res.status(201).json({
        success: true,
        data: newVariant,
        message: 'Variante creada exitosamente'
      });
    } catch (error) {
      console.error('Error al crear variante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// PUT /api/products/v2/:id - Actualizar producto
router.put('/v2/:id',
  protect,
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        success: true,
        data: product,
        message: 'Producto actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// DELETE /api/products/v2/:id - Eliminar producto (soft delete)
router.delete('/v2/:id',
  protect,
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Las variantes están embebidas, no necesitan actualización por separado

      res.json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// ========================================
// RUTAS PARA VARIANTES EMBEBIDAS
// ========================================

// GET /api/products/v2/:productId/variants/:codigo - Obtener variante específica por código
router.get('/v2/:productId/variants/:codigo', async (req, res) => {
  try {
    const { productId, codigo } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const variant = product.variantes.find(v => v.codigo === codigo);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variante no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        ...variant.toObject(),
        productName: product.name,
        productId: product._id
      }
    });
  } catch (error) {
    console.error('Error al obtener variante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/products/v2/:productId/variants/:codigo - Actualizar variante embebida
router.put('/v2/:productId/variants/:codigo',
  protect,
  async (req, res) => {
    try {
      const { productId, codigo } = req.params;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      const variantIndex = product.variantes.findIndex(v => v.codigo === codigo);
      if (variantIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Variante no encontrada'
        });
      }

      // Actualizar la variante
      Object.assign(product.variantes[variantIndex], req.body);
      await product.save();

      res.json({
        success: true,
        data: product.variantes[variantIndex],
        message: 'Variante actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error al actualizar variante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// DELETE /api/products/v2/:productId/variants/:codigo - Eliminar variante embebida
router.delete('/v2/:productId/variants/:codigo',
  protect,
  async (req, res) => {
    try {
      const { productId, codigo } = req.params;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      const variantIndex = product.variantes.findIndex(v => v.codigo === codigo);
      if (variantIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Variante no encontrada'
        });
      }

      // Eliminar la variante del array
      product.variantes.splice(variantIndex, 1);
      await product.save();

      res.json({
        success: true,
        message: 'Variante eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar variante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// ========================================
// RUTAS DE COMPATIBILIDAD (LEGACY)
// ========================================

// Mantener rutas existentes para compatibilidad
// GET /api/products/abrazaderas - Formato legacy + nuevo formato
router.get('/abrazaderas', async (req, res) => {
  try {
    const { includeInactive } = req.query;

    // Primero intentar obtener desde nueva estructura
    let query = { category: 'abrazaderas' };
    if (!includeInactive || includeInactive !== 'true') {
      query.isActive = true;
    }

    const newProducts = await Product.find(query);

    if (newProducts.length > 0) {
      // Transformar al formato legacy para compatibilidad
      const transformedProducts = newProducts.map(product => ({
        _id: product._id,
        name: product.name,
        description: product.description,
        image: product.image,
        tipoProducto: 'abrazaderas',
        codigo: product.variantes[0]?.codigo || '',
        technicalData: {
          headers: product.variantes.length > 0 ? ['Código', 'Descripción', 'Precio', 'Unidad'] : [],
          rows: product.variantes.map(variante => ({
            'Código': variante.codigo,
            'Descripción': variante.descripcion,
            'Precio': variante.precio,
            'Unidad': variante.unidad
          }))
        },
        ...product.metadata
      }));

      return res.json({
        success: true,
        data: transformedProducts,
        count: transformedProducts.length
      });
    }

    // Fallback a estructura legacy
    let abrazaderas;
    if (includeInactive === 'true') {
      abrazaderas = await Abrazadera.find({}).sort({ sortOrder: 1, name: 1 });
    } else {
      abrazaderas = await Abrazadera.getActiveProducts();
    }

    // Transformar a nuevo formato
    const transformedLegacy = abrazaderas.map(item => ({
      ...item.toObject(),
      tipoProducto: 'abrazaderas'
    }));

    res.json({
      success: true,
      data: transformedLegacy,
      count: transformedLegacy.length
    });
  } catch (error) {
    console.error('Error al obtener abrazaderas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Rutas similares para kits y epoxicos...
router.get('/kits', async (req, res) => {
  try {
    const { includeInactive } = req.query;

    let query = { category: 'kits' };
    if (!includeInactive || includeInactive !== 'true') {
      query.isActive = true;
    }

    const newProducts = await Product.find(query);

    if (newProducts.length > 0) {
      const transformedProducts = newProducts.map(product => ({
        _id: product._id,
        name: product.name,
        description: product.description,
        image: product.image,
        tipoProducto: 'kits',
        codigo: product.variantes[0]?.codigo || '',
        technicalData: {
          headers: product.variantes.length > 0 ? ['Código', 'Descripción', 'Precio', 'Unidad'] : [],
          rows: product.variantes.map(variante => ({
            'Código': variante.codigo,
            'Descripción': variante.descripcion,
            'Precio': variante.precio,
            'Unidad': variante.unidad
          }))
        },
        ...product.metadata
      }));

      return res.json({
        success: true,
        data: transformedProducts,
        count: transformedProducts.length
      });
    }

    // Fallback legacy
    let kits;
    if (includeInactive === 'true') {
      kits = await Kit.find({}).sort({ sortOrder: 1, name: 1 });
    } else {
      kits = await Kit.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    }

    const transformedLegacy = kits.map(item => ({
      ...item.toObject(),
      tipoProducto: 'kits'
    }));

    res.json({
      success: true,
      data: transformedLegacy,
      count: transformedLegacy.length
    });
  } catch (error) {
    console.error('Error al obtener kits:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

router.get('/epoxicos', async (req, res) => {
  try {
    const { includeInactive } = req.query;

    let query = { category: 'epoxicos' };
    if (!includeInactive || includeInactive !== 'true') {
      query.isActive = true;
    }

    const newProducts = await Product.find(query);

    if (newProducts.length > 0) {
      const transformedProducts = newProducts.map(product => ({
        _id: product._id,
        name: product.name,
        description: product.description,
        image: product.image,
        tipoProducto: 'epoxicos',
        codigo: product.variantes[0]?.codigo || '',
        technicalData: {
          headers: product.variantes.length > 0 ? ['Código', 'Descripción', 'Precio', 'Unidad'] : [],
          rows: product.variantes.map(variante => ({
            'Código': variante.codigo,
            'Descripción': variante.descripcion,
            'Precio': variante.precio,
            'Unidad': variante.unidad
          }))
        },
        ...product.metadata
      }));

      return res.json({
        success: true,
        data: transformedProducts,
        count: transformedProducts.length
      });
    }

    // Fallback legacy
    let epoxicos;
    if (includeInactive === 'true') {
      epoxicos = await Epoxico.find({}).sort({ sortOrder: 1, name: 1 });
    } else {
      epoxicos = await Epoxico.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    }

    const transformedLegacy = epoxicos.map(item => ({
      ...item.toObject(),
      tipoProducto: 'epoxicos'
    }));

    res.json({
      success: true,
      data: transformedLegacy,
      count: transformedLegacy.length
    });
  } catch (error) {
    console.error('Error al obtener epoxicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;