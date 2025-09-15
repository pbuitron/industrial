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

echo "🔒 COMPLETAR CONFIGURACIÓN SSL - Industrial IoT"
echo "==============================================="

DOMAIN="industrial-iot.us"

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script debe ejecutarse como root"
    log_info "Ejecuta: sudo $0"
    exit 1
fi

log_info "PASO 1: Verificando certificado SSL..."

# Verificar que el certificado existe
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    log_error "Certificado SSL no encontrado para $DOMAIN"
    log_info "Ejecuta primero: sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email info@$DOMAIN"
    exit 1
fi

log_success "Certificado SSL encontrado para $DOMAIN"

log_info "PASO 2: Creando configuración optimizada de Nginx..."

# Backup de configuración actual
if [ -f "/etc/nginx/sites-available/industrial-iot" ]; then
    cp /etc/nginx/sites-available/industrial-iot "/etc/nginx/sites-available/industrial-iot.backup.$(date +%Y%m%d_%H%M%S)"
    log_info "Backup creado de configuración existente"
fi

# Crear configuración SSL optimizada
cat > /etc/nginx/sites-available/industrial-iot << 'NGINX_CONFIG'
# HTTP - Redirección a HTTPS
server {
    listen 80;
    server_name industrial-iot.us;

    # Redirección permanente a HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS - Configuración principal
server {
    listen 443 ssl http2;
    server_name industrial-iot.us;

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
        # Proxy al backend
        proxy_pass http://localhost:3001;

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

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;

        # Headers para APIs
        proxy_set_header Accept-Encoding "";
        add_header X-API-Server "industrial-backend" always;
    }

    # Frontend Next.js (puerto 3000)
    location / {
        # Proxy al frontend
        proxy_pass http://localhost:3000;

        # Headers básicos de proxy
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Para WebSocket y Hot Reload (desarrollo)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Manejo de archivos estáticos (_next/static)
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;

        # Cache para archivos estáticos
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
NGINX_CONFIG

log_success "Configuración SSL creada"

log_info "PASO 3: Validando y aplicando configuración..."

# Verificar sintaxis de Nginx
if ! nginx -t; then
    log_error "Error en la sintaxis de configuración de Nginx"
    exit 1
fi

log_success "Sintaxis de Nginx válida"

# Habilitar sitio si no está habilitado
ln -sf /etc/nginx/sites-available/industrial-iot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Recargar Nginx
systemctl reload nginx
log_success "Nginx recargado con nueva configuración"

log_info "PASO 4: Configurando renovación automática..."

# Verificar si cron job ya existe
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    log_success "Renovación automática configurada"
else
    log_info "Renovación automática ya configurada"
fi

log_info "PASO 5: Verificaciones finales..."

echo
echo "📊 Estado de servicios:"
echo "--- Nginx ---"
systemctl status nginx --no-pager -l | head -3

echo "--- PM2 ---"
pm2 status

echo "--- Certificados SSL ---"
certbot certificates

echo
echo "🧪 Tests de conectividad:"

# Test backend directo
if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1; then
    log_success "Backend directo funcionando"
else
    log_warning "Backend directo no responde"
fi

# Test frontend directo
if curl -f -s http://localhost:3000/ >/dev/null 2>&1; then
    log_success "Frontend directo funcionando"
else
    log_warning "Frontend directo no responde"
fi

# Test redirección HTTP -> HTTPS
echo "--- Test redirección HTTP -> HTTPS ---"
HTTP_REDIRECT=$(curl -s -I http://$DOMAIN/ | head -1)
echo "HTTP Response: $HTTP_REDIRECT"

# Test HTTPS Frontend
if curl -f -s https://$DOMAIN/ >/dev/null 2>&1; then
    log_success "HTTPS Frontend funcionando"
else
    log_warning "HTTPS Frontend no funciona"
fi

# Test HTTPS API
if curl -f -s https://$DOMAIN/api/health >/dev/null 2>&1; then
    log_success "HTTPS API funcionando"
    echo "API Response:"
    curl -s https://$DOMAIN/api/health | jq . 2>/dev/null || curl -s https://$DOMAIN/api/health
else
    log_warning "HTTPS API no funciona"
fi

# Test API específica que estaba fallando
if curl -f -s https://$DOMAIN/api/products/abrazaderas >/dev/null 2>&1; then
    log_success "API de productos funcionando"
else
    log_warning "API de productos no funciona - verificar datos en MongoDB"
fi

echo
echo "🔍 Información adicional:"
echo "--- Puertos en uso ---"
netstat -tlnp | grep -E ":(80|443|3000|3001)"

echo "--- Logs recientes de Nginx ---"
tail -5 /var/log/nginx/access.log 2>/dev/null || echo "No hay logs de acceso aún"

echo
echo "🎉 ¡CONFIGURACIÓN SSL COMPLETADA!"
echo "================================="
echo
echo "🌐 URLs disponibles:"
echo "   ✅ Frontend: https://$DOMAIN"
echo "   ✅ API Health: https://$DOMAIN/api/health"
echo "   ✅ API Productos: https://$DOMAIN/api/products/abrazaderas"
echo
echo "🔧 Gestión de servicios:"
echo "   Nginx: sudo systemctl status nginx"
echo "   PM2: pm2 status"
echo "   SSL: sudo certbot certificates"
echo
echo "📝 Logs importantes:"
echo "   Nginx Access: tail -f /var/log/nginx/industrial-iot.access.log"
echo "   Nginx Error: tail -f /var/log/nginx/industrial-iot.error.log"
echo "   PM2 Logs: pm2 logs"
echo
echo "🔄 Renovación automática SSL configurada (se ejecuta diariamente a las 12:00)"

log_success "¡Configuración SSL completada exitosamente! 🔒✨"