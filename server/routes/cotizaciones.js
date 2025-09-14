const express = require('express');
const Cotizacion = require('../models/Cotizacion');
const Cliente = require('../models/Cliente');
// Nuevos modelos
const Product = require('../models/Product');
// Legacy models para compatibilidad
const Abrazadera = require('../models/Abrazadera');
const Kit = require('../models/Kit');
const Epoxico = require('../models/Epoxico');
const { protect: auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/cotizaciones - Listar cotizaciones con filtros
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      estado = '',
      clienteId = '',
      fechaInicio = '',
      fechaFin = '',
      sortBy = 'fechaCotizacion',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros
    const filters = { isActive: true };

    if (search) {
      filters.numeroCotizacion = new RegExp(search.trim(), 'i');
    }

    if (estado) {
      filters.estado = estado;
    }

    if (clienteId) {
      filters.cliente = clienteId;
    }

    if (fechaInicio && fechaFin) {
      filters.fechaCotizacion = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    // Configurar paginación
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Ejecutar consulta
    const [cotizaciones, total] = await Promise.all([
      Cotizacion.find(filters)
        .populate('cliente', 'ruc razonSocial nombreComercial')
        .populate('creadoPor', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .select('-items -__v') // Excluir items para lista
        .lean(),
      Cotizacion.countDocuments(filters)
    ]);

    res.json({
      success: true,
      data: {
        cotizaciones,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo cotizaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/cotizaciones/:id - Obtener cotización completa
router.get('/:id', auth, async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id)
      .populate('cliente')
      .populate('creadoPor', 'name email')
      .populate('modificadoPor', 'name email')
      .populate('items.productoId')
      .lean();

    if (!cotizacion) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    res.json({
      success: true,
      data: cotizacion
    });

  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/cotizaciones - Crear nueva cotización
router.post('/', auth, async (req, res) => {
  try {
    const datosCotizacion = req.body;

    // Agregar usuario que crea la cotización
    datosCotizacion.creadoPor = req.admin._id;

    // Verificar que el cliente existe
    const cliente = await Cliente.findById(datosCotizacion.cliente);
    if (!cliente) {
      return res.status(400).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Copiar datos del cliente para histórico
    datosCotizacion.datosCliente = {
      ruc: cliente.ruc,
      razonSocial: cliente.razonSocial,
      direccion: cliente.direccionCompleta,
      contacto: cliente.contacto || {}
    };

    // Validar y obtener datos de productos/variantes para items
    if (datosCotizacion.items && datosCotizacion.items.length > 0) {
      for (let i = 0; i < datosCotizacion.items.length; i++) {
        const item = datosCotizacion.items[i];

        // Si tiene código de variante, buscar en el nuevo modelo
        if (item.codigoVariante) {
          const producto = await Product.findByVariantCode(item.codigoVariante);
          if (!producto) {
            return res.status(400).json({
              success: false,
              message: `Producto con variante ${item.codigoVariante} no encontrado en item ${i + 1}`
            });
          }

          const variante = producto.getVariantByCode(item.codigoVariante);
          if (!variante) {
            return res.status(400).json({
              success: false,
              message: `Variante ${item.codigoVariante} no encontrada en item ${i + 1}`
            });
          }

          // Copiar datos de la variante
          item.codigo = variante.codigo;
          item.descripcion = variante.descripcion;
          item.especificaciones = `${producto.name} - ${variante.descripcion}`;
          item.precio = variante.precio;
          item.unidad = variante.unidad;
          item.productoId = producto._id;
          item.tipoProducto = producto.category;
        } else {
          // Fallback a modelos legacy
          let producto;

          switch (item.tipoProducto) {
            case 'Abrazadera':
            case 'abrazaderas':
              producto = await Abrazadera.findById(item.productoId);
              break;
            case 'Kit':
            case 'kits':
              producto = await Kit.findById(item.productoId);
              break;
            case 'Epoxico':
            case 'epoxicos':
              producto = await Epoxico.findById(item.productoId);
              break;
            default:
              return res.status(400).json({
                success: false,
                message: `Tipo de producto inválido: ${item.tipoProducto}`
              });
          }

          if (!producto) {
            return res.status(400).json({
              success: false,
              message: `Producto no encontrado en item ${i + 1}`
            });
          }

          // Copiar datos del producto legacy
          item.codigo = producto.codigo;
          item.descripcion = producto.name;
          item.especificaciones = producto.description;
        }
      }
    }

    const nuevaCotizacion = new Cotizacion(datosCotizacion);
    const cotizacionGuardada = await nuevaCotizacion.save();

    // Obtener cotización completa con populate
    const cotizacionCompleta = await Cotizacion.findById(cotizacionGuardada._id)
      .populate('cliente')
      .populate('creadoPor', 'name email');

    res.status(201).json({
      success: true,
      data: cotizacionCompleta,
      message: 'Cotización creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando cotización:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de cotización inválidos',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/cotizaciones/:id - Actualizar cotización
router.put('/:id', auth, async (req, res) => {
  try {
    const cotizacionId = req.params.id;
    const datosActualizados = req.body;

    // Agregar usuario que modifica
    datosActualizados.modificadoPor = req.admin._id;

    // Obtener cotización actual
    const cotizacionActual = await Cotizacion.findById(cotizacionId);
    if (!cotizacionActual) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    // Verificar permisos (el creador o admin puede modificar)
    if (cotizacionActual.creadoPor.toString() !== req.admin._id && req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar esta cotización'
      });
    }

    // No permitir modificar cotizaciones aprobadas
    if (cotizacionActual.estado === 'APROBADA') {
      return res.status(400).json({
        success: false,
        message: 'No se puede modificar una cotización aprobada'
      });
    }

    // Validar items si se proporcionan
    if (datosActualizados.items && datosActualizados.items.length > 0) {
      for (let i = 0; i < datosActualizados.items.length; i++) {
        const item = datosActualizados.items[i];

        // Si tiene código de variante, buscar en el nuevo modelo
        if (item.codigoVariante) {
          const producto = await Product.findByVariantCode(item.codigoVariante);
          if (!producto) {
            return res.status(400).json({
              success: false,
              message: `Producto con variante ${item.codigoVariante} no encontrado en item ${i + 1}`
            });
          }

          const variante = producto.getVariantByCode(item.codigoVariante);
          if (!variante) {
            return res.status(400).json({
              success: false,
              message: `Variante ${item.codigoVariante} no encontrada en item ${i + 1}`
            });
          }

          // Actualizar datos de la variante
          item.codigo = variante.codigo;
          item.descripcion = variante.descripcion;
          item.especificaciones = `${producto.name} - ${variante.descripcion}`;
          item.precio = variante.precio;
          item.unidad = variante.unidad;
          item.productoId = producto._id;
          item.tipoProducto = producto.category;
        } else {
          // Fallback a modelos legacy
          let producto;

          switch (item.tipoProducto) {
            case 'Abrazadera':
            case 'abrazaderas':
              producto = await Abrazadera.findById(item.productoId);
              break;
            case 'Kit':
            case 'kits':
              producto = await Kit.findById(item.productoId);
              break;
            case 'Epoxico':
            case 'epoxicos':
              producto = await Epoxico.findById(item.productoId);
              break;
          }

          if (!producto) {
            return res.status(400).json({
              success: false,
              message: `Producto no encontrado en item ${i + 1}`
            });
          }

          // Actualizar datos del producto legacy
          item.codigo = producto.codigo;
          item.descripcion = producto.name;
          item.especificaciones = producto.description;
        }
      }
    }

    const cotizacionActualizada = await Cotizacion.findByIdAndUpdate(
      cotizacionId,
      datosActualizados,
      { new: true, runValidators: true }
    )
    .populate('cliente')
    .populate('creadoPor', 'name email')
    .populate('modificadoPor', 'name email');

    res.json({
      success: true,
      data: cotizacionActualizada,
      message: 'Cotización actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando cotización:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de cotización inválidos',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/cotizaciones/:id/estado - Cambiar estado de cotización
router.put('/:id/estado', auth, async (req, res) => {
  try {
    const { estado, motivo = '' } = req.body;
    const cotizacion = await Cotizacion.findById(req.params.id);

    if (!cotizacion) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    // Cambiar estado
    cotizacion.cambiarEstado(estado, motivo);
    cotizacion.modificadoPor = req.admin._id;

    await cotizacion.save();

    res.json({
      success: true,
      data: cotizacion,
      message: `Estado cambiado a ${estado}`
    });

  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// DELETE /api/cotizaciones/:id - Eliminar cotización (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);

    if (!cotizacion) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    // Verificar permisos
    if (cotizacion.creadoPor.toString() !== req.admin._id && req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta cotización'
      });
    }

    // No permitir eliminar cotizaciones aprobadas
    if (cotizacion.estado === 'APROBADA') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una cotización aprobada'
      });
    }

    // Soft delete
    cotizacion.isActive = false;
    cotizacion.modificadoPor = req.admin._id;
    await cotizacion.save();

    res.json({
      success: true,
      message: 'Cotización eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando cotización:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/cotizaciones/dashboard/estadisticas - Estadísticas para dashboard
router.get('/dashboard/estadisticas', auth, async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const filtroFecha = {};
    if (fechaInicio && fechaFin) {
      filtroFecha.fechaCotizacion = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const [
      estadisticasPorEstado,
      totalCotizaciones,
      montoTotal,
      cotizacionesRecientes,
      clientesActivos
    ] = await Promise.all([
      // Estadísticas por estado
      Cotizacion.aggregate([
        { $match: { isActive: true, ...filtroFecha } },
        {
          $group: {
            _id: '$estado',
            cantidad: { $sum: 1 },
            montoTotal: { $sum: '$total' }
          }
        }
      ]),

      // Total de cotizaciones
      Cotizacion.countDocuments({ isActive: true, ...filtroFecha }),

      // Monto total
      Cotizacion.aggregate([
        { $match: { isActive: true, ...filtroFecha } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),

      // Cotizaciones recientes
      Cotizacion.find({ isActive: true })
        .populate('cliente', 'razonSocial')
        .sort({ fechaCotizacion: -1 })
        .limit(5)
        .select('numeroCotizacion estado total fechaCotizacion cliente'),

      // Clientes con más cotizaciones
      Cotizacion.aggregate([
        { $match: { isActive: true, ...filtroFecha } },
        {
          $group: {
            _id: '$cliente',
            cantidadCotizaciones: { $sum: 1 },
            montoTotal: { $sum: '$total' }
          }
        },
        { $sort: { cantidadCotizaciones: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'clientes',
            localField: '_id',
            foreignField: '_id',
            as: 'cliente'
          }
        },
        { $unwind: '$cliente' }
      ])
    ]);

    res.json({
      success: true,
      data: {
        estadisticasPorEstado,
        totalCotizaciones,
        montoTotal: montoTotal[0]?.total || 0,
        cotizacionesRecientes,
        clientesActivos
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/cotizaciones/productos/search - Búsqueda de productos para cotización
router.get('/productos/search', auth, async (req, res) => {
  try {
    const { q = '', category = '', limit = 20 } = req.query;

    if (!q.trim()) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const limitNum = parseInt(limit);

    // Primero buscar en el nuevo modelo Product
    const productFilters = {
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { 'variantes.codigo': searchRegex },
        { 'variantes.descripcion': searchRegex }
      ]
    };

    if (category) {
      productFilters.category = category;
    }

    const productos = await Product.find(productFilters)
      .select('name description image category variantes')
      .limit(limitNum)
      .lean();

    // Transformar al formato esperado por el frontend
    const productosTransformados = productos.map(prod => ({
      _id: prod._id,
      name: prod.name,
      description: prod.description,
      image: prod.image,
      category: prod.category,
      variantes: prod.variantes || [],
      // Para compatibilidad con el selector existente
      tipoProducto: prod.category,
      technicalData: {
        headers: ['Código', 'Descripción', 'Precio', 'Unidad'],
        rows: (prod.variantes || []).map(variante => ({
          'Código': variante.codigo,
          'Descripción': variante.descripcion,
          'Precio': variante.precio,
          'Unidad': variante.unidad
        }))
      }
    }));

    res.json({
      success: true,
      data: productosTransformados
    });

  } catch (error) {
    console.error('Error buscando productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;