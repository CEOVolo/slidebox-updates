# 🗄️ Архитектура баз данных SlideDeck 2.0

## 📋 Обновленная архитектура

**ДВЕ** базы данных на **ОДНОМ** Hetzner сервере:

- **🛠️ Development**: `slidebox_dev` - для локальной разработки
- **🚀 Production**: `slidebox_prod` - для продакшена

## 🎯 Схема подключений

```
🖥️ Ваш компьютер (разработка)
└── 📡 135.181.148.104:5432
    ├── 🛠️ slidebox_dev (Development)
    └── 🚀 slidebox_prod (Production)

🌐 Hetzner сервер (продакшн)
└── 📡 localhost:5432  
    ├── 🛠️ slidebox_dev (Development)
    └── 🚀 slidebox_prod (Production)
```

## 🔄 Данные подключений

### 🛠️ Development база
```
Хост: 135.181.148.104:5432
База: slidebox_dev
Пользователь: slidebox_dev_user
Пароль: dev_secure_password
```

### 🚀 Production база
```
Хост: 135.181.148.104:5432
База: slidebox_prod
Пользователь: slidebox_ad
Пароль: andersen_win
```

## 🚀 Пошаговая настройка

### Шаг 1: Создание dev базы на сервере

**Выполните на сервере Hetzner:**

```bash
# Скачайте скрипт на сервер
wget https://your-repo/setup-dev-database.sh
chmod +x setup-dev-database.sh

# Или выполните команды вручную:
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.ID}}" | head -1)

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
EOSQL
```

### Шаг 2: Настройка локальной разработки

**На вашем компьютере:**

```bash
# Запустите PowerShell скрипт
.\scripts\dev-with-remote-db.ps1

# Или создайте .env.local вручную:
```

**Содержимое .env.local:**
```env
NODE_ENV=development
DATABASE_URL="postgresql://slidebox_dev_user:dev_secure_password@135.181.148.104:5432/slidebox_dev?schema=public"
FIGMA_ACCESS_TOKEN="your_figma_token_here"
NEXTAUTH_SECRET="dev_secret_bonobo_1345"
NEXTAUTH_URL="http://localhost:3000"
DEBUG=true
```

### Шаг 3: Применение миграций

```bash
# Генерация Prisma Client
npx prisma generate

# Применение миграций к dev базе
npx prisma migrate dev

# Запуск приложения
npm run dev
```

## 🛡️ Безопасность и изоляция

### ✅ Преимущества новой архитектуры:

1. **Одинаковый PostgreSQL** в dev и prod
2. **Полная изоляция данных** между окружениями
3. **Удаленный доступ** - работает из любого места
4. **Единое управление** - обе базы на одном сервере

### 🔒 Правила безопасности:

1. **РАЗНЫЕ пользователи** для dev и prod
2. **РАЗНЫЕ пароли** для каждого окружения
3. **НИКОГДА** не путайте DATABASE_URL
4. **ВСЕГДА** проверяйте какая база активна

## 🧪 Проверка подключений

### Проверка dev базы:
```bash
# Проверка подключения
npx prisma db pull

# Просмотр данных
npx prisma studio

# Проверка через psql
psql "postgresql://slidebox_dev_user:dev_secure_password@135.181.148.104:5432/slidebox_dev"
```

### Проверка prod базы:
```bash
# ТОЛЬКО ДЛЯ ЧТЕНИЯ!
DATABASE_URL="postgresql://slidebox_ad:andersen_win@135.181.148.104:5432/slidebox_prod" npx prisma studio
```

## 🔄 Переключение между базами

### Быстрое переключение:

```bash
# Dev база (по умолчанию в .env.local)
npm run dev

# Prod база (временно для просмотра)
$env:DATABASE_URL="postgresql://slidebox_ad:andersen_win@135.181.148.104:5432/slidebox_prod"
npx prisma studio
```

## 📊 Мониторинг

### Полезные команды:

```bash
# Статус подключений на сервере
docker exec [postgres_container] psql -U slidebox_ad -d postgres -c "SELECT datname, usename, application_name, client_addr FROM pg_stat_activity WHERE datname IN ('slidebox_dev', 'slidebox_prod');"

# Размер баз данных
docker exec [postgres_container] psql -U slidebox_ad -d postgres -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) as size FROM pg_database WHERE datname IN ('slidebox_dev', 'slidebox_prod');"
```

## 🚨 Troubleshooting

### Проблема: "connection refused"
```bash
# Проверьте порт на сервере
netstat -tulpn | grep :5432

# Проверьте firewall
ufw status

# Откройте порт если нужно
ufw allow 5432
```

### Проблема: "authentication failed"
```bash
# Проверьте пользователей в базе
docker exec [postgres_container] psql -U slidebox_ad -d postgres -c "\du"

# Пересоздайте пользователя
docker exec [postgres_container] psql -U slidebox_ad -d postgres -c "DROP USER IF EXISTS slidebox_dev_user; CREATE USER slidebox_dev_user WITH PASSWORD 'dev_secure_password';"
```

## 📈 Бэкапы

### Автоматические бэкапы:

```bash
# Бэкап dev базы
docker exec [postgres_container] pg_dump -U slidebox_dev_user slidebox_dev > backup_dev_$(date +%Y%m%d).sql

# Бэкап prod базы  
docker exec [postgres_container] pg_dump -U slidebox_ad slidebox_prod > backup_prod_$(date +%Y%m%d).sql
```

---

**🎯 Результат**: Теперь у вас полноценное разделение dev/prod с одинаковой PostgreSQL, но изолированными данными! 