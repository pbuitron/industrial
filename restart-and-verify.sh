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

echo "🔄 REINICIO Y VERIFICACIÓN FINAL - WWW + MONGODB"
echo "================================================"

MAIN_DOMAIN="industrial-iot.us"
WWW_DOMAIN="www.industrial-iot.us"

# Verificar directorio
if [ ! -f "server/.env" ]; then
    log_error "No se encontró server/.env - asegúrate de estar en /root/industrial"
    exit 1
fi

log_info "PASO 1: Verificando configuración CORS aplicada"
echo
echo "=== Variables CORS actuales ==="
cat server/.env | grep -E "FRONTEND_URL|CORS_ORIGIN"

echo
log_info "PASO 2: Reiniciando backend con PM2"

# Intentar diferentes rutas de PM2
if command -v pm2 >/dev/null 2>&1; then
    log_info "Usando pm2 desde PATH global"
    pm2 restart industrial-website-server
    PM2_CMD="pm2"
elif [ -f "/usr/local/bin/pm2" ]; then
    log_info "Usando pm2 desde /usr/local/bin/pm2"
    /usr/local/bin/pm2 restart industrial-website-server
    PM2_CMD="/usr/local/bin/pm2"
else
    log_error "PM2 no encontrado en PATH ni en /usr/local/bin/"
    exit 1
fi

log_success "Backend reiniciado correctamente"

echo
log_info "PASO 3: Verificando estado de servicios"
echo "=== PM2 Status ==="
$PM2_CMD status

echo
log_info "PASO 4: Esperando a que el backend reinicie completamente..."
sleep 5

echo
log_info "PASO 5: Tests de conectividad completos"

# Test backend local
echo
log_info "5.1 - Backend directo (localhost:3001)"
if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1; then
    log_success "✅ Backend local funciona"
    curl -s http://localhost:3001/api/health | jq .
else
    log_error "❌ Backend local no responde"
fi

