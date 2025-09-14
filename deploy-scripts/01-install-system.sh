#!/bin/bash
set -e

echo "=== INSTALACIÓN DEL SISTEMA ==="
echo "Actualizando sistema..."

# Actualizar sistema
apt update && apt upgrade -y

echo "Instalando dependencias básicas..."
# Instalar dependencias básicas
apt install -y curl wget software-properties-common git ufw

echo "Instalando Node.js 18..."
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

echo "Instalando MongoDB..."
# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org

echo "Instalando Nginx..."
# Instalar Nginx y Certbot
apt install -y nginx certbot python3-certbot-nginx

echo "Instalando PM2..."
# Instalar PM2 globalmente
npm install -g pm2

echo "Configurando firewall..."
# Configurar firewall
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

echo "Iniciando servicios..."
# Iniciar servicios
systemctl start mongod
systemctl enable mongod
systemctl start nginx
systemctl enable nginx

echo "Verificando instalación..."
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "MongoDB status:"
systemctl status mongod --no-pager -l
echo "Nginx status:"
systemctl status nginx --no-pager -l

echo "✅ Instalación del sistema completada!"