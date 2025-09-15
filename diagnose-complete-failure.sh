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

echo "🔍 DIAGNÓSTICO COMPLETO - FRONTEND NO CARGA DATOS"
echo "================================================"

log_header "PASO 1: VERIFICACIÓN DE APIS BÁSICAS"

echo "=== Test API Health dominio principal ==="
echo -n "https://industrial-iot.us/api/health: "
if curl -f -s https://industrial-iot.us/api/health >/dev/null 2>&1; then
    log_success "RESPONDE"
    curl -s https://industrial-iot.us/api/health | head -3
else
    log_error "FALLA"
    echo "HTTP Status: $(curl -s -o /dev/null -w "%{http_code}" https://industrial-iot.us/api/health)"
fi

echo
echo "=== Test API Health WWW ==="
echo -n "https://www.industrial-iot.us/api/health: "
if curl -f -s https://www.industrial-iot.us/api/health >/dev/null 2>&1; then
    log_success "RESPONDE"
    curl -s https://www.industrial-iot.us/api/health | head -3
else
    log_error "FALLA"
    echo "HTTP Status: $(curl -s -o /dev/null -w "%{http_code}" https://www.industrial-iot.us/api/health)"
fi

log_header "PASO 2: VERIFICACIÓN HEADERS CORS"

