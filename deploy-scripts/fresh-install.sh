#!/bin/bash
set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
DOMAIN="industrial-iot.us"
PROJECT_DIR="/root/industrial"
DB_NAME="industrial-iot"

echo -e "${BLUE}🚀 INSTALACIÓN LIMPIA - Industrial IoT${NC}"
echo "============================================="
echo ""

# Verificar que estamos ejecutando como root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Este script debe ejecutarse como root${NC}"
    exit 1
fi

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para verificar servicio
check_service() {
    if systemctl is-active --quiet "$1"; then
        log_success "$1 está ejecutándose"
        return 0
    else
        log_error "$1 no está ejecutándose"
        return 1
    fi
}

# Limpieza inicial
log_info "Limpiando instalaciones previas..."
systemctl stop mongod 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Remover paquetes conflictivos
apt remove -y mongodb-org* mongo* nginx* 2>/dev/null || true
apt autoremove -y
apt autoclean

# Actualizar sistema
log_info "Actualizando sistema..."
export DEBIAN_FRONTEND=noninteractive
apt update && apt upgrade -y

# Instalar dependencias básicas
log_info "Instalando dependencias básicas..."
apt install -y curl wget software-properties-common git ufw dnsutils

# Verificar conexión a internet
log_info "Verificando conexión a internet..."
if ping -c 1 google.com &> /dev/null; then
    log_success "Conexión a internet OK"
else
    log_error "Sin conexión a internet"
    exit 1
fi

# Verificar DNS
log_info "Verificando configuración DNS..."
DOMAIN_IP=$(dig +short $DOMAIN @8.8.8.8 | tail -n1)
SERVER_IP=$(curl -s --max-time 10 ifconfig.me || curl -s --max-time 10 ipinfo.io/ip)

if [ -z "$DOMAIN_IP" ]; then
    log_warning "No se pudo resolver el dominio $DOMAIN"
else
    if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
        log_success "DNS configurado correctamente ($DOMAIN → $SERVER_IP)"
    else
        log_warning "El dominio $DOMAIN no apunta a este servidor"
        log_warning "Dominio apunta a: $DOMAIN_IP"
        log_warning "Servidor IP: $SERVER_IP"
    fi
fi

# Pedir email para SSL
echo ""
log_info "Para el certificado SSL, necesitamos tu email:"
read -p "Email: " USER_EMAIL
if [ -z "$USER_EMAIL" ]; then
    log_error "Email requerido"
    exit 1
fi

# Instalar Node.js
log_info "Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar Node.js
if command_exists node && command_exists npm; then
    log_success "Node.js $(node --version) instalado"
    log_success "NPM $(npm --version) instalado"
else
    log_error "Error instalando Node.js"
    exit 1
fi

# Instalar PM2
log_info "Instalando PM2..."
npm install -g pm2

# Instalar MongoDB usando Docker (más estable)
log_info "Instalando Docker para MongoDB..."
apt install -y docker.io
systemctl start docker
systemctl enable docker

# Crear directorio para datos de MongoDB
mkdir -p /var/lib/mongodb-data

# Ejecutar MongoDB en Docker
log_info "Iniciando MongoDB en Docker..."
docker stop mongodb 2>/dev/null || true
docker rm mongodb 2>/dev/null || true

docker run -d \
    --name mongodb \
    --restart unless-stopped \
    -p 27017:27017 \
    -v /var/lib/mongodb-data:/data/db \
    -e MONGO_INITDB_ROOT_USERNAME=admin \
    -e MONGO_INITDB_ROOT_PASSWORD=industrial2024 \
    mongo:5.0

# Esperar a que MongoDB esté listo
log_info "Esperando a que MongoDB esté listo..."
for i in {1..30}; do
    if docker exec mongodb mongosh --quiet --eval "db.runCommand('ping')" >/dev/null 2>&1; then
        log_success "MongoDB está funcionando"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "MongoDB no pudo iniciarse"
        exit 1
    fi
    sleep 2
done

# Instalar Nginx
log_info "Instalando Nginx..."
apt install -y nginx certbot python3-certbot-nginx

# Configurar firewall
log_info "Configurando firewall..."
ufw --force reset
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Iniciar servicios
systemctl start nginx
systemctl enable nginx

# Verificar servicios
log_info "Verificando servicios..."
check_service nginx

# Clonar proyecto
log_info "Clonando proyecto desde GitHub..."
cd /root
rm -rf industrial 2>/dev/null || true
git clone https://github.com/pbuitron/industrial.git
cd industrial

# Instalar dependencias
log_info "Instalando dependencias del proyecto..."
npm install

cd server
npm install
cd ..

# Configurar variables de entorno
log_info "Configurando variables de entorno..."

