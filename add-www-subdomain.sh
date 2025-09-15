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

echo "🌐 CONFIGURAR SUBDOMINIO WWW - Industrial IoT"
echo "============================================="

MAIN_DOMAIN="industrial-iot.us"
WWW_DOMAIN="www.industrial-iot.us"
EMAIL="info@industrial-iot.us"

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script debe ejecutarse como root"
    log_info "Ejecuta: sudo $0"
    exit 1
fi

log_info "PASO 1: Verificando DNS del subdominio www..."

# Test de resolución DNS
if nslookup $WWW_DOMAIN > /dev/null 2>&1; then
    log_success "✅ $WWW_DOMAIN resuelve correctamente"
    echo "IP detectada para $WWW_DOMAIN:"
    nslookup $WWW_DOMAIN | grep "Address:" | tail -1
else
    log_warning "⚠️  $WWW_DOMAIN no resuelve aún"
    echo
    echo "🔧 CONFIGURACIÓN NECESARIA EN NAMECHEAP:"
    echo "========================================"
    echo "1. Ve a tu panel de Namecheap"
    echo "2. Domain List → Manage → Advanced DNS"
    echo "3. Agrega este registro:"
    echo
    echo "   Tipo: CNAME"
    echo "   Host: www"
    echo "   Valor: $MAIN_DOMAIN"
    echo "   TTL: Automatic"
    echo
    echo "4. Espera 5-15 minutos para propagación"
    echo
    read -p "¿Ya configuraste el DNS en Namecheap? (y/n): " dns_ready
    if [ "$dns_ready" != "y" ]; then
        log_info "Configura primero el DNS y luego ejecuta este script nuevamente"
        exit 0
    fi
fi

log_info "PASO 2: Agregando certificado SSL para www..."

# Intentar expandir el certificado existente
log_info "Expandiendo certificado SSL para incluir www..."
if certbot --nginx -d $MAIN_DOMAIN -d $WWW_DOMAIN --expand --non-interactive --agree-tos --email "$EMAIL"; then
    log_success "Certificado SSL expandido exitosamente"
else
    log_warning "Expansión automática falló, intentando certificado nuevo..."

    # Si falla, intentar obtener certificado nuevo
    if certbot certonly --nginx -d $MAIN_DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email "$EMAIL"; then
        log_success "Certificado SSL obtenido para ambos dominios"

        # Actualizar configuración manualmente
        log_info "Actualizando configuración de Nginx..."

        # Backup de configuración actual
        cp /etc/nginx/sites-available/industrial-iot "/etc/nginx/sites-available/industrial-iot.backup.$(date +%Y%m%d_%H%M%S)"

        # Crear nueva configuración con ambos dominios
        cat > /etc/nginx/sites-available/industrial-iot << 'NGINX_CONFIG'
# HTTP - Redirección a HTTPS para ambos dominios
server {
    listen 80;
    server_name industrial-iot.us www.industrial-iot.us;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Configuración principal para ambos dominios
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

    # API Backend (puerto 3001)
    location /api/ {
        proxy_pass http://localhost:3001;
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

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Frontend Next.js (puerto 3000)
    location / {
        proxy_pass http://localhost:3000;
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

    # Archivos estáticos con cache
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Favicon y robots
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
NGINX_CONFIG

        # Verificar configuración
        if nginx -t; then
            systemctl reload nginx
            log_success "Configuración de Nginx actualizada"
        else
            log_error "Error en configuración de Nginx"
            exit 1
        fi
    else
        log_error "No se pudo obtener certificado SSL para www"
        exit 1
    fi
fi

log_info "PASO 3: Verificaciones finales..."

echo
echo "📊 Estado de certificados SSL:"
certbot certificates

echo
echo "🧪 Tests de conectividad:"

# Test dominios principales
for domain in $MAIN_DOMAIN $WWW_DOMAIN; do
    echo
    log_info "Testing $domain..."

    # Test HTTP (debería redirigir)
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$domain/ || echo "000")
    if [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        log_success "✅ HTTP redirige correctamente ($HTTP_STATUS)"
    else
        log_warning "⚠️  HTTP no redirige ($HTTP_STATUS)"
    fi

    # Test HTTPS
    if curl -f -s https://$domain/ >/dev/null 2>&1; then
        log_success "✅ HTTPS funcionando"
    else
        log_warning "⚠️  HTTPS no funciona"
    fi

    # Test API
    if curl -f -s https://$domain/api/health >/dev/null 2>&1; then
        log_success "✅ API funcionando"
    else
        log_warning "⚠️  API no funciona"
    fi
done

echo
echo "🎉 ¡CONFIGURACIÓN DE WWW COMPLETADA!"
echo "===================================="
echo
echo "🌐 URLs disponibles:"
echo "   ✅ https://$MAIN_DOMAIN"
echo "   ✅ https://$WWW_DOMAIN"
echo "   ✅ https://$MAIN_DOMAIN/api/"
echo "   ✅ https://$WWW_DOMAIN/api/"
echo
echo "🔄 Ambos dominios redirigen automáticamente a HTTPS"
echo "🔒 Certificado SSL válido para ambos dominios"
echo

if nslookup $WWW_DOMAIN > /dev/null 2>&1; then
    log_success "¡Configuración completa y funcionando! 🚀"
    echo
    echo "💡 Puedes probar ambas URLs en tu navegador:"
    echo "   • $MAIN_DOMAIN"
    echo "   • $WWW_DOMAIN"
else
    log_warning "Configuración del servidor completa"
    echo "⏳ Espera a que el DNS del subdominio www se propague (5-15 min)"
    echo
    echo "🔍 Para verificar DNS:"
    echo "   nslookup $WWW_DOMAIN"
fi

echo
log_success "Script completado exitosamente! ✨"