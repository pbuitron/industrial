#!/bin/bash
set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "${PURPLE}🔍 $1${NC}"; }

echo "🔄 LOCALIZAR PM2 Y REINICIAR SERVICIOS - Industrial IoT"
echo "======================================================="

MAIN_DOMAIN="industrial-iot.us"
WWW_DOMAIN="www.industrial-iot.us"

# Verificar directorio
if [ ! -f "server/.env" ]; then
    log_error "No se encontró server/.env - asegúrate de estar en /root/industrial"
    exit 1
fi

log_header "PASO 1: VERIFICANDO CONFIGURACIÓN CORS APLICADA"
echo
echo "=== Variables CORS actuales ==="
cat server/.env | grep -E "FRONTEND_URL|CORS_ORIGIN"

log_header "PASO 2: BUSCANDO PM2 EN EL SISTEMA"

echo
log_info "2.1 - Buscando PM2 en directorios estándar..."
PM2_PATHS=(
    "/usr/local/bin/pm2"
    "/usr/bin/pm2"
    "/usr/local/lib/node_modules/pm2/bin/pm2"
    "/usr/lib/node_modules/pm2/bin/pm2"
    "/root/.npm-global/bin/pm2"
    "/root/.npm-global/lib/node_modules/pm2/bin/pm2"
    "/root/.config/yarn/global/node_modules/pm2/bin/pm2"
    "/home/$(whoami)/.npm-global/bin/pm2"
)

PM2_FOUND=""
for path in "${PM2_PATHS[@]}"; do
    if [ -f "$path" ]; then
        log_success "PM2 encontrado en: $path"
        PM2_FOUND="$path"
        break
    fi
done

if [ -z "$PM2_FOUND" ]; then
    log_info "2.2 - Buscando PM2 con comandos find..."

    # Buscar PM2 con find
    FIND_RESULTS=$(find /usr /home /root -name "pm2" -type f -executable 2>/dev/null | head -5)

    if [ -n "$FIND_RESULTS" ]; then
        echo "PM2 encontrado en ubicaciones:"
        echo "$FIND_RESULTS"
        PM2_FOUND=$(echo "$FIND_RESULTS" | head -1)
        log_success "Usando: $PM2_FOUND"
    fi
fi

if [ -z "$PM2_FOUND" ]; then
    log_info "2.3 - Verificando si PM2 está en PATH de npm global..."
    NPM_GLOBAL_PATH=$(npm root -g 2>/dev/null)
    if [ -n "$NPM_GLOBAL_PATH" ] && [ -f "$NPM_GLOBAL_PATH/pm2/bin/pm2" ]; then
        PM2_FOUND="$NPM_GLOBAL_PATH/pm2/bin/pm2"
        log_success "PM2 encontrado en npm global: $PM2_FOUND"
    fi
fi

echo
log_info "2.4 - Verificando procesos PM2 activos..."
PM2_PROCESSES=$(ps aux | grep -i pm2 | grep -v grep || echo "No hay procesos PM2")
echo "$PM2_PROCESSES"

echo
log_info "2.5 - Verificando procesos Node activos..."
NODE_PROCESSES=$(ps aux | grep -E "(node|next)" | grep -v grep || echo "No hay procesos Node")
echo "$NODE_PROCESSES"

log_header "PASO 3: REINICIANDO SERVICIOS"

if [ -n "$PM2_FOUND" ] && [ -f "$PM2_FOUND" ]; then
    log_success "Usando PM2 encontrado: $PM2_FOUND"

    # Verificar que PM2 funciona
    if $PM2_FOUND --version >/dev/null 2>&1; then
        log_success "PM2 funcional, reiniciando servicios..."

        echo "=== Estado actual de PM2 ==="
        $PM2_FOUND status || log_warning "Error obteniendo status de PM2"

        echo
        log_info "Reiniciando backend..."
        $PM2_FOUND restart industrial-website-server || log_warning "Error reiniciando backend"

        echo
        log_info "Reiniciando frontend..."
        $PM2_FOUND restart industrial-project || log_warning "Error reiniciando frontend"

        echo
        log_success "Servicios reiniciados con PM2"

        echo "=== Estado después del reinicio ==="
        $PM2_FOUND status

        # Crear script de gestión para uso futuro
        cat > manage-pm2.sh << EOF
