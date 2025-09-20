@echo off
echo Iniciando servidor local...
echo.
echo Servidor sera iniciado em: http://localhost:8000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.
python -m http.server 8000
pause
