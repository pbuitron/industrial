#!/bin/bash

PROJECT_DIR="/root/industrial"

# Función para mostrar ayuda
show_help() {
    echo "=== HERRAMIENTAS DE MANTENIMIENTO ==="
    echo "Uso: ./maintenance.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  update     - Actualizar código desde GitHub y reiniciar"
    echo "  restart    - Reiniciar solo el backend"
    echo "  logs       - Ver logs del backend"
    echo "  status     - Ver estado de todos los servicios"
    echo "  backup     - Crear backup de la base de datos"
    echo "  restore    - Restaurar backup de la base de datos"
    echo "  ssl        - Renovar certificado SSL"
    echo "  monitor    - Abrir monitor de PM2"
    echo "  help       - Mostrar esta ayuda"
}

# Función para actualizar
update_app() {
    echo "=== ACTUALIZANDO APLICACIÓN ==="
    cd "$PROJECT_DIR"

    echo "Descargando cambios..."
    git pull

    echo "Instalando dependencias..."
    npm install
    cd server && npm install && cd ..

    echo "Haciendo build..."
    npm run build

    echo "Reiniciando backend..."
    pm2 restart industrial-iot-backend

    echo "✅ Actualización completada!"
}

# Función para reiniciar
restart_app() {
    echo "=== REINICIANDO BACKEND ==="
    pm2 restart industrial-iot-backend
    echo "✅ Backend reiniciado!"
}

# Función para ver logs
show_logs() {
    echo "=== LOGS DEL BACKEND ==="
    pm2 logs industrial-iot-backend --lines 50
}

# Función para ver estado
show_status() {
    echo "=== ESTADO DE SERVICIOS ==="
    echo "PM2:"
    pm2 status
    echo ""
    echo "MongoDB:"
    systemctl status mongod --no-pager -l
    echo ""
    echo "Nginx:"
    systemctl status nginx --no-pager -l
}

# Función para backup
backup_db() {
    echo "=== CREANDO BACKUP ==="
    BACKUP_DIR="$HOME/backups"
    DATE=$(date +%Y%m%d_%H%M%S)

    mkdir -p "$BACKUP_DIR"

    echo "Creando backup de MongoDB..."
    mongodump --db industrial-iot --out "$BACKUP_DIR/mongo_backup_$DATE"

    echo "Comprimiendo backup..."
    tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$BACKUP_DIR" "mongo_backup_$DATE"
    rm -rf "$BACKUP_DIR/mongo_backup_$DATE"

    echo "✅ Backup creado: $BACKUP_DIR/backup_$DATE.tar.gz"
}

# Función para restaurar
restore_db() {
    echo "=== RESTAURAR BACKUP ==="
    BACKUP_DIR="$HOME/backups"

    echo "Backups disponibles:"
    ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No se encontraron backups"

    read -p "Ingresa el nombre completo del archivo de backup: " BACKUP_FILE

    if [ -f "$BACKUP_FILE" ]; then
        echo "Extrayendo backup..."
        tar -xzf "$BACKUP_FILE" -C "$BACKUP_DIR"

        echo "Restaurando base de datos..."
        mongorestore --db industrial-iot --drop "$BACKUP_DIR"/mongo_backup_*/industrial-iot

        echo "Limpiando archivos temporales..."
        rm -rf "$BACKUP_DIR"/mongo_backup_*

        echo "✅ Base de datos restaurada!"
    else
        echo "❌ Archivo no encontrado: $BACKUP_FILE"
    fi
}

# Función para renovar SSL
renew_ssl() {
    echo "=== RENOVANDO CERTIFICADO SSL ==="
    certbot renew
    systemctl reload nginx
    echo "✅ Certificado SSL renovado!"
}

# Función para monitor
show_monitor() {
    echo "=== MONITOR PM2 ==="
    pm2 monit
}

# Procesar comandos
case "$1" in
    "update")
        update_app
        ;;
    "restart")
        restart_app
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
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
    "help"|*)
        show_help
        ;;
esac