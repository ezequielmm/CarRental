# Car Rental System - Complete Deployment Instructions

## Prerequisites

Before running the system, ensure you have:

1. Docker Desktop installed and running
2. Git for version control
3. Terminal/Command Prompt access

### System Requirements:
- RAM: 4GB minimum (8GB recommended)
- Storage: 2GB free space
- Ports: 4200, 5000, 1433, 6379 available

---

## Quick Start (Recommended)

### Option 1: Automated Testing Script

```bash
cd car-rental-management-system
chmod +x scripts/*.sh
./scripts/test-deployment.sh
```

### Option 2: Manual Docker Compose

```bash
docker-compose up --build -d
docker-compose ps
docker-compose logs -f
docker-compose down
```

---

## Service URLs

Once deployed, access the system at:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:4200 | Main car rental website |
| Backend API | http://localhost:5000 | REST API endpoints |
| API Documentation | http://localhost:5000/swagger | Interactive API docs |
| Database | localhost:1433 | SQL Server (sa/CarRental123!) |
| Redis Cache | localhost:6379 | Redis caching service |

---

## Health Checks

### Automatic Health Monitoring

The system includes comprehensive health checks:

1. Database Connection: Verifies SQL Server is ready
2. API Health: Tests backend service endpoints
3. Frontend Accessibility: Confirms Angular app is served
4. Redis Connectivity: Validates caching service
5. API Integration: Tests actual API functionality

### Manual Health Verification

```bash
docker exec carrental-database /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'CarRental123!' -Q "SELECT 1"
curl http://localhost:5000/health
curl http://localhost:4200
docker exec carrental-redis redis-cli ping
curl http://localhost:5000/api/locations
```

---

## Testing the Complete System

### 1. Frontend Testing

Visit http://localhost:4200 and test:

- Home Page: Search for available cars
- Customer Registration: Register a new customer
- Rental Booking: Create a reservation
- Statistics: View analytics dashboard
- Service Management: Check maintenance schedule

### 2. API Testing

Use the Swagger UI at http://localhost:5000/swagger:

- Locations: GET /api/locations
- Customers: POST /api/customers/register
- Rentals: POST /api/rentals/check-availability
- Statistics: GET /api/statistics/cars

### 3. Integration Testing

```bash
curl -X POST http://localhost:5000/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{"id":"TEST001","fullName":"John Doe","address":"123 Test St"}'

curl -X POST http://localhost:5000/api/rentals/check-availability \
  -H "Content-Type: application/json" \
  -d '{"locationId":1,"startDate":"2024-12-01","endDate":"2024-12-05"}'
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use
```bash
netstat -tulpn | grep :4200
netstat -tulpn | grep :5000
sudo kill -9 <PID>
```

#### 2. Database Connection Issues
```bash
docker-compose restart database
docker-compose logs database
docker exec carrental-database /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'CarRental123!' -Q "SELECT @@VERSION"
```

#### 3. Frontend Build Errors
```bash
docker-compose build frontend --no-cache
docker-compose logs frontend
```

#### 4. Backend API Issues
```bash
docker-compose restart backend
docker-compose logs backend
docker exec carrental-backend dotnet --version
```

### Service-Specific Debugging

#### Check Service Status
```bash
docker-compose ps
```

#### View All Logs
```bash
docker-compose logs --tail=50
```

#### Restart Individual Service
```bash
docker-compose restart [service-name]
```

#### Rebuild Specific Service
```bash
docker-compose build [service-name] --no-cache
docker-compose up -d [service-name]
```

---

## Performance Monitoring

### Resource Usage
```bash
docker stats
docker stats carrental-backend carrental-frontend carrental-database
```

### API Performance
```bash
time curl http://localhost:5000/api/locations
ab -n 100 -c 10 http://localhost:5000/api/locations
```

---

## Security Considerations

### Production Deployment Notes:

1. Change Default Passwords: Update database and Redis passwords
2. Environment Variables: Use proper secrets management
3. HTTPS: Configure SSL certificates
4. Firewall Rules: Restrict port access
5. Resource Limits: Configure Docker resource constraints

### Environment Variables for Production:
```yaml
environment:
  - ConnectionStrings__DefaultConnection=Server=database;Database=CarRentalDb;User Id=sa;Password=${DB_PASSWORD};TrustServerCertificate=true
  - JwtSettings__SecretKey=${JWT_SECRET}
  - Redis__ConnectionString=redis:6379,password=${REDIS_PASSWORD}
```

---

## Advanced Operations

### Scaling Services
```bash
docker-compose up --scale backend=3 -d
docker-compose up --scale frontend=2 --scale backend=3 -d
```

### Database Operations
```bash
docker exec carrental-database /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'CarRental123!' -Q "BACKUP DATABASE CarRentalDb TO DISK = '/tmp/backup.bak'"
docker exec -it carrental-database /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'CarRental123!'
```

### Container Management
```bash
docker-compose down --volumes --remove-orphans
docker system prune -a
docker-compose pull
docker-compose up --build -d
```

---

## Success Indicators

### System is Working Correctly When:

1. All containers are running: `docker-compose ps` shows all services as "Up"
2. Health checks pass: All endpoints return successful responses
3. Frontend loads: Angular app displays without errors
4. API responds: Swagger UI accessible and endpoints working
5. Database connected: Can query locations and create customers
6. Redis functioning: Caching services operational

### Performance Benchmarks:

- API Response: < 500ms for most endpoints
- Frontend Load: < 3 seconds initial load
- Database Queries: < 100ms for simple operations
- Memory Usage: < 2GB total for all services

---

## Support and Maintenance

### Logs Location:
```bash
docker-compose logs [service-name]
docker system events
docker inspect carrental-backend
```

### Regular Maintenance:
```bash
docker system prune
docker-compose pull
docker-compose build --no-cache
./scripts/test-deployment.sh --logs
```
