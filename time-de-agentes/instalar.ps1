# Instala o Time de Agentes em %USERPROFILE%\.claude (Windows PowerShell)
$ErrorActionPreference = "Stop"
$Origem  = Join-Path $PSScriptRoot "claude"
$Destino = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME ".claude" }
$Backup  = Join-Path $Destino ("backup-time-de-agentes-" + (Get-Date -Format "yyyyMMdd-HHmmss"))

foreach ($sub in "agents","skills") {
  New-Item -ItemType Directory -Force -Path (Join-Path $Destino $sub) | Out-Null
  foreach ($item in Get-ChildItem (Join-Path $Origem $sub)) {
    $alvo = Join-Path (Join-Path $Destino $sub) $item.Name
    if (Test-Path $alvo) {
      $bk = Join-Path $Backup $sub; New-Item -ItemType Directory -Force -Path $bk | Out-Null
      Move-Item $alvo (Join-Path $bk $item.Name)
    }
    Copy-Item $item.FullName $alvo -Recurse
    Write-Host "  $sub OK $($item.BaseName)"
  }
}
# Painel do Time (mostra os 6 agentes ao vivo e permite conversar com eles pelo navegador)
$PainelDest = Join-Path $Destino "painel"
New-Item -ItemType Directory -Force -Path $PainelDest | Out-Null
foreach ($arq in "painel.html","registrar.sh","servidor.js","Abrir Painel.cmd") {
  Copy-Item (Join-Path (Join-Path $Origem "painel") $arq) (Join-Path $PainelDest $arq) -Force
}
New-Item -ItemType Directory -Force -Path (Join-Path $HOME "Projetos") | Out-Null
$Desk = [Environment]::GetFolderPath("Desktop")
$Antigo = Join-Path $Desk "Painel do Time.url"
if (Test-Path $Antigo) { Remove-Item $Antigo -Force }
$Ws = New-Object -ComObject WScript.Shell
$Lnk = $Ws.CreateShortcut((Join-Path $Desk "Painel do Time.lnk"))
$Lnk.TargetPath = Join-Path $PainelDest "Abrir Painel.cmd"
$Lnk.WorkingDirectory = $PainelDest
$Lnk.WindowStyle = 7
$Lnk.Description = "Abre o Painel do Time (conversar com o Gerente e ver os agentes)"
$Lnk.Save()
Write-Host "  painel OK  (atalho 'Painel do Time' criado na Area de Trabalho)"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host ""
  Write-Host "  ATENCAO: o Node.js nao esta instalado. Sem ele o painel so mostra os agentes,"
  Write-Host "  sem o chat e sem a lista de projetos. Instale a versao LTS em https://nodejs.org"
}

if (Test-Path $Backup) { Write-Host "`nArquivos antigos foram salvos em: $Backup" }
Write-Host "`nPronto! Time de 6 agentes instalado em $Destino"
Write-Host "Requer Claude Code atualizado (rode: claude update)."
Write-Host "Entre na pasta de um projeto e rode:  claude --agent gerente"
Write-Host "Para ver o time trabalhando, abra o atalho 'Painel do Time' na Area de Trabalho."
