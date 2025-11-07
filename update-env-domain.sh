#!/bin/bash

# Скрипт обновления переменных окружения для нового домена
DOMAIN="YOUR_DOMAIN.com"  # Замените на ваш домен

echo "🔧 Обновление переменных окружения..."

# Создание нового .env файла
cat > .env << EOF
NODE_ENV=production
DATABASE_URL="postgresql://slidebox_ad:andersen_win@postgres:5432/slidebox_prod?schema=public"
FIGMA_ACCESS_TOKEN="your_figma_token_here"
NEXTAUTH_SECRET="bonobo_1345"
NEXTAUTH_URL="https://$DOMAIN"
POSTGRES_USER=slidebox_ad
POSTGRES_PASSWORD=andersen_win
POSTGRES_DB=slidebox_prod
EOF

echo "✅ Переменные окружения обновлены!"
echo "🔄 Перезапуск контейнеров..."

# Перезапуск Docker контейнеров
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

echo "🚀 Приложение перезапущено с новым доменом!" 