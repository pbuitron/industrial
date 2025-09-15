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

echo "🚀 VERIFICACIÓN COMPLETA DEL DEPLOYMENT - Industrial IoT"
echo "========================================================"

DOMAIN="industrial-iot.us"
SUCCESS_COUNT=0
TOTAL_TESTS=0

# Función para ejecutar test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo
    log_info "Test $TOTAL_TESTS: $test_name"

    if eval "$test_command" > /dev/null 2>&1; then
        log_success "$expected_result"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        return 0
    else
        log_error "FALLO: $test_name"
        return 1
    fi
}

# Función para test con output
run_test_with_output() {
    local test_name="$1"
    local test_command="$2"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo
    log_info "Test $TOTAL_TESTS: $test_name"

    local output
    if output=$(eval "$test_command" 2>&1); then
        log_success "✅ PASÓ"
        echo "$output"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        return 0
    else
        log_error "❌ FALLÓ"
        echo "$output"
        return 1
    fi
}

echo
log_header "VERIFICACIÓN DE SERVICIOS BASE"

# 1. PM2 Status
echo
log_info "Test: Estado de PM2"
if command -v pm2 >/dev/null 2>&1; then
    pm2 status
    log_success "PM2 disponible"
elif [ -f "/usr/local/bin/pm2" ]; then
    /usr/local/bin/pm2 status
    log_success "PM2 disponible en /usr/local/bin"
else
    log_error "PM2 no encontrado"
fi

# 2. Nginx Status
echo
log_info "Test: Estado de Nginx"
systemctl status nginx --no-pager -l | head -5

# 3. Certificados SSL
echo
log_info "Test: Certificados SSL"
certbot certificates 2>/dev/null | grep -A 5 "$DOMAIN" || log_warning "Error obteniendo info de certificados"

# 4. Puertos en uso
echo
log_info "Test: Puertos en uso"
echo "Puertos críticos:"
netstat -tlnp | grep -E ":(80|443|3000|3001)" | while read line; do
    echo "  $line"
done

echo
log_header "TESTS DE CONECTIVIDAD LOCAL"

# Tests de conectividad local
run_test "Backend Local (Puerto 3001)" \
         "curl -f -s http://localhost:3001/api/health" \
         "Backend responde en puerto 3001"

run_test "Frontend Local (Puerto 3000)" \
         "curl -f -s http://localhost:3000/" \
         "Frontend responde en puerto 3000"

echo
log_header "TESTS DE CONECTIVIDAD HTTPS"

# Tests HTTPS
run_test "HTTPS Frontend Principal" \
         "curl -f -s https://$DOMAIN/" \
         "Frontend accesible via HTTPS"

run_test "HTTPS API Health Check" \
         "curl -f -s https://$DOMAIN/api/health" \
         "API Health Check funciona"

# Test específico de productos (el que estaba fallando)
run_test "API Productos Abrazaderas" \
         "curl -f -s https://$DOMAIN/api/products/abrazaderas" \
         "API de productos abrazaderas funciona"

run_test "API Productos Kits" \
         "curl -f -s https://$DOMAIN/api/products/kits" \
         "API de productos kits funciona"

run_test "API Productos Epóxicos" \
         "curl -f -s https://$DOMAIN/api/products/epoxicos" \
         "API de productos epóxicos funciona"

echo
log_header "TESTS DE REDIRECCIÓN Y SEGURIDAD"

