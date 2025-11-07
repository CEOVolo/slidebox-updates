# Скрипт для создания архива со ВСЕМИ исправлениями (10 багов)
# Запустить из корня проекта: .\create-fixes-archive.ps1

$ErrorActionPreference = "Stop"

Write-Host "Создание архива со ВСЕМИ исправлениями (10 багов)..." -ForegroundColor Cyan

# Путь к корню проекта
$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = Get-Location
}

# Список файлов для архива (ВСЕ измененные файлы)
$filesToArchive = @(
    "app\page.tsx",
    "app\api\slides\route.ts",
    "app\api\slides\[id]\route.ts",
    "app\moderation\page.tsx",
    "components\SlideCard.tsx",
    "components\MetadataFilter.tsx",
    "components\CategoryDropdown.tsx",
    "COMPLETE_FIXES_SUMMARY.md",
    "APPLY_FIXES_INSTRUCTIONS.md",
    "CLIENT_SUMMARY.md"
)

# Опциональные файлы (могут не существовать)
$optionalFiles = @(
    "app\api\slides\[id]\favorite\route.ts",
    "app\api\slides\[id]\publish\route.ts",
    "components\EnhancedSearchBar.tsx"
)

# Добавляем опциональные файлы если они существуют
foreach ($file in $optionalFiles) {
    $fullPath = Join-Path $projectRoot $file
    if (Test-Path $fullPath) {
        $filesToArchive += $file
        Write-Host "   Найден опциональный файл: $file" -ForegroundColor Gray
    }
}

# Проверка существования файлов
$missingFiles = @()
foreach ($file in $filesToArchive) {
    $fullPath = Join-Path $projectRoot $file
    if (-not (Test-Path $fullPath)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "ОШИБКА: Не найдены файлы:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    exit 1
}

# Имя архива с датой
$dateString = Get-Date -Format "yyyyMMdd"
$archiveName = "SLIDEDECK_FIXES_$dateString.zip"
$archivePath = Join-Path $projectRoot $archiveName

# Удаление старого архива если существует
if (Test-Path $archivePath) {
    Remove-Item $archivePath -Force
    Write-Host "Удален старый архив" -ForegroundColor Yellow
}

# Создание архива
try {
    Compress-Archive -Path ($filesToArchive | ForEach-Object { Join-Path $projectRoot $_ }) -DestinationPath $archivePath -Force
    Write-Host "УСПЕХ: Архив создан: $archiveName" -ForegroundColor Green
    
    # Показываем размер архива
    $archiveSize = (Get-Item $archivePath).Length / 1KB
    Write-Host "Размер архива: $([math]::Round($archiveSize, 2)) KB" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Файлы в архиве:" -ForegroundColor Cyan
    foreach ($file in $filesToArchive) {
        Write-Host "   + $file" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "ГОТОВО! Архив можно передать клиенту." -ForegroundColor Green
    Write-Host "Путь: $archivePath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Все 10 багов включены в архив!" -ForegroundColor Green
    
} catch {
    Write-Host "ОШИБКА при создании архива: $_" -ForegroundColor Red
    exit 1
}