# Dev Status Check Script

Write-Host "Checking SlideDeck 2.0 Development Status" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Gray

# 1. Check Docker containers
Write-Host "Docker containers:" -ForegroundColor Yellow

try {
    $containers = docker-compose -f docker-compose.dev.yml ps
    if ($containers -match "Up") {
        Write-Host $containers
        Write-Host "PostgreSQL container is running" -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL container is not running" -ForegroundColor Red
        Write-Host "Run: docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error checking Docker containers" -ForegroundColor Red
}

Write-Host ""

# 2. Check environment files
Write-Host "Environment variables:" -ForegroundColor Yellow

if (Test-Path ".env.local") {
    Write-Host ".env.local exists" -ForegroundColor Green
    
    $dbUrl = (Get-Content ".env.local" | Where-Object { $_ -match "DATABASE_URL" }) -replace "DATABASE_URL=", ""
    $authUrl = (Get-Content ".env.local" | Where-Object { $_ -match "NEXTAUTH_URL" }) -replace "NEXTAUTH_URL=", ""
    
    Write-Host "DATABASE_URL: $dbUrl" -ForegroundColor Cyan
    Write-Host "NEXTAUTH_URL: $authUrl" -ForegroundColor Cyan
} else {
    Write-Host ".env.local not found" -ForegroundColor Red
    Write-Host "Run: .\scripts\dev-setup.ps1" -ForegroundColor Yellow
}

Write-Host ""

# 3. Check ports
Write-Host "Port check:" -ForegroundColor Yellow

# Check port 5432 (PostgreSQL)
$port5432 = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if ($port5432) {
    Write-Host "Port 5432 (PostgreSQL) is in use" -ForegroundColor Green
} else {
    Write-Host "Port 5432 (PostgreSQL) is free" -ForegroundColor Red
}

# Check port 3000 (Next.js)
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "Port 3000 (Next.js) is in use" -ForegroundColor Green
} else {
    Write-Host "Port 3000 (Next.js) is free" -ForegroundColor Yellow
}

Write-Host ""

# 4. Useful commands
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "   npm run dev                    # Start Next.js" -ForegroundColor White
Write-Host "   npx prisma studio              # View database" -ForegroundColor White
Write-Host "   npx prisma migrate dev         # Apply migrations" -ForegroundColor White

Write-Host ""
Write-Host "Quick links:" -ForegroundColor Cyan
Write-Host "   App: http://localhost:3000" -ForegroundColor White
Write-Host "   Prisma Studio: http://localhost:5555" -ForegroundColor White 