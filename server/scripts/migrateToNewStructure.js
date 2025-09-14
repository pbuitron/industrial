const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos legacy
const Abrazadera = require('../models/Abrazadera');
const Kit = require('../models/Kit');
const Epoxico = require('../models/Epoxico');

// Importar nuevos modelos
const Product = require('../models/Product');
const Variant = require('../models/Variant');

async function migrateToNewStructure() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('🔄 Iniciando migración de estructura de productos...');

    // Migrar Abrazaderas
    console.log('\n📋 Migrando Abrazaderas...');
    await migrateCategory('abrazaderas', Abrazadera);

    // Migrar Kits
    console.log('\n📋 Migrando Kits...');
    await migrateCategory('kits', Kit);

    // Migrar Epoxicos
    console.log('\n📋 Migrando Epoxicos...');
    await migrateCategory('epoxicos', Epoxico);

    console.log('\n✅ Migración completada exitosamente');

    // Verificar migración
    await verifyMigration();

  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

async function migrateCategory(category, LegacyModel) {
  const legacyItems = await LegacyModel.find({});
  console.log(`   Encontrados ${legacyItems.length} productos legacy`);

  let migratedCount = 0;

  for (const legacyItem of legacyItems) {
    try {
      // Crear producto principal
      const productData = {
        name: legacyItem.name,
        description: legacyItem.description,
        image: legacyItem.image,
        category: category,
        isActive: legacyItem.isActive !== undefined ? legacyItem.isActive : true,
        sortOrder: legacyItem.sortOrder || 0,
        metadata: {
          // Preservar campos específicos del modelo legacy
          details: legacyItem.details,
          specs: legacyItem.specs,
          applications: legacyItem.applications,
          materials: legacyItem.materials
        }
      };

      // Verificar si ya existe este producto
      const existingProduct = await Product.findOne({
        name: legacyItem.name,
        category: category
      });

      let product;
      if (existingProduct) {
        console.log(`   ⚠️  Producto "${legacyItem.name}" ya existe, actualizando...`);
        product = await Product.findByIdAndUpdate(
          existingProduct._id,
          productData,
          { new: true }
        );
      } else {
        product = new Product(productData);
        await product.save();
        console.log(`   ✅ Producto "${legacyItem.name}" creado`);
      }

      // Crear variantes embebidas desde technicalData
      if (legacyItem.technicalData && legacyItem.technicalData.rows && legacyItem.technicalData.rows.length > 0) {
        const headers = legacyItem.technicalData.headers || [];
        const rows = legacyItem.technicalData.rows;
        product.variantes = [];

        for (let i = 0; i < rows.length; i++) {
          const rowData = rows[i];

          // Generar código único para la variante
          let codigo = `${category.toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
          if (legacyItem.codigo) {
            codigo = `${legacyItem.codigo}-${String(i + 1).padStart(2, '0')}`;
          }

          // Generar descripción basada en los datos técnicos
          let descripcion = `${legacyItem.name}`;
          if (headers.length > 0 && rowData[headers[0]]) {
            descripcion += ` - ${headers[0]}: ${rowData[headers[0]]}`;
          } else if (rowData && typeof rowData === 'object') {
            const firstValue = Object.values(rowData)[0];
            if (firstValue) {
              descripcion += ` - ${firstValue}`;
            }
          }

          const variante = {
            codigo: codigo,
            descripcion: descripcion,
            precio: 0, // Precio por defecto, se puede actualizar después
            unidad: 'UND' // Unidad por defecto
          };

          product.variantes.push(variante);
        }

        await product.save();
        console.log(`     📊 ${rows.length} variantes embebidas creadas`);
      } else {
        // Crear una variante simple si no hay datos técnicos
        let codigo = `${category.toUpperCase()}-001`;
        if (legacyItem.codigo) {
          codigo = legacyItem.codigo;
        }

        const variante = {
          codigo: codigo,
          descripcion: legacyItem.name,
          precio: 0,
          unidad: 'UND'
        };

        product.variantes = [variante];
        await product.save();
        console.log(`     📝 1 variante embebida simple creada`);
      }

      migratedCount++;
    } catch (error) {
      console.error(`   ❌ Error migrando "${legacyItem.name}":`, error.message);
    }
  }

  console.log(`   ✅ ${migratedCount}/${legacyItems.length} productos migrados exitosamente`);
}

async function verifyMigration() {
  console.log('\n🔍 Verificando migración...');

  const products = await Product.find({});
  console.log(`✅ Total productos migrados: ${products.length}`);

  for (const category of ['abrazaderas', 'kits', 'epoxicos']) {
    const categoryProducts = await Product.find({ category });
    const totalVariants = categoryProducts.reduce((sum, product) => sum + (product.variantes ? product.variantes.length : 0), 0);
    console.log(`   📦 ${category}: ${categoryProducts.length} productos, ${totalVariants} variantes`);
  }

  // Mostrar algunos ejemplos
  console.log('\n📋 Ejemplos de productos migrados:');
  const sampleProducts = await Product.find({}).limit(3);
  sampleProducts.forEach(product => {
    console.log(`   🔹 ${product.name} (${product.category})`);
    console.log(`      - ${product.variantes ? product.variantes.length : 0} variantes`);
    if (product.variantes && product.variantes.length > 0) {
      console.log(`      - Primera variante: "${product.variantes[0].descripcion}" (${product.variantes[0].codigo})`);
    }
  });
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  migrateToNewStructure();
}

module.exports = { migrateToNewStructure };