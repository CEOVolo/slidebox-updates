# Исправление схемы базы данных

## Проблема

При импорте слайдов возникала ошибка:
```
Unknown argument `imageUrl`. Available options are marked with ?.
```

## Причина

В модели `Slide` в файле `prisma/schema.prisma` отсутствовало поле `imageUrl`, но код импорта пытался создать слайды с этим полем.

## Решение

### 1. Добавлено поле в схему
```prisma
model Slide {
  // ... существующие поля ...
  figmaUrl      String?  // URL для прямого перехода в Figma
  imageUrl      String?  // URL изображения слайда из Figma
  // ... остальные поля ...
}
```

### 2. Создана миграция
```bash
npx prisma migrate dev --name add_image_url_field
```

### 3. Обновлен Prisma клиент
```bash
npx prisma generate
```

## Статус парсинга текста

✅ **Парсинг текста работает отлично!** 

Из логов видно, что новая функция `extractTextFromFigmaNode` правильно извлекает только содержательный текст:

**Слайд 1:**
```
"SLA Item Response time Blocker 1 hour Up to 6h Critical 2 hour up to 24h Major 1 day up to 10 days Minor 1 day up to 15 days Resolution time In case of blocker customer shall inform ITSM manager call center about the blocker by phone call"
```

**Слайд 2:**
```
"Application Support - L3 L3 SUPPORT PACKAGE 8x5 Baku time ITSM MANAGER Designated contact person for issue coordination Point for escalation Liaison with external IT service providers..."
```

Видно что:
- ❌ Нет мусора типа "Frame 1686560921", "Rectangle", "Vector"
- ✅ Только реальный текст со слайдов
- ✅ Текст читаемый и осмысленный
- ✅ Подходит для поиска и индексации

## Результат

После добавления поля `imageUrl` в схему и обновления клиента, импорт должен работать без ошибок:

1. ✅ Схема базы данных обновлена
2. ✅ Миграция применена
3. ✅ Prisma клиент сгенерирован
4. ✅ Парсинг текста работает корректно
5. ✅ Категории передаются правильно
6. ✅ Импорт готов к работе

Теперь можно повторить импорт слайдов - он должен завершиться успешно! 