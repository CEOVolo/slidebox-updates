# 🐋 ПОЛНАЯ ИНСТРУКЦИЯ: Развертывание SlideDeck 2.0 через Docker

## ⚠️ ВАЖНО: Переход с npm на Docker развертывание

Если вы уже развернули проект через npm, нужно **полностью очистить** старую установку перед Docker-развертыванием.

---

## 🧹 ШАГ 1: Очистка старого развертывания

### На сервере приложения:

```bash
# Остановите все Node.js процессы
sudo pkill -f node
sudo pkill -f npm
sudo pkill -f next

# Удалите PM2 процессы (если использовались)
pm2 delete all
pm2 kill

# Очистите порт 3000
sudo lsof -ti:3000 | xargs sudo kill -9

# Удалите старые файлы проекта (ОСТОРОЖНО!)
# Сделайте backup важных данных перед этим
sudo rm -rf /old/project/path
```

### На сервере базы данных:

```bash
# Сделайте BACKUP базы данных
pg_dump -U username database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Проверьте что PostgreSQL работает
sudo systemctl status postgresql
```

---

## 🚀 ШАГ 2: Подготовка серверов

### Требования:
- **Сервер 1** (Приложение): Docker, Docker Compose, Git
- **Сервер 2** (БД): PostgreSQL или Docker с PostgreSQL
- **Порты**: 3000 (приложение), 5432 (БД)

### Установка Docker (если не установлен):

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установите Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавьте пользователя в группу Docker
sudo usermod -aG docker $USER
newgrp docker

# Проверьте установку
docker --version
docker-compose --version
```

---

## 📦 ШАГ 3: Подготовка проекта

### Склонируйте или скопируйте проект:

```bash
# Выберите папку для проекта
cd /home/
mkdir -p slidedeck && cd slidedeck

# Клонируйте репозиторий
git clone [URL_РЕПОЗИТОРИЯ] .
# ИЛИ скопируйте файлы проекта

# Проверьте что все файлы на месте
ls -la
```

### Проверьте необходимые файлы:

```bash
# Должны быть:
ls -la docker-compose.prod.yml    # ✅
ls -la Dockerfile                 # ✅
ls -la package.json               # ✅
ls -la prisma/schema.prisma       # ✅
ls -la scripts/                   # ✅ папка со скриптами
```

**⚠️ ВАЖНО**: Если каких-то файлов нет, попросите разработчиков предоставить полный набор файлов проекта.

---

## ⚙️ ШАГ 4: Настройка переменных окружения

### Создайте `.env` файл:

```bash
# Создайте .env файл
nano .env
```

**Вставьте следующее содержимое:**

```env
# Database (для двух серверов)
DATABASE_URL=postgresql://slidedeck_user:your_strong_password@IP_СЕРВЕРА_БД:5432/slidedeck_prod

# ИЛИ для одного сервера (PostgreSQL в Docker)
# DATABASE_URL=postgresql://slidedeck_user:your_strong_password@postgres:5432/slidedeck_prod

# Figma Integration
FIGMA_ACCESS_TOKEN=your_figma_token_here

# NextAuth
NEXTAUTH_SECRET=your_very_long_random_secret_key_here
NEXTAUTH_URL=http://your_server_ip:3000

# PostgreSQL (для docker-compose)
POSTGRES_USER=slidedeck_user
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=slidedeck_prod

# Node Environment
NODE_ENV=production
```

### **❗ ОБЯЗАТЕЛЬНО замените значения:**
- `IP_СЕРВЕРА_БД` - IP адрес сервера с базой данных (если она на отдельном сервере)
- `your_strong_password` - надежный пароль для БД (минимум 12 символов)
- `your_figma_token_here` - токен Figma API (получите в Figma Developer Settings)
- `your_server_ip` - внешний IP сервера с приложением
- `your_very_long_random_secret_key_here` - случайная строка длиной минимум 32 символа

### Сгенерируйте секретные ключи:

```bash
# Генерация NEXTAUTH_SECRET
openssl rand -base64 32

