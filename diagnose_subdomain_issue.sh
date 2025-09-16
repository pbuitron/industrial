#!/bin/bash

echo "🔍 DIAGNÓSTICO: WWW vs NO-WWW SUBDOMAIN ISSUE"
echo "============================================="
echo "Fecha: $(date)"
echo ""
echo "PROBLEMA: industrial-iot.us ✅ | www.industrial-iot.us ❌"
echo ""

# 1. TEST BÁSICO DE AMBOS DOMINIOS
echo "📋 PASO 1: TEST BÁSICO DE AMBOS DOMINIOS"
echo "========================================"

echo "=== Test Homepage (200 OK esperado) ==="
echo "industrial-iot.us:"
curl -s -w "HTTP %{http_code} | Time: %{time_total}s\n" -o /dev/null https://industrial-iot.us/ || echo "❌ FALLA"

echo "www.industrial-iot.us:"
curl -s -w "HTTP %{http_code} | Time: %{time_total}s\n" -o /dev/null https://www.industrial-iot.us/ || echo "❌ FALLA"

echo ""
echo "=== Test API Health (200 OK esperado) ==="
echo "industrial-iot.us/api/health:"
curl -s -w "HTTP %{http_code} | Time: %{time_total}s\n" -o /dev/null https://industrial-iot.us/api/health || echo "❌ FALLA"

echo "www.industrial-iot.us/api/health:"
curl -s -w "HTTP %{http_code} | Time: %{time_total}s\n" -o /dev/null https://www.industrial-iot.us/api/health || echo "❌ FALLA"

echo ""
echo "=== Test API Productos (200 OK esperado) ==="
echo "industrial-iot.us/api/products/abrazaderas:"
curl -s -w "HTTP %{http_code} | Time: %{time_total}s\n" -o /dev/null https://industrial-iot.us/api/products/abrazaderas || echo "❌ FALLA"

echo "www.industrial-iot.us/api/products/abrazaderas:"
curl -s -w "HTTP %{http_code} | Time: %{time_total}s\n" -o /dev/null https://www.industrial-iot.us/api/products/abrazaderas || echo "❌ FALLA"

# 2. ANÁLISIS DETALLADO DE HEADERS Y REDIRECTS
echo ""
echo "📋 PASO 2: ANÁLISIS DE HEADERS Y REDIRECTS"
echo "=========================================="

echo "=== Headers completos industrial-iot.us ==="
curl -I https://industrial-iot.us/api/health 2>/dev/null | head -10

echo ""
echo "=== Headers completos www.industrial-iot.us ==="
curl -I https://www.industrial-iot.us/api/health 2>/dev/null | head -10

# 3. VERIFICAR CONFIGURACIÓN NGINX
echo ""
echo "📋 PASO 3: CONFIGURACIÓN NGINX"
echo "=============================="

