#!/usr/bin/env bash
# Instala o Time de Agentes em ~/.claude (Mac / Linux / WSL / Git Bash no Windows)
set -euo pipefail
ORIGEM="$(cd "$(dirname "$0")" && pwd)/claude"
DESTINO="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
BACKUP="$DESTINO/backup-time-de-agentes-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$DESTINO/agents" "$DESTINO/skills"

copiar() { # $1 = origem, $2 = destino
  if [ -e "$2" ]; then mkdir -p "$BACKUP/$(dirname "${2#$DESTINO/}")"; mv "$2" "$BACKUP/${2#$DESTINO/}"; fi
  cp -R "$1" "$2"
}

for f in "$ORIGEM"/agents/*.md; do copiar "$f" "$DESTINO/agents/$(basename "$f")"; echo "  agente  ✔ $(basename "$f" .md)"; done
for d in "$ORIGEM"/skills/*/;  do n="$(basename "$d")"; copiar "${d%/}" "$DESTINO/skills/$n"; echo "  skill   ✔ $n"; done

[ -d "$BACKUP" ] && echo -e "\nArquivos antigos com o mesmo nome foram salvos em: $BACKUP"
cat <<MSG

Pronto! Time de 6 agentes instalado em $DESTINO
Requer Claude Code atualizado (rode "claude update" se algo não funcionar).
Para trabalhar com o Gerente, entre na pasta de um projeto e rode:

    claude --agent gerente

Dica: crie um atalho com
    echo "alias equipe='claude --agent gerente'" >> ~/.bashrc   (ou ~/.zshrc no Mac)
MSG