echo
echo "=== Headers CORS desde industrial-iot.us ==="
CORS_MAIN=$(curl -s -I https://industrial-iot.us/api/health | grep -i "access-control" || echo "SIN_CORS")
if [ "$CORS_MAIN" = "SIN_CORS" ]; then
    log_error "❌ No hay headers CORS desde dominio principal"
else
    log_success "✅ Headers CORS encontrados:"
    echo "$CORS_MAIN"
fi

echo
echo "=== Headers CORS desde www.industrial-iot.us ==="
CORS_WWW=$(curl -s -I https://www.industrial-iot.us/api/health | grep -i "access-control" || echo "SIN_CORS")
if [ "$CORS_WWW" = "SIN_CORS" ]; then
    log_error "❌ No hay headers CORS desde WWW"
else
    log_success "✅ Headers CORS encontrados:"
    echo "$CORS_WWW"
fi

log_header "PASO 3: VERIFICACIÓN PM2 Y VARIABLES"

echo
echo "=== Estado PM2 ==="
pm2 status

echo
echo "=== Variables de entorno PM2 backend ==="
pm2 show backend | grep -A 15 "env:" || log_warning "No se pudieron obtener variables de PM2"

echo
echo "=== Test directo de variables .env.production ==="
cd /root/industrial/server
if [ -f ".env.production" ]; then
    log_info "Archivo .env.production existe"
    echo "FRONTEND_URL en .env.production:"
    grep "FRONTEND_URL" .env.production || echo "FRONTEND_URL no encontrada"
    echo "NODE_ENV en .env.production:"
    grep "NODE_ENV" .env.production || echo "NODE_ENV no encontrada"
else
    log_error "❌ Archivo .env.production NO EXISTE"
fi

echo
echo "=== Test variables cargadas por Node.js ==="
NODE_ENV=production node -e "
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
console.log('Archivo .env usado:', envFile);
dotenv.config({ path: envFile });
console.log('NODE_ENV cargado:', process.env.NODE_ENV);
console.log('FRONTEND_URL cargado:', process.env.FRONTEND_URL);
console.log('MONGODB_URI existe:', !!process.env.MONGODB_URI);
" 2>/dev/null || log_error "Error ejecutando test de Node.js"

log_header "PASO 4: TEST DETALLADO DE APIS DE PRODUCTOS"

cd /root/industrial

echo
echo "=== Test API productos dominio principal ==="
for product in "abrazaderas" "kits" "epoxicos"; do
    echo -n "   /api/products/$product: "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://industrial-iot.us/api/products/$product)
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "✅ HTTP 200"
        RESPONSE=$(curl -s https://industrial-iot.us/api/products/$product)
        if echo "$RESPONSE" | jq . >/dev/null 2>&1; then
            COUNT=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null || echo "0")
            echo "      Productos encontrados: $COUNT"
        else
            log_warning "⚠️  Respuesta no es JSON válido"
            echo "$RESPONSE" | head -2
        fi
    else
        log_error "❌ HTTP $HTTP_CODE"
    fi
done

echo
echo "=== Test API productos WWW ==="
for product in "abrazaderas" "kits" "epoxicos"; do
    echo -n "   /api/products/$product: "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://www.industrial-iot.us/api/products/$product)
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "✅ HTTP 200"
        RESPONSE=$(curl -s https://www.industrial-iot.us/api/products/$product)
        if echo "$RESPONSE" | jq . >/dev/null 2>&1; then
            COUNT=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null || echo "0")
            echo "      Productos encontrados: $COUNT"
        else
            log_warning "⚠️  Respuesta no es JSON válido"
            echo "$RESPONSE" | head -2
        fi
    else
        log_error "❌ HTTP $HTTP_CODE"
    fi
done

log_header "PASO 5: ANÁLISIS DE LOGS NGINX"

echo
echo "=== Últimos errores Nginx ==="
sudo tail -10 /var/log/nginx/industrial-iot.error.log 2>/dev/null || sudo tail -10 /var/log/nginx/error.log

echo
echo "=== Últimos accesos Nginx ==="
sudo tail -10 /var/log/nginx/industrial-iot.access.log 2>/dev/null || sudo tail -10 /var/log/nginx/access.log

log_header "PASO 6: TEST EN TIEMPO REAL"

echo
log_info "6.1 - Iniciando monitoreo de logs en tiempo real..."
echo "Monitoreando logs por 10 segundos mientras hago requests..."

# Iniciar monitoreo de logs en background
sudo tail -f /var/log/nginx/industrial-iot.access.log 2>/dev/null > /tmp/nginx_access.log &
ACCESS_PID=$!
sudo tail -f /var/log/nginx/industrial-iot.error.log 2>/dev/null > /tmp/nginx_error.log &
ERROR_PID=$!

# Dar tiempo para que inicien
sleep 2

echo
log_info "6.2 - Haciendo requests de prueba..."
echo "Request 1: API Health WWW"
curl -s https://www.industrial-iot.us/api/health >/dev/null

echo "Request 2: Productos abrazaderas WWW"
curl -s https://www.industrial-iot.us/api/products/abrazaderas >/dev/null

echo "Request 3: Frontend página WWW"
curl -s https://www.industrial-iot.us/productos/abrazaderas >/dev/null

# Esperar un poco más
sleep 3

# Matar procesos de monitoreo
kill $ACCESS_PID $ERROR_PID 2>/dev/null || true

echo
echo "=== Logs de acceso capturados ==="
if [ -f "/tmp/nginx_access.log" ]; then
    cat /tmp/nginx_access.log
    rm -f /tmp/nginx_access.log
else
    echo "No se capturaron logs de acceso"
fi

echo
echo "=== Logs de error capturados ==="
if [ -f "/tmp/nginx_error.log" ]; then
    cat /tmp/nginx_error.log
    rm -f /tmp/nginx_error.log
else
    echo "No se capturaron logs de error"
fi

log_header "PASO 7: CONFIGURACIÓN NGINX ACTUAL"

echo
echo "=== Configuración Nginx /api/ ==="
grep -A 20 "location /api/" /etc/nginx/sites-available/industrial-iot

echo
echo "=== Server names configurados ==="
grep "server_name" /etc/nginx/sites-available/industrial-iot

log_header "PASO 8: ANÁLISIS Y RECOMENDACIONES"

echo
log_info "8.1 - Contando éxitos vs fallos"

SUCCESS_API=0
TOTAL_API=6

# Test silencioso para contar
curl -f -s https://industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1 && SUCCESS_API=$((SUCCESS_API + 1))
curl -f -s https://industrial-iot.us/api/products/kits >/dev/null 2>&1 && SUCCESS_API=$((SUCCESS_API + 1))
curl -f -s https://industrial-iot.us/api/products/epoxicos >/dev/null 2>&1 && SUCCESS_API=$((SUCCESS_API + 1))
curl -f -s https://www.industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1 && SUCCESS_API=$((SUCCESS_API + 1))
curl -f -s https://www.industrial-iot.us/api/products/kits >/dev/null 2>&1 && SUCCESS_API=$((SUCCESS_API + 1))
curl -f -s https://www.industrial-iot.us/api/products/epoxicos >/dev/null 2>&1 && SUCCESS_API=$((SUCCESS_API + 1))

echo "📊 APIs funcionando: $SUCCESS_API de $TOTAL_API"

echo
echo "🔍 DIAGNÓSTICO FINAL:"

if [ $SUCCESS_API -eq 0 ]; then
    log_error "❌ NINGUNA API FUNCIONA"
    echo "Problemas detectados:"
    echo "   • Verificar si Nginx proxy_pass está correcto"
    echo "   • Verificar si backend está corriendo en puerto 3001"
    echo "   • Verificar configuración server_name en Nginx"

elif [ $SUCCESS_API -eq 3 ]; then
    log_warning "⚠️  SOLO DOMINIO PRINCIPAL FUNCIONA"
    echo "Problema específico con WWW:"
    echo "   • Verificar server_name incluye www.industrial-iot.us"
    echo "   • Verificar certificado SSL para WWW"
    echo "   • Verificar headers CORS para WWW"

elif [ $SUCCESS_API -eq $TOTAL_API ]; then
    log_success "✅ TODAS LAS APIS FUNCIONAN"
    echo "Problema es en el frontend:"
    echo "   • Verificar CORS headers en respuesta"
    echo "   • Verificar si frontend usa HTTP en lugar de HTTPS"
    echo "   • Verificar si hay caché del navegador"
    echo "   • Considerar hacer npm run build"

else
    log_warning "⚠️  FUNCIONAMIENTO PARCIAL ($SUCCESS_API/$TOTAL_API)"
    echo "Problema mixto - revisar logs específicos arriba"
fi

echo
echo "🛠️  COMANDOS DE CORRECCIÓN SUGERIDOS:"

if [ $SUCCESS_API -lt 3 ]; then
    echo "   # Problema de Nginx/Backend"
    echo "   sudo nginx -t"
    echo "   sudo systemctl reload nginx"
    echo "   pm2 restart backend --update-env"
    echo "   pm2 logs backend"
elif [ $SUCCESS_API -lt 6 ]; then
    echo "   # Problema de CORS/WWW"
    echo "   pm2 restart backend --update-env"
    echo "   sudo systemctl reload nginx"
    echo "   curl -I https://www.industrial-iot.us/api/health"
else
    echo "   # Problema de Frontend"
    echo "   pm2 restart frontend"
    echo "   npm run build  # si existe"
    echo "   # Limpiar caché del navegador"
fi

echo
log_success "Diagnóstico completo finalizado! 🔍"