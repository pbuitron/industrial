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

echo "🔍 DIAGNÓSTICO NGINX - ROUTING API PRODUCTOS"
echo "============================================"

log_header "PASO 1: VERIFICANDO BACKEND FUNCIONAL"

echo "=== Test backend directo ==="
echo "Backend localhost:3001/api/health:"
curl -s http://localhost:3001/api/health || echo "FALLA"

echo "Backend localhost:3001/api/products/abrazaderas:"
curl -s http://localhost:3001/api/products/abrazaderas | head -5 || echo "FALLA"

echo "Backend localhost:3001/api/products/kits:"
curl -s http://localhost:3001/api/products/kits | head -5 || echo "FALLA"

echo "Backend localhost:3001/api/products/epoxicos:"
curl -s http://localhost:3001/api/products/epoxicos | head -5 || echo "FALLA"

log_header "PASO 2: CONFIGURACIÓN NGINX"

echo "=== Verificando sintaxis Nginx ==="
sudo nginx -t

echo "=== Archivos de configuración Nginx ==="
echo "Sites disponibles:"
ls -la /etc/nginx/sites-available/

echo "Sites habilitados:"
ls -la /etc/nginx/sites-enabled/

echo "=== Configuración principal del sitio ==="
if [ -f "/etc/nginx/sites-available/industrial-iot.us" ]; then
    echo "Archivo: /etc/nginx/sites-available/industrial-iot.us"
    cat /etc/nginx/sites-available/industrial-iot.us
else
    echo "Archivo industrial-iot.us no encontrado, buscando otros..."
    find /etc/nginx -name "*industrial*" -type f 2>/dev/null || echo "No se encontraron archivos"
fi

echo
echo "=== Configuración API específica ==="
grep -r -A 5 -B 5 "/api" /etc/nginx/sites-available/ 2>/dev/null || echo "No se encontró configuración /api"

echo
echo "=== Configuración para productos específicamente ==="
grep -r -A 5 -B 5 "products" /etc/nginx/sites-available/ 2>/dev/null || echo "No se encontró configuración products"

log_header "PASO 3: TESTS DE CONECTIVIDAD NGINX"

echo "=== Test API Health desde dominios públicos ==="
echo "https://industrial-iot.us/api/health:"
curl -s https://industrial-iot.us/api/health || echo "FALLA - $(curl -s -o /dev/null -w "%{http_code}" https://industrial-iot.us/api/health)"

echo "https://www.industrial-iot.us/api/health:"
curl -s https://www.industrial-iot.us/api/health || echo "FALLA - $(curl -s -o /dev/null -w "%{http_code}" https://www.industrial-iot.us/api/health)"

echo
echo "=== Test API Productos desde dominios públicos ==="
echo "https://industrial-iot.us/api/products/abrazaderas:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://industrial-iot.us/api/products/abrazaderas)
echo "HTTP Code: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    curl -s https://industrial-iot.us/api/products/abrazaderas | head -3
else
    echo "FALLA con código $HTTP_CODE"
fi

echo "https://industrial-iot.us/api/products/kits:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://industrial-iot.us/api/products/kits)
echo "HTTP Code: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    curl -s https://industrial-iot.us/api/products/kits | head -3
else
    echo "FALLA con código $HTTP_CODE"
fi

echo "https://industrial-iot.us/api/products/epoxicos:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://industrial-iot.us/api/products/epoxicos)
echo "HTTP Code: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    curl -s https://industrial-iot.us/api/products/epoxicos | head -3
else
    echo "FALLA con código $HTTP_CODE"
fi

log_header "PASO 4: LOGS Y DIAGNÓSTICO"

echo "=== Logs de error de Nginx ==="
echo "Últimos errores generales:"
sudo tail -20 /var/log/nginx/error.log || echo "No se pudieron leer logs de error"

echo
echo "=== Logs de acceso de Nginx ==="
echo "Últimos accesos:"
sudo tail -10 /var/log/nginx/access.log || echo "No se pudieron leer logs de acceso"

echo
echo "=== Logs específicos del dominio ==="
if [ -f "/var/log/nginx/industrial-iot.access.log" ]; then
    echo "Últimos accesos industrial-iot:"
    sudo tail -10 /var/log/nginx/industrial-iot.access.log
fi

if [ -f "/var/log/nginx/industrial-iot.error.log" ]; then
    echo "Últimos errores industrial-iot:"
    sudo tail -10 /var/log/nginx/industrial-iot.error.log
fi

log_header "PASO 5: ESTADO DE SERVICIOS"

echo "=== Estado de servicios ==="
echo "Nginx:"
sudo systemctl status nginx --no-pager || echo "Error obteniendo estado de Nginx"

echo "PM2:"
pm2 status || echo "Error obteniendo estado de PM2"

echo "Procesos en puerto 3001:"
sudo netstat -tlnp | grep 3001 || echo "No hay procesos en puerto 3001"

echo "Procesos en puertos 80/443:"
sudo netstat -tlnp | grep -E ":(80|443)" || echo "No hay procesos en puertos 80/443"

log_header "PASO 6: ANÁLISIS DE RUTEO"

echo "=== Análisis de configuración ==="
echo "🔍 VERIFICANDO PROBLEMAS COMUNES:"

echo "1. ¿Nginx está corriendo?"
if sudo systemctl is-active nginx > /dev/null; then
    log_success "Nginx está activo"
else
    log_error "Nginx NO está activo"
fi

echo "2. ¿Backend está corriendo en 3001?"
if curl -s http://localhost:3001/api/health > /dev/null; then
    log_success "Backend responde en puerto 3001"
else
    log_error "Backend NO responde en puerto 3001"
fi

echo "3. ¿Hay configuración proxy para /api?"
if grep -r "proxy_pass.*3001" /etc/nginx/sites-available/ > /dev/null 2>&1; then
    log_success "Configuración proxy encontrada"
    grep -r "proxy_pass.*3001" /etc/nginx/sites-available/
else
    log_error "NO hay configuración proxy para puerto 3001"
fi

echo "4. ¿Configuración incluye /api/products?"
if grep -r "/api" /etc/nginx/sites-available/ > /dev/null 2>&1; then
    LOCATIONS=$(grep -r "location.*api" /etc/nginx/sites-available/ || echo "No específicas")
    log_info "Configuraciones /api encontradas:"
    echo "$LOCATIONS"
else
    log_error "NO hay configuración para rutas /api"
fi

echo
log_success "Diagnóstico completo de Nginx finalizado!"
echo
echo "📋 RESUMEN:"
echo "   • Backend funciona: $(curl -s http://localhost:3001/api/health > /dev/null && echo "✅ SÍ" || echo "❌ NO")"
echo "   • Nginx activo: $(sudo systemctl is-active nginx > /dev/null && echo "✅ SÍ" || echo "❌ NO")"
echo "   • Proxy configurado: $(grep -r "proxy_pass.*3001" /etc/nginx/sites-available/ > /dev/null 2>&1 && echo "✅ SÍ" || echo "❌ NO")"
echo "   • APIs públicas: $(curl -s https://industrial-iot.us/api/health > /dev/null && echo "✅ SÍ" || echo "❌ NO")"