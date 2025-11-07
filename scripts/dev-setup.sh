#!/bin/bash

# 🛠️ Скрипт быстрой настройки локальной разработки SlideDeck 2.0

echo "🚀 Настройка локального окружения для разработки..."

# 1. Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker Desktop."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен."
    exit 1
fi

echo "✅ Docker установлен"

# 2. Создание .env.local если не существует
if [ ! -f ".env.local" ]; then
    echo "📝 Создание .env.local..."
    cat > .env.local << EOF
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
EOF
    echo "✅ .env.local создан"
else
    echo "✅ .env.local уже существует"
fi

# 3. Запуск PostgreSQL контейнера
echo "🐘 Запуск PostgreSQL..."
docker-compose -f docker-compose.dev.yml up -d

# Ожидание готовности базы данных
echo "⏳ Ожидание готовности базы данных..."
sleep 10

# 4. Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

# 5. Применение миграций
echo "🔄 Применение миграций к базе данных..."
npx prisma migrate dev --name init

# 6. Генерация Prisma Client
echo "⚙️ Генерация Prisma Client..."
npx prisma generate

# 7. Проверка статуса
echo "🔍 Проверка статуса..."
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "🎉 Локальная разработка настроена!"
echo ""
echo "📋 Следующие шаги:"
echo "   npm run dev     # Запуск Next.js"
echo "   npx prisma studio  # Просмотр базы данных"
echo ""
echo "🌐 Приложение будет доступно на: http://localhost:3000"
echo "🗄️ База данных: localhost:5432 (slidedeck_dev)" 