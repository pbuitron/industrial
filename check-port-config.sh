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

echo "🔍 VERIFICACIÓN DE CONFIGURACIÓN DE PUERTOS - Industrial IoT"
echo "==========================================================="

# Verificar directorio
if [ ! -f "server/.env" ]; then
    log_error "No se encontró server/.env - asegúrate de estar en /root/industrial"
    exit 1
fi

log_info "PASO 1: Verificando configuración de puertos actual"

echo
echo "=== Variables de entorno backend ==="
echo "Archivo: server/.env"
cat server/.env | grep -E "PORT|NODE_ENV" || log_warning "No se encontró PORT en server/.env"

echo
echo "=== Puertos en uso actualmente ==="
echo "Verificando qué puertos están ocupados:"
netstat -tlnp | grep -E ":(3000|3001|5000|80|443)" || log_warning "No hay procesos en puertos esperados"

echo
log_info "PASO 2: Verificando procesos Node activos"
echo "=== Procesos Node corriendo ==="
ps aux | grep -E "(node|next)" | grep -v grep || log_warning "No hay procesos Node corriendo"

echo
log_info "PASO 3: Tests de conectividad por puerto"

# Test puerto 3000 (Frontend)
echo
log_info "3.1 - Testing puerto 3000 (Frontend esperado)"
if curl -f -s http://localhost:3000/ >/dev/null 2>&1; then
    log_success "✅ Puerto 3000 responde (Frontend)"
else
    log_warning "⚠️  Puerto 3000 no responde"
fi

# Test puerto 3001 (Backend producción)
echo
log_info "3.2 - Testing puerto 3001 (Backend producción)"
if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1; then
    log_success "✅ Puerto 3001 responde (Backend producción)"
    curl -s http://localhost:3001/api/health | jq -c '{success, environment}'
else
    log_warning "⚠️  Puerto 3001 no responde"
fi

# Test puerto 5000 (Backend desarrollo)
echo
log_info "3.3 - Testing puerto 5000 (Backend desarrollo)"
if curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
    log_warning "⚠️  Puerto 5000 responde (¡Configuración de desarrollo en producción!)"
    curl -s http://localhost:5000/api/health | jq -c '{success, environment}'
else
    log_success "✅ Puerto 5000 no responde (correcto en producción)"
fi

echo
log_info "PASO 4: Verificando configuración esperada vs actual"

EXPECTED_BACKEND_PORT="3001"
EXPECTED_FRONTEND_PORT="3000"

ACTUAL_BACKEND_PORT=$(grep "PORT=" server/.env | cut -d'=' -f2 2>/dev/null || echo "NO_ENCONTRADO")
NODE_ENV=$(grep "NODE_ENV=" server/.env | cut -d'=' -f2 2>/dev/null || echo "NO_ENCONTRADO")

echo
echo "=== COMPARACIÓN DE CONFIGURACIÓN ==="
echo "Ambiente detectado: $NODE_ENV"
echo "Puerto backend esperado: $EXPECTED_BACKEND_PORT"
echo "Puerto backend configurado: $ACTUAL_BACKEND_PORT"
echo "Puerto frontend esperado: $EXPECTED_FRONTEND_PORT"

if [ "$NODE_ENV" = "production" ]; then
    if [ "$ACTUAL_BACKEND_PORT" = "$EXPECTED_BACKEND_PORT" ]; then
        log_success "✅ Configuración correcta para producción"
    else
        log_warning "⚠️  Puerto backend incorrecto para producción"
        echo "   Esperado: $EXPECTED_BACKEND_PORT"
        echo "   Actual: $ACTUAL_BACKEND_PORT"
    fi
else
    log_warning "⚠️  NODE_ENV no está configurado como 'production'"
fi

echo
log_info "PASO 5: Recomendaciones de corrección"

if [ "$ACTUAL_BACKEND_PORT" != "$EXPECTED_BACKEND_PORT" ] || [ "$NODE_ENV" != "production" ]; then
    echo
    echo "🔧 CORRECCIÓN NECESARIA:"
    echo "======================="
    echo "Tu configuración actual en server/.env:"
    echo "   PORT=$ACTUAL_BACKEND_PORT"
    echo "   NODE_ENV=$NODE_ENV"
    echo
    echo "Debería ser (para producción):"
    echo "   PORT=3001"
    echo "   NODE_ENV=production"
    echo
    echo "📋 COMANDOS DE CORRECCIÓN:"
    echo "sed -i 's/PORT=.*/PORT=3001/' server/.env"
    echo "sed -i 's/NODE_ENV=.*/NODE_ENV=production/' server/.env"
    echo
    echo "Después ejecutar:"
    echo "# Reiniciar backend para aplicar cambios"
    echo "# Verificar que funciona en puerto 3001"
else
    log_success "✅ Configuración de puertos es correcta"
fi

echo
log_info "PASO 6: Arquitectura de red en producción"

echo
echo "🌐 ARQUITECTURA DE RED - PRODUCCIÓN:"
echo "==================================="
echo "Internet → Nginx (80/443) → Backend (3001) + Frontend (3000)"
echo
echo "🔀 Flujo de requests:"
echo "   https://industrial-iot.us/api/* → Nginx → localhost:3001 (Backend)"
echo "   https://industrial-iot.us/*     → Nginx → localhost:3000 (Frontend)"
echo
echo "📊 Puertos por ambiente:"
echo "   DESARROLLO (tu PC):"
echo "     • Backend: 5000"
echo "     • Frontend: 3000"
echo
echo "   PRODUCCIÓN (VPS):"
echo "     • Backend: 3001 (interno)"
echo "     • Frontend: 3000 (interno)"
echo "     • Nginx: 80/443 (público)"

echo
echo "🎯 RESUMEN:"
if netstat -tlnp | grep -q ":3001.*node" && netstat -tlnp | grep -q ":3000"; then
    log_success "✅ Configuración correcta detectada"
    log_success "✅ Backend en 3001, Frontend en 3000, Nginx en 80/443"
elif netstat -tlnp | grep -q ":5000.*node"; then
    log_warning "⚠️  Configuración de desarrollo detectada en producción"
    log_warning "⚠️  Backend corriendo en puerto 5000 (desarrollo) en lugar de 3001 (producción)"
else
    log_error "❌ Configuración de puertos no clara"
fi

echo
log_success "Verificación de puertos completada! 🚀"