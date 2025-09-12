const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Modelo Admin simple para este script
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

const Admin = mongoose.model('Admin', adminSchema);

async function setupInitialAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      console.log('⚠️  Ya existe un administrador en el sistema:', existingAdmin.email);
      console.log('Si necesitas crear otro admin o cambiar la contraseña, hazlo manualmente desde la base de datos.');
      process.exit(0);
    }

    // Datos del admin inicial
    const adminData = {
      name: process.env.ADMIN_NAME || 'Administrador',
      email: process.env.ADMIN_EMAIL || 'info@industrial-iot.us',
      password: process.env.ADMIN_PASSWORD || 'Admin123456'
    };

    console.log('📝 Creando administrador inicial...');
    console.log('👤 Nombre:', adminData.name);
    console.log('📧 Email:', adminData.email);
    console.log('🔒 Contraseña:', adminData.password.replace(/./g, '*'));

    // Hashear la contraseña
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

    // Crear el administrador
    const admin = new Admin({
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    await admin.save();
    
    console.log('✅ Administrador creado exitosamente!');
    console.log('');
    console.log('🔐 Credenciales de acceso:');
    console.log('📧 Email:', adminData.email);
    console.log('🔒 Contraseña:', adminData.password);
    console.log('');
    console.log('🚀 Ahora puedes iniciar sesión en: http://localhost:3000/auth/login');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login por seguridad.');

  } catch (error) {
    console.error('❌ Error al crear el administrador:', error.message);
    if (error.code === 11000) {
      console.error('El email ya está en uso. Usa un email diferente.');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Ejecutar el script solo si se llama directamente
if (require.main === module) {
  console.log('🚀 Iniciando setup del administrador inicial...');
  console.log('');
  setupInitialAdmin();
}

module.exports = { setupInitialAdmin };