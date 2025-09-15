#!/bin/bash

echo "🔧 DIAGNÓSTICO AVANZADO - API 404 EN VPS"
echo "========================================"
echo "Fecha: $(date)"
echo ""

# Función para crear separadores
separator() {
    echo "----------------------------------------"
}

# 1. VERIFICAR BACKEND EN PUERTO 3001
echo "🔍 PASO 1: VERIFICAR BACKEND EN PUERTO 3001"
separator
echo "=== ¿Qué está corriendo en puerto 3001? ==="
netstat -tlnp | grep 3001
echo ""

echo "=== Test directo localhost:3001 ==="
echo "Probando /api/health en localhost:3001..."
curl -v http://localhost:3001/api/health
echo ""

echo "=== Test directo sin /api/ ==="
echo "Probando /health en localhost:3001..."
curl -v http://localhost:3001/health
echo ""

echo "=== Test root backend ==="
echo "Probando root en localhost:3001..."
curl -v http://localhost:3001/
echo ""

# 2. PM2 LOGS Y CONFIGURACIÓN
echo ""
echo "🔍 PASO 2: PM2 LOGS Y CONFIGURACIÓN"
separator
echo "=== PM2 Status ==="
pm2 status
echo ""

echo "=== PM2 Logs Backend (últimas 20 líneas) ==="
pm2 logs backend --lines 20 --nostream
echo ""

echo "=== PM2 Environment Variables ==="
pm2 show backend | grep -A 10 "env:"
echo ""

# 3. VERIFICAR SERVIDOR BACKEND
echo ""
echo "🔍 PASO 3: VERIFICAR CONFIGURACIÓN DEL SERVIDOR"
separator
echo "=== Archivo server.js o app.js ==="
if [ -f "/var/www/html/server/server.js" ]; then
    echo "Encontrado server.js, mostrando puerto y rutas:"
    grep -n "listen\|PORT\|app.use.*api" /var/www/html/server/server.js | head -10
elif [ -f "/var/www/html/server/app.js" ]; then
    echo "Encontrado app.js, mostrando puerto y rutas:"
    grep -n "listen\|PORT\|app.use.*api" /var/www/html/server/app.js | head -10
else
    echo "No se encontró server.js ni app.js en /var/www/html/server/"
    echo "Buscando archivos principales en server/:"
    ls -la /var/www/html/server/
fi
echo ""

# 4. NGINX CONFIGURACIÓN DETALLADA
echo ""
echo "🔍 PASO 4: NGINX CONFIGURACIÓN DETALLADA"
separator
echo "=== Test sintaxis Nginx ==="
nginx -t
echo ""

echo "=== Configuración completa location /api/ ==="
grep -A 20 "location /api/" /etc/nginx/sites-available/default
echo ""

echo "=== Verificar si hay múltiples configuraciones ==="
find /etc/nginx/sites-enabled/ -name "*" -exec echo "=== {} ===" \; -exec cat {} \;
echo ""

# 5. TEST PASO A PASO NGINX
echo ""
echo "🔍 PASO 5: TEST PASO A PASO NGINX"
separator
echo "=== Test Nginx sin SSL (puerto 80) ==="
curl -v http://localhost/api/health
echo ""

echo "=== Test directo al proxy_pass ==="
curl -v http://localhost:3001/health
echo ""

# 6. PROCESOS Y PUERTOS
echo ""
echo "🔍 PASO 6: PROCESOS Y PUERTOS"
separator
echo "=== Todos los puertos Node.js ==="
netstat -tlnp | grep node
echo ""

echo "=== Procesos Node.js ==="
ps aux | grep node | grep -v grep
echo ""

# 7. LOGS EN TIEMPO REAL
echo ""
echo "🔍 PASO 7: LOGS EN TIEMPO REAL"
separator
echo "=== Monitoreando logs Nginx mientras hacemos request ==="
echo "Iniciando monitoreo..."

# Función para hacer requests en background
make_test_requests() {
    sleep 2
    echo "Haciendo request de prueba..."
    curl -s http://localhost/api/health > /dev/null 2>&1
    curl -s http://localhost/api/products/abrazaderas > /dev/null 2>&1
    curl -s http://localhost:3001/api/health > /dev/null 2>&1
}

# Ejecutar requests en background
make_test_requests &

# Capturar logs por 5 segundos
timeout 5s tail -f /var/log/nginx/access.log /var/log/nginx/error.log 2>/dev/null || echo "No se pudieron leer logs de Nginx"

echo ""
echo "=== PM2 logs en tiempo real (últimas líneas) ==="
pm2 logs backend --lines 5 --nostream

# 8. VERIFICAR VARIABLES DE ENTORNO
echo ""
echo "🔍 PASO 8: VARIABLES DE ENTORNO"
separator
echo "=== Variables cargadas en el proceso Node.js ==="
# Crear un pequeño script para verificar las variables
cat > /tmp/check_env.js << 'EOF'
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI existe:', !!process.env.MONGODB_URI);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
EOF

echo "Ejecutando verificación de variables..."
cd /var/www/html/server && node /tmp/check_env.js
rm /tmp/check_env.js

# 9. ESTRUCTURA DE RUTAS
echo ""
echo "🔍 PASO 9: ESTRUCTURA DE RUTAS DEL BACKEND"
separator
echo "=== Archivos de rutas ==="
find /var/www/html/server -name "*route*" -o -name "*api*" 2>/dev/null
echo ""

echo "=== Contenido de rutas principales ==="
if [ -f "/var/www/html/server/routes/products.js" ]; then
    echo "--- routes/products.js ---"
    head -20 /var/www/html/server/routes/products.js
elif [ -f "/var/www/html/server/routes/api.js" ]; then
    echo "--- routes/api.js ---"
    head -20 /var/www/html/server/routes/api.js
else
    echo "Buscando archivos con 'router' o 'app.get'..."
    grep -r "router\|app\.get\|app\.use" /var/www/html/server --include="*.js" | head -10
fi

# 10. RESUMEN Y DIAGNÓSTICO
echo ""
echo "🔍 PASO 10: RESUMEN Y PRÓXIMOS PASOS"
separator
echo "=== Resumen de hallazgos ==="
echo "1. Puerto 3001 en uso: $(netstat -tlnp | grep 3001 | wc -l) procesos"
echo "2. Procesos Node.js: $(ps aux | grep node | grep -v grep | wc -l)"
echo "3. Estado PM2 backend: $(pm2 status | grep backend | awk '{print $10}')"
echo "4. Configuración Nginx: $(nginx -t 2>&1 | grep successful | wc -l) successful"
echo ""

echo "✅ Diagnóstico completo finalizado!"
echo "📁 Archivo generado: diagnose_api_404.sh"
echo ""
echo "🔧 PRÓXIMOS PASOS SUGERIDOS:"
echo "1. Revisar si el backend está corriendo en el puerto correcto"
echo "2. Verificar las rutas del backend (/api/ vs sin /api/)"
echo "3. Comprobar la configuración proxy_pass de Nginx"
echo "4. Revisar los logs de PM2 para errores"