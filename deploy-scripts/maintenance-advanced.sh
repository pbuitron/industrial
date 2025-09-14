#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/root/industrial"
DOMAIN="industrial-iot.us"

# Función para logging
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}=== HERRAMIENTAS DE MANTENIMIENTO AVANZADAS ===${NC}"
    echo ""
    echo "Uso: ./maintenance-advanced.sh [comando]"
    echo ""
    echo -e "${GREEN}Comandos disponibles:${NC}"
    echo "  update         - Actualizar código desde GitHub y reiniciar"
    echo "  restart        - Reiniciar solo el backend"
    echo "  restart-all    - Reiniciar todos los servicios"
    echo "  logs           - Ver logs del backend"
    echo "  logs-live      - Ver logs en tiempo real"
    echo "  status         - Ver estado de todos los servicios"
    echo "  health         - Verificación completa de salud"
    echo "  backup         - Crear backup de la base de datos"
    echo "  restore        - Restaurar backup de la base de datos"
    echo "  ssl            - Renovar certificado SSL"
    echo "  monitor        - Abrir monitor de PM2"
    echo "  cleanup        - Limpiar logs y archivos temporales"
    echo "  reset-db       - Resetear base de datos (¡CUIDADO!)"
    echo "  info           - Mostrar información del sistema"
    echo "  help           - Mostrar esta ayuda"
}

# Función para actualizar
update_app() {
    log_info "Actualizando aplicación..."
    cd "$PROJECT_DIR"

    log_info "Descargando cambios..."
    git pull

    log_info "Instalando dependencias..."
    npm install
    cd server && npm install && cd ..

    log_info "Compilando frontend..."
    npm run build

    log_info "Reiniciando backend..."
    pm2 restart industrial-iot-backend

    log_info "Esperando que la aplicación esté lista..."
    sleep 10

    # Verificar que funciona
    if curl -f http://localhost:3001/api/ >/dev/null 2>&1; then
        log_success "Aplicación actualizada y funcionando"
    else
        log_error "Error: La aplicación no responde después de la actualización"
        pm2 logs industrial-iot-backend --lines 20
    fi
}

# Función para reiniciar backend
restart_app() {
    log_info "Reiniciando backend..."
    pm2 restart industrial-iot-backend
    sleep 5

    if pm2 describe industrial-iot-backend | grep -q "online"; then
        log_success "Backend reiniciado correctamente"
    else
        log_error "Error reiniciando backend"
        pm2 logs industrial-iot-backend --lines 10
    fi
}

# Función para reiniciar todos los servicios
restart_all() {
    log_info "Reiniciando todos los servicios..."

    log_info "Reiniciando MongoDB (Docker)..."
    docker restart mongodb

    log_info "Reiniciando Nginx..."
    systemctl restart nginx

    log_info "Reiniciando backend..."
    pm2 restart industrial-iot-backend

    sleep 10
    log_success "Todos los servicios reiniciados"
}

# Función para ver logs
show_logs() {
    log_info "Logs del backend (últimas 50 líneas):"
    pm2 logs industrial-iot-backend --lines 50
}

# Función para logs en vivo
show_logs_live() {
    log_info "Mostrando logs en tiempo real (Ctrl+C para salir):"
    pm2 logs industrial-iot-backend --lines 0
}

# Función para ver estado completo
show_status() {
    echo -e "${BLUE}=== ESTADO DE SERVICIOS ===${NC}"

    echo -e "\n${GREEN}PM2:${NC}"
    pm2 status

    echo -e "\n${GREEN}MongoDB (Docker):${NC}"
    if docker ps | grep -q mongodb; then
        log_success "MongoDB ejecutándose"
        docker ps --filter name=mongodb --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        log_error "MongoDB no está ejecutándose"
    fi

    echo -e "\n${GREEN}Nginx:${NC}"
    if systemctl is-active --quiet nginx; then
        log_success "Nginx ejecutándose"
    else
        log_error "Nginx no está ejecutándose"
    fi
    systemctl status nginx --no-pager -l

    echo -e "\n${GREEN}Uso de recursos:${NC}"
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
    echo "Memoria: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
    echo "Disco: $(df -h / | awk 'NR==2{print $5}')"
}

