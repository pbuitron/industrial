#!/bin/bash

echo "🔧 FIX: SUBDOMAIN API ISSUE (www vs no-www)"
echo "==========================================="
echo "Fecha: $(date)"
echo ""

echo "PROBLEMA IDENTIFICADO:"
echo "====================="
echo "❌ Frontend hardcoded: NEXT_PUBLIC_API_URL=https://industrial-iot.us/api"
echo "❌ Cuando visitas www.industrial-iot.us → intenta llamar industrial-iot.us/api"
echo "❌ Esto puede causar problemas CORS entre subdominios"
echo ""

echo "SOLUCIONES A APLICAR:"
echo "===================="
echo "1. ✅ Configuración API dinámica basada en window.location"
echo "2. ✅ Actualizar CORS del backend para incluir ambos dominios"
echo "3. ✅ Verificar Nginx server_name"
echo ""

# 1. ACTUALIZAR CONFIGURACIÓN DEL FRONTEND
echo "📋 PASO 1: ACTUALIZAR FRONTEND PARA API DINÁMICA"
echo "==============================================="

echo "Creando configuración dinámica de API..."

# Crear archivo de configuración dinámica
cat > /var/www/html/lib/api-config.js << 'EOF'
/**
 * Configuración dinámica de API basada en el dominio actual
 * Esto soluciona el problema de www vs no-www
 */

export function getApiUrl() {
  // En el servidor (SSR), usar la URL de producción por defecto
  if (typeof window === 'undefined') {
    return 'https://industrial-iot.us/api'
  }

  // En el cliente, usar el dominio actual
  const currentHost = window.location.hostname
  const protocol = window.location.protocol

  // Mapear dominios a APIs correspondientes
  const apiMapping = {
    'industrial-iot.us': 'https://industrial-iot.us/api',
    'www.industrial-iot.us': 'https://www.industrial-iot.us/api',
    'localhost': 'http://localhost:3001/api'
  }

  return apiMapping[currentHost] || `${protocol}//${currentHost}/api`
}

export function getBaseUrl() {
  if (typeof window === 'undefined') {
    return 'https://industrial-iot.us'
  }

  return `${window.location.protocol}//${window.location.hostname}`
}
EOF

echo "✅ Configuración dinámica creada en lib/api-config.js"

# 2. ACTUALIZAR VARIABLES DE ENTORNO BACKEND
echo ""
echo "📋 PASO 2: ACTUALIZAR CORS DEL BACKEND"
echo "====================================="

cd /var/www/html/server || cd /root/industrial/server

if [ -f ".env.production" ]; then
    echo "Actualizando variables CORS..."

    # Backup del archivo actual
    cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)

    # Actualizar FRONTEND_URL y CORS_ORIGIN para incluir www
    sed -i 's/FRONTEND_URL=https:\/\/industrial-iot\.us,https:\/\/www\.industrial-iot\.us/FRONTEND_URL=https:\/\/industrial-iot.us,https:\/\/www.industrial-iot.us/g' .env.production
    sed -i 's/CORS_ORIGIN=https:\/\/industrial-iot\.us,https:\/\/www\.industrial-iot\.us/CORS_ORIGIN=https:\/\/industrial-iot.us,https:\/\/www.industrial-iot.us/g' .env.production

    # Si no existen las variables, agregarlas
    if ! grep -q "CORS_ORIGIN" .env.production; then
        echo "" >> .env.production
        echo "# CORS Configuration - Updated for subdomain fix" >> .env.production
        echo "CORS_ORIGIN=https://industrial-iot.us,https://www.industrial-iot.us" >> .env.production
    fi

    echo "✅ Variables CORS actualizadas"
    echo "FRONTEND_URL y CORS_ORIGIN ahora incluyen ambos dominios"
else
    echo "❌ No se encontró .env.production del backend"
fi

# 3. VERIFICAR NGINX CONFIGURATION
echo ""
echo "📋 PASO 3: VERIFICAR NGINX CONFIGURATION"
echo "======================================="

echo "=== Server names actuales ==="
grep -n "server_name" /etc/nginx/sites-enabled/industrial-iot 2>/dev/null || echo "No se pudo leer Nginx config"

echo ""
echo "=== CORS headers actuales ==="
grep -A 5 "Access-Control-Allow-Origin" /etc/nginx/sites-enabled/industrial-iot 2>/dev/null || echo "No se encontraron headers CORS en Nginx"

# 4. REINICIAR SERVICIOS
echo ""
echo "📋 PASO 4: REINICIAR SERVICIOS"
echo "============================="

echo "Reiniciando backend para cargar nuevas variables..."
pm2 restart backend --update-env
echo "✅ Backend reiniciado"

echo "Recargando Nginx..."
nginx -t && systemctl reload nginx
echo "✅ Nginx recargado"

# 5. VERIFICACIÓN POST-FIX
echo ""
echo "📋 PASO 5: VERIFICACIÓN POST-FIX"
echo "==============================="

echo "Esperando 3 segundos para que los servicios se estabilicen..."
sleep 3

echo "=== Test API desde industrial-iot.us ==="
API_RESPONSE_1=$(curl -s -w "%{http_code}" https://industrial-iot.us/api/health -o /dev/null)
echo "industrial-iot.us/api/health: HTTP $API_RESPONSE_1"

echo "=== Test API desde www.industrial-iot.us ==="
API_RESPONSE_2=$(curl -s -w "%{http_code}" https://www.industrial-iot.us/api/health -o /dev/null)
echo "www.industrial-iot.us/api/health: HTTP $API_RESPONSE_2"

echo "=== Test productos desde ambos dominios ==="
PRODUCTS_1=$(curl -s -w "%{http_code}" https://industrial-iot.us/api/products/abrazaderas -o /dev/null)
echo "industrial-iot.us/api/products/abrazaderas: HTTP $PRODUCTS_1"

PRODUCTS_2=$(curl -s -w "%{http_code}" https://www.industrial-iot.us/api/products/abrazaderas -o /dev/null)
echo "www.industrial-iot.us/api/products/abrazaderas: HTTP $PRODUCTS_2"

# 6. RESUMEN
echo ""
echo "🎉 RESUMEN DEL FIX"
echo "=================="

if [ "$API_RESPONSE_1" = "200" ] && [ "$API_RESPONSE_2" = "200" ]; then
    echo "✅ ✅ ÉXITO: Ambos dominios funcionan correctamente"
    echo "✅ industrial-iot.us: OK"
    echo "✅ www.industrial-iot.us: OK"
else
    echo "⚠️ Posibles problemas aún presentes:"
    if [ "$API_RESPONSE_1" != "200" ]; then
        echo "❌ industrial-iot.us: HTTP $API_RESPONSE_1"
    fi
    if [ "$API_RESPONSE_2" != "200" ]; then
        echo "❌ www.industrial-iot.us: HTTP $API_RESPONSE_2"
    fi
fi

echo ""
echo "📋 SIGUIENTE PASO:"
echo "=================="
echo "1. Actualizar el código del frontend para usar getApiUrl()"
echo "2. Hacer pull de estos cambios en el repositorio"
echo "3. Desplegar la nueva versión del frontend"
echo ""
echo "📁 Archivos creados/modificados:"
echo "- lib/api-config.js (nueva configuración dinámica)"
echo "- server/.env.production (CORS actualizado)"