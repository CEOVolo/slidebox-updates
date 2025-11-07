# 🛠️ Скрипт быстрой настройки локальной разработки SlideDeck 2.0

Write-Host "🚀 Настройка локального окружения для разработки..." -ForegroundColor Green

# 1. Проверка наличия Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker не установлен. Установите Docker Desktop." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose не установлен." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker установлен" -ForegroundColor Green

# 2. Создание .env.local если не существует
if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Создание .env.local..." -ForegroundColor Yellow
    
    $envContent = @"
# 🛠️ DEVELOPMENT ОКРУЖЕНИЕ - локальная разработка
NODE_ENV=development

# 🐘 База данных PostgreSQL (локальный Docker)
DATABASE_URL="postgresql://slidedeck_user:slidedeck_password@localhost:5432/slidedeck_dev?schema=public"

# 🎨 Figma API (тот же токен для разработки)
FIGMA_ACCESS_TOKEN="your_figma_token_here"

# 🔐 NextAuth настройки (разработка)
NEXTAUTH_SECRET="dev_secret_bonobo_1345"
NEXTAUTH_URL="http://localhost:3000"

# 🐛 Debug режим (включен для разработки)
DEBUG=true

# 📊 Логирование
LOG_LEVEL=debug
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ .env.local создан" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local уже существует" -ForegroundColor Green
}

# 3. Запуск PostgreSQL контейнера
Write-Host "🐘 Запуск PostgreSQL..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d

# Ожидание готовности базы данных
Write-Host "⏳ Ожидание готовности базы данных..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 4. Установка зависимостей
Write-Host "📦 Установка зависимостей..." -ForegroundColor Yellow
npm install

# 5. Применение миграций
Write-Host "🔄 Применение миграций к базе данных..." -ForegroundColor Yellow
npx prisma migrate dev --name init

# 6. Генерация Prisma Client
Write-Host "⚙️ Генерация Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# 7. Проверка статуса
Write-Host "🔍 Проверка статуса..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "🎉 Локальная разработка настроена!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Следующие шаги:" -ForegroundColor Cyan
Write-Host "   npm run dev           # Запуск Next.js" -ForegroundColor White
Write-Host "   npx prisma studio     # Просмотр базы данных" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Приложение будет доступно на: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🗄️ База данных: localhost:5432 (slidedeck_dev)" -ForegroundColor Cyan 