#!/bin/bash
# Script de gestión PM2 - Ubicación detectada: $PM2_FOUND

PM2="$PM2_FOUND"

case "\$1" in
    "status")
        \$PM2 status
        ;;
    "restart")
        \$PM2 restart all
        ;;
    "logs")
        \$PM2 logs
        ;;
    "stop")
        \$PM2 stop all
        ;;
    "start")
        \$PM2 start ecosystem.config.js
        ;;
    *)
        echo "Uso: \$0 {status|restart|logs|stop|start}"
        echo "PM2 está en: $PM2_FOUND"
        ;;
esac
EOF
        chmod +x manage-pm2.sh
        log_success "Script manage-pm2.sh creado para uso futuro"

    else
        log_error "PM2 encontrado pero no funcional: $PM2_FOUND"
        PM2_FOUND=""
    fi
fi

if [ -z "$PM2_FOUND" ]; then
    log_warning "PM2 no encontrado o no funcional, reiniciando manualmente..."

    echo
    log_info "3.1 - Deteniendo procesos existentes..."

    # Obtener PIDs de procesos actuales
    BACKEND_PIDS=$(ps aux | grep "server/server.js" | grep -v grep | awk '{print $2}' || echo "")
    FRONTEND_PIDS=$(ps aux | grep "next-server" | grep -v grep | awk '{print $2}' || echo "")

    if [ -n "$BACKEND_PIDS" ]; then
        log_info "Deteniendo backend PIDs: $BACKEND_PIDS"
        echo "$BACKEND_PIDS" | xargs kill -TERM 2>/dev/null || true
        sleep 3
        echo "$BACKEND_PIDS" | xargs kill -KILL 2>/dev/null || true
    fi

    if [ -n "$FRONTEND_PIDS" ]; then
        log_info "Deteniendo frontend PIDs: $FRONTEND_PIDS"
        echo "$FRONTEND_PIDS" | xargs kill -TERM 2>/dev/null || true
        sleep 3
        echo "$FRONTEND_PIDS" | xargs kill -KILL 2>/dev/null || true
    fi

    echo
    log_info "3.2 - Creando directorio de logs..."
    mkdir -p logs

    echo
    log_info "3.3 - Iniciando backend manualmente..."
    cd server
    nohup node server.js > ../logs/backend-manual.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend iniciado con PID: $BACKEND_PID"
    cd ..

    echo
    log_info "3.4 - Iniciando frontend manualmente..."
    nohup npm start > logs/frontend-manual.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend iniciado con PID: $FRONTEND_PID"

    echo
    log_info "3.5 - Esperando a que los servicios inicien..."
    sleep 10

    # Crear script de gestión manual
    cat > manage-services.sh << EOF
#!/bin/bash
# Script de gestión manual de servicios

case "\$1" in
    "status")
        echo "=== Procesos Backend ==="
        ps aux | grep "server/server.js" | grep -v grep
        echo "=== Procesos Frontend ==="
        ps aux | grep "next-server" | grep -v grep
        ;;
    "restart")
        echo "Reiniciando servicios..."
        pkill -f "server/server.js" 2>/dev/null || true
        pkill -f "next-server" 2>/dev/null || true
        sleep 5
        cd server && nohup node server.js > ../logs/backend-manual.log 2>&1 & cd ..
        nohup npm start > logs/frontend-manual.log 2>&1 &
        echo "Servicios reiniciados"
        ;;
    "stop")
        pkill -f "server/server.js" 2>/dev/null || true
        pkill -f "next-server" 2>/dev/null || true
        echo "Servicios detenidos"
        ;;
    "logs")
        echo "=== Logs Backend ==="
        tail -20 logs/backend-manual.log 2>/dev/null || echo "No hay logs de backend"
        echo "=== Logs Frontend ==="
        tail -20 logs/frontend-manual.log 2>/dev/null || echo "No hay logs de frontend"
        ;;
    *)
        echo "Uso: \$0 {status|restart|logs|stop}"
        ;;
