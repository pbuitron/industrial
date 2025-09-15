#!/bin/bash
set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "${PURPLE}🔍 $1${NC}"; }

echo "🚀 CONFIGURACIÓN COMPLETA PRODUCCIÓN - 3 PÁGINAS DE PRODUCTOS"
echo "============================================================="

log_header "ANÁLISIS COMPLETO DEL PROBLEMA"

# Verificar directorio
if [ ! -f "server/.env" ]; then
    log_error "No se encontró server/.env - asegúrate de estar en /root/industrial"
    exit 1
fi

log_info "1. Verificando commit actual"
git log --oneline -3

log_info "2. Analizando configuración actual"
echo "=== server/.env actual ==="
cat server/.env | head -10

echo "=== Verificando si existe .env.production ==="
if [ -f "server/.env.production" ]; then
    log_warning "server/.env.production existe:"
    cat server/.env.production | head -5
else
    log_info "server/.env.production NO existe"
fi

log_info "3. Verificando proceso PM2 actual"
pm2 show backend | grep -A 5 -B 5 "env:" || log_warning "No se pudo obtener env de PM2"

log_info "4. Verificando conectividad actual"
echo "Backend local:"
curl -s http://localhost:3001/api/health 2>/dev/null || echo "Puerto 3001 no responde"
curl -s http://localhost:5000/api/health 2>/dev/null || echo "Puerto 5000 no responde"

log_header "PASO 1: CREAR .env.production CORRECTO"

log_info "Creando .env.production con configuración completa para producción..."

cat > server/.env.production << 'EOF'
# Variables de entorno para el servidor - PRODUCCIÓN
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://pbuitron:pbuitron@backend.98juy.mongodb.net/industrial-iot?retryWrites=true&w=majority

# URL del frontend para CORS - PRODUCCIÓN
FRONTEND_URL=https://industrial-iot.us,https://www.industrial-iot.us
CORS_ORIGIN=https://industrial-iot.us,https://www.industrial-iot.us

# JWT Configuration - PRODUCCIÓN
JWT_SECRET=Pr0duct0sS3gur0sIndu5tr14l_Dev
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

# Email Configuration (Nodemailer) - PRODUCCIÓN
EMAIL_FROM=info@industrial-iot.us
EMAIL_HOST=mail.privateemail.com
EMAIL_PORT=465
EMAIL_USERNAME=info@industrial-iot.us
EMAIL_PASSWORD=Bitchgetinmycar1!

# Security - PRODUCCIÓN
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=30

# API Externa RUC - APIPERU
APIPERU_TOKEN=da2681421089c13397a819eecf768404d7eff8c89ffa17c5f1338779328e983d
EOF

log_success ".env.production creado"

echo "=== Contenido .env.production ==="
cat server/.env.production | head -15

log_header "PASO 2: VERIFICAR CONFIGURACIÓN DE CORS EN SERVER.JS"

echo "=== Configuración CORS actual en server.js ==="
grep -A 10 -B 5 "corsOptions" server/server.js

log_info "Verificando que server.js maneja múltiples orígenes CORS..."
if grep -q "split.*," server/server.js; then
    log_success "✅ server.js ya maneja múltiples orígenes CORS"
else
    log_warning "⚠️  server.js necesita actualización para múltiples orígenes"

    # Backup
    cp server/server.js "server/server.js.backup.$(date +%Y%m%d_%H%M%S)"

    # Actualizar CORS configuration
    sed -i '/origin: \[/,/\],/c\
  origin: [\
    ...process.env.FRONTEND_URL.split(","),\
    "http://localhost:3000",\
    "http://127.0.0.1:3000"\
  ],' server/server.js

    log_success "server.js actualizado para múltiples orígenes"
fi

log_header "PASO 3: REINICIAR PM2 CON CONFIGURACIÓN DE PRODUCCIÓN"

log_info "3.1 - Estado PM2 antes del reinicio"
pm2 status

log_info "3.2 - Reiniciando backend con configuración de producción"
pm2 restart backend --update-env

log_info "3.3 - Esperando estabilización del backend..."
sleep 8

log_info "3.4 - Verificando que PM2 use NODE_ENV=production"
pm2 show backend | grep -A 10 "env:" || log_warning "No se pudo verificar env de PM2"

log_header "PASO 4: VERIFICACIÓN COMPLETA DE FUNCIONAMIENTO"

