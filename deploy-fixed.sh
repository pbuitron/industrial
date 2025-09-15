#!/bin/bash
set -e

echo "🚀 DESPLIEGUE LIMPIO CORREGIDO - Industrial IoT"
echo "=============================================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

DOMAIN="industrial-iot.us"

# Verificar que estamos ejecutando como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script debe ejecutarse como root"
    exit 1
fi

# Pedir email para SSL
log_info "Email para certificado SSL:"
read -p "Email: " USER_EMAIL
if [ -z "$USER_EMAIL" ]; then
    log_error "Email requerido"
    exit 1
fi

log_info "PASO 1: Preparación del sistema"
export DEBIAN_FRONTEND=noninteractive
apt update && apt upgrade -y
apt install -y curl wget git ufw nginx certbot python3-certbot-nginx

log_info "PASO 2: Instalando Node.js 18"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
npm install -g pm2

log_success "Node.js $(node --version) y PM2 instalados"

log_info "PASO 3: Clonando proyecto"
cd /root
rm -rf industrial 2>/dev/null || true
git clone https://github.com/pbuitron/industrial.git
cd industrial

log_info "PASO 4: Configurando variables de entorno SIN CONFLICTOS"

# IMPORTANTE: Limpiar archivos .env existentes para evitar conflictos
log_warning "Limpiando archivos .env existentes para evitar conflictos..."
rm -f .env .env.local .env.production .env.development 2>/dev/null || true
rm -f server/.env server/.env.development 2>/dev/null || true

# 1. BACKEND: Solo crear .env en server/
log_info "Configurando backend (server/.env)..."
cat > server/.env << 'BACKEND_ENV'
# BACKEND - Variables de entorno para PRODUCCIÓN
PORT=3001
MONGODB_URI=mongodb+srv://pbuitron:pbuitron@backend.98juy.mongodb.net/industrial-iot?retryWrites=true&w=majority
NODE_ENV=production

# URL del frontend para CORS
FRONTEND_URL=https://industrial-iot.us
CORS_ORIGIN=https://industrial-iot.us

# JWT Configuration
JWT_SECRET=9k2m8n4p6r7t1w3x5z8a2c4e6g9j1m3p5r8u0w2y4a7d9f2h5k7n0q3s6v8x1z4
JWT_EXPIRES_IN=1d
JWT_COOKIE_EXPIRES_IN=1

# Email Configuration
EMAIL_FROM=info@industrial-iot.us
EMAIL_HOST=mail.privateemail.com
EMAIL_PORT=465
EMAIL_USERNAME=info@industrial-iot.us
EMAIL_PASSWORD=Bitchgetinmycar1!

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=30

# API Externa RUC
APIPERU_TOKEN=da2681421089c13397a819eecf768404d7eff8c89ffa17c5f1338779328e983d
BACKEND_ENV

# 2. FRONTEND: Crear .env.production.local para producción
log_info "Configurando frontend (.env.production.local)..."
cat > .env.production.local << 'FRONTEND_ENV'
# FRONTEND - Variables de entorno para PRODUCCIÓN
NEXT_PUBLIC_BASE_URL=https://industrial-iot.us
NEXT_PUBLIC_API_URL=https://industrial-iot.us/api
NEXT_PUBLIC_IMAGE_QUALITY=85
NEXT_PUBLIC_CACHE_DURATION=3600
NEXT_PUBLIC_ENV=production
FRONTEND_ENV

log_success "Variables de entorno configuradas sin conflictos"

log_info "PASO 5: Instalando dependencias (AMBOS LUGARES)"

# Frontend (raíz)
log_info "Instalando dependencias del frontend (raíz)..."
npm install

# Backend (server/)
log_info "Instalando dependencias del backend (server/)..."
cd server
npm install
cd ..

log_success "Dependencias instaladas en frontend y backend"

log_info "PASO 6: Compilando aplicación"
export NODE_ENV=production
npm run build

log_info "PASO 7: Configurando PM2"
mkdir -p logs

cat > ecosystem.config.js << 'PM2_CONFIG'
module.exports = {
  apps: [
    {
      name: 'industrial-website-server',
      script: './server/server.js',
      cwd: '/root/industrial',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      restart_delay: 1000,
      max_restarts: 10,
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'industrial-project',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/root/industrial',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      restart_delay: 1000,
      max_restarts: 10,
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
}
PM2_CONFIG

log_info "PASO 8: Configurando Nginx"
cat > /etc/nginx/sites-available/industrial-iot << 'NGINX_CONFIG'
server {
    listen 80;
    server_name industrial-iot.us www.industrial-iot.us;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name industrial-iot.us www.industrial-iot.us;

    # Headers de seguridad
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

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
    }

    # Frontend Next.js (puerto 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_CONFIG

ln -sf /etc/nginx/sites-available/industrial-iot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

log_info "PASO 9: Configurando firewall y SSL"
ufw --force reset
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

systemctl start nginx
systemctl enable nginx
nginx -t

certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email "$USER_EMAIL"

log_info "PASO 10: Iniciando aplicaciones"
pm2 startup systemd -u root --hp /root
pm2 start ecosystem.config.js
pm2 save

sleep 15

log_info "VERIFICACIONES FINALES"
echo ""
echo "📊 Estado de PM2:"
pm2 status

echo ""
echo "🧪 Tests de conectividad:"

if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1; then
    log_success "✅ Backend funcionando"
else
    log_warning "⚠️  Backend no responde"
fi

if curl -f -s http://localhost:3000/ >/dev/null 2>&1; then
    log_success "✅ Frontend funcionando"
else
    log_warning "⚠️  Frontend no responde"
fi

if curl -f -s https://$DOMAIN/ >/dev/null 2>&1; then
    log_success "✅ Sitio web funcionando"
else
    log_warning "⚠️  Verificar DNS"
fi

echo ""
echo "🎉 ¡DESPLIEGUE COMPLETADO!"
echo "========================"
echo ""
echo "🌐 Sitio: https://$DOMAIN"
echo "🔧 API: https://$DOMAIN/api/"
echo ""
echo "📋 Estructura de archivos .env:"
echo "   Frontend: /root/industrial/.env.local"
echo "   Backend: /root/industrial/server/.env"
echo ""
echo "📦 Dependencias instaladas en:"
echo "   Frontend: /root/industrial/node_modules"
echo "   Backend: /root/industrial/server/node_modules"
echo ""
echo "📊 Gestión:"
echo "   Estado: pm2 status"
echo "   Logs: pm2 logs"
echo "   Reiniciar: pm2 restart all"

log_success "Deploy sin conflictos completado! 🚀"