#!/bin/bash

echo "🧹 LIMPIAR ARCHIVOS .ENV BACKUP QUE CONFUNDEN AL SISTEMA"
echo "========================================================"
echo "Fecha: $(date)"
echo ""

# 1. MOSTRAR ARCHIVOS .ENV ACTUALES
echo "📋 PASO 1: ARCHIVOS .ENV ACTUALES"
echo "=================================="

echo "=== En /root/industrial/server ==="
ls -la /root/industrial/server/.env* 2>/dev/null || echo "No hay archivos .env en /root/industrial/server"

echo ""
echo "=== En /var/www/html/server ==="
ls -la /var/www/html/server/.env* 2>/dev/null || echo "No hay archivos .env en /var/www/html/server"

echo ""
echo "=== En directorio raíz del proyecto ==="
ls -la /root/industrial/.env* 2>/dev/null || echo "No hay archivos .env en directorio raíz"
ls -la /var/www/html/.env* 2>/dev/null || echo "No hay archivos .env en /var/www/html"

# 2. IDENTIFICAR ARCHIVOS DE BACKUP
echo ""
echo "📋 PASO 2: IDENTIFICAR ARCHIVOS DE BACKUP"
echo "=========================================="

echo "=== Archivos .backup encontrados ==="
find /root/industrial -name "*.env.backup*" 2>/dev/null
find /var/www/html -name "*.env.backup*" 2>/dev/null

# 3. INVESTIGAR ARCHIVO .ENV.PRODUCTION FALTANTE
echo ""
echo "📋 PASO 3: INVESTIGAR .ENV.PRODUCTION FALTANTE"
echo "=============================================="

echo "=== Búsqueda exhaustiva de archivos .env.production ==="
find /root -name ".env.production" 2>/dev/null
find /var/www -name ".env.production" 2>/dev/null
find /home -name ".env.production" 2>/dev/null

echo ""
echo "=== Verificar directorio de trabajo actual ==="
pwd
echo "PM2 cwd: $(pm2 describe backend | grep "cwd" | awk '{print $3}' | head -1)"

echo ""
echo "=== Verificar permisos en directorios ==="
echo "Permisos /root/industrial/server:"
ls -la /root/industrial/server/ | head -5

echo ""
echo "=== Si existe .env.production, verificar contenido ==="
if [ -f "/root/industrial/server/.env.production" ]; then
    echo "✅ Archivo encontrado en /root/industrial/server/.env.production"
    echo "Tamaño: $(wc -l < /root/industrial/server/.env.production) líneas"
    echo "Permisos: $(ls -la /root/industrial/server/.env.production)"
    echo "MONGODB_URI presente: $(grep -c MONGODB_URI /root/industrial/server/.env.production)"
    echo "PORT presente: $(grep -c PORT /root/industrial/server/.env.production)"
    echo "NODE_ENV presente: $(grep -c NODE_ENV /root/industrial/server/.env.production)"
    echo ""
    echo "=== Primeras líneas del archivo ==="
    head -5 /root/industrial/server/.env.production
elif [ -f "/var/www/html/server/.env.production" ]; then
    echo "✅ Archivo encontrado en /var/www/html/server/.env.production"
    echo "Permisos: $(ls -la /var/www/html/server/.env.production)"
    echo "MONGODB_URI presente: $(grep -c MONGODB_URI /var/www/html/server/.env.production)"
else
    echo "❌ CRÍTICO: NO se encontró .env.production en ningún lado"
    echo ""
    echo "=== Creando .env.production desde template ==="

    # Determinar directorio correcto
    if [ -d "/root/industrial/server" ]; then
        ENV_DIR="/root/industrial/server"
    elif [ -d "/var/www/html/server" ]; then
        ENV_DIR="/var/www/html/server"
    else
        echo "❌ No se encontró directorio server/"
        exit 1
    fi

    echo "Creando .env.production en: $ENV_DIR"

    cat > "$ENV_DIR/.env.production" << 'EOF'
# Variables de entorno para el servidor - PRODUCCIÓN
PORT=3001
MONGODB_URI=mongodb+srv://pbuitron:pbuitron@backend.98juy.mongodb.net/industrial-iot?retryWrites=true&w=majority
NODE_ENV=production

# URL del frontend para CORS - Producción
FRONTEND_URL=https://industrial-iot.us,https://www.industrial-iot.us
CORS_ORIGIN=https://industrial-iot.us,https://www.industrial-iot.us

