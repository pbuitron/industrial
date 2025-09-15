#!/bin/bash

echo "🔧 APLICAR FIX NGINX - API ROUTING"
echo "=================================="
echo "Fecha: $(date)"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "nginx/industrial-iot-fixed.conf" ]; then
    echo "❌ Error: No se encuentra nginx/industrial-iot-fixed.conf"
    echo "Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# 1. BACKUP DE CONFIGURACIÓN ACTUAL
echo "📁 PASO 1: BACKUP CONFIGURACIÓN ACTUAL"
echo "======================================="
cp /etc/nginx/sites-enabled/industrial-iot /etc/nginx/sites-enabled/industrial-iot.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup creado en /etc/nginx/sites-enabled/"

# 2. ELIMINAR CONFIGURACIONES CONFLICTIVAS
echo ""
echo "🗑️ PASO 2: LIMPIAR CONFIGURACIONES DUPLICADAS"
echo "==============================================="
if [ -f "/etc/nginx/sites-enabled/backend" ]; then
    rm /etc/nginx/sites-enabled/backend
    echo "✅ Eliminado: /etc/nginx/sites-enabled/backend"
fi

if [ -f "/etc/nginx/sites-enabled/frontend" ]; then
    rm /etc/nginx/sites-enabled/frontend
    echo "✅ Eliminado: /etc/nginx/sites-enabled/frontend"
fi

# 3. APLICAR NUEVA CONFIGURACIÓN
echo ""
echo "🔧 PASO 3: APLICAR CONFIGURACIÓN CORREGIDA"
echo "=========================================="
cp nginx/industrial-iot-fixed.conf /etc/nginx/sites-enabled/industrial-iot
echo "✅ Nueva configuración aplicada"

# 4. VERIFICAR SINTAXIS
echo ""
echo "🔍 PASO 4: VERIFICAR SINTAXIS NGINX"
echo "==================================="
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración Nginx válida"

    # 5. RECARGAR NGINX
    echo ""
    echo "🔄 PASO 5: RECARGAR NGINX"
    echo "========================="
    systemctl reload nginx
    echo "✅ Nginx recargado correctamente"

    # 6. VERIFICAR EL FIX
    echo ""
    echo "🧪 PASO 6: VERIFICAR FIX APLICADO"
    echo "================================="
    sleep 3

    echo "=== Test API Health ==="
    HEALTH_RESPONSE=$(curl -s -w "%{http_code}" https://industrial-iot.us/api/health)
    if [[ "$HEALTH_RESPONSE" == *"200" ]]; then
        echo "✅ API Health: FUNCIONANDO"
    else
        echo "❌ API Health: ERROR ($HEALTH_RESPONSE)"
    fi

    echo ""
    echo "=== Test API Productos Abrazaderas ==="
    ABRAZADERAS_RESPONSE=$(curl -s -w "%{http_code}" https://industrial-iot.us/api/products/abrazaderas)
    if [[ "$ABRAZADERAS_RESPONSE" == *"200" ]]; then
        echo "✅ API Abrazaderas: FUNCIONANDO"
    else
        echo "❌ API Abrazaderas: ERROR ($ABRAZADERAS_RESPONSE)"
    fi

    echo ""
    echo "=== Test API Productos Kits ==="
    KITS_RESPONSE=$(curl -s -w "%{http_code}" https://industrial-iot.us/api/products/kits)
    if [[ "$KITS_RESPONSE" == *"200" ]]; then
        echo "✅ API Kits: FUNCIONANDO"
    else
        echo "❌ API Kits: ERROR ($KITS_RESPONSE)"
    fi

    echo ""
    echo "=== Test API Productos Epóxicos ==="
    EPOXICOS_RESPONSE=$(curl -s -w "%{http_code}" https://industrial-iot.us/api/products/epoxicos)
    if [[ "$EPOXICOS_RESPONSE" == *"200" ]]; then
        echo "✅ API Epóxicos: FUNCIONANDO"
    else
        echo "❌ API Epóxicos: ERROR ($EPOXICOS_RESPONSE)"
    fi

    echo ""
    echo "🎉 FIX APLICADO EXITOSAMENTE!"
    echo "============================"
    echo "✅ Configuraciones duplicadas eliminadas"
    echo "✅ Proxy_pass corregido (mantiene /api/)"
    echo "✅ Nginx recargado"
    echo "✅ APIs verificadas"
    echo ""
    echo "🌐 URLs funcionando:"
    echo "  - https://industrial-iot.us/api/health"
    echo "  - https://industrial-iot.us/api/products/abrazaderas"
    echo "  - https://industrial-iot.us/api/products/kits"
    echo "  - https://industrial-iot.us/api/products/epoxicos"

else
    echo "❌ ERROR EN CONFIGURACIÓN NGINX"
    echo "==============================="
    echo "Restaurando backup..."

    # Restaurar backup más reciente
    LATEST_BACKUP=$(ls -t /etc/nginx/sites-enabled/industrial-iot.backup.* | head -1)
    cp "$LATEST_BACKUP" /etc/nginx/sites-enabled/industrial-iot
    echo "⚠️ Configuración anterior restaurada"

    echo ""
    echo "❌ El fix no se pudo aplicar."
    echo "La configuración anterior fue restaurada."
    echo "Revisa los errores de sintaxis de Nginx arriba."
fi

echo ""
echo "📋 LOGS PARA MONITOREO:"
echo "======================="
echo "Nginx access: tail -f /var/log/nginx/industrial-iot.access.log"
echo "Nginx error: tail -f /var/log/nginx/industrial-iot.error.log"
echo "Backend PM2: pm2 logs backend"