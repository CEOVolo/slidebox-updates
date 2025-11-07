# 🚀 Настройка окружений: Разработка + Продакшн

Пошаговая инструкция для создания профессиональной системы с двумя окружениями.

## 📋 Что мы создадим:

- **Development** - локальная разработка с Docker PostgreSQL
- **Production** - продакшн сервер с автоматическим деплоем
- **GitHub Actions** - автоматический CI/CD pipeline
- **Переменные окружения** - разные настройки для каждого окружения

---

## ШАГ 1: Настройка GitHub репозитория

### 1.1 Создайте репозиторий на GitHub

1. Идите на https://github.com/new
2. Название: `slidedeck-2.0` (или любое другое)
3. Выберите **Private** (для приватного проекта)
4. Создайте репозиторий

### 1.2 Подключите локальный проект к GitHub

```bash
# В корне вашего проекта
git init
git add .
git commit -m "Initial commit: SlideDeck 2.0"

# Замените YOUR_USERNAME и YOUR_REPO на ваши
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## ШАГ 2: Настройка переменных окружения

### 2.1 Development (.env.local)

Создайте файл `.env.local` для разработки:

```bash
# DEVELOPMENT ОКРУЖЕНИЕ
NODE_ENV=development

# База данных PostgreSQL (Docker)
DATABASE_URL="postgresql://slidedeck_user:slidedeck_password@localhost:5432/slidedeck_dev?schema=public"

# Figma API
FIGMA_ACCESS_TOKEN="your_figma_token_here"

# Next.js
NEXTAUTH_SECRET="dev_secret_key_change_in_production"
NEXTAUTH_URL="http://localhost:3000"

# Debug режим
DEBUG=true
```

### 2.2 Production (.env.example)

Создайте файл `.env.example` как шаблон для продакшена:

```bash
# PRODUCTION ОКРУЖЕНИЕ
NODE_ENV=production

# База данных PostgreSQL (продакшн)
DATABASE_URL="postgresql://username:password@prod-server:5432/slidedeck_prod?schema=public"

# Figma API
FIGMA_ACCESS_TOKEN="your_figma_token_here"

# Next.js
NEXTAUTH_SECRET="super_secure_production_secret"
NEXTAUTH_URL="https://yourdomain.com"

# Security
DEBUG=false
```

---

## ШАГ 3: Docker конфигурация для окружений

### 3.1 Development (docker-compose.dev.yml) - уже создан ✅

### 3.2 Production (docker-compose.prod.yml)

```yaml
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - FIGMA_ACCESS_TOKEN=${FIGMA_ACCESS_TOKEN}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    networks:
      - slidedeck-network

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    networks:
      - slidedeck-network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - slidedeck-network

volumes:
  postgres_prod_data:

networks:
  slidedeck-network:
    driver: bridge
```

---

## ШАГ 4: GitHub Actions для автоматического деплоя

### 4.1 Создайте файл `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run lint
    
    - name: Type check
      run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /home/slidedeck/app
          git pull origin main
          docker compose -f docker-compose.prod.yml down
          docker compose -f docker-compose.prod.yml up -d --build
          docker system prune -f
```

---

## ШАГ 5: Настройка продакшн сервера

### 5.1 Выберите хостинг

Рекомендую **Hetzner Cloud** (дешево и надежно):

1. Регистрируйтесь на https://hetzner.com
2. Создайте VPS: **CX11** (2GB RAM, 20GB SSD) - 4.15€/мес
3. Выберите Ubuntu 22.04 LTS
4. Добавьте SSH ключ для безопасности

### 5.2 Настройте сервер

```bash
# Подключитесь к серверу
ssh root@YOUR_SERVER_IP

# Обновите систему
apt update && apt upgrade -y

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установите Docker Compose
apt install docker-compose-plugin -y

# Создайте пользователя для приложения
useradd -m -s /bin/bash slidedeck
usermod -aG docker slidedeck

# Создайте директорию для приложения
mkdir -p /home/slidedeck/app
chown slidedeck:slidedeck /home/slidedeck/app
```

### 5.3 Клонируйте репозиторий на сервер

```bash
# Переключитесь на пользователя slidedeck
su - slidedeck

# Клонируйте репозиторий
cd /home/slidedeck/app
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Создайте .env файл для продакшена
nano .env.prod
```

Вставьте в `.env.prod`:
```bash
NODE_ENV=production
DATABASE_URL="postgresql://slidebox_ad:andersen_win@postgres:5432/slidebox_prod?schema=public"
FIGMA_ACCESS_TOKEN="your_figma_token_here"
NEXTAUTH_SECRET="bonobo_1345"
NEXTAUTH_URL="http://135.181.148.104:3000"

POSTGRES_USER=slidebox_ad
POSTGRES_PASSWORD=andersen_win
POSTGRES_DB=slidebox_prod
```

---

## ШАГ 6: Настройка GitHub Secrets

В вашем GitHub репозитории:

1. Идите в **Settings** → **Secrets and variables** → **Actions**
2. Добавьте секреты:

- `HOST`: IP адрес вашего сервера
- `USERNAME`: `slidedeck`
- `SSH_KEY`: ваш приватный SSH ключ

---

## ШАГ 7: Первый деплой

### 7.1 На сервере

```bash
# Запустите продакшн окружение
cd /home/slidedeck/app
docker compose -f docker-compose.prod.yml up -d

# Проверьте статус
docker compose -f docker-compose.prod.yml ps

# Создайте таблицы в БД
docker compose -f docker-compose.prod.yml exec app npm run db:push
```

### 7.2 Проверьте доступность

Откройте в браузере: `http://YOUR_SERVER_IP:3000`

---

## ШАГ 8: Настройка домена и HTTPS (опционально)

### 8.1 Привяжите домен

1. Купите домен (Namecheap, GoDaddy)
2. В DNS настройках добавьте A-запись: `yourdomain.com` → `YOUR_SERVER_IP`

### 8.2 Настройте HTTPS с Let's Encrypt

```bash
# Установите Certbot
apt install certbot python3-certbot-nginx

# Получите SSL сертификат
certbot --nginx -d yourdomain.com
```

---

## 🎯 Workflow разработки

### Локальная разработка:
```bash
# Запустите dev окружение
docker compose -f docker-compose.dev.yml up -d
npm run dev
```

### Деплой в продакшн:
```bash
# Просто сделайте commit и push
git add .
git commit -m "Add new feature"
git push origin main

# GitHub Actions автоматически задеплоит на сервер!
```

---

## 🔧 Полезные команды

### Development:
```bash
# Запуск dev окружения
npm run dev

# Работа с dev базой
npm run db:push
npm run migrate-data

# Остановка dev окружения
docker compose -f docker-compose.dev.yml down
```

### Production:
```bash
# На сервере - просмотр логов
docker compose -f docker-compose.prod.yml logs -f

# Перезапуск приложения
docker compose -f docker-compose.prod.yml restart app

# Backup базы данных
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U slidedeck_user slidedeck_prod > backup.sql
```

---

## 🎉 Готово!

Теперь у вас:
- ✅ **Dev окружение** - для разработки с Docker PostgreSQL
- ✅ **Prod окружение** - на отдельном сервере с автоматическим деплоем  
- ✅ **CI/CD** - автоматические тесты и деплой через GitHub Actions
- ✅ **Безопасность** - разные пароли и настройки для каждого окружения

**Workflow:** Разрабатываете локально → Push в GitHub → Автоматический деплой на продакшн! 🚀 