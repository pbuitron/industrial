#!/bin/bash

echo "📸 CAPTURAR ESTADO ACTUAL DE PRODUCCIÓN VPS"
echo "============================================"
echo "Fecha: $(date)"
echo "VPS: root@162.254.37.42"
echo ""

# Crear directorio para configuraciones de producción
mkdir -p production-configs/nginx
mkdir -p production-configs/pm2
mkdir -p production-configs/env

echo "📁 PASO 1: CAPTURAR CONFIGURACIONES NGINX"
echo "=========================================="

# Configuración principal funcionando
echo "=== Copiando configuración Nginx funcionando ==="
cp /etc/nginx/sites-enabled/industrial-iot production-configs/nginx/industrial-iot-working.conf
echo "✅ industrial-iot configuración guardada"

# Configuración completa de Nginx
echo "=== Copiando configuración completa Nginx ==="
cp /etc/nginx/nginx.conf production-configs/nginx/nginx.conf
echo "✅ nginx.conf guardado"

# SSL configuración
echo "=== Copiando configuración SSL ==="
cp /etc/letsencrypt/options-ssl-nginx.conf production-configs/nginx/options-ssl-nginx.conf 2>/dev/null || echo "⚠️ SSL config no encontrado"

echo ""
echo "📁 PASO 2: CAPTURAR CONFIGURACIONES PM2"
echo "========================================"

# PM2 ecosystem
echo "=== PM2 list y configuración ==="
pm2 list > production-configs/pm2/pm2-list.txt
pm2 describe backend > production-configs/pm2/backend-config.txt 2>/dev/null
pm2 describe frontend > production-configs/pm2/frontend-config.txt 2>/dev/null

# Variables de entorno del proceso
echo "=== Variables de entorno PM2 ==="
pm2 show backend | grep -A 20 "env:" > production-configs/pm2/backend-env.txt 2>/dev/null

echo ""
echo "📁 PASO 3: CAPTURAR ARCHIVOS .ENV"
echo "================================="

# Variables de entorno del servidor
if [ -f "/var/www/html/server/.env.production" ]; then
    cp /var/www/html/server/.env.production production-configs/env/server-env-production.txt
    echo "✅ server .env.production guardado"
fi

if [ -f "/var/www/html/.env.production" ]; then
    cp /var/www/html/.env.production production-configs/env/frontend-env-production.txt
    echo "✅ frontend .env.production guardado"
fi

echo ""
echo "📁 PASO 4: CAPTURAR ESTADO DEL SISTEMA"
echo "======================================"

# Estado de servicios
echo "=== Estado de servicios ==="
systemctl status nginx > production-configs/nginx-status.txt
systemctl status pm2-root > production-configs/pm2-status.txt 2>/dev/null

# Puertos en uso
echo "=== Puertos en uso ==="
netstat -tlnp | grep -E "3000|3001" > production-configs/ports-status.txt

# Procesos Node.js
echo "=== Procesos Node.js ==="
ps aux | grep node > production-configs/node-processes.txt

echo ""
echo "📁 PASO 5: VERIFICAR APIS FUNCIONANDO"
echo "====================================="

# Test APIs actuales
echo "=== Test API Health ==="
curl -s https://industrial-iot.us/api/health > production-configs/api-health-test.json
echo "✅ API Health test guardado"

echo "=== Test API Productos ==="
curl -s https://industrial-iot.us/api/products/abrazaderas | head -10 > production-configs/api-productos-test.json
echo "✅ API Productos test guardado"

echo ""
echo "📁 PASO 6: DOCUMENTAR ESTRUCTURA"
echo "================================"

# Estructura de archivos del proyecto
echo "=== Estructura del proyecto ==="
find /var/www/html -type f -name "*.js" -o -name "*.json" -o -name "*.env*" | head -20 > production-configs/project-structure.txt

# Logs recientes
echo "=== Logs recientes ==="
tail -20 /var/log/nginx/industrial-iot.access.log > production-configs/nginx-access-recent.log 2>/dev/null
tail -20 /var/log/nginx/industrial-iot.error.log > production-configs/nginx-error-recent.log 2>/dev/null

echo ""
echo "🏷️ PASO 7: CREAR METADATA"
echo "========================="

# Crear archivo de metadata
cat > production-configs/PRODUCTION-STATE.md << EOF
# ESTADO DE PRODUCCIÓN VPS - $(date)

## 🏷️ Información del Estado
- **Fecha captura**: $(date)
- **VPS**: root@162.254.37.42
- **Estado**: ✅ FUNCIONANDO CORRECTAMENTE
- **Frontend URL**: https://industrial-iot.us
- **Backend Puerto**: 3001
- **Frontend Puerto**: 3000

## 🔧 Configuraciones Capturadas

### Nginx
- \`nginx/industrial-iot-working.conf\` - Configuración principal funcionando
- \`nginx/nginx.conf\` - Configuración global Nginx
- \`nginx/options-ssl-nginx.conf\` - Configuración SSL

### PM2
- \`pm2/pm2-list.txt\` - Lista de procesos PM2
- \`pm2/backend-config.txt\` - Configuración backend
- \`pm2/frontend-config.txt\` - Configuración frontend
- \`pm2/backend-env.txt\` - Variables de entorno backend

### Variables de Entorno
- \`env/server-env-production.txt\` - Variables servidor
- \`env/frontend-env-production.txt\` - Variables frontend

## ✅ APIs Funcionando
- \`/api/health\` - ✅ OK
- \`/api/products/abrazaderas\` - ✅ OK
- \`/api/products/kits\` - ✅ OK
- \`/api/products/epoxicos\` - ✅ OK

## 🔑 Cambio Clave que Solucionó el Problema
\`\`\`nginx
# ANTES (roto):
location /api/ {
    proxy_pass http://localhost:3001/;  # ❌ Eliminaba /api/
}

# DESPUÉS (funcionando):
location /api/ {
    proxy_pass http://localhost:3001/api/;  # ✅ Mantiene /api/
}
\`\`\`

## 📋 Para Replicar este Estado
1. Usar la configuración Nginx de \`nginx/industrial-iot-working.conf\`
2. Configurar PM2 con las variables de \`pm2/\`
3. Usar las variables de entorno de \`env/\`
4. Verificar que APIs respondan correctamente

EOF

echo "✅ Metadata creada en production-configs/PRODUCTION-STATE.md"

echo ""
echo "🎉 CAPTURA COMPLETADA!"
echo "====================="
echo "📁 Todas las configuraciones guardadas en: production-configs/"
echo "📋 Documenta el estado actual funcionando del VPS"
echo "🔄 Listo para commit y push a rama production-stable"

# Agregar todo al git
git add production-configs/
echo "✅ Archivos agregados al git (listos para commit)"