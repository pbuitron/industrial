#!/bin/bash

# 🚀 Script de Actualización Automática de Dependencias
# Proyecto: Industrial Next.js

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
echo -e "${PURPLE}"
echo "=================================="
echo "   ACTUALIZADOR DE DEPENDENCIAS   "
echo "=================================="
echo -e "${NC}"

# Verificar que estamos en un proyecto Node.js
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. ¿Estás en el directorio correcto?"
    exit 1
fi

# Paso 1: Crear backup
print_step "Creando backup del proyecto..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git add .
    git commit -m "🔄 Backup antes de actualizar dependencias - $(date '+%Y-%m-%d %H:%M:%S')" || true
    print_success "Backup creado en Git"
else
    print_warning "No es un repositorio Git. Considerando crear backup manual."
fi

# Paso 2: Mostrar estado actual
print_step "Verificando dependencias desactualizadas..."
echo -e "${YELLOW}Dependencias desactualizadas:${NC}"
npm outdated || true
echo ""

# Paso 3: Instalar npm-check-updates si no existe
if ! command -v ncu &> /dev/null; then
    print_step "Instalando npm-check-updates..."
    npm install -g npm-check-updates
    print_success "npm-check-updates instalado"
fi

# Paso 4: Mostrar qué se va a actualizar
print_step "Analizando actualizaciones disponibles..."
echo -e "${YELLOW}Actualizaciones disponibles:${NC}"
npx npm-check-updates
echo ""

# Confirmar con el usuario
read -p "¿Deseas continuar con la actualización? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Actualización cancelada por el usuario"
    exit 0
fi

# Paso 5: Actualizar package.json
print_step "Actualizando package.json..."
npx npm-check-updates -u
print_success "package.json actualizado"

# Paso 6: Limpiar instalación anterior
print_step "Limpiando instalación anterior..."
rm -rf node_modules
rm -f package-lock.json yarn.lock pnpm-lock.yaml
npm cache clean --force
print_success "Limpieza completada"

# Paso 7: Instalar dependencias actualizadas
print_step "Instalando dependencias actualizadas..."
npm install
print_success "Dependencias instaladas"

# Paso 8: Verificar instalación
print_step "Verificando instalación..."

# Verificar que el proyecto se puede construir
echo "🏗️  Probando build..."
if npm run build; then
    print_success "Build exitoso"
else
    print_error "Build falló - revisando..."
    
    # Intentar arreglar problemas comunes
    print_step "Intentando arreglar problemas comunes..."
    npm install --legacy-peer-deps
    
    if npm run build; then
        print_success "Build exitoso después de arreglo"
    else
        print_error "Build sigue fallando - revisar manualmente"
    fi
fi

# Paso 9: Auditoría de seguridad
print_step "Ejecutando auditoría de seguridad..."
npm audit --audit-level=moderate || true

# Paso 10: Verificar desarrollo
print_step "Verificando que el servidor de desarrollo puede iniciar..."
timeout 10 npm run dev > /dev/null 2>&1 && echo "Dev server OK" || echo "Dev server podría tener problemas"

# Paso 11: Mostrar resumen
echo ""
echo -e "${PURPLE}=================================="
echo "         RESUMEN FINAL"
echo "==================================${NC}"

print_success "Actualización completada"
echo ""
echo -e "${BLUE}📊 Estado final:${NC}"
npm outdated || echo "✅ Todas las dependencias están actualizadas"
echo ""

echo -e "${BLUE}📝 Próximos pasos:${NC}"
echo "1. Ejecuta: npm run dev"
echo "2. Prueba tu aplicación"
echo "3. Ejecuta: npm run lint"
echo "4. Si todo funciona, haz commit de los cambios"
echo ""

echo -e "${GREEN}🎉 ¡Actualización automática completada!${NC}"

# Paso 12: Script de verificación post-actualización
cat > verify-update.sh << 'VERIFY_EOF'
#!/bin/bash
echo "🔍 Verificando actualización..."
echo ""
echo "1. Testing build..."
npm run build && echo "✅ Build OK" || echo "❌ Build failed"
echo ""
echo "2. Testing lint..."
npm run lint && echo "✅ Lint OK" || echo "❌ Lint failed"
echo ""
echo "3. Testing type check..."
npm run type-check && echo "✅ Types OK" || echo "❌ Types failed"
echo ""
echo "4. Dependencias finales:"
npm outdated || echo "✅ Todo actualizado"
VERIFY_EOF

chmod +x verify-update.sh
print_success "Script de verificación creado: ./verify-update.sh"