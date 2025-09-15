#!/bin/bash
set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }

echo "🔄 PUSH & DEPLOY - Industrial IoT"
echo "================================"

# Verificar si hay cambios
if [[ -z $(git status -s) ]]; then
    log_info "No hay cambios para commitear"
else
    log_info "Commiteando cambios..."
    git add .

    # Pedir mensaje de commit
    echo -n "💬 Mensaje del commit (Enter para mensaje auto): "
    read commit_message

    if [ -z "$commit_message" ]; then
        commit_message="update: Cambios automáticos $(date '+%Y-%m-%d %H:%M')"
    fi

    git commit -m "$commit_message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    log_success "Cambios commiteados"
fi

log_info "Haciendo push a GitHub..."
git push origin main
log_success "Push completado"

log_info "Iniciando deploy automático..."
./deploy-auto.sh

log_success "🎉 ¡Todo completado!"