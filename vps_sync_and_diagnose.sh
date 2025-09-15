#!/bin/bash

echo "🔄 SINCRONIZACIÓN Y DIAGNÓSTICO VPS"
echo "=================================="
echo "VPS: root@162.254.37.42"
echo "Fecha: $(date)"
echo ""

# 1. VERIFICAR UBICACIÓN ACTUAL
echo "🔍 PASO 1: VERIFICAR UBICACIÓN ACTUAL"
echo "======================================"
pwd
ls -la
echo ""

# 2. IR AL DIRECTORIO DEL PROYECTO
echo "🔍 PASO 2: NAVEGAR AL PROYECTO"
echo "==============================="
cd /var/www/html
echo "Directorio actual: $(pwd)"
echo "Contenido:"
ls -la
echo ""

# 3. VERIFICAR ESTADO DEL GIT
echo "🔍 PASO 3: ESTADO DEL REPOSITORIO"
echo "=================================="
echo "=== Git Status ==="
git status
echo ""
echo "=== Git Remote ==="
git remote -v
echo ""
echo "=== Branch actual ==="
git branch -a
echo ""

# 4. SINCRONIZAR CON REPOSITORIO
echo "🔍 PASO 4: SINCRONIZAR REPOSITORIO"
echo "==================================="
echo "=== Haciendo git pull ==="
git pull origin main
echo ""

# 5. VERIFICAR QUE TENEMOS LOS SCRIPTS
echo "🔍 PASO 5: VERIFICAR SCRIPTS DISPONIBLES"
echo "========================================="
echo "Scripts de diagnóstico disponibles:"
ls -la *.sh 2>/dev/null || echo "No se encontraron scripts .sh"
echo ""

# 6. EJECUTAR DIAGNÓSTICO
echo "🔍 PASO 6: EJECUTAR DIAGNÓSTICO"
echo "==============================="
if [ -f "diagnose_api_404.sh" ]; then
    echo "=== Ejecutando diagnose_api_404.sh ==="
    chmod +x diagnose_api_404.sh
    ./diagnose_api_404.sh
else
    echo "❌ No se encontró diagnose_api_404.sh"
    echo "Scripts disponibles:"
    ls -la *.sh
fi
echo ""

# 7. GUARDAR RESULTADOS
echo "🔍 PASO 7: GUARDAR RESULTADOS"
echo "=============================="
echo "=== Guardando resultados en el repositorio ==="
if [ -f "diagnostic_results.txt" ]; then
    git add diagnostic_results.txt
    git add *.sh 2>/dev/null || true
    git commit -m "Add VPS diagnostic results - $(date)"
    git push origin main
    echo "✅ Resultados guardados en el repositorio"
else
    echo "⚠️ No se generó diagnostic_results.txt"
fi

echo ""
echo "✅ SINCRONIZACIÓN Y DIAGNÓSTICO COMPLETADO"
echo "==========================================="