echo "=== Server names configurados ==="
grep -n "server_name" /etc/nginx/sites-enabled/* 2>/dev/null || echo "No se pudo leer configuración Nginx"

echo ""
echo "=== Configuración SSL ==="
grep -A 5 -B 5 "ssl_certificate" /etc/nginx/sites-enabled/industrial-iot 2>/dev/null || echo "No se encontró configuración SSL"

# 4. TEST DETALLADO DE CORS
echo ""
echo "📋 PASO 4: TEST CORS DESDE AMBOS DOMINIOS"
echo "========================================="

echo "=== CORS desde industrial-iot.us ==="
curl -H "Origin: https://industrial-iot.us" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://industrial-iot.us/api/health -v 2>&1 | grep -i "access-control\|origin"

echo ""
echo "=== CORS desde www.industrial-iot.us ==="
curl -H "Origin: https://www.industrial-iot.us" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://www.industrial-iot.us/api/health -v 2>&1 | grep -i "access-control\|origin"

# 5. VERIFICAR VARIABLES DE ENTORNO CORS
echo ""
echo "📋 PASO 5: VARIABLES DE ENTORNO"
echo "==============================="

echo "=== Variables CORS del backend ==="
cd /var/www/html/server 2>/dev/null || cd /root/industrial/server
if [ -f ".env.production" ]; then
    echo "FRONTEND_URL configurado:"
    grep "FRONTEND_URL" .env.production || echo "❌ FRONTEND_URL no encontrado"
    echo "CORS_ORIGIN configurado:"
    grep "CORS_ORIGIN" .env.production || echo "❌ CORS_ORIGIN no encontrado"
else
    echo "❌ No se encontró .env.production"
fi

# 6. TEST JAVASCRIPT DESDE BROWSER SIMULATION
echo ""
echo "📋 PASO 6: SIMULACIÓN BROWSER JAVASCRIPT"
echo "======================================="

echo "=== Test fetch() desde industrial-iot.us ==="
curl -H "Referer: https://industrial-iot.us/" \
     -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
     -H "Accept: application/json" \
     https://industrial-iot.us/api/products/abrazaderas 2>/dev/null | head -5

echo ""
echo "=== Test fetch() desde www.industrial-iot.us ==="
curl -H "Referer: https://www.industrial-iot.us/" \
     -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
     -H "Accept: application/json" \
     https://www.industrial-iot.us/api/products/abrazaderas 2>/dev/null | head -5

# 7. LOGS EN TIEMPO REAL
echo ""
echo "📋 PASO 7: LOGS EN TIEMPO REAL"
echo "=============================="

echo "Haciendo requests simultáneos y monitoreando logs..."

# Función para hacer requests en background
make_requests() {
    sleep 2
    echo "Haciendo request a industrial-iot.us..."
    curl -s https://industrial-iot.us/api/products/abrazaderas > /dev/null
    echo "Haciendo request a www.industrial-iot.us..."
    curl -s https://www.industrial-iot.us/api/products/abrazaderas > /dev/null
}

# Ejecutar requests en background
make_requests &

# Capturar logs por 5 segundos
echo "Monitoreando logs Nginx..."
timeout 5s tail -f /var/log/nginx/industrial-iot.access.log 2>/dev/null | grep -E "(industrial-iot|www\.industrial)" || echo "No se pudieron leer logs"

# 8. RESOLUCIÓN DNS
echo ""
echo "📋 PASO 8: RESOLUCIÓN DNS"
echo "========================="

echo "=== DNS Resolution ==="
echo "industrial-iot.us:"
nslookup industrial-iot.us 2>/dev/null | grep "Address:" | tail -2 || echo "No se pudo resolver DNS"

echo "www.industrial-iot.us:"
nslookup www.industrial-iot.us 2>/dev/null | grep "Address:" | tail -2 || echo "No se pudo resolver DNS"

# 9. RESUMEN Y DIAGNÓSTICO
echo ""
echo "📋 PASO 9: RESUMEN Y POSIBLES CAUSAS"
echo "===================================="

echo "🔍 POSIBLES CAUSAS DEL PROBLEMA:"
echo ""
echo "1. 🌐 NGINX SERVER_NAME:"
echo "   - Verificar que server_name incluya AMBOS: 'industrial-iot.us www.industrial-iot.us'"
echo ""
echo "2. 🔒 CORS CONFIGURATION:"
echo "   - Backend debe permitir AMBOS orígenes en CORS_ORIGIN"
echo "   - Verificar variables FRONTEND_URL y CORS_ORIGIN"
echo ""
echo "3. 📱 FRONTEND CONFIGURATION:"
echo "   - NEXT_PUBLIC_API_URL debe funcionar desde ambos dominios"
echo "   - Verificar si hay hard-coding de URLs"
echo ""
echo "4. 🔐 SSL CERTIFICATE:"
echo "   - Certificado debe cubrir AMBOS dominios (SAN certificate)"
echo ""
echo "5. 🔄 NGINX REDIRECTS:"
echo "   - Verificar si hay redirects que interfieren"
echo ""

echo "✅ COMANDOS DE VERIFICACIÓN RÁPIDA:"
echo "=================================="
echo "# Ver configuración Nginx:"
echo "sudo nginx -T | grep -A 10 -B 10 'server_name'"
echo ""
echo "# Ver variables CORS:"
echo "cat /var/www/html/server/.env.production | grep -E 'FRONTEND_URL|CORS_ORIGIN'"
echo ""
echo "# Test manual APIs:"
echo "curl -v https://industrial-iot.us/api/health"
echo "curl -v https://www.industrial-iot.us/api/health"
echo ""

echo "🔧 POSIBLES SOLUCIONES:"
echo "======================"
echo "1. Actualizar CORS_ORIGIN para incluir www"
echo "2. Verificar/actualizar certificado SSL"
echo "3. Revisar configuración de Nginx server_name"
echo "4. Verificar variables de entorno del frontend"