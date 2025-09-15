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

echo "🚀 DEPLOY AUTOMÁTICO - Industrial IoT"
echo "===================================="

# Información del servidor
VPS_IP="162.254.37.42"
VPS_USER="root"
VPS_PATH="/root/industrial"
REPO_URL="https://github.com/pbuitron/industrial.git"

log_info "PASO 1: Verificando conexión al VPS..."
if ! ping -c 1 $VPS_IP > /dev/null 2>&1; then
    log_error "No se puede conectar al VPS $VPS_IP"
    exit 1
fi
log_success "Conexión al VPS verificada"

log_info "PASO 2: Conectando al VPS y actualizando código..."

# Script que se ejecutará en el VPS
ssh $VPS_USER@$VPS_IP << 'REMOTE_SCRIPT'
set -e

# Colores para el servidor
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[VPS] $1${NC}"; }
log_success() { echo -e "${GREEN}[VPS] ✅ $1${NC}"; }

cd /root

log_info "Actualizando código desde GitHub..."
if [ -d "industrial" ]; then
    cd industrial
    git fetch origin
    git reset --hard origin/main
    git pull origin main
    log_success "Código actualizado"
else
    log_info "Clonando repositorio por primera vez..."
    git clone https://github.com/pbuitron/industrial.git
    cd industrial
    log_success "Repositorio clonado"
fi

log_info "Configurando variables de entorno para producción..."
# Verificar que existen los archivos de producción
if [ ! -f "server/.env.production" ]; then
    echo "❌ Error: server/.env.production no existe"
    exit 1
fi

if [ ! -f ".env.production.local" ]; then
    echo "❌ Error: .env.production.local no existe"
    exit 1
fi

# Usar archivos de producción
cp server/.env.production server/.env
cp .env.production.local .env.local

# Verificar que se copiaron correctamente
echo "✅ Archivos de ambiente copiados:"
echo "Backend env:"
head -5 server/.env
echo "Frontend env:"
head -3 .env.local

log_info "Instalando dependencias..."
# Frontend
npm install
# Backend
cd server && npm install && cd ..

log_info "Construyendo aplicación..."
NODE_ENV=production npm run build

log_info "Reiniciando servicios..."
pm2 restart all

log_success "¡Deploy completado en el VPS!"

# Verificar estado
echo
echo "📊 Estado de PM2:"
pm2 status

# Tests básicos
echo
echo "🧪 Verificando servicios:"
if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ Backend funcionando"
else
    echo "⚠️  Backend no responde"
fi

if curl -f -s http://localhost:3000/ >/dev/null 2>&1; then
    echo "✅ Frontend funcionando"
else
    echo "⚠️  Frontend no responde"
fi

REMOTE_SCRIPT

if [ $? -eq 0 ]; then
    log_success "🎉 Deploy automático completado exitosamente!"
    echo
    echo "🌐 Sitio web: https://industrial-iot.us"
    echo "🔧 API: https://industrial-iot.us/api/"
    echo
    echo "📊 Para ver logs: ssh $VPS_USER@$VPS_IP 'pm2 logs'"
else
    log_error "Error durante el deploy automático"
    exit 1
fi