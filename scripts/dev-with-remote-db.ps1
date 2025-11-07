# Development setup with remote PostgreSQL database on Hetzner

Write-Host "Setting up development with remote database on Hetzner..." -ForegroundColor Green

# 1. Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host ".env.local already exists. Creating backup..." -ForegroundColor Yellow
    Copy-Item ".env.local" ".env.local.backup"
    Write-Host "Backup created: .env.local.backup" -ForegroundColor Cyan
}

# 2. Create .env.local for remote dev database
Write-Host "Creating .env.local for remote development database..." -ForegroundColor Yellow

$envContent = @"
# DEVELOPMENT ENVIRONMENT - Remote dev database on Hetzner
NODE_ENV=development

# PostgreSQL Database (Remote dev database on Hetzner)
DATABASE_URL="postgresql://slidebox_dev_user:dev_secure_password@135.181.148.104:5432/slidebox_dev?schema=public"

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
Write-Host "Created .env.local with remote database connection" -ForegroundColor Green

# 3. Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# 4. Generate Prisma Client
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# 5. Check database connection
Write-Host "Testing database connection..." -ForegroundColor Yellow
$testResult = npx prisma db pull --force 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database connection successful!" -ForegroundColor Green
} else {
    Write-Host "Database connection failed. Please check:" -ForegroundColor Red
    Write-Host "1. Server is accessible: 135.181.148.104:5432" -ForegroundColor Yellow
    Write-Host "2. Dev database exists: slidebox_dev" -ForegroundColor Yellow
    Write-Host "3. User has permissions: slidebox_dev_user" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run migrations: npx prisma migrate dev" -ForegroundColor White
Write-Host "2. Start development: npm run dev" -ForegroundColor White
Write-Host "3. View database: npx prisma studio" -ForegroundColor White
Write-Host ""
Write-Host "Database info:" -ForegroundColor Cyan
Write-Host "   Dev DB: slidebox_dev@135.181.148.104:5432" -ForegroundColor White
Write-Host "   Prod DB: slidebox_prod@135.181.148.104:5432" -ForegroundColor White 