const express = require('express');
const Abrazadera = require('../models/Abrazadera');
const Kit = require('../models/Kit');
const Epoxico = require('../models/Epoxico');

const router = express.Router();

// GET /api/search - Búsqueda avanzada de productos
router.get('/', async (req, res) => {
  try {
    const {
      q: query = '',
      category = '',
      application = '',
      material = '',
      limit = 20,
      page = 1,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Construir filtros base
    const filters = { isActive: true };
    let searchFilters = {};

    // Filtro de texto (búsqueda en múltiples campos)
    if (query.trim()) {
      const searchRegex = new RegExp(query.trim(), 'i');
      searchFilters = {
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { details: searchRegex },
          { specs: { $elemMatch: { $regex: searchRegex } } },
          { applications: { $elemMatch: { $regex: searchRegex } } },
          { materials: { $elemMatch: { $regex: searchRegex } } },
          { generic_type: searchRegex },
          { special_features: { $elemMatch: { $regex: searchRegex } } }
        ]
      };
    }

    // Filtro de aplicación
    if (application) {
      const appRegex = new RegExp(application, 'i');
      searchFilters.applications = { $elemMatch: { $regex: appRegex } };
    }

    // Filtro de material
    if (material) {
      const materialRegex = new RegExp(material, 'i');
      searchFilters.materials = { $elemMatch: { $regex: materialRegex } };
    }

    // Combinar filtros
    const finalFilters = { ...filters, ...searchFilters };

    // Configurar paginación
    const limitNum = Math.min(parseInt(limit), 100); // Máximo 100 resultados
    const pageNum = Math.max(parseInt(page), 1);
    const skip = (pageNum - 1) * limitNum;

    // Configurar ordenamiento
    const sortOptions = {};
    const validSortFields = ['name', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;

    let results = [];
    let totalResults = 0;
    let categoryBreakdown = { abrazaderas: 0, kits: 0, epoxicos: 0 };

    // Buscar en cada categoría si no hay filtro específico
    const categoriesToSearch = category ? [category] : ['abrazaderas', 'kits', 'epoxicos'];

    for (const cat of categoriesToSearch) {
      let Model;
      let categoryResults = [];
      let categoryTotal = 0;

      switch (cat) {
        case 'abrazaderas':
          Model = Abrazadera;
          break;
        case 'kits':
          Model = Kit;
          break;
        case 'epoxicos':
          Model = Epoxico;
          break;
        default:
          continue;
      }

      // Ejecutar búsqueda
      [categoryResults, categoryTotal] = await Promise.all([
        Model.find(finalFilters)
          .sort(sortOptions)
          .skip(category ? skip : 0) // Solo paginar si es categoría específica
          .limit(category ? limitNum : 100) // Limitar resultados por categoría
          .select('-__v -technicalData') // Excluir campos pesados
          .lean(),
        Model.countDocuments(finalFilters)
      ]);

      // Agregar categoría a cada resultado
      const resultsWithCategory = categoryResults.map(item => ({
        ...item,
        category: cat,
        // Normalizar campo de imagen
        image: item.image || item.image_url
      }));

      results = results.concat(resultsWithCategory);
      categoryBreakdown[cat] = categoryTotal;
      totalResults += categoryTotal;
    }

    // Si no hay filtro de categoría, aplicar paginación global
    if (!category) {
      // Ordenar resultados combinados
      results.sort((a, b) => {
        const aValue = a[sortField] || '';
        const bValue = b[sortField] || '';
        
        if (sortOrder === 'desc') {
          return bValue.localeCompare(aValue);
        }
        return aValue.localeCompare(bValue);
      });

      // Aplicar paginación
      const startIndex = skip;
      const endIndex = skip + limitNum;
      results = results.slice(startIndex, endIndex);
    }

    // Generar sugerencias si no hay resultados
    let suggestions = [];
    if (results.length === 0 && query.trim()) {
      suggestions = await generateSuggestions(query);
    }

    // Generar opciones de filtros para el frontend
    const filterOptions = await getFilterOptions();

    res.json({
      success: true,
      data: {
        products: results,
        totalResults,
        currentPage: pageNum,
        totalPages: Math.ceil(totalResults / limitNum),
        categoryBreakdown,
        suggestions,
        filterOptions,
        query: query.trim(),
        appliedFilters: {
          category,
          application,
          material
        }
      }
    });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/search/suggestions - Obtener sugerencias de autocompletado
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query = '', limit = 8 } = req.query;

    if (!query.trim()) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = await getAutocompleteSuggestions(query.trim(), parseInt(limit));

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Error obteniendo sugerencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/search/filters - Obtener opciones de filtros
router.get('/filters', async (req, res) => {
  try {
    const filterOptions = await getFilterOptions();

    res.json({
      success: true,
      data: filterOptions
    });

  } catch (error) {
    console.error('Error obteniendo filtros:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Función auxiliar para generar sugerencias cuando no hay resultados
async function generateSuggestions(query) {
  try {
    const suggestions = new Set();
    const searchRegex = new RegExp(query, 'i');

    // Buscar términos similares en nombres de productos
    const [abrazaderas, kits, epoxicos] = await Promise.all([
      Abrazadera.find({ 
        isActive: true,
        name: searchRegex 
      }).select('name').limit(5).lean(),
      Kit.find({ 
        isActive: true,
        name: searchRegex 
      }).select('name').limit(5).lean(),
      Epoxico.find({ 
        isActive: true,
        name: searchRegex 
      }).select('name').limit(5).lean()
    ]);

    // Agregar nombres de productos como sugerencias
    [...abrazaderas, ...kits, ...epoxicos].forEach(item => {
      if (item.name) suggestions.add(item.name);
    });

    // Buscar en aplicaciones comunes
    const commonApplications = await Promise.all([
      Abrazadera.distinct('applications', { isActive: true }),
      Kit.distinct('applications', { isActive: true }),
      Epoxico.distinct('applications', { isActive: true })
    ]);

    const allApplications = [...commonApplications[0], ...commonApplications[1], ...commonApplications[2]];
    allApplications.forEach(app => {
      if (app && app.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(app);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  } catch (error) {
    console.error('Error generando sugerencias:', error);
    return [];
  }
}

// Función auxiliar para obtener sugerencias de autocompletado
async function getAutocompleteSuggestions(query, limit = 8) {
  try {
    const suggestions = new Set();
    const searchRegex = new RegExp(query, 'i');

    // Buscar en nombres de productos
    const [productNames] = await Promise.all([
      Promise.all([
        Abrazadera.find({ 
          isActive: true,
          name: searchRegex 
        }).select('name').limit(3).lean(),
        Kit.find({ 
          isActive: true,
          name: searchRegex 
        }).select('name').limit(3).lean(),
        Epoxico.find({ 
          isActive: true,
          name: searchRegex 
        }).select('name').limit(3).lean()
      ])
    ]);

    // Agregar nombres de productos
    productNames.flat().forEach(item => {
      if (item.name) suggestions.add(item.name);
    });

    // Buscar en aplicaciones populares
    const applications = await Promise.all([
      Abrazadera.distinct('applications', { 
        isActive: true,
        applications: { $elemMatch: { $regex: searchRegex } }
      }),
      Kit.distinct('applications', { 
        isActive: true,
        applications: { $elemMatch: { $regex: searchRegex } }
      }),
      Epoxico.distinct('applications', { 
        isActive: true,
        applications: { $elemMatch: { $regex: searchRegex } }
      })
    ]);

    applications.flat().forEach(app => {
      if (app && suggestions.size < limit) {
        suggestions.add(app);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('Error en autocompletado:', error);
    return [];
  }
}

// Función auxiliar para obtener opciones de filtros
async function getFilterOptions() {
  try {
    const [applications, materials] = await Promise.all([
      // Obtener todas las aplicaciones únicas
      Promise.all([
        Abrazadera.distinct('applications', { isActive: true }),
        Kit.distinct('applications', { isActive: true }),
        Epoxico.distinct('applications', { isActive: true })
      ]).then(results => [...new Set(results.flat())]),
      
      // Obtener todos los materiales únicos
      Promise.all([
        Abrazadera.distinct('materials', { isActive: true }),
        Kit.distinct('materials', { isActive: true })
      ]).then(results => [...new Set(results.flat())])
    ]);

    return {
      categories: [
        { value: 'abrazaderas', label: 'Abrazaderas' },
        { value: 'kits', label: 'Kits de Reparación' },
        { value: 'epoxicos', label: 'Epóxicos' }
      ],
      applications: applications
        .filter(app => app && app.trim())
        .sort()
        .slice(0, 50) // Limitar opciones
        .map(app => ({ value: app, label: app })),
      materials: materials
        .filter(material => material && material.trim())
        .sort()
        .slice(0, 30) // Limitar opciones
        .map(material => ({ value: material, label: material }))
    };
  } catch (error) {
    console.error('Error obteniendo opciones de filtros:', error);
    return {
      categories: [],
      applications: [],
      materials: []
    };
  }
}

module.exports = router;