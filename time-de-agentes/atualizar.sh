#!/usr/bin/env bash
# Baixa a versão mais nova do time e reinstala em ~/.claude
set -euo pipefail
cd "$(dirname "$0")"
git pull --ff-only
./instalar.sh
