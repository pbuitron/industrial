const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Importar modelos
const Abrazadera = require('../models/Abrazadera');
const Epoxico = require('../models/Epoxico');
const Kit = require('../models/Kit');

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Función para cargar datos JSON
const loadJSONData = (filename) => {
  try {
    const dataPath = path.join(__dirname, '../../data', filename);
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error(`❌ Error cargando ${filename}:`, error.message);
    return [];
  }
};

// Migrar Abrazaderas
const migrateAbrazaderas = async () => {
  console.log('\n📦 Migrando Abrazaderas...');
  
  try {
    const abrazaderasData = loadJSONData('abrazaderas.json');
    
    if (abrazaderasData.length === 0) {
      console.log('⚠️  No hay datos de abrazaderas para migrar');
      return;
    }

    // Limpiar colección existente (opcional - comentar si no quieres limpiar)
    await Abrazadera.deleteMany({});
    console.log('🗑️  Colección de abrazaderas limpiada');

    let migratedCount = 0;
    let errorCount = 0;

    for (const item of abrazaderasData) {
      try {
        const abrazadera = new Abrazadera({
          productId: item.id,
          name: item.name,
          description: item.description,
          details: item.details,
          image: item.image,
          specs: item.specs || [],
          applications: item.applications || [],
          materials: item.materials || [],
          technicalData: item.technicalData || null,
          sortOrder: item.id
        });

        await abrazadera.save();
        migratedCount++;
        console.log(`✅ Abrazadera migrada: ${item.name}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrando abrazadera ${item.name}:`, error.message);
      }
    }

    console.log(`\n📊 Resumen Abrazaderas:`);
    console.log(`   ✅ Migradas: ${migratedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);

  } catch (error) {
    console.error('❌ Error en migración de abrazaderas:', error.message);
  }
};

// Migrar Epóxicos
const migrateEpoxicos = async () => {
  console.log('\n🧪 Migrando Epóxicos...');
  
  try {
    const epoxicosData = loadJSONData('epoxicos.json');
    
    if (epoxicosData.length === 0) {
      console.log('⚠️  No hay datos de epóxicos para migrar');
      return;
    }

    // Limpiar colección existente (opcional)
    await Epoxico.deleteMany({});
    console.log('🗑️  Colección de epóxicos limpiada');

    let migratedCount = 0;
    let errorCount = 0;

    for (const item of epoxicosData) {
      try {
        const epoxico = new Epoxico({
          productId: item.id,
          name: item.name,
          description: item.description,
          generic_type: item.generic_type,
          image_url: item.image_url,
          product_url: item.product_url,
          film_thickness: item.film_thickness || {},
          flexibility: item.flexibility,
          applications: item.applications || [],
          colores: item.colores || [],
          relacion_de_mezcla: item.relacion_de_mezcla,
          pot_life: item.pot_life,
          cure_time: item.cure_time,
          chemical_resistance: item.chemical_resistance || [],
          service_temperature: item.service_temperature,
          physical_properties: item.physical_properties || {},
          sortOrder: item.id === 's-26' ? 1 : 2 // Ordenar por ID
        });

        await epoxico.save();
        migratedCount++;
        console.log(`✅ Epóxico migrado: ${item.name}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrando epóxico ${item.name}:`, error.message);
      }
    }

    console.log(`\n📊 Resumen Epóxicos:`);
    console.log(`   ✅ Migrados: ${migratedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);

  } catch (error) {
    console.error('❌ Error en migración de epóxicos:', error.message);
  }
};

// Migrar Kits
const migrateKits = async () => {
  console.log('\n🛠️  Migrando Kits...');
  
  try {
    const kitsData = loadJSONData('kits.json');
    
    if (kitsData.length === 0) {
      console.log('⚠️  No hay datos de kits para migrar');
      return;
    }

    // Limpiar colección existente (opcional)
    await Kit.deleteMany({});
    console.log('🗑️  Colección de kits limpiada');

    let migratedCount = 0;
    let errorCount = 0;

    for (const item of kitsData) {
      try {
        const kit = new Kit({
          productId: item.id,
          name: item.name,
          description: item.description,
          image: item.image,
          specs: item.specs || [],
          applications: item.applications || [],
          resistencia: item.resistencia || [],
          technicalData: item.technicalData || null,
          content: item.content || [],
          instructions: item.instructions || [],
          usage_conditions: item.usage_conditions || {},
          compatible_materials: item.compatible_materials || [],
          available_sizes: item.available_sizes || [],
          sortOrder: item.id
        });

        await kit.save();
        migratedCount++;
        console.log(`✅ Kit migrado: ${item.name}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrando kit ${item.name}:`, error.message);
      }
    }

    console.log(`\n📊 Resumen Kits:`);
    console.log(`   ✅ Migrados: ${migratedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);

  } catch (error) {
    console.error('❌ Error en migración de kits:', error.message);
  }
};

// Función principal
const migrateAllProducts = async () => {
  console.log('🚀 Iniciando migración de productos...');
  console.log('');

  try {
    await connectDB();

    // Migrar cada categoría
    await migrateAbrazaderas();
    await migrateEpoxicos();
    await migrateKits();

    console.log('\n🎉 Migración completada exitosamente!');
    console.log('\n📋 Resumen final:');
    
    // Mostrar conteos finales
    const abrazaderasCount = await Abrazadera.countDocuments({ isActive: true });
    const epoxicosCount = await Epoxico.countDocuments({ isActive: true });
    const kitsCount = await Kit.countDocuments({ isActive: true });
    
    console.log(`   📦 Abrazaderas: ${abrazaderasCount}`);
    console.log(`   🧪 Epóxicos: ${epoxicosCount}`);
    console.log(`   🛠️  Kits: ${kitsCount}`);
    console.log(`   📊 Total: ${abrazaderasCount + epoxicosCount + kitsCount}`);

  } catch (error) {
    console.error('💥 Error fatal en migración:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Desconectado de MongoDB');
  }
};

// Función para migrar solo una categoría
const migrateCategory = async (category) => {
  console.log(`🚀 Migrando solo categoría: ${category}`);
  
  try {
    await connectDB();

    switch (category.toLowerCase()) {
      case 'abrazaderas':
        await migrateAbrazaderas();
        break;
      case 'epoxicos':
        await migrateEpoxicos();
        break;
      case 'kits':
        await migrateKits();
        break;
      default:
        console.log('❌ Categoría no válida. Usa: abrazaderas, epoxicos, o kits');
        return;
    }

    console.log(`\n🎉 Migración de ${category} completada!`);

  } catch (error) {
    console.error('💥 Error en migración:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Desconectado de MongoDB');
  }
};

// Ejecutar script si se llama directamente
if (require.main === module) {
  const category = process.argv[2];
  
  if (category) {
    migrateCategory(category);
  } else {
    migrateAllProducts();
  }
}

module.exports = {
  migrateAllProducts,
  migrateCategory,
  migrateAbrazaderas,
  migrateEpoxicos,
  migrateKits
};