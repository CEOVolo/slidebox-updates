# Инструкция по применению патча 5.4.0 (без доступа к нашему Git)

Этот способ позволяет безопасно накатить изменения в ваш репозиторий, если у поставщика нет доступа к вашему Git.

## Что в комплекте
- update-5.4.0.patch — единый патч со всеми изменениями (API и фронтенд)
- RELEASE_NOTES_5.4.0.md — список изменений
- CLIENT_UPGRADE_GUIDE_5.4.0.md — полное руководство по обновлению

## Требования
- Git 2.30+
- Права на запись в рабочую ветку (или создание новой ветки)

## Применение (рекомендуемый путь)

1) Создайте рабочую ветку
```bash
git checkout -b update/categories-ux-5.4.0
```

2) Примените патч с авто-слиянием
```bash
git apply --3way --whitespace=fix update-5.4.0.patch
```

3) Проверьте изменения
```bash
git status
```

4) Закоммитьте и пушните
```bash
git add -A
git commit -m "feat: Categories UX 5.4.0"
git push origin update/categories-ux-5.4.0
```

5) Соберите/запустите систему и пройдите health-checks по CLIENT_UPGRADE_GUIDE_5.4.0.md.

## Если возник конфликт
1) Откройте конфликтующие файлы, вручную разрешите отличия.
2) Добавьте и завершите коммит:
```bash
git add <файлы>
git commit
```

## Откат патча
Если нужно откатить незакоммиченные изменения:
```bash
git reset --hard
```
Если изменения уже закоммичены в ветке, выполните:
```bash
git revert <commit_sha>
```

## Содержимое патча
- app/api/slides/route.ts — поддержка фильтрации по родительским категориям (включая дочерние)
- components/GroupedSlideGrid.tsx — группировка и авто-раскрытие в UI, «Uncategorized» первым в All Slides
- components/CategoryTree.tsx — «Uncategorized» показывается только в All Slides
- Документация: RELEASE_NOTES_5.4.0.md, CLIENT_UPGRADE_GUIDE_5.4.0.md

## Контакты для поддержки
Прикладывайте к обращению:
- Логи сборки/запуска
- Ответ `GET /api/slides?category=<id>&page=1&limit=20`
- Скриншоты UI (All Slides и выбранный родитель)