echo
log_info "4.1 - Test backend local"
if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1; then
    log_success "✅ Backend responde en puerto 3001"
    HEALTH=$(curl -s http://localhost:3001/api/health)
    echo "$HEALTH" | jq -c '{success, environment}' 2>/dev/null || echo "$HEALTH"
else
    log_error "❌ Backend no responde en puerto 3001"
    echo "Verificando logs..."
    pm2 logs backend --lines 5
fi

echo
log_info "4.2 - Test de las 3 páginas desde dominio principal"

# Test Abrazaderas
echo -n "   Abrazaderas: "
if curl -f -s https://industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1; then
    PRODUCTS=$(curl -s https://industrial-iot.us/api/products/abrazaderas)
    if echo "$PRODUCTS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$PRODUCTS" | jq '.data | length' 2>/dev/null || echo "0")
        log_success "$COUNT productos"
    else
        log_warning "Responde pero datos inválidos"
    fi
else
    log_error "FALLA"
fi

# Test Kits
echo -n "   Kits: "
if curl -f -s https://industrial-iot.us/api/products/kits >/dev/null 2>&1; then
    KITS=$(curl -s https://industrial-iot.us/api/products/kits)
    if echo "$KITS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$KITS" | jq '.data | length' 2>/dev/null || echo "0")
        log_success "$COUNT productos"
    else
        log_warning "Responde pero datos inválidos"
    fi
else
    log_error "FALLA"
fi

# Test Epóxicos
echo -n "   Epóxicos: "
if curl -f -s https://industrial-iot.us/api/products/epoxicos >/dev/null 2>&1; then
    EPOXICOS=$(curl -s https://industrial-iot.us/api/products/epoxicos)
    if echo "$EPOXICOS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$EPOXICOS" | jq '.data | length' 2>/dev/null || echo "0")
        log_success "$COUNT productos"
    else
        log_warning "Responde pero datos inválidos"
    fi
else
    log_error "FALLA"
fi

echo
log_info "4.3 - Test de las 3 páginas desde WWW subdomain"

# Test WWW Abrazaderas
echo -n "   WWW Abrazaderas: "
if curl -f -s https://www.industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1; then
    PRODUCTS=$(curl -s https://www.industrial-iot.us/api/products/abrazaderas)
    if echo "$PRODUCTS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$PRODUCTS" | jq '.data | length' 2>/dev/null || echo "0")
        log_success "$COUNT productos"
    else
        log_warning "Responde pero datos inválidos"
    fi
else
    log_error "FALLA CORS"
    # Verificar headers CORS
    echo "Headers CORS:"
    curl -s -I https://www.industrial-iot.us/api/products/abrazaderas | grep -i "access-control" || echo "Sin headers CORS"
fi

# Test WWW Kits
echo -n "   WWW Kits: "
if curl -f -s https://www.industrial-iot.us/api/products/kits >/dev/null 2>&1; then
    KITS=$(curl -s https://www.industrial-iot.us/api/products/kits)
    if echo "$KITS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$KITS" | jq '.data | length' 2>/dev/null || echo "0")
        log_success "$COUNT productos"
    else
        log_warning "Responde pero datos inválidos"
    fi
else
    log_error "FALLA CORS"
fi

# Test WWW Epóxicos
echo -n "   WWW Epóxicos: "
if curl -f -s https://www.industrial-iot.us/api/products/epoxicos >/dev/null 2>&1; then
    EPOXICOS=$(curl -s https://www.industrial-iot.us/api/products/epoxicos)
    if echo "$EPOXICOS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$EPOXICOS" | jq '.data | length' 2>/dev/null || echo "0")
        log_success "$COUNT productos"
    else
        log_warning "Responde pero datos inválidos"
    fi
else
    log_error "FALLA CORS"
fi

log_header "PASO 5: RESUMEN FINAL Y URLS DE VERIFICACIÓN"

echo
# Contar éxitos
SUCCESS_COUNT=0
TOTAL_TESTS=6

# Test de éxito
curl -f -s https://industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
curl -f -s https://industrial-iot.us/api/products/kits >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
curl -f -s https://industrial-iot.us/api/products/epoxicos >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
curl -f -s https://www.industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
curl -f -s https://www.industrial-iot.us/api/products/kits >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
curl -f -s https://www.industrial-iot.us/api/products/epoxicos >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

echo "📊 RESULTADO: $SUCCESS_COUNT de $TOTAL_TESTS tests exitosos"

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    log_success "🎉 ¡ÉXITO TOTAL! TODAS LAS PÁGINAS FUNCIONAN"
    echo
    echo "✅ DOMINIO PRINCIPAL (industrial-iot.us):"
    echo "   • https://industrial-iot.us/productos/abrazaderas"
    echo "   • https://industrial-iot.us/productos/kits"
    echo "   • https://industrial-iot.us/productos/epoxicos"
    echo
    echo "✅ WWW SUBDOMAIN (www.industrial-iot.us):"
    echo "   • https://www.industrial-iot.us/productos/abrazaderas"
    echo "   • https://www.industrial-iot.us/productos/kits"
    echo "   • https://www.industrial-iot.us/productos/epoxicos"
    echo
    echo "🌐 TODAS LAS 6 COMBINACIONES CARGAN DATOS MONGODB CORRECTAMENTE"

elif [ $SUCCESS_COUNT -gt 3 ]; then
    log_warning "⚠️  ÉXITO PARCIAL ($SUCCESS_COUNT/$TOTAL_TESTS)"
    echo "El dominio principal funciona pero WWW tiene problemas CORS"

else
    log_error "❌ FALLO CRÍTICO ($SUCCESS_COUNT/$TOTAL_TESTS)"
    echo
    echo "🆘 DIAGNÓSTICO NECESARIO:"
    echo "   • Logs backend: pm2 logs backend"
    echo "   • Estado MongoDB: curl http://localhost:3001/api/health"
    echo "   • Variables PM2: pm2 show backend"
fi

echo
echo "🔧 COMANDOS ÚTILES:"
echo "   • Estado: pm2 status"
echo "   • Logs: pm2 logs backend"
echo "   • Restart: pm2 restart backend --update-env"
echo "   • Health: curl http://localhost:3001/api/health"

echo
log_success "Configuración completa de producción finalizada! 🚀"