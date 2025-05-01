@echo off
echo Iniciando Value Investing Frontend...

echo.
echo [1/2] Verificando dependencias...
IF NOT EXIST node_modules (
    echo Instalando dependencias...
    npm install
) ELSE (
    echo Dependencias ya instaladas.
)

echo.
echo [2/2] Iniciando aplicación React...
echo.
echo Value Investing Frontend iniciando...
echo - Frontend: http://localhost:3000
echo.

npm start
