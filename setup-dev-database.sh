#!/bin/bash

# 🛠️ Скрипт создания DEV базы данных на Hetzner сервере

SERVER_IP="135.181.148.104"
echo "🚀 Создание DEV базы данных на сервере $SERVER_IP"

echo "📋 Что будет создано:"
echo "   - База данных: slidebox_dev"
echo "   - Пользователь: slidebox_dev_user"
echo "   - Пароль: dev_secure_password"
echo ""

read -p "Продолжить? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Отменено"
    exit 1
fi

echo "🔧 Подключение к серверу и создание базы данных..."

# SSH команды для создания dev базы
ssh root@$SERVER_IP << 'EOF'
echo "📦 Подключение к PostgreSQL контейнеру..."

# Получаем ID контейнера PostgreSQL
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.ID}}" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ PostgreSQL контейнер не найден!"
    exit 1
fi

echo "✅ Найден PostgreSQL контейнер: $POSTGRES_CONTAINER"

# Создание пользователя и базы данных
echo "🗄️ Создание dev пользователя и базы данных..."

docker exec -i $POSTGRES_CONTAINER psql -U slidebox_ad -d postgres << 'EOSQL'
-- Создание пользователя для dev
CREATE USER slidebox_dev_user WITH PASSWORD 'dev_secure_password';

-- Создание базы данных для dev
CREATE DATABASE slidebox_dev OWNER slidebox_dev_user;

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE slidebox_dev TO slidebox_dev_user;

-- Дополнительные права для схемы public
\c slidebox_dev
GRANT ALL ON SCHEMA public TO slidebox_dev_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO slidebox_dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO slidebox_dev_user;

-- Проверка созданных объектов
\l
\du
EOSQL

echo "✅ Dev база данных создана успешно!"

# Проверка подключения
echo "🧪 Проверка подключения к dev базе..."
docker exec $POSTGRES_CONTAINER psql -U slidebox_dev_user -d slidebox_dev -c "SELECT version();"

if [ $? -eq 0 ]; then
    echo "✅ Подключение к dev базе работает!"
else
    echo "❌ Проблема с подключением к dev базе"
fi

EOF

echo ""
echo "🎉 DEV база данных настроена!"
echo ""
echo "📋 Данные для подключения:"
echo "   Хост: $SERVER_IP:5432"
echo "   База: slidebox_dev"
echo "   Пользователь: slidebox_dev_user"
echo "   Пароль: dev_secure_password"
echo ""
echo "🔧 CONNECTION STRING для .env.local:"
echo 'DATABASE_URL="postgresql://slidebox_dev_user:dev_secure_password@135.181.148.104:5432/slidebox_dev?schema=public"'
</rewritten_file> 