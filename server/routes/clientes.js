const express = require('express');
const Cliente = require('../models/Cliente');
const { protect: auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/clientes - Listar todos los clientes (solo admins)
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      estado = '',
      sortBy = 'razonSocial',
      sortOrder = 'asc'
    } = req.query;

    // Construir filtros
    const filters = { isActive: true };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filters.$or = [
        { razonSocial: searchRegex },
        { nombreComercial: searchRegex },
        { ruc: searchRegex }
      ];
    }

    if (estado) {
      filters.estado = estado;
    }

    // Configurar paginación
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Ejecutar consulta
    const [clientes, total] = await Promise.all([
      Cliente.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .select('-__v')
        .lean(),
      Cliente.countDocuments(filters)
    ]);

    res.json({
      success: true,
      data: {
        clientes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/clientes/search - Búsqueda rápida de clientes para autocompletado
router.get('/search', auth, async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;

    if (!q.trim()) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const clientes = await Cliente.find({
      isActive: true,
      $or: [
        { razonSocial: searchRegex },
        { nombreComercial: searchRegex },
        { ruc: searchRegex }
      ]
    })
    .select('ruc razonSocial nombreComercial direccion telefono email')
    .limit(parseInt(limit))
    .lean();

    res.json({
      success: true,
      data: clientes
    });

  } catch (error) {
    console.error('Error en búsqueda de clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/clientes/:id - Obtener cliente por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: cliente
    });

  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/clientes/ruc/:ruc - Buscar cliente por RUC
router.get('/ruc/:ruc', auth, async (req, res) => {
  try {
    const ruc = req.params.ruc.replace(/\D/g, ''); // Solo números

    if (ruc.length !== 11) {
      return res.status(400).json({
        success: false,
        message: 'RUC debe tener 11 dígitos'
      });
    }

    const cliente = await Cliente.buscarPorRUC(ruc);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: cliente
    });

  } catch (error) {
    console.error('Error buscando cliente por RUC:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/clientes - Crear nuevo cliente
router.post('/', auth, async (req, res) => {
  try {
    const datosCliente = req.body;

    // Verificar si ya existe un cliente con este RUC
    const clienteExistente = await Cliente.buscarPorRUC(datosCliente.ruc);
    if (clienteExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con este RUC'
      });
    }

    const nuevoCliente = new Cliente(datosCliente);
    const clienteGuardado = await nuevoCliente.save();

    res.status(201).json({
      success: true,
      data: clienteGuardado,
      message: 'Cliente creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando cliente:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de cliente inválidos',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/clientes/:id - Actualizar cliente
router.put('/:id', auth, async (req, res) => {
  try {
    const clienteId = req.params.id;
    const datosActualizados = req.body;

    // Si se está cambiando el RUC, verificar que no exista otro cliente con ese RUC
    if (datosActualizados.ruc) {
      const clienteConRUC = await Cliente.buscarPorRUC(datosActualizados.ruc);
      if (clienteConRUC && clienteConRUC._id.toString() !== clienteId) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro cliente con este RUC'
        });
      }
    }

    const clienteActualizado = await Cliente.findByIdAndUpdate(
      clienteId,
      datosActualizados,
      { new: true, runValidators: true }
    );

    if (!clienteActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: clienteActualizado,
      message: 'Cliente actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando cliente:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de cliente inválidos',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/clientes/:id - Eliminar cliente (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Soft delete
    cliente.isActive = false;
    await cliente.save();

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/clientes/consulta-ruc - Consultar RUC en API externa y crear/actualizar cliente
router.post('/consulta-ruc', auth, async (req, res) => {
  try {
    const { ruc } = req.body;
    const RUCService = require('../utils/rucService');
    const rucService = new RUCService();

    // Validar RUC
    if (!rucService.validarRUC(ruc)) {
      return res.status(400).json({
        success: false,
        message: 'RUC inválido. Debe tener 11 dígitos y dígito verificador correcto.'
      });
    }

    const rucLimpio = ruc.replace(/\D/g, '');

    // Buscar cliente existente
    let cliente = await Cliente.buscarPorRUC(rucLimpio);

    // Si existe y la consulta es reciente (menos de 24 horas), devolver datos existentes
    if (cliente) {
      const horasDesdeUltimaConsulta = (new Date() - cliente.ultimaConsultaRUC) / (1000 * 60 * 60);

      if (horasDesdeUltimaConsulta < 24) {
        return res.json({
          success: true,
          data: cliente,
          message: 'Cliente encontrado en base de datos',
          esNuevo: false
        });
      }
    }

    // Consultar API externa
    console.log(`🔍 Consultando RUC ${rucLimpio} en SUNAT...`);
    const datosRUC = await rucService.consultarRUC(rucLimpio);

    if (!datosRUC) {
      return res.status(404).json({
        success: false,
        message: 'RUC no encontrado en SUNAT'
      });
    }

    // Si el cliente existe, actualizar con datos de SUNAT
    if (cliente) {
      Object.assign(cliente, datosRUC);
      await cliente.save();

      return res.json({
        success: true,
        data: cliente,
        message: 'Datos actualizados desde SUNAT',
        esNuevo: false
      });
    }

    // Cliente nuevo, devolver datos para que el frontend confirme creación
    res.json({
      success: true,
      data: datosRUC,
      message: 'Datos obtenidos de SUNAT. Confirme para crear cliente.',
      esNuevo: true
    });

  } catch (error) {
    console.error('Error consultando RUC:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error consultando RUC'
    });
  }
});

module.exports = router;