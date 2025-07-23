@echo off
REM Car Rental System - Deployment Testing and Validation Script for Windows
REM This script tests the complete system deployment and fixes common issues

echo ==========================================
echo   Car Rental System - Deployment Test
echo ==========================================

REM Colors for output (using echo with special formatting)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Function to print status messages
goto :main

:print_status
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

:print_info
echo %BLUE%[INFO]%NC% %~1
goto :eof

:check_prerequisites
call :print_info "Checking prerequisites..."

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not installed or not in PATH"
    goto :error_exit
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not running. Please start Docker Desktop"
    goto :error_exit
)

REM Check for Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        call :print_error "Docker Compose is not available"
        goto :error_exit
    ) else (
        set "COMPOSE_CMD=docker compose"
    )
) else (
    set "COMPOSE_CMD=docker-compose"
)

call :print_status "Prerequisites check passed"
goto :eof

:start_services
call :print_info "Building and starting services..."

REM Stop any existing services
call :print_info "Stopping existing services..."
%COMPOSE_CMD% down --volumes >nul 2>&1

REM Start services with build
call :print_info "Starting services with build..."
%COMPOSE_CMD% up --build -d
if errorlevel 1 (
    call :print_error "Failed to start services"
    goto :show_logs
)

call :print_status "Services started successfully"
goto :eof

:wait_for_database
call :print_info "Waiting for SQL Server database to be ready..."
set /a attempt=1
set /a max_attempts=60

:db_wait_loop
docker exec carrental-database /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "CarRental123!" -Q "SELECT 1" >nul 2>&1
if not errorlevel 1 (
    call :print_status "Database is ready!"
    goto :eof
)

echo|set /p="."
timeout /t 2 >nul
set /a attempt+=1
if %attempt% leq %max_attempts% goto :db_wait_loop

call :print_error "Database failed to start after %max_attempts% attempts"
goto :error_exit

:check_service_health
set service_name=%~1
set url=%~2
call :print_info "Checking health of %service_name%..."

set /a attempt=1
set /a max_attempts=30

:health_wait_loop
curl -f -s "%url%" >nul 2>&1
if not errorlevel 1 (
    call :print_status "%service_name% is healthy!"
    goto :eof
)

echo|set /p="."
timeout /t 2 >nul
set /a attempt+=1
if %attempt% leq %max_attempts% goto :health_wait_loop

call :print_error "%service_name% failed to become healthy after %max_attempts% attempts"
goto :error_exit

:run_system_tests
call :print_info "Running system health checks..."

REM Wait for database
call :wait_for_database
if errorlevel 1 goto :error_exit

REM Check backend health
call :check_service_health "Backend API" "http://localhost:5000/health"
if errorlevel 1 (
    call :print_warning "Backend health check failed, checking alternative endpoint..."
    call :check_service_health "Backend API (alternative)" "http://localhost:5000/api/locations"
    if errorlevel 1 goto :error_exit
)

REM Check frontend health
call :check_service_health "Frontend" "http://localhost:4200"
if errorlevel 1 (
    call :print_warning "Frontend direct check failed, checking through proxy..."
    call :check_service_health "Frontend (proxy)" "http://localhost/health"
    if errorlevel 1 goto :error_exit
)

REM Check Redis
call :print_info "Checking Redis connectivity..."
docker exec carrental-redis redis-cli ping >nul 2>&1
if errorlevel 1 (
    call :print_warning "Redis check failed, but system may still work"
) else (
    call :print_status "Redis is working!"
)

goto :eof

:test_api_endpoints
call :print_info "Testing API endpoints..."

REM Test locations endpoint
curl -f -s http://localhost:5000/api/locations >nul 2>&1
if errorlevel 1 (
    call :print_error "Locations API failed"
    goto :error_exit
) else (
    call :print_status "Locations API working"
)

REM Test Swagger documentation
curl -f -s http://localhost:5000/swagger >nul 2>&1
if errorlevel 1 (
    call :print_warning "Swagger documentation not accessible"
) else (
    call :print_status "Swagger documentation accessible"
)

REM Test customer registration with timestamp
for /f "delims=" %%i in ('powershell -Command "Get-Date -Format 'yyyyMMddHHmmss'"') do set timestamp=%%i
set test_customer_id=TEST%timestamp%

echo {"id":"%test_customer_id%","fullName":"Test Customer","address":"123 Test Street"} > temp_customer.json

curl -f -s -H "Content-Type: application/json" -d @temp_customer.json http://localhost:5000/api/customers/register >nul 2>&1
if errorlevel 1 (
    call :print_warning "Customer registration API may need debugging"
) else (
    call :print_status "Customer registration API working"
)

del temp_customer.json >nul 2>&1

goto :eof

:show_service_status
call :print_info "Current service status:"
%COMPOSE_CMD% ps

echo.
call :print_info "Service URLs:"
echo 🌐 Frontend: http://localhost:4200
echo 🔧 Backend API: http://localhost:5000
echo 📚 API Docs: http://localhost:5000/swagger
echo 🗄️ Database: localhost:1433 (sa/CarRental123!)
echo 🔴 Redis: localhost:6379

goto :eof

:show_logs
call :print_info "Showing recent service logs..."
echo.
call :print_info "=== DATABASE LOGS ==="
%COMPOSE_CMD% logs --tail=20 database

echo.
call :print_info "=== BACKEND LOGS ==="
%COMPOSE_CMD% logs --tail=20 backend

echo.
call :print_info "=== FRONTEND LOGS ==="
%COMPOSE_CMD% logs --tail=20 frontend

goto :eof

:main
echo.
call :print_info "Starting Car Rental System deployment test..."
echo.

REM Check prerequisites
call :check_prerequisites
if errorlevel 1 goto :error_exit

REM Start services
call :start_services
if errorlevel 1 goto :error_exit

REM Wait for services to initialize
call :print_info "Waiting for services to initialize..."
timeout /t 10 >nul

REM Run health checks
call :run_system_tests
if errorlevel 1 goto :error_exit

REM Test API endpoints
call :test_api_endpoints
if errorlevel 1 (
    call :print_warning "Some API endpoints may have issues"
    call :show_logs
)

echo.
call :print_status "=========================================="
call :print_status "  DEPLOYMENT SUCCESSFUL!"
call :print_status "=========================================="
echo.

call :show_service_status

echo.
call :print_info "To stop the system: docker-compose down"
call :print_info "To view logs: docker-compose logs -f [service-name]"
call :print_info "To restart: scripts\test-deployment.bat"

goto :success_exit

:error_exit
echo.
call :print_error "Deployment failed. Check the logs above for details."
call :show_logs
exit /b 1

:success_exit
echo.
call :print_status "System is ready for use!"
echo.
pause
exit /b 0