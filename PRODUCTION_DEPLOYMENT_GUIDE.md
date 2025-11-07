# Руководство по деплою и импорту метаданных в продакшн

## Обзор
Данное руководство описывает проверенный способ деплоя новой функциональности и импорта метаданных в продакшн базу SlideDeck 2.0.

> ⚡ **Новое!** Доступна универсальная система управления данными. См. `UNIVERSAL_DATA_MANAGEMENT_GUIDE.md` для продвинутых сценариев.

## Архитектура системы

### Сервер продакшн
- **IP**: 135.181.148.104
- **Путь к приложению**: `/home/slidebox/app/slidebox/`
- **Контейнеры**: 
  - `slidebox-app-1` (порт 3000)
  - `slidebox-postgres-1` (порт 5432)
- **База данных**: PostgreSQL в Docker контейнере

### Структура метаданных
База содержит следующие таблицы метаданных:
- Categories (категории слайдов)
- Tags (теги)
- Products (продукты)
- UserTypes (типы пользователей)
- Components (компоненты)
- Integrations (интеграции)
- SolutionAreas (области решений)
- Domains (домены)
- Status (статусы)
- Format (форматы)
- Language (языки)
- Region (регионы)

## Пошаговый процесс деплоя

### Шаг 1: Подготовка к деплою

1. **Убедитесь, что все изменения зафиксированы в Git:**
```bash
git add .
git commit -m "Описание изменений"
git push origin main
```

2. **Проверьте, что dev база содержит актуальные метаданные:**
```bash
npm run seed:all
```

### Шаг 2: Деплой кода на сервер

1. **Подключитесь к серверу:**
```bash
ssh root@135.181.148.104
```

2. **Перейдите в директорию приложения:**
```bash
cd /home/slidebox/app/slidebox/
```

3. **Настройте Git (если нужно):**
```bash
git config --global --add safe.directory /home/slidebox/app/slidebox
```

4. **Обновите код:**
```bash
git pull origin main
```

5. **Установите зависимости (если добавлялись новые):**
```bash
npm install
```

6. **Пересоберите приложение:**
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d
```

### Шаг 3: Импорт метаданных

1. **Проверьте статус базы данных:**
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U slidebox -d slidebox -c "\dt"
```

2. **Выполните миграции Prisma (если есть новые):**
```bash
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

3. **Импортируйте метаданные используя единый скрипт:**
```bash
docker-compose -f docker-compose.prod.yml exec app npm run seed:all
```

Или по отдельности (если нужно):
```bash
# Статические значения (языки, регионы, форматы, статусы)
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-static-values.ts

# Категории
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-categories.ts

# Домены и области решений
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-domains.ts
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-solution-areas.ts

# Продукты и компоненты
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-products.ts
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-components.ts

# Интеграции и типы пользователей
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-integrations.ts
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/seed-user-types.ts
```

### Шаг 4: Проверка результатов

1. **Проверьте, что метаданные импортированы:**
```bash
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/verify-metadata.ts
```

2. **Проверьте работу приложения:**
- Откройте приложение в браузере
- Проверьте работу фильтров
- Убедитесь, что метаданные отображаются корректно

## Альтернативные способы импорта

### Через npm скрипты (если настроены)
```bash
docker-compose -f docker-compose.prod.yml exec app npm run seed:categories
docker-compose -f docker-compose.prod.yml exec app npm run seed:products
# и т.д.
```

### Через SQL файл (резервный способ)
Если TypeScript скрипты не работают, можно использовать прямой SQL импорт:
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U slidebox -d slidebox -f /path/to/metadata.sql
```

## Возможные проблемы и решения

### 1. Проблемы с правами Git
**Ошибка**: `detected dubious ownership in repository`
**Решение**:
```bash
git config --global --add safe.directory /home/slidebox/app/slidebox
```

### 2. Отсутствие tsx
**Ошибка**: `tsx: command not found`
**Решение**:
```bash
npm install tsx --save-dev
```

### 3. Проблемы с Prisma Client
**Ошибка**: `PrismaClient is unable to be run in the browser`
**Решение**:
```bash
npx prisma generate
```

### 4. Проблемы с подключением к базе
**Ошибка**: Connection refused
**Решение**:
- Проверьте, что контейнер базы запущен: `docker ps`
- Проверьте переменные окружения в `.env`
- Перезапустите контейнеры

### 5. Дублирование данных
**Проблема**: Данные импортируются повторно
**Решение**: 
- Используйте `upsert` вместо `create` в скриптах
- Или очистите таблицы перед импортом:
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U slidebox -d slidebox -c "TRUNCATE TABLE categories, tags, products CASCADE;"
```

## Скрипты для автоматизации

### Создание backup'а перед импортом
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U slidebox slidebox > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Быстрая проверка количества записей
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U slidebox -d slidebox -c "
SELECT 'categories' as table_name, count(*) as count FROM categories
UNION ALL
SELECT 'products', count(*) FROM products
UNION ALL
SELECT 'user_types', count(*) FROM user_types
UNION ALL
SELECT 'components', count(*) FROM components;
"
```

## Рекомендации

1. **Всегда делайте backup** перед импортом метаданных
2. **Тестируйте на dev окружении** перед продакшн деплоем
3. **Используйте единый скрипт** `seed-all-metadata.ts` для консистентности
4. **Проверяйте логи** контейнеров при возникновении проблем:
   ```bash
   docker-compose -f docker-compose.prod.yml logs app
   docker-compose -f docker-compose.prod.yml logs postgres
   ```
5. **Документируйте изменения** в метаданных для отслеживания версий

## Контакты и поддержка

При возникновении проблем:
1. Проверьте логи контейнеров
2. Убедитесь в корректности переменных окружения
3. Проверьте статус всех сервисов
4. При необходимости откатитесь к предыдущей версии

## 🆕 Новые универсальные команды

### Быстрые команды для типовых сценариев

```bash
# Миграция метаданных dev → prod (рекомендуется)
docker-compose -f docker-compose.prod.yml exec app npm run data:migrate-dev-to-prod

# Засев метаданных в prod
docker-compose -f docker-compose.prod.yml exec app npm run data:seed-prod

# Полная синхронизация
docker-compose -f docker-compose.prod.yml exec app npm run data:full-sync
```

### Гибкие команды для специальных случаев

```bash
# Миграция конкретных категорий
docker-compose -f docker-compose.prod.yml exec app npm run migrate:universal -- --categories static_metadata,core_metadata

# Засев с пропуском существующих данных
docker-compose -f docker-compose.prod.yml exec app npm run seed:managed -- --skip-existing --env prod

# Батчевая обработка для больших данных
docker-compose -f docker-compose.prod.yml exec app npm run migrate:universal -- --tables slide --batch-size 50
```

> 📖 **Подробнее:** Полное описание новых возможностей см. в `UNIVERSAL_DATA_MANAGEMENT_GUIDE.md` и `UNIVERSAL_DATA_CHECKLIST.md`

---

**Последнее обновление**: $(date +%Y-%m-%d)
**Версия**: 2.0
**Автор**: SlideDeck DevOps Team 