# Función para verificación de salud
health_check() {
    log_info "Ejecutando verificación completa de salud..."

    HEALTH_OK=true

    # Verificar PM2
    if pm2 describe industrial-iot-backend | grep -q "online"; then
        log_success "Backend PM2 OK"
    else
        log_error "Backend PM2 no está online"
        HEALTH_OK=false
    fi

    # Verificar MongoDB
    if docker exec mongodb mongosh --quiet --eval "db.runCommand('ping')" >/dev/null 2>&1; then
        log_success "MongoDB OK"
    else
        log_error "MongoDB no responde"
        HEALTH_OK=false
    fi

    # Verificar Nginx
    if systemctl is-active --quiet nginx; then
        log_success "Nginx OK"
    else
        log_error "Nginx no está activo"
        HEALTH_OK=false
    fi

    # Verificar API
    if curl -f -m 10 http://localhost:3001/api/ >/dev/null 2>&1; then
        log_success "API backend OK"
    else
        log_error "API backend no responde"
        HEALTH_OK=false
    fi

    # Verificar sitio web
    if curl -f -m 10 https://$DOMAIN/ >/dev/null 2>&1; then
        log_success "Sitio web OK"
    else
        log_warning "Sitio web no responde (verificar DNS)"
    fi

    # Verificar certificado SSL
    SSL_EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    if [ -n "$SSL_EXPIRY" ]; then
        log_success "Certificado SSL válido hasta: $SSL_EXPIRY"
    else
        log_warning "No se pudo verificar certificado SSL"
    fi

    if [ "$HEALTH_OK" = true ]; then
        log_success "Verificación de salud: TODO OK ✨"
    else
        log_error "Verificación de salud: PROBLEMAS DETECTADOS"
        return 1
    fi
}

# Función para backup
backup_db() {
    log_info "Creando backup de la base de datos..."

    BACKUP_DIR="$HOME/backups"
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_$DATE.tar.gz"

    mkdir -p "$BACKUP_DIR"

    log_info "Exportando datos de MongoDB..."
    docker exec mongodb mongodump --db industrial-iot --out /tmp/backup_$DATE

    log_info "Copiando backup desde el contenedor..."
    docker cp mongodb:/tmp/backup_$DATE $BACKUP_DIR/

    log_info "Comprimiendo backup..."
    tar -czf "$BACKUP_FILE" -C "$BACKUP_DIR" "backup_$DATE"
    rm -rf "$BACKUP_DIR/backup_$DATE"

    log_info "Limpiando contenedor..."
    docker exec mongodb rm -rf /tmp/backup_$DATE

    log_success "Backup creado: $BACKUP_FILE"

    # Limpiar backups antiguos (mantener solo los últimos 5)
    log_info "Limpiando backups antiguos..."
    ls -t "$BACKUP_DIR"/backup_*.tar.gz | tail -n +6 | xargs -r rm

    log_info "Backups disponibles:"
    ls -la "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null || log_warning "No hay backups previos"
}

# Función para restaurar
restore_db() {
    log_info "Restaurar backup de la base de datos"

    BACKUP_DIR="$HOME/backups"

    log_info "Backups disponibles:"
    ls -la "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null || {
        log_error "No se encontraron backups"
        return 1
    }

    echo ""
    read -p "Ingresa el nombre completo del archivo de backup: " BACKUP_FILE

    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Archivo no encontrado: $BACKUP_FILE"
        return 1
    fi

    log_warning "ADVERTENCIA: Esto sobrescribirá la base de datos actual"
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operación cancelada"
        return 1
    fi

    TEMP_DIR=$(mktemp -d)

    log_info "Extrayendo backup..."
    tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

    log_info "Copiando al contenedor..."
    docker cp "$TEMP_DIR"/backup_*/ mongodb:/tmp/restore/

    log_info "Restaurando base de datos..."
    docker exec mongodb mongorestore --db industrial-iot --drop /tmp/restore/industrial-iot/

    log_info "Limpiando archivos temporales..."
    rm -rf "$TEMP_DIR"
    docker exec mongodb rm -rf /tmp/restore

    log_success "Base de datos restaurada exitosamente"

    log_info "Reiniciando backend para aplicar cambios..."
    pm2 restart industrial-iot-backend
}

