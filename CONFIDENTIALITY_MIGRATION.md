# Миграция UserType на Confidentiality

## Описание изменений

Метаданные "User Type" были переименованы в "Confidentiality" с двумя возможными значениями:
- **Internal** - для внутреннего использования
- **External** - для внешнего использования

## Что было изменено

### 1. База данных
- Таблица `UserType` переименована в `Confidentiality`
- Таблица `SlideUserType` переименована в `SlideConfidentiality` 
- Создана миграция `20250717121347_rename_usertype_to_confidentiality`

### 2. API Endpoints
- `/api/user-types` → `/api/confidentiality`
- Все методы (GET, POST, PUT, DELETE) обновлены

### 3. TypeScript типы
- `UserType` → `Confidentiality`
- `SlideUserType` → `SlideConfidentiality`
- `userTypeCodes` → `confidentialityCodes`

### 4. UI компоненты
- **SlideEditModal**: поле "User Types" заменено на "Confidentiality"
- **MetadataFilter**: фильтр по User Types заменен на Confidentiality
- **Settings**: раздел User Types заменен на Confidentiality
- **MetadataContext**: `userTypes` заменено на `confidentiality`

### 5. Seed скрипты
- `seed-user-types.ts` → `seed-confidentiality.ts`
- Новые значения: `internal` и `external`

## Как применить миграцию

1. Обновите Prisma Client:
```bash
npx prisma generate
```

2. Запустите seed скрипт для заполнения новых значений:
```bash
npx tsx scripts/seed-confidentiality.ts
```

3. Обновите существующие данные (если необходимо):
- Слайды с `userType: 'employee'` → `confidentiality: 'internal'`
- Слайды с `userType: 'client'` или `'partner'` → `confidentiality: 'external'`

## Использование в коде

### Старый код:
```typescript
// В SlideEditModal
userTypeCodes: slide.userTypes?.map(u => u.userType.code) || []

// В API
await tx.slideUserType.deleteMany({ where: { slideId } });
```

### Новый код:
```typescript
// В SlideEditModal
confidentialityCodes: slide.confidentiality?.map(c => c.confidentiality.code) || []

// В API
await tx.slideConfidentiality.deleteMany({ where: { slideId } });
```

## Примечания

- Confidentiality теперь является одиночным выбором (не множественным)
- Значения строго ограничены: только `internal` или `external`
- Все слайды должны иметь указанный уровень конфиденциальности 