# Backend .env
cat > server/.env << EOF
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://admin:industrial2024@localhost:27017/$DB_NAME?authSource=admin
JWT_SECRET=9k2m8n4p6r7t1w3x5z8a2c4e6g9j1m3p5r8u0w2y4a7d9f2h5k7n0q3s6v8x1z4b6e8h1k3n6q9s2v5x8z1c4f7i0l3o6r9u2w5y8a1d4g7j0m3p6s9v2x5z8c1e4h7k0n3q6t9w2y5a8d1f4i7l0o3r6u9x2z5c8e1h4k7n0q3s6v9y2a5d8f1i4l7o0r3u6x9z2c5e8h1k4n7q0s3v6y9a2d5g8j1m4p7s0v3x6z9c2e5h8k1n4q7t0w3y6a9d2f5i8l1o4r7u0x3z6c9e2h5k8n1q4s7v0y3a6d9g2j5m8p1s4v7y0b3e6h9k2n5q8t1w4z7c0f3i6l9o2r5u8x1a4d7g0j3m6p9s2v5y8b1e4h7k0n3q6t9w2z5c8f1i4l7o0r3u6x9a2d5g8j1m4p7s0v3y6b9e2h5k8n1q4t7w0z3c6f9i2l5o8r1u4x7a0d3g6j9m2p5s8v1y4b7e0h3k6n9q2t5w8z1c4f7i0l3o6r9u2x5a8d1g4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9c2f5i8l1o4r7u0x3a6d9g2j5m8p1s4v7y0b3e6h9k2n5q8t1w4z7
CORS_ORIGIN=https://$DOMAIN
EOF

# Frontend .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
EOF

# Crear configuración PM2
log_info "Configurando PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'industrial-iot-backend',
    script: './server/server.js',
    cwd: '/root/industrial',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    exec_mode: 'cluster',
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Crear directorio de logs
mkdir -p logs

# Build del frontend
log_info "Compilando frontend..."
npm run build

# Configurar Nginx
log_info "Configurando Nginx..."
cat > /etc/nginx/sites-available/industrial-iot << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # Logs
    access_log /var/log/nginx/industrial-iot.access.log;
    error_log /var/log/nginx/industrial-iot.error.log;

    # Configuración de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Frontend estático
    location / {
        root /root/industrial/out;
        try_files \$uri \$uri.html \$uri/ /index.html;

        # Headers para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
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

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/industrial-iot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Verificar configuración de Nginx
if nginx -t; then
    log_success "Configuración de Nginx válida"
else
    log_error "Error en configuración de Nginx"
    exit 1
fi

# Obtener certificado SSL
log_info "Obteniendo certificado SSL..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email "$USER_EMAIL"

# Reiniciar Nginx
systemctl reload nginx

# Configurar PM2 autostart
log_info "Configurando autostart de PM2..."
pm2 startup systemd -u root --hp /root

# Iniciar aplicación
log_info "Iniciando aplicación..."
pm2 start ecosystem.config.js
pm2 save

# Esperar a que la aplicación esté lista
log_info "Esperando a que la aplicación esté lista..."
sleep 10

# Verificaciones finales
log_info "Ejecutando verificaciones finales..."

# Verificar backend
if curl -f http://localhost:3001/api/ >/dev/null 2>&1; then
    log_success "Backend responde correctamente"
else
    log_warning "Backend no responde - revisar logs con: pm2 logs"
fi

# Verificar sitio web
if curl -f https://$DOMAIN/ >/dev/null 2>&1; then
    log_success "Sitio web responde correctamente"
else
    log_warning "Sitio web no responde - verificar DNS"
fi

echo ""
echo -e "${GREEN}🎉 ¡INSTALACIÓN COMPLETADA!${NC}"
echo "=========================="
echo ""
echo -e "${BLUE}✅ Tu aplicación está disponible en:${NC}"
echo "   🌐 https://$DOMAIN"
echo "   🔧 API: https://$DOMAIN/api/"
echo ""
echo -e "${BLUE}📋 Comandos de mantenimiento:${NC}"
echo "   📊 Estado: pm2 status"
echo "   📝 Logs: pm2 logs industrial-iot-backend"
echo "   🔄 Reiniciar: pm2 restart industrial-iot-backend"
echo "   📈 Monitor: pm2 monit"
echo ""
echo -e "${BLUE}🐳 MongoDB (Docker):${NC}"
echo "   📊 Estado: docker ps"
echo "   📝 Logs: docker logs mongodb"
echo "   🔄 Reiniciar: docker restart mongodb"
echo ""
echo -e "${BLUE}📋 Estado de servicios:${NC}"
pm2 status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
systemctl status nginx --no-pager -l

log_success "Instalación completada exitosamente!"