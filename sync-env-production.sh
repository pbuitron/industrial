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

echo "🔧 SINCRONIZAR CONFIGURACIÓN PRODUCCIÓN - Industrial IoT"
echo "========================================================"

# Verificar directorio
if [ ! -f "server/.env" ]; then
    log_error "No se encontró server/.env - asegúrate de estar en /root/industrial"
    exit 1
fi

log_info "PASO 1: Estado actual detectado"
echo
echo "=== Configuración archivo .env ==="
cat server/.env | grep -E "PORT|NODE_ENV" || echo "Variables no encontradas"

echo
echo "=== Procesos corriendo actualmente ==="
ps aux | grep -E "(node server.js|next-server)" | grep -v grep

echo
echo "=== Puertos en uso ==="
netstat -tlnp | grep -E ":(3000|3001|5000)" | while read line; do
    echo "  $line"
done

log_info "PASO 2: Creando backup y sincronizando configuración"

# Crear backup
cp server/.env "server/.env.backup.$(date +%Y%m%d_%H%M%S)"
log_success "Backup creado"

echo
log_info "Sincronizando server/.env con configuración de producción..."

# Sincronizar las variables principales
sed -i 's/PORT=.*/PORT=3001/' server/.env
sed -i 's/NODE_ENV=.*/NODE_ENV=production/' server/.env

# Verificar que las variables CORS estén correctas
if ! grep -q "FRONTEND_URL=https://industrial-iot.us,https://www.industrial-iot.us" server/.env; then
    sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://industrial-iot.us,https://www.industrial-iot.us|' server/.env
fi

if ! grep -q "CORS_ORIGIN=https://industrial-iot.us,https://www.industrial-iot.us" server/.env; then
    sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://industrial-iot.us,https://www.industrial-iot.us|' server/.env
fi

echo "=== Configuración sincronizada ==="
cat server/.env | grep -E "PORT|NODE_ENV|FRONTEND_URL|CORS_ORIGIN"

log_info "PASO 3: Localizando y reiniciando PM2"

# Buscar PM2 en ubicaciones comunes
PM2_PATHS=(
    "/usr/local/bin/pm2"
    "/usr/bin/pm2"
    "/usr/local/lib/node_modules/pm2/bin/pm2"
    "/usr/lib/node_modules/pm2/bin/pm2"
    "/root/.npm-global/bin/pm2"
    "/root/.npm-global/lib/node_modules/pm2/bin/pm2"
)

PM2_FOUND=""
for path in "${PM2_PATHS[@]}"; do
    if [ -f "$path" ]; then
        PM2_FOUND="$path"
        log_success "PM2 encontrado en: $path"
        break
    fi
done

# Si no lo encuentra en rutas comunes, usar find
if [ -z "$PM2_FOUND" ]; then
    log_info "Buscando PM2 con find..."
    FIND_RESULT=$(find /usr /home /root -name "pm2" -type f -executable 2>/dev/null | head -1)
    if [ -n "$FIND_RESULT" ]; then
        PM2_FOUND="$FIND_RESULT"
        log_success "PM2 encontrado con find: $PM2_FOUND"
    fi
fi

if [ -n "$PM2_FOUND" ] && [ -f "$PM2_FOUND" ]; then
    log_success "Usando PM2: $PM2_FOUND"

    echo
    log_info "Estado actual de PM2:"
    $PM2_FOUND status

    echo
    log_info "Reiniciando backend para aplicar configuración..."
    $PM2_FOUND restart industrial-website-server

    log_success "Backend reiniciado con PM2"

    # Crear script de gestión
    cat > manage-services.sh << EOF
#!/bin/bash
# Script de gestión con PM2 detectado: $PM2_FOUND

PM2="$PM2_FOUND"

case "\$1" in
    "status")
        \$PM2 status
        ;;
    "restart")
        \$PM2 restart all
        ;;
    "restart-backend")
        \$PM2 restart industrial-website-server
        ;;
    "restart-frontend")
        \$PM2 restart industrial-project
        ;;
    "logs")
        \$PM2 logs
        ;;
    "logs-backend")
        \$PM2 logs industrial-website-server
        ;;
    *)
        echo "Uso: \$0 {status|restart|restart-backend|restart-frontend|logs|logs-backend}"
        ;;
esac
EOF
    chmod +x manage-services.sh
    log_success "Script manage-services.sh creado"

else
    log_warning "PM2 no encontrado, reiniciando manualmente..."

    # Obtener PIDs y reiniciar manualmente
    BACKEND_PIDS=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')

    if [ -n "$BACKEND_PIDS" ]; then
        log_info "Reiniciando backend (PID: $BACKEND_PIDS)..."
        echo "$BACKEND_PIDS" | xargs kill -TERM
        sleep 5

        # Iniciar de nuevo
        cd server
        nohup node server.js > ../logs/backend.log 2>&1 &
        NEW_PID=$!
        log_success "Backend reiniciado con PID: $NEW_PID"
        cd ..
    fi