# Test ambos dominios
for domain in $MAIN_DOMAIN $WWW_DOMAIN; do
    echo
    log_info "5.2 - Testing $domain"

    # Test API Health
    if curl -f -s https://$domain/api/health >/dev/null 2>&1; then
        log_success "✅ API Health OK"
        curl -s https://$domain/api/health | jq -c '{success, environment}'
    else
        log_error "❌ API Health falla"
        echo "Error response:"
        curl -s https://$domain/api/health | head -3
    fi

    # Test Productos Abrazaderas
    echo -n "   Productos abrazaderas: "
    if curl -f -s https://$domain/api/products/abrazaderas >/dev/null 2>&1; then
        PRODUCTS=$(curl -s https://$domain/api/products/abrazaderas)
        if echo "$PRODUCTS" | jq . >/dev/null 2>&1; then
            COUNT=$(echo "$PRODUCTS" | jq '. | length' 2>/dev/null || echo "0")
            log_success "$COUNT items encontrados"
        else
            log_warning "Responde pero no es JSON válido"
        fi
    else
        log_error "Falla al obtener productos"
    fi

    # Test Productos Kits
    echo -n "   Productos kits: "
    if curl -f -s https://$domain/api/products/kits >/dev/null 2>&1; then
        KITS=$(curl -s https://$domain/api/products/kits)
        if echo "$KITS" | jq . >/dev/null 2>&1; then
            COUNT=$(echo "$KITS" | jq '. | length' 2>/dev/null || echo "0")
            log_success "$COUNT items encontrados"
        else
            log_warning "Responde pero no es JSON válido"
        fi
    else
        log_error "Falla al obtener kits"
    fi

    # Test Productos Epóxicos
    echo -n "   Productos epóxicos: "
    if curl -f -s https://$domain/api/products/epoxicos >/dev/null 2>&1; then
        EPOXICOS=$(curl -s https://$domain/api/products/epoxicos)
        if echo "$EPOXICOS" | jq . >/dev/null 2>&1; then
            COUNT=$(echo "$EPOXICOS" | jq '. | length' 2>/dev/null || echo "0")
            log_success "$COUNT items encontrados"
        else
            log_warning "Responde pero no es JSON válido"
        fi
    else
        log_error "Falla al obtener epóxicos"
    fi

    echo "   ---"
done

echo
log_info "PASO 6: Test de headers CORS"

for domain in $MAIN_DOMAIN $WWW_DOMAIN; do
    echo
    log_info "Headers CORS para $domain:"
    CORS_HEADERS=$(curl -s -I https://$domain/api/health | grep -i "access-control")
    if [ -n "$CORS_HEADERS" ]; then
        echo "$CORS_HEADERS"
        log_success "✅ Headers CORS presentes"
    else
        log_warning "⚠️  No se detectan headers CORS"
    fi
done

echo
log_info "PASO 7: URLs para probar en navegador"

echo
echo "🌐 URLS PARA VERIFICAR EN NAVEGADOR:"
echo "======================================"
echo
echo "✅ Páginas principales:"
echo "   • https://$MAIN_DOMAIN"
echo "   • https://$WWW_DOMAIN"
echo
echo "✅ Páginas de productos:"
echo "   • https://$MAIN_DOMAIN/productos/abrazaderas"
echo "   • https://$WWW_DOMAIN/productos/abrazaderas"
echo "   • https://$MAIN_DOMAIN/productos/kits"
echo "   • https://$WWW_DOMAIN/productos/kits"
echo "   • https://$MAIN_DOMAIN/productos/epoxicos"
echo "   • https://$WWW_DOMAIN/productos/epoxicos"
echo
echo "✅ APIs directas:"
echo "   • https://$MAIN_DOMAIN/api/health"
echo "   • https://$WWW_DOMAIN/api/health"
echo

# Resumen final
SUCCESS_COUNT=0
TOTAL_TESTS=6

# Contar éxitos
for domain in $MAIN_DOMAIN $WWW_DOMAIN; do
    curl -f -s https://$domain/api/health >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    curl -f -s https://$domain/api/products/abrazaderas >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    curl -f -s https://$domain/api/products/kits >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
done

echo
echo "📊 RESUMEN FINAL:"
echo "================="
echo "✅ Tests exitosos: $SUCCESS_COUNT de $TOTAL_TESTS"

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    log_success "🎉 ¡PERFECTO! Ambos dominios funcionan completamente"
    echo
    echo "✅ industrial-iot.us - Carga datos MongoDB"
    echo "✅ www.industrial-iot.us - Carga datos MongoDB"
    echo
    echo "🚀 Tu aplicación está 100% operativa en ambos dominios!"
elif [ $SUCCESS_COUNT -gt 3 ]; then
    log_warning "⚠️  Funciona parcialmente ($SUCCESS_COUNT/$TOTAL_TESTS tests)"
    echo "La mayoría de funcionalidades están operativas."
else
    log_error "❌ Problemas detectados ($SUCCESS_COUNT/$TOTAL_TESTS tests)"
    echo
    echo "🔧 Comandos de diagnóstico adicional:"
    echo "   • Logs backend: $PM2_CMD logs industrial-website-server"
    echo "   • Logs Nginx: tail -f /var/log/nginx/industrial-iot.*.log"
    echo "   • Estado completo: $PM2_CMD status && systemctl status nginx"
fi

echo
echo "🔧 COMANDOS ÚTILES PARA GESTIÓN:"
echo "==============================="
echo "• Ver logs backend: $PM2_CMD logs industrial-website-server"
echo "• Ver logs Nginx: sudo tail -f /var/log/nginx/industrial-iot.access.log"
echo "• Estado servicios: $PM2_CMD status && sudo systemctl status nginx"
echo "• Reiniciar backend: $PM2_CMD restart industrial-website-server"
echo "• Reiniciar Nginx: sudo systemctl reload nginx"

echo
log_success "Verificación completa finalizada! 🚀"