# Test redirección HTTP -> HTTPS
echo
log_info "Test: Redirección HTTP -> HTTPS"
HTTP_RESPONSE=$(curl -s -I http://$DOMAIN/ | head -1)
echo "Respuesta HTTP: $HTTP_RESPONSE"
if echo "$HTTP_RESPONSE" | grep -q "301\|302"; then
    log_success "Redirección HTTP -> HTTPS configurada"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    log_warning "Redirección HTTP -> HTTPS no detectada"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test headers de seguridad
echo
log_info "Test: Headers de seguridad HTTPS"
SECURITY_HEADERS=$(curl -s -I https://$DOMAIN/ | grep -i "x-frame-options\|x-content-type-options\|strict-transport-security")
if [ -n "$SECURITY_HEADERS" ]; then
    log_success "Headers de seguridad presentes"
    echo "$SECURITY_HEADERS"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    log_warning "Headers de seguridad no detectados"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo
log_header "TESTS DE FUNCIONALIDAD API"

# Test con contenido de API
echo
log_info "Test: Contenido de API Health"
curl -s https://$DOMAIN/api/health | jq . 2>/dev/null || curl -s https://$DOMAIN/api/health

echo
log_info "Test: Contenido de API Productos (primer item)"
PRODUCTS_RESPONSE=$(curl -s https://$DOMAIN/api/products/abrazaderas)
if echo "$PRODUCTS_RESPONSE" | jq . >/dev/null 2>&1; then
    echo "$PRODUCTS_RESPONSE" | jq '.[0] // "Sin productos"' 2>/dev/null
    log_success "API devuelve JSON válido"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "$PRODUCTS_RESPONSE"
    log_warning "API no devuelve JSON válido o está vacía"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo
log_header "TESTS DE MONITOREO Y LOGS"

# Logs recientes
echo
log_info "Test: Logs recientes de Nginx"
if [ -f "/var/log/nginx/access.log" ]; then
    echo "Últimas 3 líneas del access log:"
    tail -3 /var/log/nginx/access.log 2>/dev/null || echo "No hay logs de acceso"
else
    echo "No se encontró access.log"
fi

if [ -f "/var/log/nginx/error.log" ]; then
    echo "Últimas 3 líneas del error log:"
    tail -3 /var/log/nginx/error.log 2>/dev/null || echo "No hay logs de error"
else
    echo "No se encontró error.log"
fi

# Test de cron job SSL
echo
log_info "Test: Renovación automática SSL"
if crontab -l 2>/dev/null | grep -q "certbot renew"; then
    log_success "Renovación automática SSL configurada"
    echo "Cron job SSL:"
    crontab -l | grep certbot
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    log_warning "Renovación automática SSL no configurada"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo
log_header "RESUMEN FINAL"

# Calcular porcentaje de éxito
SUCCESS_PERCENTAGE=$((SUCCESS_COUNT * 100 / TOTAL_TESTS))

echo
echo "📊 RESULTADOS DE LA VERIFICACIÓN:"
echo "================================="
echo "✅ Tests exitosos: $SUCCESS_COUNT"
echo "📋 Total de tests: $TOTAL_TESTS"
echo "📈 Porcentaje de éxito: $SUCCESS_PERCENTAGE%"
echo

if [ "$SUCCESS_PERCENTAGE" -ge 90 ]; then
    log_success "🎉 ¡DEPLOYMENT EXCELENTE! ($SUCCESS_PERCENTAGE% de éxito)"
    echo
    echo "🌐 Tu aplicación está completamente funcional:"
    echo "   Frontend: https://$DOMAIN"
    echo "   API: https://$DOMAIN/api/"
    echo "   Health Check: https://$DOMAIN/api/health"
    echo
elif [ "$SUCCESS_PERCENTAGE" -ge 75 ]; then
    log_warning "⚠️  DEPLOYMENT BUENO ($SUCCESS_PERCENTAGE% de éxito)"
    echo "La mayoría de funcionalidades están operativas."
    echo "Revisa los tests fallidos para optimización."
else
    log_error "❌ DEPLOYMENT CON PROBLEMAS ($SUCCESS_PERCENTAGE% de éxito)"
    echo "Varios tests han fallado. Revisa la configuración."
fi

echo
echo "🔧 COMANDOS ÚTILES PARA GESTIÓN:"
echo "================================"
echo "Ver estado de servicios:"
echo "  sudo systemctl status nginx"
echo "  pm2 status"
echo
echo "Ver logs en tiempo real:"
echo "  sudo tail -f /var/log/nginx/access.log"
echo "  sudo tail -f /var/log/nginx/error.log"
echo "  pm2 logs"
echo
echo "Gestionar SSL:"
echo "  sudo certbot certificates"
echo "  sudo certbot renew --dry-run"
echo
echo "Reiniciar servicios:"
echo "  sudo systemctl reload nginx"
echo "  pm2 restart all"

echo
log_success "Verificación completa finalizada! 🚀"