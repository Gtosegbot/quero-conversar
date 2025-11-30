@echo off
echo ===================================================
echo   Iniciando Deploy Completo do Quero Conversar
echo ===================================================
echo.
echo 1. Deploy das Regras de Banco de Dados e Indices...
call firebase deploy --only firestore
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao deployar Firestore. Verifique se o firebase-tools esta instalado e logado.
    pause
    exit /b %errorlevel%
)
echo.
echo 2. Deploy das Regras de Armazenamento (Storage)...
call firebase deploy --only storage
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao deployar Storage.
    pause
    exit /b %errorlevel%
)
echo.
echo 3. Deploy das Cloud Functions (Dra. Clara)...
echo    Isso pode levar alguns minutos...
call firebase deploy --only functions
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao deployar Functions.
    pause
    exit /b %errorlevel%
)
echo.
echo ===================================================
echo   Deploy Concluido com Sucesso!
echo ===================================================
pause
