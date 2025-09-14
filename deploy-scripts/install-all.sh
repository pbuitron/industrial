#!/bin/bash
set -e

echo "🚀 INSTALACIÓN COMPLETA - Industrial IoT"
echo "======================================"
echo ""

# Verificar que estamos ejecutando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script debe ejecutarse como root"
    exit 1
fi

# Verificar conexión a internet
echo "🔍 Verificando conexión a internet..."
if ping -c 1 google.com &> /dev/null; then
    echo "✅ Conexión a internet OK"
else
    echo "❌ Sin conexión a internet"
    exit 1
fi

# Verificar que el dominio apunta al servidor
echo "🔍 Verificando DNS..."
DOMAIN_IP=$(dig +short industrial-iot.us)
SERVER_IP=$(curl -s ifconfig.me)
if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
    echo "✅ DNS configurado correctamente"
else
    echo "⚠️ Advertencia: El dominio industrial-iot.us no apunta a este servidor"
    echo "   Dominio apunta a: $DOMAIN_IP"
    echo "   Servidor IP: $SERVER_IP"
    read -p "¿Continuar de todas formas? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📧 IMPORTANTE: Necesitamos tu email para el certificado SSL"
read -p "Ingresa tu email: " USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
    echo "❌ Email requerido para continuar"
    exit 1
fi

# Actualizar el email en el script de nginx
sed -i "s/admin@industrial-iot.us/$USER_EMAIL/g" 03-configure-nginx.sh

echo ""
echo "🏁 Iniciando instalación completa..."
echo "   Esto puede tardar entre 10-15 minutos"
echo ""

# Paso 1: Instalación del sistema
echo "📦 [1/4] Instalando sistema base..."
if ./01-install-system.sh; then
    echo "✅ Sistema base instalado"
else
    echo "❌ Error en la instalación del sistema"
    exit 1
fi

echo ""

# Paso 2: Configuración del proyecto
echo "⚙️ [2/4] Configurando proyecto..."
if ./02-setup-project.sh; then
    echo "✅ Proyecto configurado"
else
    echo "❌ Error en la configuración del proyecto"
    exit 1
fi

echo ""

# Paso 3: Configuración de Nginx y SSL
echo "🔒 [3/4] Configurando Nginx y SSL..."
if ./03-configure-nginx.sh; then
    echo "✅ Nginx y SSL configurados"
else
    echo "❌ Error en la configuración de Nginx y SSL"
    exit 1
fi

echo ""

# Paso 4: Despliegue final
echo "🚀 [4/4] Desplegando aplicación..."
if ./04-deploy.sh; then
    echo "✅ Aplicación desplegada"
else
    echo "❌ Error en el despliegue"
    exit 1
fi

echo ""
echo "🎉 ¡INSTALACIÓN COMPLETADA!"
echo "=========================="
echo ""
echo "✅ Tu aplicación está disponible en:"
echo "   🌐 https://industrial-iot.us"
echo "   🔧 API: https://industrial-iot.us/api/"
echo ""
echo "📋 Comandos útiles:"
echo "   📊 Estado: ./maintenance.sh status"
echo "   📝 Logs: ./maintenance.sh logs"
echo "   🔄 Actualizar: ./maintenance.sh update"
echo "   📈 Monitor: ./maintenance.sh monitor"
echo ""
echo "🎯 Próximos pasos:"
echo "   1. Visita tu sitio web para verificar que funciona"
echo "   2. Configura los datos de tu empresa en el admin"
echo "   3. Añade productos y servicios"
echo ""
echo "🆘 Si hay problemas:"
echo "   - Revisa los logs: pm2 logs industrial-iot-backend"
echo "   - Estado de servicios: systemctl status mongod nginx"
echo ""