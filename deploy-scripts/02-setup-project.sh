#!/bin/bash
set -e

USER_HOME="/root"
PROJECT_DIR="$USER_HOME/industrial"
DOMAIN="industrial-iot.us"

echo "=== CONFIGURACIÓN DEL PROYECTO ==="

# Clonar repositorio
echo "Clonando repositorio..."
cd "$USER_HOME"
if [ -d "industrial" ]; then
    echo "Directorio ya existe, actualizando..."
    cd industrial
    git pull
else
    git clone https://github.com/pbuitron/industrial.git
    cd industrial
fi

echo "Instalando dependencias del frontend..."
npm install

echo "Instalando dependencias del backend..."
cd server
npm install
cd ..

echo "Configurando variables de entorno..."
# Crear .env para el backend
cat > server/.env << EOF
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/industrial-iot
JWT_SECRET=9k2m8n4p6r7t1w3x5z8a2c4e6g9j1m3p5r8u0w2y4a7d9f2h5k7n0q3s6v8x1z4
CORS_ORIGIN=https://$DOMAIN
EOF

# Crear .env.local para el frontend
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
EOF

echo "Creando configuración PM2..."
# Crear archivo de configuración PM2
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
    max_restarts: 3,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
}
EOF

# Crear directorio de logs
mkdir -p logs

echo "✅ Configuración del proyecto completada!"