# JWT Configuration - Producción
JWT_SECRET=9k2m8n4p6r7t1w3x5z8a2c4e6g9j1m3p5r8u0w2y4a7d9f2h5k7n0q3s6v8x1z4b6e8h1k3n6q9s2v5x8z1c4f7i0l3o6r9u2w5y8a1d4g7j0m3p6s9v2x5z8c1e4h7k0n3q6t9w2y5a8d1f4i7l0o3r6u9x2z5
JWT_EXPIRES_IN=1d
JWT_COOKIE_EXPIRES_IN=1

# Email Configuration (Nodemailer)
EMAIL_FROM=info@industrial-iot.us
EMAIL_HOST=mail.privateemail.com
EMAIL_PORT=465
EMAIL_USERNAME=info@industrial-iot.us
EMAIL_PASSWORD=Bitchgetinmycar1!

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=30

# API Externa RUC - APIPERU
APIPERU_TOKEN=da2681421089c13397a819eecf768404d7eff8c89ffa17c5f1338779328e983d
EOF

    echo "✅ .env.production creado exitosamente"
    echo "Permisos asignados: 600 (solo owner puede leer/escribir)"
    chmod 600 "$ENV_DIR/.env.production"

fi

# 4. LIMPIAR ARCHIVOS DE BACKUP
echo ""
echo "📋 PASO 4: LIMPIAR ARCHIVOS DE BACKUP"
echo "====================================="

echo "Creando directorio de backups organizado..."
mkdir -p /root/backups/env_files/$(date +%Y%m%d)

echo "Moviendo archivos .backup a directorio organizado..."
find /root/industrial -name "*.env.backup*" -exec mv {} /root/backups/env_files/$(date +%Y%m%d)/ \; 2>/dev/null
find /var/www/html -name "*.env.backup*" -exec mv {} /root/backups/env_files/$(date +%Y%m%d)/ \; 2>/dev/null

echo "✅ Archivos backup organizados en /root/backups/env_files/$(date +%Y%m%d)/"

# 5. VERIFICAR LIMPIEZA
echo ""
echo "📋 PASO 5: VERIFICAR LIMPIEZA"
echo "============================="

echo "=== Archivos .env después de limpieza ==="
echo "En /root/industrial/server:"
ls -la /root/industrial/server/.env* 2>/dev/null

echo ""
echo "En /var/www/html/server:"
ls -la /var/www/html/server/.env* 2>/dev/null

# 6. VERIFICAR DIRECTORIO DE TRABAJO PM2
echo ""
echo "📋 PASO 6: VERIFICAR DIRECTORIO PM2"
echo "==================================="

echo "=== Información del proceso backend PM2 ==="
pm2 describe backend | grep -E "cwd|script|exec_mode" || echo "❌ Backend no encontrado en PM2"

# 7. CORREGIR DIRECTORIO DE TRABAJO PM2 SI ES NECESARIO
echo ""
echo "📋 PASO 7: CORREGIR PM2 SI ES NECESARIO"
echo "========================================"

PM2_CWD=$(pm2 describe backend | grep "cwd" | awk '{print $3}' | head -1)
echo "Directorio actual PM2: $PM2_CWD"

if [ "$PM2_CWD" != "/root/industrial/server" ]; then
    echo "❌ PM2 está en directorio incorrecto"
    echo "Corrigiendo directorio de trabajo PM2..."

    pm2 stop backend
    cd /root/industrial/server
    pm2 start server.js --name backend --node-args="--max-old-space-size=512"

    echo "✅ PM2 backend reiniciado desde directorio correcto"
else
    echo "✅ PM2 ya está en el directorio correcto"
    echo "Reiniciando backend para recargar variables..."
    pm2 restart backend --update-env
fi

# 8. VERIFICACIÓN FINAL
echo ""
echo "📋 PASO 8: VERIFICACIÓN FINAL"
echo "============================="

echo "Esperando 5 segundos para estabilización..."
sleep 5

echo "=== Test conectividad backend ==="
curl -s -w "HTTP Status: %{http_code}\n" http://localhost:3001/api/health -o /dev/null || echo "❌ Backend aún no responde"

echo ""
echo "=== Logs PM2 recientes ==="
pm2 logs backend --lines 5 --nostream

echo ""
echo "🎉 LIMPIEZA COMPLETADA"
echo "====================="
echo "✅ Archivos .backup organizados"
echo "✅ PM2 verificado/corregido"
echo "✅ Variables de entorno limpias"
echo ""
echo "📁 Archivos backup guardados en: /root/backups/env_files/$(date +%Y%m%d)/"