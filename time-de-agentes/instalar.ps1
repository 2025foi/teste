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
    Write-Host "  $sub ✔ $($item.BaseName)"
  }
}
if (Test-Path $Backup) { Write-Host "`nArquivos antigos foram salvos em: $Backup" }
Write-Host "`nPronto! Entre na pasta de um projeto e rode:  claude --agent gerente"
