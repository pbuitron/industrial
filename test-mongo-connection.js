#!/usr/bin/env node

const mongoose = require('mongoose');
const dotenv = require('dotenv');

console.log('🧪 MONGODB CONNECTION TEST');
console.log('=' .repeat(50));

// Detectar ambiente
const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env';

console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📄 Loading env file: ${envFile}`);
console.log('');

// Cargar variables de entorno
dotenv.config({ path: envFile });

// Verificar variables críticas
console.log('🔍 ENVIRONMENT VARIABLES CHECK:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('PORT:', process.env.PORT || 'undefined');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  console.log('MONGODB_URI format:', uri.substring(0, 30) + '...' + uri.substring(uri.length - 20));
  console.log('Database name:', uri.split('/').pop().split('?')[0]);
} else {
  console.error('❌ MONGODB_URI is not defined!');
  console.log('\n🔧 DEBUGGING INFO:');
  console.log('Current working directory:', process.cwd());
  console.log('Looking for env file:', require('path').resolve(envFile));

  try {
    const fs = require('fs');
    if (fs.existsSync(envFile)) {
      console.log(`✅ ${envFile} exists`);
      const content = fs.readFileSync(envFile, 'utf8');
      const lines = content.split('\n').filter(line => line.includes('MONGODB_URI'));
      console.log('MONGODB_URI lines found:', lines.length);
      lines.forEach(line => {
        console.log('  ->', line.substring(0, 50) + '...');
      });
    } else {
      console.log(`❌ ${envFile} does not exist`);
    }
  } catch (error) {
    console.error('Error reading env file:', error.message);
  }

  process.exit(1);
}

console.log('');
console.log('🔄 ATTEMPTING CONNECTION...');

// Configurar timeout
const connectionTimeout = setTimeout(() => {
  console.error('❌ Connection timeout after 15 seconds');
  process.exit(1);
}, 15000);

// Intentar conexión
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 second timeout
})
.then(() => {
  clearTimeout(connectionTimeout);
  console.log('✅ MongoDB connected successfully!');
  console.log('📊 Connection details:');
  console.log('  Host:', mongoose.connection.host);
  console.log('  Database:', mongoose.connection.name);
  console.log('  Ready state:', mongoose.connection.readyState);

  // Test simple query
  console.log('\n🧪 Testing simple query...');
  return mongoose.connection.db.admin().ping();
})
.then(() => {
  console.log('✅ Database ping successful!');
  console.log('🎉 All tests passed!');
  process.exit(0);
})
.catch((error) => {
  clearTimeout(connectionTimeout);
  console.error('❌ MongoDB connection failed!');
  console.error('Error type:', error.name);
  console.error('Error message:', error.message);

  if (error.code) {
    console.error('Error code:', error.code);
  }

  // Specific error handling
  if (error.message.includes('ENOTFOUND')) {
    console.log('\n🔧 TROUBLESHOOTING: DNS Resolution Issue');
    console.log('- Check internet connectivity');
    console.log('- Verify MongoDB Atlas cluster is running');
    console.log('- Check if domain is accessible: nslookup backend.98juy.mongodb.net');
  } else if (error.message.includes('authentication failed')) {
    console.log('\n🔧 TROUBLESHOOTING: Authentication Issue');
    console.log('- Verify username and password in connection string');
    console.log('- Check if user exists in MongoDB Atlas');
    console.log('- Verify user has correct permissions');
  } else if (error.message.includes('IP') || error.message.includes('not authorized')) {
    console.log('\n🔧 TROUBLESHOOTING: IP Whitelist Issue');
    console.log('- Add VPS IP to MongoDB Atlas Network Access');
    console.log('- Or temporarily allow all IPs (0.0.0.0/0) for testing');
  } else if (error.message.includes('ECONNREFUSED')) {
    console.log('\n🔧 TROUBLESHOOTING: Connection Refused');
    console.log('- Check if MongoDB Atlas cluster is paused');
    console.log('- Verify network connectivity');
    console.log('- Check firewall settings');
  }

  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️ Test interrupted by user');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Test terminated');
  mongoose.connection.close();
  process.exit(0);
});