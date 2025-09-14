#!/bin/bash
set -e

PROJECT_DIR="/root/industrial"

echo "=== DESPLIEGUE FINAL ==="

cd "$PROJECT_DIR"

echo "Haciendo build del frontend..."
# Build del frontend
npm run build

echo "Configurando admin (si es necesario)..."
# Inicializar datos de la base de datos
cd server
if [ -f "scripts/setup-admin.js" ]; then
    npm run setup-admin
fi
cd ..

echo "Configurando PM2 para autoarranque..."
# Configurar PM2 para autoarranque
pm2 startup
echo "IMPORTANTE: Ejecuta el comando que aparece arriba si es necesario"

echo "Iniciando backend con PM2..."
# Parar procesos anteriores si existen
pm2 delete industrial-iot-backend 2>/dev/null || true

# Iniciar backend con PM2
pm2 start ecosystem.config.js

echo "Guardando configuración de PM2..."
# Guardar configuración de PM2
pm2 save

echo "Verificando estado de servicios..."
echo "Estado de PM2:"
pm2 status

echo "Estado de MongoDB:"
systemctl status mongod --no-pager -l

echo "Estado de Nginx:"
systemctl status nginx --no-pager -l

echo "Logs recientes del backend:"
pm2 logs industrial-iot-backend --lines 10

echo "Probando API local..."
sleep 3
curl -f http://localhost:3001/api/ || echo "⚠️ API no responde en localhost:3001"

echo "Probando sitio web..."
curl -f https://industrial-iot.us/ || echo "⚠️ Sitio web no responde"

echo "✅ Despliegue completado!"
echo ""
echo "🌐 Tu sitio debería estar disponible en: https://industrial-iot.us"
echo "📊 Monitoreo: pm2 monit"
echo "📋 Logs: pm2 logs industrial-iot-backend"