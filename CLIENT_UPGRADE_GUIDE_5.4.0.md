# Руководство по обновлению до версии 5.4.0 (Categories UX)

Дата выпуска: 2025/10/14

Версия 5.4.0 — минорное обновление интерфейса и API без изменений схемы БД. Миграции не требуются.

## Что входит
- Изменён UX категорий и «Uncategorized» (см. `RELEASE_NOTES_5.4.0.md`).
- Endpoint `/api/slides` теперь корректно фильтрует по родительским категориям (включая дочерние уровни).

## Предусловия
- Node.js 18+ (для dev) / Docker 24+ (для контейнерного развёртывания).
- Доступ к базе Postgres (без изменений схемы).
- Резервная копия `.env` и docker-файлов (на случай отката).

## Вариант A — Обновление в Docker (рекомендовано)

1. Получите код
```bash
# на сервере
cd /opt/slidebox
# переключитесь на ветку/тег релиза 5.4.0
git fetch --all --tags
git checkout tags/v5.4.0 -B v5.4.0
```

2. Пересоберите образы
```bash
docker compose -f docker-compose.prod.yml build --no-cache
```

3. Примените обновление (без простоя)
```bash
docker compose -f docker-compose.prod.yml up -d
```

4. Проверка состояния
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f web
```

5. Health-check
- Откройте `/` — UI должен загрузиться.
- Откройте `GET /api/slides/stats` — статус 200.
- Выберите родительскую категорию — справа появятся группы её дочерних категорий.
- В «All Slides» сверху есть «Uncategorized», прочие группы свернуты.

### Откат (rollback)
```bash
git checkout <предыдущий_тег_или_commit>
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## Вариант B — Обновление без Docker (bare-metal)

1. Получите код
```bash
cd /srv/slidebox
git fetch --all --tags
git checkout tags/v5.4.0 -B v5.4.0
```

2. Установите зависимости и соберите
```bash
npm ci
npm run build
```

3. Запустите (pm2 как пример)
```bash
pm2 start npm --name slidebox -- run start
pm2 save
```

4. Health-check — как в Docker варианте.

## Переменные окружения
Изменений нет. Проверьте, что заданы:
- `DATABASE_URL`
- `NEXTAUTH_URL` (если используется авторизация)
- `FIGMA_*` (если используется импорт из Figma)

## Чек-лист после обновления
- [ ] UI загружается, ошибок в консоли нет
- [ ] В «All Slides» блок «Uncategorized» — первый; остальные группы свернуты
- [ ] Поиск раскрывает только релевантные группы
- [ ] Выбор родительской категории показывает только дочерние группы
- [ ] Выбор подкатегории показывает её слайды
- [ ] Endpoint `GET /api/slides?category=<parentId>` возвращает слайды дочерних категорий

## Частые вопросы
- В «All Slides» группы не видны? — Проверьте, что в ответе `/api/slides` есть `SlideCategory`/`categories`, и выполните жёсткое обновление браузера.
- Родитель выбран, но пусто? — Убедитесь, что в БД у дочерних есть активные слайды (`isActive=true`).

## Поддержка
При проблемах приложите логи контейнера `web` и ответ `GET /api/slides?category=<id>&page=1&limit=20`.

