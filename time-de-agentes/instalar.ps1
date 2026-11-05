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
# Painel do Time (mostra os 6 agentes trabalhando, ao vivo, no navegador)
$PainelDest = Join-Path $Destino "painel"
New-Item -ItemType Directory -Force -Path $PainelDest | Out-Null
foreach ($arq in "painel.html","registrar.sh") {
  Copy-Item (Join-Path (Join-Path $Origem "painel") $arq) (Join-Path $PainelDest $arq) -Force
}
$PainelHtml = Join-Path $PainelDest "painel.html"
$Url = "file:///" + (($PainelHtml -replace "\\","/") -replace " ","%20")
$Atalho = Join-Path ([Environment]::GetFolderPath("Desktop")) "Painel do Time.url"
Set-Content -Path $Atalho -Value "[InternetShortcut]`r`nURL=$Url" -Encoding ASCII
Write-Host "  painel OK  (atalho 'Painel do Time' criado na Area de Trabalho)"

if (Test-Path $Backup) { Write-Host "`nArquivos antigos foram salvos em: $Backup" }
Write-Host "`nPronto! Time de 6 agentes instalado em $Destino"
Write-Host "Requer Claude Code atualizado (rode: claude update)."
Write-Host "Entre na pasta de um projeto e rode:  claude --agent gerente"
Write-Host "Para ver o time trabalhando, abra o atalho 'Painel do Time' na Area de Trabalho."
