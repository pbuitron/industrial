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

echo "🔒 CONFIGURACIÓN SSL Y NGINX - Industrial IoT"
echo "============================================="

DOMAIN="industrial-iot.us"
EMAIL="info@industrial-iot.us"

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script debe ejecutarse como root"
    log_info "Ejecuta: sudo $0"
    exit 1
fi

log_info "PASO 1: Verificando estado actual..."

echo "--- Estado de servicios ---"
systemctl status nginx --no-pager -l || log_warning "Nginx no está corriendo"
pm2 status || log_warning "PM2 no está disponible"

echo "--- Puertos en uso ---"
netstat -tlnp | grep -E ":(80|443|3000|3001)" || log_warning "Algunos puertos no están en uso"

echo "--- Configuración actual de Nginx ---"
if [ -f "/etc/nginx/sites-available/industrial-iot" ]; then
    log_info "Configuración existente encontrada"
    head -10 /etc/nginx/sites-available/industrial-iot
else
    log_warning "No existe configuración para industrial-iot"
fi

log_info "PASO 2: Instalando dependencias..."
apt update
apt install -y nginx certbot python3-certbot-nginx curl

log_info "PASO 3: Creando configuración de Nginx..."

# Backup de configuración existente
if [ -f "/etc/nginx/sites-available/industrial-iot" ]; then
    cp /etc/nginx/sites-available/industrial-iot /etc/nginx/sites-available/industrial-iot.backup.$(date +%Y%m%d_%H%M%S)
    log_info "Backup creado de configuración existente"
fi

# Crear configuración base (HTTP primero)
cat > /etc/nginx/sites-available/industrial-iot << 'NGINX_CONFIG'
server {
    listen 80;
    server_name industrial-iot.us www.industrial-iot.us;

    # Headers de seguridad básicos
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API Backend (puerto 3001) - IMPORTANTE: sin barra final en proxy_pass
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # CORS headers para API
        add_header Access-Control-Allow-Origin https://industrial-iot.us always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    }

    # Frontend Next.js (puerto 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_CONFIG

log_success "Configuración base de Nginx creada"

log_info "PASO 4: Habilitando sitio..."
# Habilitar sitio
ln -sf /etc/nginx/sites-available/industrial-iot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
nginx -t
if [ $? -ne 0 ]; then
    log_error "Error en configuración de Nginx"
    exit 1
fi

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx
log_success "Nginx configurado y reiniciado"

log_info "PASO 5: Configurando SSL con Certbot..."

# Verificar que el dominio resuelve
log_info "Verificando resolución DNS..."
if ! nslookup $DOMAIN > /dev/null 2>&1; then
    log_warning "El dominio $DOMAIN no resuelve correctamente"
    log_warning "Continuando con la configuración SSL..."
fi

# Configurar SSL
log_info "Obteniendo certificado SSL..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email "$EMAIL" || {
    log_warning "Certbot automático falló, intentando modo manual..."
    certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email "$EMAIL"

    if [ $? -eq 0 ]; then
        log_info "Configurando SSL manualmente en Nginx..."
        # Recrear configuración con SSL
        cat > /etc/nginx/sites-available/industrial-iot << 'NGINX_SSL_CONFIG'
server {
    listen 80;
    server_name industrial-iot.us www.industrial-iot.us;
    return 301 https://$server_name$request_uri;
}

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

    # API Backend (puerto 3001)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # CORS headers para API
        add_header Access-Control-Allow-Origin https://industrial-iot.us always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    }

    # Frontend Next.js (puerto 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_SSL_CONFIG

        nginx -t && systemctl reload nginx
    fi
}

log_info "PASO 6: Configurando renovación automática..."
# Configurar renovación automática
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
log_success "Renovación automática configurada"

log_info "PASO 7: Verificaciones finales..."

echo
echo "📊 Estado de servicios:"
systemctl status nginx --no-pager -l | head -3
pm2 status

echo
echo "🧪 Tests de conectividad:"

# Test backend directo
if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1; then
    log_success "Backend funcionando (puerto 3001)"
else
    log_warning "Backend no responde en puerto 3001"
fi

# Test frontend directo
if curl -f -s http://localhost:3000/ >/dev/null 2>&1; then
    log_success "Frontend funcionando (puerto 3000)"
else
    log_warning "Frontend no responde en puerto 3000"
fi

# Test HTTP
if curl -f -s http://$DOMAIN/ >/dev/null 2>&1; then
    log_success "HTTP funcionando (debería redirigir a HTTPS)"
else
    log_warning "HTTP no funciona"
fi

# Test HTTPS
if curl -f -s https://$DOMAIN/ >/dev/null 2>&1; then
    log_success "HTTPS funcionando"
else
    log_warning "HTTPS no funciona - puede necesitar tiempo para propagar"
fi

# Test API HTTPS
if curl -f -s https://$DOMAIN/api/health >/dev/null 2>&1; then
    log_success "API HTTPS funcionando"
else
    log_warning "API HTTPS no funciona"
fi

echo
echo "🎉 ¡CONFIGURACIÓN SSL COMPLETADA!"
echo "================================"
echo
echo "🌐 URLs disponibles:"
echo "   Frontend: https://$DOMAIN"
echo "   API: https://$DOMAIN/api/"
echo "   Health Check: https://$DOMAIN/api/health"
echo
echo "📊 Gestión:"
echo "   Nginx: systemctl status nginx"
echo "   PM2: pm2 status"
echo "   SSL: certbot certificates"
echo
echo "🔄 Renovación automática configurada"
echo "📝 Logs de Nginx: /var/log/nginx/"

log_success "¡SSL y Nginx configurados correctamente! 🔒"