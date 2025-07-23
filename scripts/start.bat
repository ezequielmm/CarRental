@echo off
REM Car Rental System - Simple Start Script for Windows
REM Quick deployment without extensive testing

echo ==========================================
echo   Car Rental System - Quick Start
echo ==========================================
echo.

echo [INFO] Starting Car Rental Management System...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)

echo [INFO] Docker is running. Starting services...

REM Check for Docker Compose command
docker-compose --version >nul 2>&1
if errorlevel 1 (
    set "COMPOSE_CMD=docker compose"
) else (
    set "COMPOSE_CMD=docker-compose"
)

REM Stop any existing services
echo [INFO] Stopping any existing services...
%COMPOSE_CMD% down --volumes >nul 2>&1

REM Start services with build
echo [INFO] Building and starting all services...
echo This may take a few minutes on first run...
%COMPOSE_CMD% up --build -d

if errorlevel 1 (
    echo [ERROR] Failed to start services
    echo.
    echo Showing logs for troubleshooting:
    %COMPOSE_CMD% logs
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Services are starting up!
echo.
echo Please wait 30-60 seconds for all services to initialize...
echo.
echo Service URLs:
echo   Frontend:     http://localhost:4200
echo   Backend API:  http://localhost:5000  
echo   API Docs:     http://localhost:5000/swagger
echo.

REM Wait a bit for services to start
timeout /t 10 >nul

REM Show status
echo Current service status:
%COMPOSE_CMD% ps

echo.
echo [INFO] To stop the system: docker-compose down
echo [INFO] To view logs: docker-compose logs -f
echo [INFO] For full testing: scripts\test-deployment.bat
echo.

pause