# Función para renovar SSL
renew_ssl() {
    log_info "Renovando certificado SSL..."

    if certbot renew --quiet; then
        systemctl reload nginx
        log_success "Certificado SSL renovado"
    else
        log_error "Error renovando certificado SSL"
        certbot renew
    fi
}

# Función para monitor
show_monitor() {
    log_info "Abriendo monitor de PM2..."
    pm2 monit
}

# Función para limpiar
cleanup() {
    log_info "Limpiando archivos temporales y logs..."

    # Limpiar logs de PM2
    pm2 flush

    # Limpiar logs del sistema
    journalctl --vacuum-time=7d

    # Limpiar logs de nginx
    find /var/log/nginx/ -name "*.log.*" -mtime +7 -delete

    # Limpiar archivos temporales
    find /tmp -name "*industrial*" -mtime +1 -delete 2>/dev/null || true

    # Limpiar Docker
    docker system prune -f

    log_success "Limpieza completada"
}

# Función para resetear DB (PELIGROSO)
reset_db() {
    log_warning "ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos"
    log_warning "Esta acción NO se puede deshacer"
    echo ""
    read -p "¿Estás SEGURO que quieres continuar? Escribe 'CONFIRMAR': " CONFIRMATION

    if [ "$CONFIRMATION" != "CONFIRMAR" ]; then
        log_info "Operación cancelada"
        return 1
    fi

    log_info "Eliminando base de datos..."
    docker exec mongodb mongosh --quiet --eval "db.getSiblingDB('industrial-iot').dropDatabase()"

    log_info "Reiniciando backend..."
    pm2 restart industrial-iot-backend

    log_success "Base de datos reseteada"
    log_warning "Recuerda configurar un usuario administrador"
}

# Función para mostrar información del sistema
show_info() {
    echo -e "${BLUE}=== INFORMACIÓN DEL SISTEMA ===${NC}"
    echo ""
    echo "Dominio: $DOMAIN"
    echo "Directorio del proyecto: $PROJECT_DIR"
    echo "Usuario: $(whoami)"
    echo "Fecha: $(date)"
    echo "Uptime: $(uptime -p)"
    echo "SO: $(lsb_release -d | cut -f2)"
    echo "Kernel: $(uname -r)"
    echo "Node.js: $(node --version)"
    echo "NPM: $(npm --version)"
    echo "PM2: $(pm2 --version)"
    echo "Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
    echo "Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"
    echo ""
    echo "IP del servidor: $(curl -s --max-time 5 ifconfig.me)"
    echo "Espacio en disco: $(df -h / | awk 'NR==2{print $4 " disponible de " $2}')"
    echo "Memoria libre: $(free -h | awk 'NR==2{print $7 " disponible de " $2}')"
}

# Procesar comandos
case "$1" in
    "update")
        update_app
        ;;
    "restart")
        restart_app
        ;;
    "restart-all")
        restart_all
        ;;
    "logs")
        show_logs
        ;;
    "logs-live")
        show_logs_live
        ;;
    "status")
        show_status
        ;;
    "health")
        health_check
        ;;
    "backup")
        backup_db
        ;;
    "restore")
        restore_db
        ;;
    "ssl")
        renew_ssl
        ;;
    "monitor")
        show_monitor
        ;;
    "cleanup")
        cleanup
        ;;
    "reset-db")
        reset_db
        ;;
    "info")
        show_info
        ;;
    "help"|*)
        show_help
        ;;
esac