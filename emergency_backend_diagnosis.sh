#!/bin/bash

echo "🚨 DIAGNÓSTICO EMERGENCIA - BACKEND ERRORS"
echo "=========================================="
echo "Fecha: $(date)"
echo ""

# 1. ESTADO ACTUAL DEL BACKEND
echo "📋 PASO 1: ESTADO ACTUAL DEL BACKEND"
echo "===================================="

echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== PM2 Logs Backend (últimas 20 líneas) ==="
pm2 logs backend --lines 20 --nostream

echo ""
echo "=== ¿Backend responde en localhost? ==="
echo "Test directo localhost:3001/api/health:"
curl -s -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" http://localhost:3001/api/health || echo "❌ FALLA CONEXIÓN LOCAL"

echo ""
echo "=== Test productos en localhost ==="
echo "Test localhost:3001/api/products/abrazaderas:"
curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:3001/api/products/abrazaderas | head -5

# 2. ESTADO DEL PROCESO BACKEND
echo ""
echo "📋 PASO 2: ESTADO DEL PROCESO"
echo "============================="

echo "=== Proceso Node.js backend ==="
ps aux | grep "node.*server.js\|node.*backend" | grep -v grep

echo ""
echo "=== Puerto 3001 en uso ==="
netstat -tlnp | grep 3001

echo ""
echo "=== Variables de entorno del proceso ==="
PM2_BACKEND_PID=$(pm2 list | grep backend | awk '{print $10}' | head -1)
if [ ! -z "$PM2_BACKEND_PID" ]; then
    echo "PID del backend: $PM2_BACKEND_PID"
    cat /proc/$PM2_BACKEND_PID/environ | tr '\0' '\n' | grep -E "NODE_ENV|PORT|MONGODB_URI" | head -5
else
    echo "❌ No se pudo obtener PID del backend"
fi

# 3. CONECTIVIDAD MONGODB
echo ""
echo "📋 PASO 3: VERIFICAR MONGODB"
echo "============================"

echo "=== Test conexión MongoDB ==="
cd /var/www/html/server || cd /root/industrial/server
if [ -f "test-mongo-simple.js" ]; then
    echo "Ejecutando test de MongoDB..."
    timeout 10s node test-mongo-simple.js
else
    echo "No se encontró script de test MongoDB"
fi

# 4. LOGS DE ERROR SISTEMA
echo ""
echo "📋 PASO 4: LOGS DE ERROR DEL SISTEMA"
echo "===================================="

echo "=== Errores recientes en syslog ==="
tail -20 /var/log/syslog | grep -E "error|Error|ERROR" | tail -5

echo ""
echo "=== Errores de memoria/espacio ==="
echo "Memoria disponible:"
free -h
echo "Espacio en disco:"
df -h | grep -E "/$|/var"

# 5. RESTART CLEAN DEL BACKEND
echo ""
echo "📋 PASO 5: RESTART LIMPIO DEL BACKEND"
echo "====================================="

echo "Deteniendo backend..."
pm2 stop backend

echo "Esperando 3 segundos..."
sleep 3

echo "Iniciando backend con variables frescas..."
pm2 start backend --update-env

echo "Esperando 5 segundos para estabilización..."
sleep 5

echo "=== Test después del restart ==="
echo "PM2 Status:"
pm2 status | grep backend

echo ""
echo "Test API Health después del restart:"
curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:3001/api/health || echo "❌ SIGUE FALLANDO"

# 6. VERIFICACIÓN NGINX
echo ""
echo "📋 PASO 6: VERIFICACIÓN NGINX"
echo "============================="

echo "=== Test API a través de Nginx ==="
echo "https://industrial-iot.us/api/health:"
curl -s -w "\nHTTP Status: %{http_code}\n" https://industrial-iot.us/api/health | head -3

echo ""
echo "=== Logs Nginx recientes ==="
tail -10 /var/log/nginx/industrial-iot.error.log 2>/dev/null || echo "No se pudieron leer logs Nginx"

# 7. RESUMEN Y RECOMENDACIONES
echo ""
echo "📋 PASO 7: RESUMEN DE ESTADO"
echo "============================"

# Verificar si backend responde
BACKEND_LOCAL=$(curl -s -w "%{http_code}" http://localhost:3001/api/health -o /dev/null 2>/dev/null)
BACKEND_NGINX=$(curl -s -w "%{http_code}" https://industrial-iot.us/api/health -o /dev/null 2>/dev/null)

echo "🔍 ESTADO ACTUAL:"
echo "Backend local (localhost:3001): HTTP $BACKEND_LOCAL"
echo "Backend via Nginx (industrial-iot.us): HTTP $BACKEND_NGINX"

if [ "$BACKEND_LOCAL" = "200" ]; then
    echo "✅ Backend local funciona"
else
    echo "❌ Backend local NO funciona - revisar logs PM2"
fi

if [ "$BACKEND_NGINX" = "200" ]; then
    echo "✅ Backend via Nginx funciona"
else
    echo "❌ Backend via Nginx NO funciona - revisar configuración Nginx"
fi

echo ""
echo "🛠️ COMANDOS DE EMERGENCIA:"
echo "========================="
echo "# Ver logs en tiempo real:"
echo "pm2 logs backend"
echo ""
echo "# Restart completo:"
echo "pm2 restart backend --update-env"
echo ""
echo "# Ver configuración Nginx:"
echo "nginx -t && systemctl reload nginx"