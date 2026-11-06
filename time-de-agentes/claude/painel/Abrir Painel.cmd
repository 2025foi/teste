@echo off
title Painel do Time - deixe esta janela aberta
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  O Node.js nao esta instalado. Ele e necessario para o chat e os projetos do painel.
  echo  Baixe e instale a versao LTS em: https://nodejs.org
  echo  Por enquanto vou abrir o painel apenas para visualizacao.
  echo.
  start "" "%~dp0painel.html"
  pause
  exit /b 1
)
node servidor.js
if errorlevel 1 pause