fi

echo
log_info "PASO 4: Verificación post-sincronización"

# Esperar a que reinicie
sleep 10

echo
log_info "4.1 - Verificando servicios locales..."

# Backend
if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1; then
    log_success "✅ Backend funcionando en puerto 3001"
    HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
    echo "Response: $HEALTH_RESPONSE"
else
    log_error "❌ Backend no responde en puerto 3001"
fi

# Frontend
if curl -f -s http://localhost:3000/ >/dev/null 2>&1; then
    log_success "✅ Frontend funcionando en puerto 3000"
else
    log_error "❌ Frontend no responde en puerto 3000"
fi

echo
log_info "4.2 - Verificando APIs con CORS corregido..."

DOMAINS=("industrial-iot.us" "www.industrial-iot.us")

for domain in "${DOMAINS[@]}"; do
    echo
    log_info "Testing https://$domain..."

    # API Health
    if curl -f -s "https://$domain/api/health" >/dev/null 2>&1; then
        log_success "✅ API Health funciona"
        RESPONSE=$(curl -s "https://$domain/api/health" | jq -c '{success, environment}' 2>/dev/null || curl -s "https://$domain/api/health")
        echo "   Response: $RESPONSE"
    else
        log_error "❌ API Health falla"
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain/api/health")
        echo "   HTTP Status: $STATUS"
    fi

    # Productos
    if curl -f -s "https://$domain/api/products/abrazaderas" >/dev/null 2>&1; then
        PRODUCTS=$(curl -s "https://$domain/api/products/abrazaderas")
        if echo "$PRODUCTS" | jq . >/dev/null 2>&1; then
            COUNT=$(echo "$PRODUCTS" | jq '. | length' 2>/dev/null)
            log_success "✅ Productos funcionan ($COUNT items)"
        else
            log_warning "⚠️  API responde pero datos inválidos"
        fi
    else
        log_error "❌ Productos fallan"
    fi

    # Headers CORS
    CORS_HEADERS=$(curl -s -I "https://$domain/api/health" | grep -i "access-control" | wc -l)
    if [ "$CORS_HEADERS" -gt 0 ]; then
        log_success "✅ Headers CORS presentes ($CORS_HEADERS headers)"
    else
        log_warning "⚠️  Headers CORS no detectados"
    fi
done

echo
log_info "PASO 5: Resumen final"

echo
echo "🎯 CONFIGURACIÓN SINCRONIZADA:"
echo "=============================="
echo "✅ server/.env actualizado:"
echo "   • PORT=3001 (producción)"
echo "   • NODE_ENV=production"
echo "   • CORS configurado para ambos dominios"
echo
echo "✅ Procesos:"
echo "   • Backend: puerto 3001"
echo "   • Frontend: puerto 3000"
echo "   • Nginx: puertos 80/443"

# Verificar éxito final
SUCCESS=0
TOTAL=4

curl -f -s https://industrial-iot.us/api/health >/dev/null 2>&1 && SUCCESS=$((SUCCESS + 1))
curl -f -s https://www.industrial-iot.us/api/health >/dev/null 2>&1 && SUCCESS=$((SUCCESS + 1))
curl -f -s https://industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1 && SUCCESS=$((SUCCESS + 1))
curl -f -s https://www.industrial-iot.us/api/products/abrazaderas >/dev/null 2>&1 && SUCCESS=$((SUCCESS + 1))

echo
if [ $SUCCESS -eq $TOTAL ]; then
    log_success "🎉 ¡PERFECTO! Ambos dominios funcionan completamente"
    echo
    echo "✅ https://industrial-iot.us - Carga datos MongoDB"
    echo "✅ https://www.industrial-iot.us - Carga datos MongoDB"
    echo
    echo "🌐 URLs para probar:"
    for domain in "${DOMAINS[@]}"; do
        echo "   • https://$domain/productos/abrazaderas"
        echo "   • https://$domain/productos/kits"
        echo "   • https://$domain/productos/epoxicos"
    done
elif [ $SUCCESS -gt 2 ]; then
    log_warning "⚠️  Funciona parcialmente ($SUCCESS/$TOTAL tests exitosos)"
    echo "La mayoría de funcionalidades operan correctamente."
else
    log_error "❌ Problemas detectados ($SUCCESS/$TOTAL tests exitosos)"
    echo "Revisa los logs para más detalles:"
    if [ -n "$PM2_FOUND" ]; then
        echo "   $PM2_FOUND logs industrial-website-server"
    else
        echo "   tail -f logs/backend.log"
    fi
fi

echo
echo "🔧 GESTIÓN FUTURA:"
echo "=================="
if [ -f "manage-services.sh" ]; then
    echo "• ./manage-services.sh status"
    echo "• ./manage-services.sh restart-backend"
    echo "• ./manage-services.sh logs-backend"
else
    echo "• ps aux | grep node"
    echo "• tail -f logs/backend.log"
fi

echo
log_success "Sincronización de configuración completada! 🚀"