esac
EOF
    chmod +x manage-services.sh
    log_success "Script manage-services.sh creado para gestión manual"
fi

log_header "PASO 4: VERIFICACIÓN POST-REINICIO"

echo
log_info "4.1 - Esperando a que los servicios estén listos..."
sleep 5

echo
log_info "4.2 - Test de servicios locales..."

# Test backend local
if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1; then
    log_success "✅ Backend funcionando en localhost:3001"
    curl -s http://localhost:3001/api/health | jq -c '{success, environment}'
else
    log_error "❌ Backend no responde en localhost:3001"
fi

# Test frontend local
if curl -f -s http://localhost:3000/ >/dev/null 2>&1; then
    log_success "✅ Frontend funcionando en localhost:3000"
else
    log_error "❌ Frontend no responde en localhost:3000"
fi

echo
log_info "4.3 - Test de APIs con CORS corregido..."

# Test ambos dominios
for domain in $MAIN_DOMAIN $WWW_DOMAIN; do
    echo
    log_info "Testing $domain..."

    # API Health
    if curl -f -s https://$domain/api/health >/dev/null 2>&1; then
        log_success "✅ API Health funciona"
        curl -s https://$domain/api/health | jq -c '{success, environment}'
    else
        log_error "❌ API Health falla"
        echo "Response status: $(curl -s -o /dev/null -w "%{http_code}" https://$domain/api/health)"
    fi

    # Productos
    if curl -f -s https://$domain/api/products/abrazaderas >/dev/null 2>&1; then
        PRODUCTS=$(curl -s https://$domain/api/products/abrazaderas)
        if echo "$PRODUCTS" | jq . >/dev/null 2>&1; then
            COUNT=$(echo "$PRODUCTS" | jq '. | length' 2>/dev/null || echo "0")
            log_success "✅ Productos funcionan ($COUNT items)"
        else
            log_warning "⚠️  API responde pero datos no válidos"
        fi
    else
        log_error "❌ Productos fallan"
    fi
done

log_header "PASO 5: RESUMEN FINAL Y COMANDOS ÚTILES"

echo
echo "🎉 REINICIO COMPLETADO"
echo "======================"

if curl -f -s https://$WWW_DOMAIN/api/health >/dev/null 2>&1 && curl -f -s https://$MAIN_DOMAIN/api/health >/dev/null 2>&1; then
    log_success "¡ÉXITO! Ambos dominios funcionan correctamente:"
    echo "   ✅ https://$MAIN_DOMAIN - Carga datos MongoDB"
    echo "   ✅ https://$WWW_DOMAIN - Carga datos MongoDB"
    echo
    echo "🌐 URLs para probar en navegador:"
    echo "   • https://$MAIN_DOMAIN/productos/abrazaderas"
    echo "   • https://$WWW_DOMAIN/productos/abrazaderas"
    echo "   • https://$MAIN_DOMAIN/productos/kits"
    echo "   • https://$WWW_DOMAIN/productos/kits"
else
    log_warning "Servicios reiniciados pero algunas APIs aún fallan"
    echo "Revisa los logs para más detalles."
fi

echo
echo "🔧 COMANDOS ÚTILES:"
echo "=================="

if [ -n "$PM2_FOUND" ]; then
    echo "• Gestión con PM2:"
    echo "  ./manage-pm2.sh status     # Ver estado"
    echo "  ./manage-pm2.sh restart    # Reiniciar"
    echo "  ./manage-pm2.sh logs       # Ver logs"
    echo "  $PM2_FOUND status          # Comando directo"
else
    echo "• Gestión manual:"
    echo "  ./manage-services.sh status   # Ver estado"
    echo "  ./manage-services.sh restart  # Reiniciar"
    echo "  ./manage-services.sh logs     # Ver logs"
fi

echo "• Logs del sistema:"
echo "  tail -f logs/backend-manual.log   # Backend logs"
echo "  tail -f logs/frontend-manual.log  # Frontend logs"
echo "  tail -f /var/log/nginx/industrial-iot.*.log  # Nginx logs"

echo
log_success "Script completado! 🚀"