# Генерация пароля БД
openssl rand -base64 16
```

---

## 🗄️ ШАГ 5: Настройка базы данных

### Вариант A: База данных на отдельном сервере

**На сервере БД выполните:**

```bash
# Установите PostgreSQL (если не установлен)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Создайте пользователя и базу
sudo -u postgres psql
```

**В PostgreSQL консоли выполните:**

```sql
-- Создайте пользователя и базу данных
CREATE USER slidedeck_user WITH ENCRYPTED PASSWORD 'your_strong_password';
CREATE DATABASE slidedeck_prod;
GRANT ALL PRIVILEGES ON DATABASE slidedeck_prod TO slidedeck_user;
ALTER DATABASE slidedeck_prod OWNER TO slidedeck_user;

-- Выход из PostgreSQL
\q
```

**Настройте доступ извне:**

```bash
# Найдите конфигурационные файлы PostgreSQL
sudo find /etc -name "postgresql.conf" 2>/dev/null

# Отредактируйте postgresql.conf
sudo nano /etc/postgresql/*/main/postgresql.conf
# Найдите строку #listen_addresses = 'localhost' и измените на:
# listen_addresses = '*'

# Отредактируйте pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Добавьте строку в конец файла:
# host all all IP_СЕРВЕРА_ПРИЛОЖЕНИЯ/32 md5

# Перезапустите PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql

# Откройте порт в файрволе
sudo ufw allow from IP_СЕРВЕРА_ПРИЛОЖЕНИЯ to any port 5432

# Проверьте статус
sudo systemctl status postgresql
```

### Вариант B: База данных в Docker (один сервер)

Если вы хотите запустить все на одном сервере, используйте `docker-compose.prod.yml` как есть - PostgreSQL запустится в контейнере автоматически.

---

## 🚀 ШАГ 6: Запуск Docker контейнеров

### Проверьте конфигурацию:

```bash
# Убедитесь что находитесь в папке проекта
pwd
ls -la

# Проверьте .env файл
cat .env

# Проверьте docker-compose файл
cat docker-compose.prod.yml
```

### Запустите приложение:

```bash
# Сначала остановите существующие контейнеры (если есть)
docker-compose -f docker-compose.prod.yml down

# Очистите старые образы (опционально)
docker system prune -f

# Запустите сборку и запуск в background режиме
docker-compose -f docker-compose.prod.yml up -d --build

# Это займет 5-15 минут в зависимости от скорости интернета
```

### Проверьте статус:

```bash
# Проверьте что контейнеры запущены
docker-compose -f docker-compose.prod.yml ps

# Должно показать:
# slidedeck-app-1       running
# slidedeck-postgres-1  running (если используете Docker БД)

# Посмотрите логи
docker-compose -f docker-compose.prod.yml logs -f app

# Проверьте что приложение отвечает
curl http://localhost:3000

# Если получили HTML ответ - приложение работает!
```

---

## 🔧 ШАГ 7: Миграции базы данных

### Примените миграции Prisma:

```bash
# Проверьте подключение к базе данных
docker-compose -f docker-compose.prod.yml exec app npx prisma db pull

# Примените все миграции
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Сгенерируйте Prisma Client
docker-compose -f docker-compose.prod.yml exec app npx prisma generate

# Проверьте статус миграций
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate status
```

### Проверьте структуру БД:

```bash
# Для отдельного сервера БД:
psql -h IP_СЕРВЕРА_БД -U slidedeck_user -d slidedeck_prod -c "\dt"

# Для Docker PostgreSQL:
docker-compose -f docker-compose.prod.yml exec postgres psql -U slidedeck_user -d slidedeck_prod -c "\dt"

# Должны увидеть список таблиц: Category, Product, Domain, Language, Region, и т.д.
```

---

## 📊 ШАГ 8: Заполнение метаданными

**Это самый важный шаг!** Без метаданных выпадающие списки будут пустые.

### Быстрый способ (рекомендуется):

```bash
# Заполните ВСЕ метаданные одной командой
docker-compose -f docker-compose.prod.yml exec app npm run seed:all

# Если первая команда не работает, попробуйте:
docker-compose -f docker-compose.prod.yml exec app npm run data:seed-prod

# Или напрямую через tsx:
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-all-metadata.ts
```

### Поэтапный способ (если нужен контроль):

```bash
# 1. Статические значения (языки, регионы, форматы, статусы)
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-static-values.ts

# 2. Категории слайдов
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-categories.ts

# 3. Домены и области решений
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-domains.ts
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-solution-areas.ts

# 4. Продукты и компоненты
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-products.ts
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-components.ts

# 5. Интеграции и типы пользователей
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-integrations.ts
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-user-types.ts
```

### Проверьте результат:

```bash
# Проверьте что метаданные заполнены
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/verify-metadata.ts

# Проверьте количество записей в каждой таблице
docker-compose -f docker-compose.prod.yml exec postgres psql -U slidedeck_user -d slidedeck_prod -c "
SELECT 'categories' as table_name, count(*) as count FROM \"Category\"
UNION ALL
SELECT 'products', count(*) FROM \"Product\"  
UNION ALL
SELECT 'domains', count(*) FROM \"Domain\"
UNION ALL
SELECT 'languages', count(*) FROM \"Language\"
UNION ALL
SELECT 'regions', count(*) FROM \"Region\"
UNION ALL
SELECT 'formats', count(*) FROM \"Format\"
UNION ALL
SELECT 'statuses', count(*) FROM \"Status\";
"

# Все таблицы должны содержать данные (count > 0)
```

---

## ✅ ШАГ 9: Финальная проверка

### Проверьте веб-интерфейс:

1. **Откройте браузер**: `http://IP_ВАШЕГО_СЕРВЕРА:3000`
   
2. **Проверьте главную страницу** - должна загрузиться без ошибок

3. **Проверьте выпадающие списки** (они должны быть заполнены):
   - Статусы: Draft, In Review, Approved, Archived
   - Форматы: Vertical, Horizontal
   - Языки: English, French, German, Multilingual
   - Регионы: EMEA, Americas, APAC, Global
   - Домены: различные домены компании
   - Продукты: список продуктов
   - Категории: иерархическая структура категорий

4. **Попробуйте импорт Figma** (если токен настроен)

5. **Проверьте фильтрацию и поиск**

### Проверьте логи на ошибки:

```bash
# Логи приложения
docker-compose -f docker-compose.prod.yml logs app --tail 50

# Логи базы данных  
docker-compose -f docker-compose.prod.yml logs postgres --tail 50

# Убедитесь что нет критических ошибок (ERROR, FATAL)
```

---

## 🔧 ШАГ 10: Настройка автозапуска

### Создайте systemd сервис:

```bash
# Создайте файл сервиса
sudo nano /etc/systemd/system/slidedeck.service
```

**Вставьте следующий контент:**

```ini
[Unit]
Description=SlideDeck 2.0 Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/slidedeck
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Обновите systemd и включите сервис
sudo systemctl daemon-reload
sudo systemctl enable slidedeck.service
sudo systemctl start slidedeck.service

# Проверьте статус
sudo systemctl status slidedeck.service
```

**Теперь приложение будет автоматически запускаться при перезагрузке сервера.**

---

## 🚨 Решение проблем

### Если контейнеры не запускаются:

```bash
# Посмотрите подробные логи
docker-compose -f docker-compose.prod.yml logs

# Проверьте синтаксис .env файла
cat -n .env

# Проверьте доступность портов
sudo lsof -i :3000
sudo lsof -i :5432

# Если порты заняты, освободите их:
sudo fuser -k 3000/tcp
sudo fuser -k 5432/tcp
```

### Если база данных недоступна:

```bash
# Проверьте подключение к БД
docker-compose -f docker-compose.prod.yml exec app npx prisma db pull

# Для отдельного сервера БД проверьте сетевое соединение:
telnet IP_СЕРВЕРА_БД 5432
ping IP_СЕРВЕРА_БД

# Проверьте файрвол на сервере БД:
sudo ufw status
```

### Если метаданные не заполняются:

```bash
# Установите tsx если его нет
docker-compose -f docker-compose.prod.yml exec app npm install tsx --save-dev

# Проверьте что Prisma работает
docker-compose -f docker-compose.prod.yml exec app npx prisma generate

# Проверьте есть ли файлы скриптов
docker-compose -f docker-compose.prod.yml exec app ls -la scripts/

# Запустите заполнение отдельных таблиц
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-static-values.ts
```

### Если приложение не отвечает:

```bash
# Проверьте что контейнер работает
docker ps

# Перезапустите контейнеры
docker-compose -f docker-compose.prod.yml restart

# Проверьте использование ресурсов
docker stats

# Проверьте логи на ошибки
docker-compose -f docker-compose.prod.yml logs app --tail 100
```

---

## 🔄 Обслуживание и обновления

### Регулярное обслуживание:

```bash
# Создание backup базы данных (еженедельно)
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U slidedeck_user slidedeck_prod > backup_$(date +%Y%m%d).sql

# Очистка старых Docker образов (ежемесячно)
docker system prune -af

# Проверка логов на ошибки (ежедневно)
docker-compose -f docker-compose.prod.yml logs --tail 50 | grep -i error
```

### Обновление приложения:

```bash
# 1. Создайте backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U slidedeck_user slidedeck_prod > backup_before_update.sql

# 2. Загрузите новую версию
git pull origin main

# 3. Перестройте контейнеры
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Примените новые миграции (если есть)
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# 5. Проверьте что все работает
curl http://localhost:3000
```

---

## 📋 Чеклист развертывания

### Подготовка:
- [ ] Остановлено старое npm развертывание
- [ ] Установлен Docker и Docker Compose  
- [ ] Склонирован/скопирован проект со всеми файлами
- [ ] Создан и настроен `.env` файл с правильными значениями

### База данных:
- [ ] PostgreSQL настроен и доступен
- [ ] Созданы пользователь и база данных
- [ ] Настроен сетевой доступ (для отдельного сервера БД)

### Развертывание:
- [ ] Запущены Docker контейнеры
- [ ] Контейнеры показывают статус "running"
- [ ] Применены миграции Prisma
- [ ] Заполнены метаданные (seed скрипты)

### Проверка:
- [ ] Веб-интерфейс доступен по http://IP:3000
- [ ] Выпадающие списки заполнены данными
- [ ] Нет критических ошибок в логах
- [ ] Настроен автозапуск сервиса

### Безопасность:
- [ ] Используются надежные пароли
- [ ] Настроен файрвол
- [ ] Настроено резервное копирование

---

## 🆘 Контакты поддержки

### При возникновении проблем:

1. **Проверьте логи**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

2. **Создайте отчет о проблеме** включающий:
   - Описание ошибки
   - Логи контейнеров
   - Вывод `docker ps`
   - Конфигурацию `.env` (без секретных ключей)

3. **Экстренный откат**:
   ```bash
   # Остановите контейнеры
   docker-compose -f docker-compose.prod.yml down
   
   # Восстановите backup базы данных
   psql -h IP_БД -U slidedeck_user -d slidedeck_prod < backup_file.sql
   
   # Запустите предыдущую версию
   git checkout previous_commit
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

---

## 🎉 Поздравляем!

После выполнения всех шагов у вас будет полностью рабочий SlideDeck 2.0 с:

✅ **Docker контейнеризацией** - приложение изолировано и легко масштабируется  
✅ **PostgreSQL базой данных** - надежное хранение данных  
✅ **Заполненными метаданными** - все выпадающие списки работают  
✅ **Готовностью к импорту Figma** - можно импортировать слайды  
✅ **Автозапуском** - приложение перезапустится после перезагрузки сервера  

### Основные URL:
- **Приложение**: `http://IP_ВАШЕГО_СЕРВЕРА:3000`
- **База данных**: `IP_СЕРВЕРА_БД:5432` (если отдельный сервер)

### Полезные команды:
```bash
# Статус сервисов
docker-compose -f docker-compose.prod.yml ps

# Логи в реальном времени
docker-compose -f docker-compose.prod.yml logs -f

# Перезапуск
docker-compose -f docker-compose.prod.yml restart

# Остановка
docker-compose -f docker-compose.prod.yml down

# Полная очистка и перезапуск
docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d --build
```

---

**Дата создания**: $(date +%Y-%m-%d)  
**Версия**: 1.0  
**Для проекта**: SlideDeck 2.0

