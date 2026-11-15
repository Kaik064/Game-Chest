@echo off
setlocal

title Game Chest - Inicializador

set "RAIZ=%~dp0"
set "BACKEND=%RAIZ%game-chest\backend"
set "FRONTEND=%RAIZ%game-chest\frontend"

echo ========================================
echo        GAME CHEST - INICIALIZADOR
echo ========================================
echo.

if not exist "%BACKEND%\package.json" (
    echo ERRO: backend nao encontrado em:
    echo %BACKEND%
    pause
    exit /b 1
)

if not exist "%FRONTEND%\package.json" (
    echo ERRO: frontend nao encontrado em:
    echo %FRONTEND%
    pause
    exit /b 1
)

echo Iniciando o backend na porta 3000...
start "Game Chest - Backend" /D "%BACKEND%" cmd /k npm run dev

echo Iniciando o frontend na porta 5173...
start "Game Chest - Frontend" /D "%FRONTEND%" cmd /k npm run dev

echo.
echo ========================================
echo Servidores iniciados em janelas separadas.
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo Health:   http://localhost:3000/api/health
echo ========================================
echo.
echo Feche as janelas Backend e Frontend para encerrar os servidores.
echo.
pause

endlocal
