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

echo "🔄 REVERTIR Y CORREGIR CORS - WWW SUBDOMAIN"
echo "==========================================="

log_info "PASO 1: Revertir al commit que funcionaba"

# Verificar que estamos en el directorio correcto
if [ ! -f "server/.env" ]; then
    log_error "No se encontró server/.env - asegúrate de estar en /root/industrial"
    exit 1
fi

echo "=== Estado actual del repositorio ==="
git log --oneline -3

log_info "Revirtiendo al commit b6119905880a7cf4a29034010a69a6a3e3166bf4..."
git reset --hard b6119905880a7cf4a29034010a69a6a3e3166bf4

log_success "Revertido al commit que funcionaba"

echo "=== Commit actual después de revertir ==="
git log --oneline -3

log_info "PASO 2: Verificando estado después de revertir"

echo "=== Variables de entorno originales ==="
cat server/.env | head -15

echo "=== Verificando MONGODB_URI ==="
if grep -q "MONGODB_URI" server/.env; then
    log_success "✅ MONGODB_URI encontrada"
    grep "MONGODB_URI" server/.env | sed 's/mongodb+srv:\/\/[^:]*:[^@]*@/mongodb+srv://***:***@/'
else
    log_error "❌ MONGODB_URI no encontrada"
fi

log_info "PASO 3: Agregando SOLO configuración CORS para WWW"

# Crear backup del .env funcionando
cp server/.env "server/.env.backup.funcionando.$(date +%Y%m%d_%H%M%S)"
log_success "Backup del .env funcionando creado"

# Verificar si ya existe FRONTEND_URL
if grep -q "FRONTEND_URL" server/.env; then
    log_info "FRONTEND_URL ya existe, actualizando..."
    sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://industrial-iot.us,https://www.industrial-iot.us|' server/.env
else
    log_info "Agregando FRONTEND_URL nueva..."
    echo "" >> server/.env
    echo "# CORS para WWW subdomain" >> server/.env
    echo "FRONTEND_URL=https://industrial-iot.us,https://www.industrial-iot.us" >> server/.env
fi

# Verificar configuración CORS en server.js
echo "=== Configuración CORS en server.js ==="
if grep -A 5 -B 5 "corsOptions\|cors(" server/server.js; then
    log_info "Configuración CORS encontrada en código"
else
    log_warning "No se encontró configuración CORS explícita"
fi

echo "=== Variables después de agregar CORS ==="
cat server/.env | grep -E "MONGODB_URI|FRONTEND_URL|PORT|NODE_ENV" || log_warning "Algunas variables no encontradas"

log_info "PASO 4: Reiniciando backend cuidadosamente"

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

echo "=== Estado PM2 antes de reiniciar ==="
$PM2_CMD status

log_info "Reiniciando backend..."
$PM2_CMD restart backend --update-env

log_success "Backend reiniciado"

# Esperar a que se estabilice
sleep 8

log_info "PASO 5: Verificación post-reinicio"

echo "=== Test backend local ==="
if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1; then
    log_success "✅ Backend local responde"
    curl -s http://localhost:3001/api/health
else
    log_error "❌ Backend local no responde"
    echo "Verificando logs..."
    $PM2_CMD logs backend --lines 5
fi

echo "=== Test dominio principal (debe seguir funcionando) ==="
if curl -f -s https://industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1; then
    PRODUCTS=$(curl -s https://industrial-iot.us/api/products/abrazaderas)
    if echo "$PRODUCTS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$PRODUCTS" | jq '. | length' 2>/dev/null || echo "0")
        log_success "✅ industrial-iot.us funciona: $COUNT productos"
    else
        log_warning "⚠️  industrial-iot.us responde pero datos inválidos"
    fi
else
    log_error "❌ industrial-iot.us NO FUNCIONA - PROBLEMA GRAVE"
fi

echo "=== Test WWW subdomain (objetivo principal) ==="
if curl -f -s https://www.industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1; then
    PRODUCTS=$(curl -s https://www.industrial-iot.us/api/products/abrazaderas)
    if echo "$PRODUCTS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$PRODUCTS" | jq '. | length' 2>/dev/null || echo "0")
        log_success "✅ www.industrial-iot.us funciona: $COUNT productos"
    else
        log_warning "⚠️  www.industrial-iot.us responde pero datos inválidos"
    fi
else
    log_error "❌ www.industrial-iot.us aún falla"
    echo "Verificando headers CORS..."
    curl -s -I https://www.industrial-iot.us/api/health | grep -i "access-control" || echo "Sin headers CORS"
fi

echo "=== Test de conectividad MongoDB ==="
if curl -s http://localhost:3001/api/health | grep -q "success.*true"; then
    log_success "✅ MongoDB conectado correctamente"
else
    log_warning "⚠️  Posible problema de conexión MongoDB"
fi

log_info "PASO 6: Resumen final"

echo
if curl -f -s https://industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1 && curl -f -s https://www.industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1; then
    log_success "🎉 ¡ÉXITO TOTAL!"
    echo
    echo "✅ https://industrial-iot.us - Funciona perfectamente"
    echo "✅ https://www.industrial-iot.us - Funciona perfectamente"
    echo
    echo "🌐 URLs para verificar:"
    echo "   • https://industrial-iot.us/productos/abrazaderas"
    echo "   • https://www.industrial-iot.us/productos/abrazaderas"
    echo "   • https://industrial-iot.us/productos/kits"
    echo "   • https://www.industrial-iot.us/productos/kits"

elif curl -f -s https://industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1; then
    log_warning "⚠️  ÉXITO PARCIAL"
    echo "✅ industrial-iot.us funciona"
    echo "❌ www.industrial-iot.us aún tiene problemas"
    echo
    echo "🔧 Diagnóstico adicional necesario:"
    echo "   • Verificar configuración Nginx para WWW"
    echo "   • Revisar headers CORS: curl -I https://www.industrial-iot.us/api/health"

else
    log_error "❌ PROBLEMA GRAVE"
    echo "El dominio principal dejó de funcionar después del revert."
    echo
    echo "🆘 Acción de emergencia:"
    echo "   • Logs backend: $PM2_CMD logs backend"
    echo "   • Estado MongoDB: curl http://localhost:3001/api/health"
    echo "   • Restaurar backup: cp server/.env.backup.funcionando.* server/.env"
fi

echo
echo "🔧 Comandos útiles:"
echo "   • Ver logs: $PM2_CMD logs backend"
echo "   • Estado: $PM2_CMD status"
echo "   • Restart: $PM2_CMD restart backend"

echo
log_success "Script de revert y corrección completado! 🚀"