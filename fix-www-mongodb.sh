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

echo "🔧 DIAGNÓSTICO Y CORRECCIÓN WWW + MONGODB - Industrial IoT"
echo "=========================================================="

MAIN_DOMAIN="industrial-iot.us"
WWW_DOMAIN="www.industrial-iot.us"

# Verificar que estamos en el directorio correcto
if [ ! -f "server/.env" ]; then
    log_error "No se encontró server/.env - asegúrate de estar en /root/industrial"
    exit 1
fi

log_header "PASO 1: DIAGNÓSTICO COMPLETO"

echo
log_info "1.1 - Test Backend Directo (localhost:3001)"
if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1; then
    log_success "✅ Backend responde localmente"
    curl -s http://localhost:3001/api/health | head -3
else
    log_error "❌ Backend no responde localmente"
fi

echo
log_info "1.2 - Test API desde $MAIN_DOMAIN"
if curl -f -s https://$MAIN_DOMAIN/api/health >/dev/null 2>&1; then
    log_success "✅ API funciona desde $MAIN_DOMAIN"
    curl -s https://$MAIN_DOMAIN/api/health | head -3
else
    log_error "❌ API falla desde $MAIN_DOMAIN"
fi

echo
log_info "1.3 - Test API desde $WWW_DOMAIN"
if curl -f -s https://$WWW_DOMAIN/api/health >/dev/null 2>&1; then
    log_success "✅ API funciona desde $WWW_DOMAIN"
    curl -s https://$WWW_DOMAIN/api/health | head -3
else
    log_error "❌ API falla desde $WWW_DOMAIN"
fi

