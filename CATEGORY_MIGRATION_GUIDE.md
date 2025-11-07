# Руководство по миграции категорий слайдов

## Проблема

Слайды используют старые ID категорий, которые не соответствуют новым категориям из базы данных. Это приводит к тому, что слайды попадают в "Uncategorized".

## Решение

### 1. Запустите миграцию категорий

```bash
npx tsx scripts/migrate-slide-categories.ts
```

Этот скрипт:
- Проверит все слайды
- Обновит старые ID категорий на новые ID из базы данных
- Пометит слайды с неизвестными категориями как uncategorized

### 2. Вручную назначьте категории

Для слайдов в "Uncategorized":

1. Перейдите в библиотеку
2. Найдите слайды в категории "Uncategorized"
3. Откройте каждый слайд и нажмите "Edit Details"
4. Выберите подходящую категорию
5. Сохраните изменения

### 3. Массовое назначение категорий

Для большого количества слайдов:

1. Перейдите в раздел Moderation
2. Отфильтруйте слайды без категории
3. Выберите слайды с похожим содержанием
4. Нажмите "Edit Metadata"
5. Назначьте категорию для всех выбранных слайдов

## Новая структура категорий

### Company (Компания)
- Company Overview
- Mission & Values
- Awards & Recognition
- Team & Culture
- History & Milestones

### Services (Услуги)
- Custom Software Development
- Mobile Development
- Web Development
- Cloud Solutions
- DevOps & Infrastructure
- IT Consulting
- QA & Testing
- UI/UX Design

### Technologies (Технологии)
- Frontend
- Backend
- Databases
- Cloud Platforms
- Mobile Technologies
- DevOps Tools
- AI & Machine Learning
- Security

### Portfolio (Портфолио)
- Case Studies
- Success Stories
- Client Testimonials
- Industry Solutions

### Partnership (Партнерство)
- Partner Programs
- Technology Partners
- Certifications
- Strategic Alliances

### Resources (Ресурсы)
- Whitepapers
- Blog Articles
- Webinars
- Templates
- Best Practices

## Важные замечания

1. **Старые категории больше не поддерживаются** - используйте только категории из Settings
2. **Один слайд - одна категория** - множественная категоризация не поддерживается
3. **Иерархия важна** - выбирайте самую специфичную подкатегорию
4. **Обновления мгновенные** - изменения категорий сразу отражаются в библиотеке 