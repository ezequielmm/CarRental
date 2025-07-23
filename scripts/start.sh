#!/bin/bash

# Car Rental System - Automated Startup Script
# This script initializes the complete system with one click

echo "=========================================="
echo "  Car Rental System - Startup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    print_step "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi

    print_status "Docker is installed and running."
}

# Check if Docker Compose is available
check_docker_compose() {
    print_step "Checking Docker Compose installation..."
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose and try again."
        exit 1
    fi

    print_status "Docker Compose is available."
}

# Clean up existing containers and volumes if requested
cleanup() {
    if [[ "$1" == "--clean" ]]; then
        print_step "Cleaning up existing containers and volumes..."
        
        # Stop and remove containers
        docker-compose down --volumes --remove-orphans 2>/dev/null || docker compose down --volumes --remove-orphans 2>/dev/null
        
        # Remove images if they exist
        docker rmi carrental-backend carrental-frontend 2>/dev/null || true
        
        # Prune unused volumes
        docker volume prune -f
        
        print_status "Cleanup completed."
    fi
}

# Build and start services
start_services() {
    print_step "Building and starting Car Rental services..."
    
    # Use docker-compose or docker compose based on what's available
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi

    # Build and start services
    $COMPOSE_CMD up --build -d

    if [ $? -ne 0 ]; then
        print_error "Failed to start services. Please check the logs."
        exit 1
    fi

    print_status "Services are starting up..."
}

# Wait for services to be healthy
wait_for_services() {
    print_step "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for database to be ready..."
    timeout=300
    while [ $timeout -gt 0 ]; do
        if docker exec carrental-database /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'CarRental123!' -Q "SELECT 1" &> /dev/null; then
            break
        fi
        sleep 5
        timeout=$((timeout-5))
    done

    if [ $timeout -le 0 ]; then
        print_error "Database failed to start within timeout period."
        exit 1
    fi

    print_status "Database is ready."

    # Wait for backend API
    print_status "Waiting for backend API to be ready..."
    timeout=180
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:5000/health &> /dev/null; then
            break
        fi
        sleep 5
        timeout=$((timeout-5))
    done

    if [ $timeout -le 0 ]; then
        print_warning "Backend API health check timeout. It may still be starting."
    else
        print_status "Backend API is ready."
    fi

    # Wait for frontend
    print_status "Waiting for frontend to be ready..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost/health &> /dev/null; then
            break
        fi
        sleep 5
        timeout=$((timeout-5))
    done

    if [ $timeout -le 0 ]; then
        print_warning "Frontend health check timeout. It may still be starting."
    else
        print_status "Frontend is ready."
    fi
}

# Display service information
show_service_info() {
    print_step "Service Information:"
    echo ""
    echo "🌐 Frontend Application:"
    echo "   URL: http://localhost"
    echo "   Alternative: http://localhost:4200"
    echo ""
    echo "🔧 Backend API:"
    echo "   URL: http://localhost:5000"
    echo "   Swagger: http://localhost:5000/swagger"
    echo "   Health: http://localhost:5000/health"
    echo ""
    echo "🗄️  Database:"
    echo "   Server: localhost,1433"
    echo "   Username: sa"
    echo "   Password: CarRental123!"
    echo "   Database: CarRentalDb"
    echo ""
    echo "🔴 Redis Cache:"
    echo "   URL: localhost:6379"
    echo ""
    echo "📊 Container Status:"
    if command -v docker-compose &> /dev/null; then
        docker-compose ps
    else
        docker compose ps
    fi
}

# Display logs if requested
show_logs() {
    if [[ "$1" == "--logs" ]]; then
        print_step "Displaying service logs..."
        if command -v docker-compose &> /dev/null; then
            docker-compose logs -f
        else
            docker compose logs -f
        fi
    fi
}

# Main execution
main() {
    echo ""
    print_step "Starting Car Rental System deployment..."
    echo ""

    check_docker
    check_docker_compose
    cleanup "$1"
    start_services
    wait_for_services
    
    echo ""
    echo "=========================================="
    print_status "Car Rental System is now running!"
    echo "=========================================="
    echo ""
    
    show_service_info
    
    echo ""
    print_status "To stop the system, run: ./scripts/stop.sh"
    print_status "To view logs, run: ./scripts/logs.sh"
    print_status "To restart, run: ./scripts/start.sh --clean"
    echo ""

    show_logs "$2"
}

# Handle script arguments
if [[ "$1" == "--help" ]]; then
    echo "Car Rental System Startup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean     Clean up existing containers and volumes before starting"
    echo "  --logs      Display logs after starting (follows log output)"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                Start the system normally"
    echo "  $0 --clean        Clean start (removes existing data)"
    echo "  $0 --clean --logs Clean start and follow logs"
    exit 0
fi

# Execute main function
main "$1" "$2"