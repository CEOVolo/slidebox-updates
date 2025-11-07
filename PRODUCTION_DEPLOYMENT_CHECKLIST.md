# Чек-лист деплоя в продакшн

## Быстрый чек-лист для деплоя и импорта метаданных

### ✅ Предварительная подготовка
- [ ] Все изменения зафиксированы в Git (`git add . && git commit && git push`)
- [ ] Dev база обновлена (`npm run seed:all`)
- [ ] Тестирование пройдено локально

### ✅ Деплой кода на сервер
```bash
# 1. Подключение к серверу
ssh root@135.181.148.104

# 2. Переход в директорию
cd /home/slidebox/app/slidebox/

# 3. Настройка Git (если нужно)
git config --global --add safe.directory /home/slidebox/app/slidebox

# 4. Обновление кода
git pull origin main

# 5. Установка зависимостей
npm install

# 6. Пересборка приложения
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d
```

### ✅ Импорт метаданных
```bash
# 1. Проверка статуса базы
docker-compose -f docker-compose.prod.yml exec postgres psql -U slidebox -d slidebox -c "\dt"

# 2. Миграции (если есть новые)
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# 3. Импорт всех метаданных одной командой
docker-compose -f docker-compose.prod.yml exec app npm run seed:all
```

### ✅ Проверка результатов
```bash
# 1. Проверка импорта
docker-compose -f docker-compose.prod.yml exec app npx tsx scripts/verify-metadata.ts

# 2. Проверка количества записей
docker-compose -f docker-compose.prod.yml exec postgres psql -U slidebox -d slidebox -c "
SELECT 'categories' as table_name, count(*) as count FROM categories
UNION ALL
SELECT 'products', count(*) FROM products
UNION ALL
SELECT 'user_types', count(*) FROM user_types;"
```

### ✅ Финальная проверка
- [ ] Приложение открывается в браузере
- [ ] Фильтры работают корректно
- [ ] Метаданные отображаются
- [ ] Производительность в норме

## 🔧 Команды для диагностики проблем

### Логи контейнеров
```bash
docker-compose -f docker-compose.prod.yml logs app
docker-compose -f docker-compose.prod.yml logs postgres
```

### Статус контейнеров
```bash
docker ps
docker-compose -f docker-compose.prod.yml ps
```

### Backup базы данных
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U slidebox slidebox > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🚨 Частые проблемы

| Ошибка | Решение |
|--------|---------|
| `tsx: command not found` | `npm install tsx --save-dev` |
| `detected dubious ownership` | `git config --global --add safe.directory /home/slidebox/app/slidebox` |
| `PrismaClient is unable to be run` | `npx prisma generate` |
| Connection refused | Проверить статус контейнеров и переменные окружения |

## 📞 Экстренные контакты
- Полное руководство: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- В случае критических ошибок: откат к предыдущей версии
- Логи всегда доступны через Docker Compose

---
**Время выполнения полного деплоя**: ~10-15 минут 