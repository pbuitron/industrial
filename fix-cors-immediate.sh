#!/bin/bash
set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🚀 CORRECCIÓN INMEDIATA CORS - WWW SUBDOMAIN"
echo "============================================="

log_info "PASO 1: Verificando directorio y configuración actual"

if [ ! -f "server/.env" ]; then
    log_error "No se encontró server/.env - asegúrate de estar en /root/industrial"
    exit 1
fi

echo "=== Variables CORS actuales ==="
cat server/.env | grep -E "FRONTEND_URL|CORS_ORIGIN" || log_warning "Variables CORS no encontradas"

log_info "PASO 2: Corrigiendo variables CORS en .env"

# Backup
cp server/.env "server/.env.backup.$(date +%Y%m%d_%H%M%S)"
log_success "Backup creado"

# Actualizar FRONTEND_URL
if grep -q "FRONTEND_URL=" server/.env; then
    sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://industrial-iot.us,https://www.industrial-iot.us|' server/.env
    log_success "FRONTEND_URL actualizada"
else
    echo "FRONTEND_URL=https://industrial-iot.us,https://www.industrial-iot.us" >> server/.env
    log_success "FRONTEND_URL agregada"
fi

# Actualizar CORS_ORIGIN
if grep -q "CORS_ORIGIN=" server/.env; then
    sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://industrial-iot.us,https://www.industrial-iot.us|' server/.env
    log_success "CORS_ORIGIN actualizada"
else
    echo "CORS_ORIGIN=https://industrial-iot.us,https://www.industrial-iot.us" >> server/.env
    log_success "CORS_ORIGIN agregada"
fi

echo "=== Variables CORS corregidas ==="
cat server/.env | grep -E "FRONTEND_URL|CORS_ORIGIN"

log_info "PASO 3: Verificando configuración CORS en server.js"

# Mostrar configuración actual de CORS
echo "=== Configuración CORS en código ==="
grep -A 10 -B 3 "corsOptions\|cors(" server/server.js || log_warning "No se encontró configuración CORS explícita"

log_info "PASO 4: Creando configuración CORS mejorada"

# Backup de server.js
cp server/server.js "server/server.js.backup.$(date +%Y%m%d_%H%M%S)"

# Verificar si ya tiene configuración CORS múltiple
if grep -q "split.*," server/server.js || grep -q "FRONTEND_URL.*split" server/server.js; then
    log_success "Configuración CORS múltiple ya existe"
else
    log_info "Actualizando configuración CORS en server.js"

    # Buscar línea de configuración CORS y reemplazar
    if grep -q "corsOptions" server/server.js; then
        sed -i '/const corsOptions = {/,/};/c\
const corsOptions = {\
  origin: [\
    ...process.env.FRONTEND_URL.split(","),\
    "http://localhost:3000",\
    "http://127.0.0.1:3000"\
  ],\
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],\
  allowedHeaders: ["Content-Type", "Authorization"],\
  credentials: true\
};' server/server.js
    else
        # Si no existe corsOptions, agregar antes de app.use(cors())
        sed -i '/app\.use(cors/i\
const corsOptions = {\
  origin: [\
    ...process.env.FRONTEND_URL.split(","),\
    "http://localhost:3000",\
    "http://127.0.0.1:3000"\
  ],\
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],\
  allowedHeaders: ["Content-Type", "Authorization"],\
  credentials: true\
};\
' server/server.js

        # Actualizar app.use(cors()) para usar corsOptions
        sed -i 's/app\.use(cors())/app.use(cors(corsOptions))/' server/server.js
    fi

    log_success "Configuración CORS actualizada en server.js"
fi

log_info "PASO 5: Reiniciando backend con PM2"

# Detectar PM2
PM2_CMD=""
if command -v pm2 >/dev/null 2>&1; then
    PM2_CMD="pm2"
elif [ -f "/usr/local/bin/pm2" ]; then
    PM2_CMD="/usr/local/bin/pm2"
else
    log_error "PM2 no encontrado"
    exit 1
fi

log_info "Usando PM2: $PM2_CMD"

# Mostrar estado actual
echo "=== Estado PM2 actual ==="
$PM2_CMD status

# Reiniciar backend con nombres correctos
log_info "Reiniciando backend..."
$PM2_CMD restart backend --update-env || $PM2_CMD restart industrial-website-server --update-env || log_error "Error reiniciando backend"

log_success "Backend reiniciado"

# Esperar reinicio
sleep 5

log_info "PASO 6: Verificación inmediata"

echo "=== Test backend local ==="
if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1; then
    log_success "✅ Backend local funciona"
    curl -s http://localhost:3001/api/health | head -3
else
    log_error "❌ Backend local no responde"
fi

echo "=== Test CORS headers ==="
log_info "Headers CORS para www.industrial-iot.us:"
curl -s -I https://www.industrial-iot.us/api/health | grep -i "access-control" || log_warning "No hay headers CORS"

echo "=== Test productos desde WWW ==="
if curl -f -s https://www.industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1; then
    PRODUCTS=$(curl -s https://www.industrial-iot.us/api/products/abrazaderas)
    if echo "$PRODUCTS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$PRODUCTS" | jq '. | length' 2>/dev/null || echo "0")
        log_success "✅ WWW carga productos: $COUNT items"
    else
        log_warning "⚠️  WWW responde pero datos no válidos"
    fi
else
    log_error "❌ WWW no puede obtener productos"
fi

echo
if curl -f -s https://www.industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1; then
    log_success "🎉 ¡CORRECCIÓN EXITOSA! WWW.INDUSTRIAL-IOT.US FUNCIONA"
    echo
    echo "✅ Prueba en navegador: https://www.industrial-iot.us/productos/abrazaderas"
else
    log_error "❌ Aún hay problemas. Revisa logs: $PM2_CMD logs backend"
fi

echo
log_success "Script de corrección CORS completado! 🚀"