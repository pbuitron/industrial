#!/usr/bin/env node

/**
 * Script de verificación de seguridad
 * Verifica que no haya archivos sensibles en el repositorio
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando seguridad del repositorio...\n');

// Archivos que NO deben estar en git
const sensitiveFiles = [
  '.env',
  'server/.env',
  '.env.local',
  '.env.production',
  'server/.env.local',
  'server/.env.production'
];

// Verificar archivos sensibles
console.log('📋 Verificando archivos sensibles...');
let foundSensitive = false;

sensitiveFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const output = execSync(`git ls-files --cached ${file}`, { encoding: 'utf8', stdio: 'pipe' });
      if (output.trim()) {
        console.log(`❌ PELIGRO: ${file} está en git`);
        foundSensitive = true;
      } else {
        console.log(`✅ ${file} está ignorado correctamente`);
      }
    } catch (e) {
      console.log(`✅ ${file} no está en git`);
    }
  } else {
    console.log(`ℹ️  ${file} no existe`);
  }
});

// Verificar .gitignore
console.log('\n📝 Verificando .gitignore...');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  const requiredPatterns = ['.env', 'node_modules/', '*.log'];
  
  requiredPatterns.forEach(pattern => {
    if (gitignore.includes(pattern)) {
      console.log(`✅ ${pattern} está en .gitignore`);
    } else {
      console.log(`⚠️  ${pattern} podría faltar en .gitignore`);
    }
  });
} else {
  console.log('❌ .gitignore no existe');
}

// Verificar variables de entorno críticas
console.log('\n🔑 Verificando configuración del servidor...');
const envExample = 'server/.env.example';
const envFile = 'server/.env';

if (fs.existsSync(envExample)) {
  console.log('✅ .env.example existe');
} else {
  console.log('⚠️  .env.example no existe');
}

if (fs.existsSync(envFile)) {
  console.log('✅ .env del servidor existe');
  
  // Verificar variables críticas
  const envContent = fs.readFileSync(envFile, 'utf8');
  const criticalVars = ['JWT_SECRET', 'MONGODB_URI', 'EMAIL_PASSWORD'];
  
  criticalVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=(.+)`, 'm');
    const match = envContent.match(regex);
    if (match && match[1] && match[1].length > 10) {
      console.log(`✅ ${varName} está configurado`);
    } else {
      console.log(`⚠️  ${varName} podría necesitar configuración`);
    }
  });
} else {
  console.log('⚠️  .env del servidor no existe - ejecuta: cp server/.env.example server/.env');
}

// Resultado final
console.log('\n' + '='.repeat(50));
if (foundSensitive) {
  console.log('❌ SEGURIDAD: Se encontraron archivos sensibles en git');
  console.log('💡 Ejecuta: git rm --cached <archivo> para removerlos');
  process.exit(1);
} else {
  console.log('✅ SEGURIDAD: No se encontraron archivos sensibles en git');
  console.log('🎉 El repositorio está seguro para hacer push');
}