echo
log_info "1.4 - Test productos desde $MAIN_DOMAIN"
PRODUCTS_MAIN=$(curl -s https://$MAIN_DOMAIN/api/products/abrazaderas 2>/dev/null)
if echo "$PRODUCTS_MAIN" | jq . >/dev/null 2>&1; then
    PRODUCT_COUNT=$(echo "$PRODUCTS_MAIN" | jq '. | length' 2>/dev/null || echo "0")
    log_success "✅ Productos desde $MAIN_DOMAIN: $PRODUCT_COUNT items"
else
    log_error "❌ No se pueden obtener productos desde $MAIN_DOMAIN"
fi

echo
log_info "1.5 - Test productos desde $WWW_DOMAIN"
PRODUCTS_WWW=$(curl -s https://$WWW_DOMAIN/api/products/abrazaderas 2>/dev/null)
if echo "$PRODUCTS_WWW" | jq . >/dev/null 2>&1; then
    PRODUCT_COUNT=$(echo "$PRODUCTS_WWW" | jq '. | length' 2>/dev/null || echo "0")
    log_success "✅ Productos desde $WWW_DOMAIN: $PRODUCT_COUNT items"
else
    log_error "❌ No se pueden obtener productos desde $WWW_DOMAIN"
fi

echo
log_header "PASO 2: ANÁLISIS DE CONFIGURACIÓN CORS"

echo
log_info "2.1 - Configuración CORS actual del backend"
echo "--- server/.env ---"
cat server/.env | grep -E "FRONTEND_URL|CORS_ORIGIN" || log_warning "No se encontraron variables CORS"

echo
log_info "2.2 - Verificando código CORS en server.js"
if grep -n "corsOptions\|cors(" server/server.js; then
    log_info "Configuración CORS encontrada en server.js"
else
    log_warning "No se encontró configuración CORS explícita"
fi

echo
log_info "2.3 - Headers CORS en respuesta real"
echo "Headers desde $MAIN_DOMAIN:"
curl -s -I https://$MAIN_DOMAIN/api/health | grep -i "access-control\|cors" || echo "No hay headers CORS"

echo "Headers desde $WWW_DOMAIN:"
curl -s -I https://$WWW_DOMAIN/api/health | grep -i "access-control\|cors" || echo "No hay headers CORS"

echo
log_header "PASO 3: CORRECCIÓN AUTOMÁTICA"

log_info "3.1 - Creando backup de configuración actual"
cp server/.env "server/.env.backup.$(date +%Y%m%d_%H%M%S)"
log_success "Backup creado"

log_info "3.2 - Actualizando variables CORS para incluir ambos dominios"

# Leer variables actuales
CURRENT_FRONTEND_URL=$(grep "FRONTEND_URL=" server/.env | cut -d'=' -f2)
CURRENT_CORS_ORIGIN=$(grep "CORS_ORIGIN=" server/.env | cut -d'=' -f2 2>/dev/null || echo "")

echo "Variables actuales:"
echo "  FRONTEND_URL: $CURRENT_FRONTEND_URL"
echo "  CORS_ORIGIN: $CURRENT_CORS_ORIGIN"

# Actualizar FRONTEND_URL
if [[ "$CURRENT_FRONTEND_URL" == *"www"* ]]; then
    log_info "FRONTEND_URL ya incluye www"
else
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$MAIN_DOMAIN,https://$WWW_DOMAIN|" server/.env
    log_success "FRONTEND_URL actualizada"
fi

# Actualizar CORS_ORIGIN (si existe)
if grep -q "CORS_ORIGIN=" server/.env; then
    if [[ "$CURRENT_CORS_ORIGIN" == *"www"* ]]; then
        log_info "CORS_ORIGIN ya incluye www"
    else
        sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$MAIN_DOMAIN,https://$WWW_DOMAIN|" server/.env
        log_success "CORS_ORIGIN actualizada"
    fi
else
    echo "CORS_ORIGIN=https://$MAIN_DOMAIN,https://$WWW_DOMAIN" >> server/.env
    log_success "CORS_ORIGIN agregada"
fi

echo
log_info "3.3 - Verificando cambios aplicados"
echo "--- Variables CORS actualizadas ---"
cat server/.env | grep -E "FRONTEND_URL|CORS_ORIGIN"

echo
log_info "3.4 - Verificando y actualizando código CORS en server.js"

# Verificar si server.js maneja múltiples orígenes
if grep -q "split.*," server/server.js || grep -q "\[.*FRONTEND_URL" server/server.js; then
    log_success "server.js ya maneja múltiples orígenes"
else
    log_warning "server.js podría necesitar actualización para múltiples orígenes"

    # Crear backup de server.js
    cp server/server.js "server/server.js.backup.$(date +%Y%m%d_%H%M%S)"

    # Actualizar configuración CORS en server.js
    log_info "Actualizando configuración CORS en server.js..."

    # Buscar y reemplazar la configuración CORS
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

    log_success "server.js actualizado para múltiples orígenes"
fi

echo
log_info "3.5 - Reiniciando backend con nueva configuración"

# Reiniciar backend
if command -v pm2 >/dev/null 2>&1; then
    pm2 restart industrial-website-server
elif [ -f "/usr/local/bin/pm2" ]; then
    /usr/local/bin/pm2 restart industrial-website-server
else
    log_error "PM2 no encontrado"
    exit 1
fi

log_success "Backend reiniciado"

# Esperar a que reinicie
sleep 5

echo
log_header "PASO 4: VERIFICACIÓN POST-CORRECCIÓN"

echo
log_info "4.1 - Estado de servicios"
echo "--- PM2 Status ---"
if command -v pm2 >/dev/null 2>&1; then
    pm2 status
elif [ -f "/usr/local/bin/pm2" ]; then
    /usr/local/bin/pm2 status
fi

echo
log_info "4.2 - Tests de conectividad después de corrección"

# Re-test APIs
for domain in $MAIN_DOMAIN $WWW_DOMAIN; do
    echo
    log_info "Testing $domain..."

    # Test API Health
    if curl -f -s https://$domain/api/health >/dev/null 2>&1; then
        log_success "✅ API Health OK"
    else
        log_error "❌ API Health falla"
    fi

    # Test productos
    if curl -f -s https://$domain/api/products/abrazaderas >/dev/null 2>&1; then
        PRODUCTS=$(curl -s https://$domain/api/products/abrazaderas)
        if echo "$PRODUCTS" | jq . >/dev/null 2>&1; then
            COUNT=$(echo "$PRODUCTS" | jq '. | length' 2>/dev/null || echo "0")
            log_success "✅ Productos OK ($COUNT items)"
        else
            log_warning "⚠️  Productos devuelve datos pero no JSON válido"
        fi
    else
        log_error "❌ Productos falla"
    fi

    # Test headers CORS
    CORS_HEADERS=$(curl -s -I https://$domain/api/health | grep -i "access-control" | wc -l)
    if [ "$CORS_HEADERS" -gt 0 ]; then
        log_success "✅ Headers CORS presentes ($CORS_HEADERS headers)"
    else
        log_warning "⚠️  No se detectan headers CORS"
    fi
done

echo
log_info "4.3 - Test específico de productos en navegador"
echo
echo "🌐 URLs para probar en navegador:"
echo "   • https://$MAIN_DOMAIN/productos/abrazaderas"
echo "   • https://$WWW_DOMAIN/productos/abrazaderas"
echo "   • https://$MAIN_DOMAIN/productos/kits"
echo "   • https://$WWW_DOMAIN/productos/kits"

echo
log_header "RESUMEN Y RECOMENDACIONES"

echo
if curl -f -s https://$WWW_DOMAIN/api/products/abrazaderas >/dev/null 2>&1; then
    log_success "🎉 ¡CORRECCIÓN EXITOSA!"
    echo
    echo "✅ Ambos dominios funcionan correctamente:"
    echo "   • $MAIN_DOMAIN - Carga datos de MongoDB"
    echo "   • $WWW_DOMAIN - Carga datos de MongoDB"
    echo
    echo "🔧 Cambios aplicados:"
    echo "   • Variables CORS actualizadas en .env"
    echo "   • Configuración CORS en server.js actualizada"
    echo "   • Backend reiniciado con nueva configuración"
    echo
else
    log_warning "⚠️  CORRECCIÓN PARCIAL"
    echo
    echo "🔍 Pasos adicionales necesarios:"
    echo "1. Verificar logs del backend: pm2 logs industrial-website-server"
    echo "2. Verificar conexión MongoDB: curl http://localhost:3001/api/health"
    echo "3. Revisar configuración Nginx para WWW"
    echo
fi

echo "📊 Para monitoreo continuo:"
echo "   • Logs backend: pm2 logs industrial-website-server"
echo "   • Logs Nginx: tail -f /var/log/nginx/industrial-iot.*.log"
echo "   • Estado servicios: pm2 status && systemctl status nginx"

echo
log_success "Script de diagnóstico y corrección completado! 🚀"