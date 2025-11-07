# SlideDeck 2.0 - Database Status Check
# This script checks the status of both development and production databases

Write-Host "🔍 SlideDeck 2.0 Database Status Check" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray

# Configuration
$REMOTE_HOST = "135.181.148.104"
$DEV_DB = "slidebox_dev"
$PROD_DB = "slidebox_prod"

Write-Host ""
Write-Host "📊 Database Configuration:" -ForegroundColor Yellow
Write-Host "   Remote Host: $REMOTE_HOST:5432" -ForegroundColor Cyan
Write-Host "   Development DB: $DEV_DB" -ForegroundColor Cyan
Write-Host "   Production DB: $PROD_DB" -ForegroundColor Cyan
Write-Host ""

# 1. Check environment files
Write-Host "📁 Environment Configuration:" -ForegroundColor Yellow

if (Test-Path ".env.local") {
    Write-Host "✅ .env.local exists" -ForegroundColor Green
    
    $dbUrl = (Get-Content ".env.local" | Where-Object { $_ -match "DATABASE_URL" }) -replace "DATABASE_URL=", "" -replace '"', ''
    $authUrl = (Get-Content ".env.local" | Where-Object { $_ -match "NEXTAUTH_URL" }) -replace "NEXTAUTH_URL=", "" -replace '"', ''
    
    Write-Host "   DATABASE_URL: $dbUrl" -ForegroundColor Cyan
    Write-Host "   NEXTAUTH_URL: $authUrl" -ForegroundColor Cyan
    
    # Check if using correct password
    if ($dbUrl -match "andersen_win") {
        Write-Host "✅ Using correct password" -ForegroundColor Green
    } elseif ($dbUrl -match "dev_secure_password") {
        Write-Host "⚠️  Using old password - need to update" -ForegroundColor Yellow
        Write-Host "   Run: .\scripts\setup-remote-dev.ps1" -ForegroundColor Gray
    } else {
        Write-Host "❓ Unknown password in DATABASE_URL" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env.local not found" -ForegroundColor Red
    Write-Host "   Run: .\scripts\setup-remote-dev.ps1" -ForegroundColor Yellow
}

Write-Host ""

# 2. Check network connectivity
Write-Host "🌐 Network Connectivity:" -ForegroundColor Yellow

try {
    $connection = Test-NetConnection -ComputerName $REMOTE_HOST -Port 5432 -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "✅ Port 5432 is accessible on $REMOTE_HOST" -ForegroundColor Green
    } else {
        Write-Host "❌ Cannot reach $REMOTE_HOST on port 5432" -ForegroundColor Red
        Write-Host "   Check server firewall and PostgreSQL configuration" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Network test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. Check database connection
Write-Host "🗄️ Database Connection:" -ForegroundColor Yellow

if (Test-Path ".env.local") {
    try {
        $pullResult = npx prisma db pull 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Development database connection successful" -ForegroundColor Green
            
            # Count tables
            $tableCount = ($pullResult | Select-String "Introspected \d+ models").Matches.Value
            if ($tableCount) {
                Write-Host "   $tableCount found in database" -ForegroundColor Cyan
            }
        } else {
            Write-Host "❌ Development database connection failed" -ForegroundColor Red
            Write-Host "   Error: $pullResult" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Database test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Skipping database test (no .env.local)" -ForegroundColor Yellow
}

Write-Host ""

# 4. Check local development server
Write-Host "🖥️ Local Development:" -ForegroundColor Yellow

# Check if Next.js is running
$nextProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*Next.js*" }
if ($nextProcess) {
    Write-Host "✅ Next.js development server is running" -ForegroundColor Green
} else {
    Write-Host "⏹️  Next.js development server is not running" -ForegroundColor Yellow
    Write-Host "   Start with: npm run dev" -ForegroundColor Gray
}

# Check port 3000
try {
    $webRequest = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Application accessible at http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Application not accessible at http://localhost:3000" -ForegroundColor Red
}

# Check port 5555 (Prisma Studio)
try {
    $studioRequest = Invoke-WebRequest -Uri "http://localhost:5555" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Prisma Studio running at http://localhost:5555" -ForegroundColor Green
} catch {
    Write-Host "⏹️  Prisma Studio not running" -ForegroundColor Yellow
    Write-Host "   Start with: npx prisma studio" -ForegroundColor Gray
}

Write-Host ""

# 5. Check Prisma status
Write-Host "⚙️ Prisma Status:" -ForegroundColor Yellow

if (Test-Path "node_modules\.prisma\client") {
    Write-Host "✅ Prisma Client is generated" -ForegroundColor Green
} else {
    Write-Host "❌ Prisma Client not found" -ForegroundColor Red
    Write-Host "   Run: npx prisma generate" -ForegroundColor Yellow
}

# Check if schema is in sync
try {
    $statusResult = npx prisma migrate status 2>&1
    if ($statusResult -match "No pending migrations") {
        Write-Host "✅ Database schema is up to date" -ForegroundColor Green
    } elseif ($statusResult -match "pending migrations") {
        Write-Host "⚠️  Pending migrations found" -ForegroundColor Yellow
        Write-Host "   Run: npx prisma db push" -ForegroundColor Gray
    } else {
        Write-Host "❓ Migration status unclear" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❓ Could not check migration status" -ForegroundColor Yellow
}

Write-Host ""

# 6. Summary and recommendations
Write-Host "🎯 Summary:" -ForegroundColor Cyan

$issues = @()
if (-not (Test-Path ".env.local")) { $issues += "Missing .env.local" }
if (-not $connection.TcpTestSucceeded) { $issues += "Network connectivity" }
if ($LASTEXITCODE -ne 0 -and (Test-Path ".env.local")) { $issues += "Database connection" }

if ($issues.Count -eq 0) {
    Write-Host "✅ All checks passed! Development environment is ready." -ForegroundColor Green
} else {
    Write-Host "⚠️  Issues found: $($issues -join ', ')" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 Recommended actions:" -ForegroundColor Cyan
    Write-Host "   1. Run: .\scripts\setup-remote-dev.ps1" -ForegroundColor White
    Write-Host "   2. Verify server configuration" -ForegroundColor White
    Write-Host "   3. Check DATABASE_ARCHITECTURE.md for troubleshooting" -ForegroundColor White
}

Write-Host ""
Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "   Application: http://localhost:3000" -ForegroundColor White
Write-Host "   Database Browser: http://localhost:5555" -ForegroundColor White
Write-Host "   Documentation: DATABASE_ARCHITECTURE.md" -ForegroundColor White 