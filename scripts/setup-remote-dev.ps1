# SlideDeck 2.0 - Remote Development Database Setup
# This script configures local development to use remote PostgreSQL database on Hetzner

Write-Host "🚀 Setting up SlideDeck 2.0 with remote development database..." -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

# Configuration
$REMOTE_HOST = "135.181.148.104"
$DEV_DB_NAME = "slidebox_dev"
$DEV_DB_USER = "slidebox_dev_user"
$DEV_DB_PASSWORD = "andersen_win"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Remote Host: $REMOTE_HOST" -ForegroundColor Cyan
Write-Host "   Database: $DEV_DB_NAME" -ForegroundColor Cyan
Write-Host "   User: $DEV_DB_USER" -ForegroundColor Cyan
Write-Host ""

# 1. Backup existing .env.local if it exists
if (Test-Path ".env.local") {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = ".env.local.backup_$timestamp"
    Copy-Item ".env.local" $backupFile
    Write-Host "✅ Backed up existing .env.local to $backupFile" -ForegroundColor Green
}

# 2. Create new .env.local with correct password
Write-Host "📝 Creating .env.local with remote database configuration..." -ForegroundColor Yellow

$envContent = @"
# DEVELOPMENT ENVIRONMENT - Remote dev database on Hetzner
NODE_ENV=development

# PostgreSQL Database (Remote dev database on Hetzner)
DATABASE_URL="postgresql://${DEV_DB_USER}:${DEV_DB_PASSWORD}@${REMOTE_HOST}:5432/${DEV_DB_NAME}?schema=public"

# Figma API
FIGMA_ACCESS_TOKEN="your_figma_token_here"

# NextAuth settings (development)
NEXTAUTH_SECRET="dev_secret_bonobo_1345"
NEXTAUTH_URL="http://localhost:3000"

# Debug mode (enabled for development)
DEBUG=true

# Logging
LOG_LEVEL=debug
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Created .env.local with remote database connection" -ForegroundColor Green

# 3. Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

# 4. Generate Prisma Client
Write-Host "⚙️ Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generated" -ForegroundColor Green

# 5. Test database connection
Write-Host "🧪 Testing database connection..." -ForegroundColor Yellow
$testResult = npx prisma db pull 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful!" -ForegroundColor Green
    Write-Host "📊 Found tables in remote database" -ForegroundColor Cyan
} else {
    Write-Host "❌ Database connection failed!" -ForegroundColor Red
    Write-Host "🔍 Please verify:" -ForegroundColor Yellow
    Write-Host "   1. Server is accessible: $REMOTE_HOST" -ForegroundColor White
    Write-Host "   2. Port 5432 is open" -ForegroundColor White
    Write-Host "   3. Database exists: $DEV_DB_NAME" -ForegroundColor White
    Write-Host "   4. User has permissions: $DEV_DB_USER" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Try running on server:" -ForegroundColor Yellow
    Write-Host "   ufw allow 5432" -ForegroundColor Gray
    Write-Host "   docker restart [postgres_container]" -ForegroundColor Gray
    exit 1
}

# 6. Apply schema if database is empty
Write-Host "🗄️ Checking database schema..." -ForegroundColor Yellow
if ($testResult -match "empty" -or $testResult -match "no tables") {
    Write-Host "📥 Database is empty, applying schema..." -ForegroundColor Yellow
    npx prisma db push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Schema applied successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to apply schema" -ForegroundColor Red
        Write-Host "💡 Try running: npx prisma db push --force-reset" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Database schema exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start development: npm run dev" -ForegroundColor White
Write-Host "   2. View database: npx prisma studio" -ForegroundColor White
Write-Host "   3. Access app: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "🗄️ Database information:" -ForegroundColor Cyan
Write-Host "   Development: ${DEV_DB_NAME}@${REMOTE_HOST}:5432" -ForegroundColor White
Write-Host "   Production: slidebox_prod@${REMOTE_HOST}:5432" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Cyan
Write-Host "   npx prisma studio          # Database browser" -ForegroundColor White
Write-Host "   npx prisma db push         # Apply schema changes" -ForegroundColor White
Write-Host "   npx prisma generate        # Regenerate client" -ForegroundColor White 