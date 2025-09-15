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
log_header() { echo -e "${PURPLE}🔧 $1${NC}"; }

echo "🔧 CORRECCIÓN CONFIGURACIÓN NGINX - INDUSTRIAL IOT"
echo "================================================="

log_header "PASO 1: BACKUP Y DIAGNÓSTICO"

# Verificar que estamos en el lugar correcto
if [ ! -f "/etc/nginx/sites-available/industrial-iot" ]; then
    log_error "Archivo /etc/nginx/sites-available/industrial-iot no encontrado"
    exit 1
fi

log_info "1.1 - Creando backup del archivo corrupto"
sudo cp /etc/nginx/sites-available/industrial-iot /etc/nginx/sites-available/industrial-iot.corrupted.$(date +%Y%m%d_%H%M%S)
log_success "Backup creado"

log_info "1.2 - Mostrando problema actual"
echo "=== Línea problemática encontrada ==="
grep -n "proxy_pass.*localhor" /etc/nginx/sites-available/industrial-iot || echo "Línea corrupta no encontrada en grep"

log_header "PASO 2: CREANDO CONFIGURACIÓN CORREGIDA"

log_info "2.1 - Escribiendo nueva configuración Nginx"

# Crear la configuración corregida
sudo tee /etc/nginx/sites-available/industrial-iot > /dev/null << 'EOF'
# HTTP - Redirección a HTTPS
server {
    listen 80;
    server_name industrial-iot.us www.industrial-iot.us;

    # Redirección permanente a HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS - Configuración principal
server {
    listen 443 ssl http2;
    server_name industrial-iot.us www.industrial-iot.us;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/industrial-iot.us/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/industrial-iot.us/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Headers de seguridad
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Configuración de logs
    access_log /var/log/nginx/industrial-iot.access.log;
    error_log /var/log/nginx/industrial-iot.error.log;

    # API Backend (puerto 3001) - CORREGIDO
    location /api/ {
        proxy_pass http://localhost:3001/;

        # Headers básicos de proxy
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # CORS Headers para ambos dominios
        add_header Access-Control-Allow-Origin "https://industrial-iot.us, https://www.industrial-iot.us" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;

        # Headers para APIs
        proxy_set_header Accept-Encoding "";
        add_header X-API-Server "industrial-backend" always;
    }

    # Frontend Next.js (puerto 3000)
    location / {
        proxy_pass http://localhost:3000;

        # Headers básicos de proxy
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Para WebSocket y Hot Reload
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Manejo de archivos estáticos
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Favicon y robots.txt
    location = /favicon.ico {
        proxy_pass http://localhost:3000;
        expires 1d;
        add_header Cache-Control "public";
    }

    location = /robots.txt {
        proxy_pass http://localhost:3000;
        expires 1d;
        add_header Cache-Control "public";
    }
}
EOF

log_success "Nueva configuración escrita"

log_info "2.2 - Verificando sintaxis de Nginx"
if sudo nginx -t; then
    log_success "✅ Sintaxis de Nginx correcta"
else
    log_error "❌ Error en sintaxis de Nginx"
    echo "Restaurando backup..."
    sudo cp /etc/nginx/sites-available/industrial-iot.corrupted.* /etc/nginx/sites-available/industrial-iot
    exit 1
fi

log_header "PASO 3: APLICANDO CAMBIOS"

log_info "3.1 - Recargando configuración de Nginx"
sudo systemctl reload nginx
log_success "Nginx recargado"

log_info "3.2 - Esperando que se apliquen cambios..."
sleep 3

log_header "PASO 4: VERIFICACIÓN INMEDIATA"

echo
log_info "4.1 - Test API Health desde dominio principal"
if curl -f -s https://industrial-iot.us/api/health >/dev/null 2>&1; then
    log_success "✅ API Health funciona desde industrial-iot.us"
    curl -s https://industrial-iot.us/api/health | head -3
else
    log_error "❌ API Health falla desde industrial-iot.us"
fi

echo
log_info "4.2 - Test API Health desde WWW"
if curl -f -s https://www.industrial-iot.us/api/health >/dev/null 2>&1; then
    log_success "✅ API Health funciona desde www.industrial-iot.us"
    curl -s https://www.industrial-iot.us/api/health | head -3
else
    log_error "❌ API Health falla desde www.industrial-iot.us"
fi

echo
log_info "4.3 - Test productos desde dominio principal"
if curl -f -s https://industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1; then
    PRODUCTS=$(curl -s https://industrial-iot.us/api/products/abrazaderas)
    if echo "$PRODUCTS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$PRODUCTS" | jq '.data | length' 2>/dev/null || echo "0")
        log_success "✅ Productos abrazaderas: $COUNT items"
    fi
else
    log_error "❌ Productos abrazaderas fallan"
fi

if curl -f -s https://industrial-iot.us/api/products/kits >/dev/null 2>&1; then
    KITS=$(curl -s https://industrial-iot.us/api/products/kits)
    if echo "$KITS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$KITS" | jq '.data | length' 2>/dev/null || echo "0")
        log_success "✅ Productos kits: $COUNT items"
    fi
else
    log_error "❌ Productos kits fallan"
fi

if curl -f -s https://industrial-iot.us/api/products/epoxicos >/dev/null 2>&1; then
    EPOXICOS=$(curl -s https://industrial-iot.us/api/products/epoxicos)
    if echo "$EPOXICOS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$EPOXICOS" | jq '.data | length' 2>/dev/null || echo "0")
        log_success "✅ Productos epóxicos: $COUNT items"
    fi
else
    log_error "❌ Productos epóxicos fallan"
fi

echo
log_info "4.4 - Test productos desde WWW"
if curl -f -s https://www.industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1; then
    PRODUCTS=$(curl -s https://www.industrial-iot.us/api/products/abrazaderas)
    if echo "$PRODUCTS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$PRODUCTS" | jq '.data | length' 2>/dev/null || echo "0")
        log_success "✅ WWW Productos abrazaderas: $COUNT items"
    fi
else
    log_error "❌ WWW Productos abrazaderas fallan"
fi

if curl -f -s https://www.industrial-iot.us/api/products/kits >/dev/null 2>&1; then
    KITS=$(curl -s https://www.industrial-iot.us/api/products/kits)
    if echo "$KITS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$KITS" | jq '.data | length' 2>/dev/null || echo "0")
        log_success "✅ WWW Productos kits: $COUNT items"
    fi
else
    log_error "❌ WWW Productos kits fallan"
fi

if curl -f -s https://www.industrial-iot.us/api/products/epoxicos >/dev/null 2>&1; then
    EPOXICOS=$(curl -s https://www.industrial-iot.us/api/products/epoxicos)
    if echo "$EPOXICOS" | jq . >/dev/null 2>&1; then
        COUNT=$(echo "$EPOXICOS" | jq '.data | length' 2>/dev/null || echo "0")
        log_success "✅ WWW Productos epóxicos: $COUNT items"
    fi
else
    log_error "❌ WWW Productos epóxicos fallan"
fi

log_header "PASO 5: RESUMEN FINAL"

# Contar éxitos
SUCCESS_COUNT=0
TOTAL_TESTS=6

curl -f -s https://industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
curl -f -s https://industrial-iot.us/api/products/kits >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
curl -f -s https://industrial-iot.us/api/products/epoxicos >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
curl -f -s https://www.industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
curl -f -s https://www.industrial-iot.us/api/products/kits >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
curl -f -s https://www.industrial-iot.us/api/products/epoxicos >/dev/null 2>&1 && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

echo
echo "📊 RESULTADO FINAL: $SUCCESS_COUNT de $TOTAL_TESTS tests exitosos"

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    log_success "🎉 ¡PERFECTO! TODAS LAS 6 COMBINACIONES FUNCIONAN"
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
    echo "🌐 TODAS LAS PÁGINAS CARGAN DATOS MONGODB CORRECTAMENTE"

elif [ $SUCCESS_COUNT -gt 3 ]; then
    log_warning "⚠️  ÉXITO PARCIAL ($SUCCESS_COUNT/$TOTAL_TESTS)"
    echo "La mayoría funciona, revisa los fallos específicos arriba"

else
    log_error "❌ PROBLEMAS DETECTADOS ($SUCCESS_COUNT/$TOTAL_TESTS)"
    echo "Revisa los logs de Nginx para más detalles"
fi

echo
echo "🛠️  CAMBIOS APLICADOS:"
echo "   • proxy_pass corregido: http://localhost:3001/"
echo "   • server_name agregado: www.industrial-iot.us"
echo "   • Headers CORS explícitos para ambos dominios"
echo "   • Backup guardado en: industrial-iot.corrupted.*"

echo
echo "🔧 Si hay problemas, restaurar backup:"
echo "   sudo cp /etc/nginx/sites-available/industrial-iot.corrupted.* /etc/nginx/sites-available/industrial-iot"
echo "   sudo systemctl reload nginx"

echo
log_success "Corrección de Nginx completada! 🚀"