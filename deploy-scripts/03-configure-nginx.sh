#!/bin/bash
set -e

DOMAIN="industrial-iot.us"
EMAIL="admin@industrial-iot.us"  # Cambiar por tu email real

echo "=== CONFIGURACIÓN DE NGINX Y SSL ==="

echo "Configurando Nginx..."
# Crear configuración de Nginx
sudo tee /etc/nginx/sites-available/industrial-iot << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Redirigir todo a HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # Configuración SSL (se completará con certbot)

    # Configuración de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Frontend estático
    location / {
        root /root/industrial/out;
        try_files \$uri \$uri.html \$uri/ /index.html;

        # Headers para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

echo "Habilitando sitio..."
# Habilitar el sitio
ln -sf /etc/nginx/sites-available/industrial-iot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "Verificando configuración de Nginx..."
# Verificar configuración
nginx -t

echo "Obteniendo certificado SSL..."
# Obtener certificado SSL
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL

echo "Reiniciando Nginx..."
# Reiniciar Nginx
systemctl reload nginx

echo "✅ Configuración de Nginx y SSL completada!"