#!/bin/bash
set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🔧 CORRIGIENDO URLs DUPLICADAS /api/api/"
echo "======================================"

# Verificar que estamos en el directorio correcto
if [ ! -f ".env.local" ]; then
    log_error "No se encontró .env.local - asegúrate de estar en /root/industrial"
    exit 1
fi

log_info "PASO 1: Verificando configuración actual..."

echo "--- Variables actuales ---"
cat .env.local | grep NEXT_PUBLIC_API_URL || log_error "Variable NEXT_PUBLIC_API_URL no encontrada"

log_info "PASO 2: Corrigiendo variable de entorno..."

# Crear backup
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)

# Corregir la URL - quitar /api del final
sed -i 's|NEXT_PUBLIC_API_URL=https://industrial-iot.us/api|NEXT_PUBLIC_API_URL=https://industrial-iot.us|g' .env.local

echo "--- Variables corregidas ---"
cat .env.local | grep NEXT_PUBLIC_API_URL

log_info "PASO 3: Verificando que el cambio es correcto..."

CURRENT_URL=$(grep NEXT_PUBLIC_API_URL .env.local | cut -d'=' -f2)
if [ "$CURRENT_URL" = "https://industrial-iot.us" ]; then
    log_success "Variable corregida correctamente"
else
    log_error "Error en la corrección. URL actual: $CURRENT_URL"
    exit 1
fi

log_info "PASO 4: Rebuild del frontend..."

# Limpiar build anterior
rm -rf .next

# Rebuild con variables corregidas
NODE_ENV=production npm run build

log_info "PASO 5: Reiniciando frontend..."

# Reiniciar solo el frontend
if command -v pm2 >/dev/null 2>&1; then
    pm2 restart industrial-project
elif [ -f "/usr/local/bin/pm2" ]; then
    /usr/local/bin/pm2 restart industrial-project
else
    log_error "PM2 no encontrado"
    exit 1
fi

log_success "Frontend reiniciado"

log_info "PASO 6: Verificando corrección..."

echo "🧪 Tests de las URLs problemáticas:"

# Test kits
if curl -f -s https://industrial-iot.us/api/products/kits >/dev/null 2>&1; then
    log_success "✅ /api/products/kits funciona"
else
    log_error "❌ /api/products/kits sigue fallando"
fi

# Test epóxicos
if curl -f -s https://industrial-iot.us/api/products/epoxicos >/dev/null 2>&1; then
    log_success "✅ /api/products/epoxicos funciona"
else
    log_error "❌ /api/products/epoxicos sigue fallando"
fi

# Test abrazaderas (debería seguir funcionando)
if curl -f -s https://industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1; then
    log_success "✅ /api/products/abrazaderas sigue funcionando"
else
    log_error "❌ /api/products/abrazaderas se rompió"
fi

echo
echo "🎯 URLs finales correctas:"
echo "   https://industrial-iot.us/api/products/kits"
echo "   https://industrial-iot.us/api/products/epoxicos"
echo "   https://industrial-iot.us/api/products/abrazaderas"

log_success "¡Corrección de URLs completada! 🚀"