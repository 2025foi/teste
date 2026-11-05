#!/usr/bin/env bash
# Painel do Time: registra o que cada agente esta fazendo.
# Chamado pelos hooks do Gerente. Roda em segundo plano e nunca bloqueia o Claude.
DIR="$HOME/.claude/painel"
ARQ="$DIR/eventos.js"
mkdir -p "$DIR" 2>/dev/null
x=$(cat)

# Le o valor (ja escapado em JSON) de um campo de texto: campo nome
campo() {
  local re='"'"$1"'"[[:space:]]*:[[:space:]]*"((\\.|[^"\\])*)"'
  [[ $x =~ $re ]] && printf '%s' "${BASH_REMATCH[1]}"
}

# Corta um texto JSON-escapado sem quebrar sequencias de escape: curto texto limite
curto() {
  local s="$1" n="${2:-180}" t c=0
  (( ${#s} <= n )) && { printf '%s' "$s"; return; }
  s="${s:0:n}"
  [[ $s =~ (\\u[0-9a-fA-F]{0,3})$ ]] && s="${s:0:${#s}-${#BASH_REMATCH[1]}}"
  t="$s"; while [[ $t == *'\' ]]; do t="${t%?}"; c=$((c+1)); done
  (( c % 2 )) && s="${s%?}"
  printf '%s...' "$s"
}

ev=$(campo hook_event_name)
ag=$(campo agent_type)
id=$(campo agent_id)
tool=$(campo tool_name)
tid=$(campo tool_use_id)
cwd=$(campo cwd)
det=""; msg=""
case "$ev" in
  UserPromptSubmit) msg=$(curto "$(campo prompt)" 400) ;;
  SubagentStop|Stop) msg=$(curto "$(campo last_assistant_message)" 900) ;;
  PreToolUse)
    case "$tool" in
      Agent|Task) det="$(campo subagent_type)|$(campo description)" ;;
      Bash|PowerShell) det=$(campo description); [[ -z $det ]] && det=$(campo command) ;;
      Read|Write|Edit|NotebookEdit) det=$(campo file_path) ;;
      Glob|Grep) det=$(campo pattern) ;;
      WebFetch) det=$(campo url) ;;
      WebSearch) det=$(campo query) ;;
      Skill) det=$(campo skill) ;;
      TaskCreate|TaskUpdate) det=$(campo subject); [[ -z $det ]] && det=$(campo status) ;;
    esac
    det=$(curto "$det" 180) ;;
esac
[[ -z $ev ]] && exit 0

# Evita que o arquivo cresca sem limite (~3 MB)
if [[ -f $ARQ ]] && (( $(wc -c < "$ARQ") > 3000000 )); then mv -f "$ARQ" "$DIR/eventos-anterior.js"; fi

t=$(date +%s%3N 2>/dev/null); [[ $t == *N* || -z $t ]] && t="$(date +%s)000"
printf 'E({"t":%s,"ev":"%s","ag":"%s","id":"%s","tool":"%s","tid":"%s","det":"%s","cwd":"%s","msg":"%s"});\n' \
  "$t" "$ev" "$ag" "$id" "$tool" "$tid" "$det" "$cwd" "$msg" >> "$ARQ"
exit 0
