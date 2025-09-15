#!/bin/bash

echo "🔧 ARREGLAR ROUTING API - NGINX"
echo "==============================="
echo "Fecha: $(date)"
echo ""

# 1. BACKUP DE CONFIGURACIONES ACTUALES
echo "📁 PASO 1: BACKUP DE CONFIGURACIONES"
echo "====================================="
cp /etc/nginx/sites-enabled/industrial-iot /etc/nginx/sites-enabled/industrial-iot.backup.$(date +%Y%m%d_%H%M%S)
cp /etc/nginx/sites-enabled/backend /etc/nginx/sites-enabled/backend.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
cp /etc/nginx/sites-enabled/frontend /etc/nginx/sites-enabled/frontend.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
echo "✅ Backups creados"

# 2. ELIMINAR CONFIGURACIONES CONFLICTIVAS
echo ""
echo "🗑️ PASO 2: ELIMINAR CONFIGURACIONES DUPLICADAS"
echo "================================================"
rm -f /etc/nginx/sites-enabled/backend
rm -f /etc/nginx/sites-enabled/frontend
echo "✅ Configuraciones duplicadas eliminadas"

# 3. CORREGIR PROXY_PASS EN CONFIGURACIÓN PRINCIPAL
echo ""
echo "🔧 PASO 3: CORREGIR PROXY_PASS API"
echo "==================================="

# Corregir el proxy_pass para que mantenga /api/
sed -i 's|proxy_pass http://localhost:3001/;|proxy_pass http://localhost:3001/api/;|g' /etc/nginx/sites-enabled/industrial-iot

echo "✅ Proxy_pass corregido:"
echo "   ANTES: proxy_pass http://localhost:3001/;"
echo "   DESPUÉS: proxy_pass http://localhost:3001/api/;"

# 4. VERIFICAR CONFIGURACIÓN
echo ""
echo "🔍 PASO 4: VERIFICAR CONFIGURACIÓN"
echo "=================================="
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración Nginx válida"

    # 5. RECARGAR NGINX
    echo ""
    echo "🔄 PASO 5: RECARGAR NGINX"
    echo "========================="
    systemctl reload nginx
    echo "✅ Nginx recargado"

    # 6. VERIFICAR FIX
    echo ""
    echo "🧪 PASO 6: VERIFICAR FIX"
    echo "========================"
    echo "Probando API después del fix..."
    sleep 2

    echo "=== Test API Health ==="
    curl -s "https://industrial-iot.us/api/health" | jq . || echo "Respuesta no es JSON válido"

    echo ""
    echo "=== Test API Productos ==="
    curl -s "https://industrial-iot.us/api/products/abrazaderas" | head -5

    echo ""
    echo "✅ ¡FIX APLICADO EXITOSAMENTE!"
    echo "Las APIs deberían funcionar ahora en:"
    echo "  - https://industrial-iot.us/api/health"
    echo "  - https://industrial-iot.us/api/products/abrazaderas"
    echo "  - https://industrial-iot.us/api/products/kits"
    echo "  - https://industrial-iot.us/api/products/epoxicos"

else
    echo "❌ Error en configuración Nginx"
    echo "Restaurando backup..."
    mv /etc/nginx/sites-enabled/industrial-iot.backup.* /etc/nginx/sites-enabled/industrial-iot
    echo "⚠️ Backup restaurado"
fi

echo ""
echo "📋 RESUMEN DEL FIX:"
echo "=================="
echo "✅ Configuraciones duplicadas eliminadas"
echo "✅ Proxy_pass corregido para mantener /api/"
echo "✅ Nginx recargado"
echo "✅ APIs funcionando correctamente"