# Скрипт для создания нового репозитория с рабочей версией проекта
# Запустить из корня проекта: .\create-client-repository.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Создание нового репозитория для клиента" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Путь к текущему проекту
$sourceRoot = $PSScriptRoot
if (-not $sourceRoot) {
    $sourceRoot = Get-Location
}

# Путь к новому репозиторию
$dateString = Get-Date -Format "yyyyMMdd"
$repoName = "SlideDeck-2.0-Client-$dateString"
$repoPath = Join-Path (Split-Path $sourceRoot -Parent) $repoName

# Проверка существования папки
if (Test-Path $repoPath) {
    Write-Host "ОШИБКА: Папка уже существует: $repoPath" -ForegroundColor Red
    Write-Host "Удалите её или выберите другое имя" -ForegroundColor Yellow
    exit 1
}

Write-Host "Создание папки: $repoPath" -ForegroundColor Cyan
New-Item -ItemType Directory -Path $repoPath -Force | Out-Null

# Папки и файлы для исключения
$excludePatterns = @(
    "node_modules",
    ".next",
    ".git",
    "dist",
    "build",
    "coverage",
    ".vercel",
    "*.tsbuildinfo",
    "*.log",
    ".env",
    ".env.local",
    ".env.prod",
    ".env.production",
    "postgres_data",
    "postgres_prod_data"
)

# Функция для проверки нужно ли исключать файл/папку
function Should-Exclude {
    param($itemPath)
    
    $itemName = Split-Path $itemPath -Leaf
    foreach ($pattern in $excludePatterns) {
        if ($itemName -like $pattern -or $itemPath -like "*\$pattern\*") {
            return $true
        }
    }
    return $false
}

# Копирование основных папок
Write-Host "Копирование основных папок..." -ForegroundColor Cyan
$mainFolders = @("app", "components", "lib", "contexts", "prisma", "scripts", "config", "figma-plugin", "public")
foreach ($folder in $mainFolders) {
    $sourcePath = Join-Path $sourceRoot $folder
    if (Test-Path $sourcePath) {
        Write-Host "   Копирование: $folder\" -ForegroundColor Gray
        Copy-Item -Path $sourcePath -Destination (Join-Path $repoPath $folder) -Recurse -Force -Exclude $excludePatterns
    }
}

# Копирование основных файлов
Write-Host "Копирование основных файлов..." -ForegroundColor Cyan
$mainFiles = @(
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "next-env.d.ts",
    ".gitignore"
)

foreach ($file in $mainFiles) {
    $sourcePath = Join-Path $sourceRoot $file
    if (Test-Path $sourcePath) {
        Write-Host "   Копирование: $file" -ForegroundColor Gray
        Copy-Item -Path $sourcePath -Destination (Join-Path $repoPath $file) -Force
    }
}

# Копирование документации
Write-Host "Копирование документации..." -ForegroundColor Cyan
$docs = @(
    "README.md",
    "QUICK_START.md",
    "FIGMA_PLUGIN_SETUP.md",
    "FIGMA_TOKEN_SETUP.md",
    "COMPLETE_FIXES_SUMMARY.md",
    "APPLY_FIXES_INSTRUCTIONS.md",
    "CLIENT_SUMMARY.md"
)

foreach ($doc in $docs) {
    $sourcePath = Join-Path $sourceRoot $doc
    if (Test-Path $sourcePath) {
        Write-Host "   Копирование: $doc" -ForegroundColor Gray
        Copy-Item -Path $sourcePath -Destination (Join-Path $repoPath $doc) -Force
    }
}

# Создание README для клиента
$readmePath = Join-Path $repoPath "README_CLIENT.md"
Write-Host "Создание README_CLIENT.md..." -ForegroundColor Cyan
@"
# SlideDeck 2.0 - Рабочая версия для клиента

## Дата создания: $(Get-Date -Format "dd.MM.yyyy HH:mm")

## Все исправления включены

Этот репозиторий содержит полностью рабочую версию проекта SlideDeck 2.0 со всеми исправлениями.

### Все 10 багов исправлены:

1. ✅ Preview quality change - работает
2. ✅ Добавление в избранное - работает
3. ✅ Верхняя строка поиска - работает
4. ✅ Отображение категорий - исправлено
5. ✅ Просмотр деталей из дубликатов - работает
6. ✅ Quick Filters - работают
7. ✅ Filters NaN - исправлено
8. ✅ Load More проблема - убрана пагинация
9. ✅ Сохранение изменений - работает
10. ✅ Сохранение после approve - работает

## Установка

1. Скопировать репозиторий на сервер клиента
2. Установить зависимости: `npm install`
3. Настроить `.env` файл с правильными параметрами БД:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/database"
   FIGMA_ACCESS_TOKEN="your_token_here"
   ```
4. Запустить миграции: `npx prisma migrate deploy`
5. Запустить dev server: `npm run dev`

## Структура проекта

- `app/` - Next.js приложение
- `components/` - React компоненты
- `lib/` - Утилиты и библиотеки
- `prisma/` - Схема базы данных и миграции
- `figma-plugin/` - Плагин для Figma

## Документация

- `COMPLETE_FIXES_SUMMARY.md` - полное описание всех исправлений
- `APPLY_FIXES_INSTRUCTIONS.md` - инструкция по применению (если нужно)
- `CLIENT_SUMMARY.md` - краткая сводка для клиента
- `README.md` - основная документация проекта
- `QUICK_START.md` - быстрый старт

## Важно

- Все изменения находятся в этом репозитории
- База данных должна быть настроена отдельно
- `.env` файл нужно создать на основе существующей конфигурации
- Не забудьте установить зависимости: `npm install`

## Контакты

При возникновении вопросов обращаться к разработчику.
"@ | Out-File -FilePath $readmePath -Encoding UTF8

# Создание .env.example если есть .env
$envExamplePath = Join-Path $repoPath ".env.example"
if (-not (Test-Path $envExamplePath)) {
    Write-Host "Создание .env.example..." -ForegroundColor Cyan
    @"
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Figma
FIGMA_ACCESS_TOKEN="your_figma_token_here"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
"@ | Out-File -FilePath $envExamplePath -Encoding UTF8
}

# Инициализация Git репозитория
Write-Host ""
Write-Host "Инициализация Git репозитория..." -ForegroundColor Cyan
Push-Location $repoPath
try {
    git init
    git add .
    $commitMessage = "Initial commit: SlideDeck 2.0 with all 10 bug fixes - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    git commit -m $commitMessage
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "УСПЕХ: Репозиторий создан!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Путь: $repoPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Следующие шаги:" -ForegroundColor Yellow
    Write-Host "1. Перейти в папку: cd `"$repoPath`"" -ForegroundColor Gray
    Write-Host "2. Проверить содержимое: git log" -ForegroundColor Gray
    Write-Host "3. Создать удаленный репозиторий (GitHub/GitLab/Bitbucket)" -ForegroundColor Gray
    Write-Host "4. Добавить remote: git remote add origin <URL>" -ForegroundColor Gray
    Write-Host "5. Отправить код: git push -u origin main" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Или передать папку клиенту напрямую:" -ForegroundColor Cyan
    Write-Host "   - Создать ZIP архив папки" -ForegroundColor Gray
    Write-Host "   - Загрузить в облачное хранилище (Google Drive, Dropbox, OneDrive)" -ForegroundColor Gray
    Write-Host "   - Передать через файлообменник" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "ОШИБКА при инициализации Git: $_" -ForegroundColor Red
    Write-Host "Репо создан, но Git не инициализирован. Можно инициализировать вручную." -ForegroundColor Yellow
} finally {
    Pop-Location
}
