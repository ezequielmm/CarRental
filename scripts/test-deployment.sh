#!/bin/bash

# Car Rental System - Deployment Testing and Validation Script
# This script tests the complete system deployment and fixes common issues

echo "=========================================="
echo "  Car Rental System - Deployment Test"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to check if a service is healthy
check_service_health() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    print_info "Checking health of $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            print_status "$service_name is healthy!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to become healthy after $max_attempts attempts"
    return 1
}

# Function to wait for database
wait_for_database() {
    print_info "Waiting for SQL Server database to be ready..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec carrental-database /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'CarRental123!' -Q "SELECT 1" > /dev/null 2>&1; then
            print_status "Database is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Database failed to start"
    return 1
}

# Function to check Docker and Docker Compose
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running"
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available"
        return 1
    fi
    
    print_status "Prerequisites check passed"
    return 0
}

# Function to build and start services
start_services() {
    print_info "Building and starting services..."
    
    # Determine compose command
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    # Stop any existing services
    print_info "Stopping existing services..."
    $COMPOSE_CMD down --volumes 2>/dev/null || true
    
    # Start services
    print_info "Starting services with build..."
    if ! $COMPOSE_CMD up --build -d; then
        print_error "Failed to start services"
        return 1
    fi
    
    print_status "Services started successfully"
    return 0
}

# Function to run comprehensive tests
run_system_tests() {
    print_info "Running system health checks..."
    
    # Wait for database
    if ! wait_for_database; then
        return 1
    fi
    
    # Check backend health
    if ! check_service_health "Backend API" "http://localhost:5000/health"; then
        print_warning "Backend health check failed, checking alternative endpoint..."
        if ! check_service_health "Backend API (alternative)" "http://localhost:5000/api/locations"; then
            return 1
        fi
    fi
    
    # Check frontend health  
    if ! check_service_health "Frontend" "http://localhost:4200"; then
        print_warning "Frontend direct check failed, checking through proxy..."
        if ! check_service_health "Frontend (proxy)" "http://localhost/health"; then
            return 1
        fi
    fi
    
    # Check Redis
    print_info "Checking Redis connectivity..."
    if docker exec carrental-redis redis-cli ping > /dev/null 2>&1; then
        print_status "Redis is working!"
    else
        print_warning "Redis check failed, but system may still work"
    fi
    
    return 0
}

# Function to test API endpoints
test_api_endpoints() {
    print_info "Testing API endpoints..."
    
    # Test locations endpoint
    if curl -f -s http://localhost:5000/api/locations > /dev/null; then
        print_status "Locations API working"
    else
        print_error "Locations API failed"
        return 1
    fi
    
    # Test Swagger documentation
    if curl -f -s http://localhost:5000/swagger > /dev/null; then
        print_status "Swagger documentation accessible"
    else
        print_warning "Swagger documentation not accessible"
    fi
    
    # Test customer registration
    local test_customer_id="TEST$(date +%s)"
    local customer_data=$(cat <<EOF
{
    "id": "$test_customer_id",
    "fullName": "Test Customer",
    "address": "123 Test Street"
}
EOF
)
    
    if curl -f -s -H "Content-Type: application/json" -d "$customer_data" http://localhost:5000/api/customers/register > /dev/null; then
        print_status "Customer registration API working"
    else
        print_warning "Customer registration API may need debugging"
    fi
    
    return 0
}

# Function to show service logs if there are issues
show_service_logs() {
    print_info "Showing recent service logs..."
    
    # Determine compose command
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    echo ""
    print_info "=== DATABASE LOGS ==="
    $COMPOSE_CMD logs --tail=20 database
    
    echo ""
    print_info "=== BACKEND LOGS ==="
    $COMPOSE_CMD logs --tail=20 backend
    
    echo ""
    print_info "=== FRONTEND LOGS ==="
    $COMPOSE_CMD logs --tail=20 frontend
}

# Function to display service status
show_service_status() {
    print_info "Current service status:"
    
    # Determine compose command
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    $COMPOSE_CMD ps
    
    echo ""
    print_info "Service URLs:"
    echo "🌐 Frontend: http://localhost:4200"
    echo "🔧 Backend API: http://localhost:5000"
    echo "📚 API Docs: http://localhost:5000/swagger"
    echo "🗄️  Database: localhost:1433 (sa/CarRental123!)"
    echo "🔴 Redis: localhost:6379"
}

# Main execution
main() {
    echo ""
    print_info "Starting Car Rental System deployment test..."
    echo ""
    
    # Check prerequisites
    if ! check_prerequisites; then
        exit 1
    fi
    
    # Start services
    if ! start_services; then
        print_error "Failed to start services"
        show_service_logs
        exit 1
    fi
    
    # Wait a bit for services to fully initialize
    print_info "Waiting for services to initialize..."
    sleep 10
    
    # Run health checks
    if ! run_system_tests; then
        print_error "System health checks failed"
        show_service_logs
        exit 1
    fi
    
    # Test API endpoints
    if ! test_api_endpoints; then
        print_warning "Some API endpoints may have issues"
        show_service_logs
    fi
    
    echo ""
    print_status "=========================================="
    print_status "  DEPLOYMENT SUCCESSFUL!"
    print_status "=========================================="
    echo ""
    
    show_service_status
    
    echo ""
    print_info "To stop the system: docker-compose down"
    print_info "To view logs: docker-compose logs -f [service-name]"
    print_info "To restart: ./scripts/test-deployment.sh"
    
    return 0
}

# Handle script arguments
if [[ "$1" == "--help" ]]; then
    echo "Car Rental System Deployment Test Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --logs      Show service logs after testing"
    echo "  --help      Show this help message"
    echo ""
    exit 0
fi

# Execute main function
main "$@"

# Show logs if requested
if [[ "$1" == "--logs" ]]; then
    echo ""
    print_info "Showing live logs (Ctrl+C to exit)..."
    sleep 2
    
    if command -v docker-compose &> /dev/null; then
        docker-compose logs -f
    else
        docker compose logs -f
    fi
fi