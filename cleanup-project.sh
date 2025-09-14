#!/bin/bash

echo "🧹 LIMPIANDO PROYECTO PARA DESPLIEGUE"
echo "===================================="

# 1. Eliminar archivos de desarrollo
echo "Eliminando archivos de desarrollo..."
rm -f README.md
rm -f update-deps.sh
rm -f check-security.js 2>/dev/null || true

# 2. Eliminar archivos temporales
echo "Eliminando archivos temporales..."
rm -rf .next
rm -rf out
rm -rf node_modules/.cache
rm -rf .env.local.backup 2>/dev/null || true

# 3. Limpiar servidor
echo "Limpiando servidor..."
cd server
rm -rf node_modules/.cache 2>/dev/null || true
rm -f .env.example 2>/dev/null || true
cd ..

# 4. Eliminar imágenes placeholder innecesarias
echo "Eliminando imágenes placeholder..."
cd public
rm -f placeholder-logo.png 2>/dev/null || true
rm -f placeholder-logo.svg 2>/dev/null || true
rm -f placeholder-user.jpg 2>/dev/null || true
rm -f placeholder.jpg 2>/dev/null || true
rm -f placeholder.svg 2>/dev/null || true
cd ..

# 5. Eliminar componentes UI no utilizados
echo "Eliminando componentes UI no utilizados..."
cd components/ui
rm -f menubar.tsx 2>/dev/null || true
rm -f command.tsx 2>/dev/null || true
rm -f context-menu.tsx 2>/dev/null || true
rm -f hover-card.tsx 2>/dev/null || true
rm -f radio-group.tsx 2>/dev/null || true
rm -f toggle.tsx 2>/dev/null || true
rm -f toggle-group.tsx 2>/dev/null || true
cd ../..

# 6. Limpiar deploy-scripts si existe
rm -rf deploy-scripts 2>/dev/null || true

echo "✅ Limpieza completada"
echo "📦 Proyecto optimizado para despliegue"