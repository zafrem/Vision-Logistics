@echo off
REM Vision Logistics System - Windows Batch Launcher
REM Supports fallback mode for environments without Docker

setlocal enabledelayedexpansion

set "FALLBACK_MODE=false"
set "COMMAND=start"

REM Parse arguments
:parse_args
if "%1"=="--fallback" (
    set "FALLBACK_MODE=true"
    shift
    goto parse_args
)
if "%1"=="--no-docker" (
    set "FALLBACK_MODE=true"
    shift
    goto parse_args
)
if "%1"=="stop" (
    set "COMMAND=stop"
    shift
    goto parse_args
)
if "%1"=="status" (
    set "COMMAND=status"
    shift
    goto parse_args
)
if "%1"=="" goto main

:main
echo.
echo 🚀 Vision Logistics System - Windows Launcher
echo ============================================

REM Check prerequisites
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js is required but not installed
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: npm is required but not installed
    echo Please install npm or use the Node.js installer which includes npm
    pause
    exit /b 1
)

echo ✓ Node.js and npm are available

if "%COMMAND%"=="stop" goto stop_services
if "%COMMAND%"=="status" goto show_status

REM Start services
echo.
echo 📦 Installing dependencies...
call npm install >nul 2>&1
call npm install --workspace=collector >nul 2>&1
call npm install --workspace=manager >nul 2>&1  
call npm install --workspace=ui >nul 2>&1

if "%FALLBACK_MODE%"=="true" (
    echo.
    echo 🔄 Starting in fallback mode (no Docker required)
    echo This mode uses in-memory services for development/testing
    node scripts/start.js --fallback
) else (
    echo.
    echo 🐳 Checking Docker availability...
    docker --version >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Docker not found - switching to fallback mode
        echo This will use in-memory services instead of Docker containers
        timeout /t 3 /nobreak >nul
        node scripts/start.js --fallback
    ) else (
        echo ✓ Docker is available
        node scripts/start.js
    )
)

goto end

:stop_services
echo.
echo 🛑 Stopping all services...
node scripts/start.js stop
goto end

:show_status
echo.
echo 📊 System Status
echo ===============
netstat -an | findstr ":3000 " >nul 2>&1 && echo ✓ UI Service: Running on port 3000 || echo ✗ UI Service: Not running
netstat -an | findstr ":3001 " >nul 2>&1 && echo ✓ Collector Service: Running on port 3001 || echo ✗ Collector Service: Not running
netstat -an | findstr ":3002 " >nul 2>&1 && echo ✓ Manager Service: Running on port 3002 || echo ✗ Manager Service: Not running
echo.
echo 🌐 If services are running, access at:
echo   • UI Dashboard: http://localhost:3000
echo   • Collector API: http://localhost:3001  
echo   • Manager API: http://localhost:3002
goto end

:end
echo.
echo 📖 Usage:
echo   start.bat                   - Start system (with Docker if available)
echo   start.bat --fallback        - Start with in-memory services (no Docker)  
echo   start.bat stop              - Stop all services
echo   start.bat status            - Show service status
echo.
echo 💡 Tips:
echo   • Use Ctrl+C to stop services when running
echo   • Check README.md for detailed documentation
echo   • Generate test data: npm run generate-test-data

if "%COMMAND%"=="start" (
    echo.
    echo Press any key to exit...
    pause >nul
)

endlocal