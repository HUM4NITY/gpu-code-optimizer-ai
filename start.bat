@echo off
echo ========================================
echo   GPU Code Optimizer AI - Quick Start
echo ========================================
echo.

echo Checking Ollama installation...
ollama list >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Ollama is not installed or not running
    echo Please install Ollama from: https://ollama.ai
    pause
    exit /b 1
)

echo Ollama is running!
echo.

echo Checking for Nemotron model...
ollama list | find "nemotron" >nul
if %errorlevel% neq 0 (
    echo Nemotron model not found. Installing...
    echo This may take a few minutes...
    ollama pull nemotron
) else (
    echo Nemotron model is installed!
)

echo.
echo Starting GPU Code Optimizer AI...
echo.
echo The application will open at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

C:\Python313\python.exe app.py
