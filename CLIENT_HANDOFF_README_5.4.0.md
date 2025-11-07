# Поставка 5.4.0 — как забрать и применить

## Вариант 1 — через git bundle (рекомендуется)
Файлы:
- client-delivery-5.4.0.bundle
  - SHA-256: 60238C60EC313B037F7FB77363ABDAD948F2768AC35D37C5AC97F0423AF15C56

Шаги:
```bash
# создать ветку для интеграции
git checkout -b merge/vendor-5.4.0
# подтянуть из bundle в локальный бранч vendor/main
git fetch client-delivery-5.4.0.bundle main:vendor/main
# слить в вашу ветку
git merge --no-ff vendor/main
# решить конфликты (если появятся), затем
git add -A && git commit
```
Дальше сборка/деплой по CLIENT_UPGRADE_GUIDE_5.4.0.md.

## Вариант 2 — исходники архивом
Файлы:
- slidebox-5.4.0-src.zip
  - SHA-256: B55CB00D8E235B8FA3F733EB31F69068354F809AB3D8DF9E5CB52EE96071DA84

Шаги:
1) Распакуйте архив в новую папку.
2) Сравните с вашим репозиторием и перенесите изменения (или используйте как новый источник).
3) Сборка/деплой по CLIENT_UPGRADE_GUIDE_5.4.0.md.

## Документация
- RELEASE_NOTES_5.4.0.md
- CLIENT_UPGRADE_GUIDE_5.4.0.md
- PATCH_INSTRUCTIONS_5.4.0.md (если решите применять патчи)

## Поддержка
При проблемах приложите: логи сборки/запуска и ответ `GET /api/slides?category=<id>&page=1&limit=20`.







