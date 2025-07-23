@echo off
REM Car Rental System - Stop Script for Windows

echo ==========================================
echo   Car Rental System - Stop Services
echo ==========================================
echo.

echo [INFO] Stopping all Car Rental services...

REM Check for Docker Compose command
docker-compose --version >nul 2>&1
if errorlevel 1 (
    set "COMPOSE_CMD=docker compose"
) else (
    set "COMPOSE_CMD=docker-compose"
)

REM Stop services and remove volumes
%COMPOSE_CMD% down --volumes

if errorlevel 1 (
    echo [ERROR] Failed to stop services
    pause
    exit /b 1
)

echo.
echo [SUCCESS] All services stopped successfully!
echo.
echo To restart: scripts\start.bat
echo.

pause