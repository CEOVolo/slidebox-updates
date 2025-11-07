const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к старой SQLite базе
const sqlitePath = path.join(__dirname, '..', 'prisma', 'dev.db');

// Подключение к PostgreSQL
const prisma = new PrismaClient();

async function migrateData() {
  console.log('Начинаем перенос данных из SQLite в PostgreSQL...');

  try {
    // Открываем SQLite базу
    const db = new sqlite3.Database(sqlitePath);

    // Функция для промисификации SQLite запросов
    const query = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    // 1. Переносим пользователей
    console.log('Переносим пользователей...');
    const users = await query('SELECT * FROM User');
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'USER',
          isActive: Boolean(user.isActive),
          lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });
    }
    console.log(`✓ Перенесено ${users.length} пользователей`);

    // 2. Переносим теги
    console.log('Переносим теги...');
    const tags = await query('SELECT * FROM Tag');
    for (const tag of tags) {
      await prisma.tag.upsert({
        where: { id: tag.id },
        update: {},
        create: {
          id: tag.id,
          name: tag.name,
          color: tag.color,
          isAutomatic: Boolean(tag.isAutomatic),
          usageCount: tag.usageCount || 0,
          createdAt: new Date(tag.createdAt),
        },
      });
    }
    console.log(`✓ Перенесено ${tags.length} тегов`);

    // 3. Переносим слайды
    console.log('Переносим слайды...');
    const slides = await query('SELECT * FROM Slide');
    for (const slide of slides) {
      await prisma.slide.upsert({
        where: { id: slide.id },
        update: {},
        create: {
          id: slide.id,
          title: slide.title,
          description: slide.description,
          category: slide.category || 'other',
          subcategory: slide.subcategory,
          figmaFileId: slide.figmaFileId,
          figmaNodeId: slide.figmaNodeId,
          figmaFileName: slide.figmaFileName,
          figmaUrl: slide.figmaUrl,
          imageUrl: slide.imageUrl,
          width: slide.width,
          height: slide.height,
          extractedText: slide.extractedText,
          authorId: slide.authorId,
          version: slide.version || '1.0',
          isActive: Boolean(slide.isActive),
          viewCount: slide.viewCount || 0,
          useCount: slide.useCount || 0,
          createdAt: new Date(slide.createdAt),
          updatedAt: new Date(slide.updatedAt),
          lastChecked: slide.lastChecked ? new Date(slide.lastChecked) : new Date(),
        },
      });
    }
    console.log(`✓ Перенесено ${slides.length} слайдов`);

    // 4. Переносим презентации
    console.log('Переносим презентации...');
    const presentations = await query('SELECT * FROM Presentation');
    for (const presentation of presentations) {
      await prisma.presentation.upsert({
        where: { id: presentation.id },
        update: {},
        create: {
          id: presentation.id,
          title: presentation.title,
          description: presentation.description,
          pdfUrl: presentation.pdfUrl,
          authorId: presentation.authorId,
          isTemplate: Boolean(presentation.isTemplate),
          createdAt: new Date(presentation.createdAt),
          updatedAt: new Date(presentation.updatedAt),
        },
      });
    }
    console.log(`✓ Перенесено ${presentations.length} презентаций`);

    // 5. Переносим связи слайд-тег
    console.log('Переносим связи слайд-тег...');
    const slideTags = await query('SELECT * FROM SlideTag');
    for (const slideTag of slideTags) {
      await prisma.slideTag.upsert({
        where: { id: slideTag.id },
        update: {},
        create: {
          id: slideTag.id,
          slideId: slideTag.slideId,
          tagId: slideTag.tagId,
        },
      });
    }
    console.log(`✓ Перенесено ${slideTags.length} связей слайд-тег`);

    // 6. Переносим связи презентация-слайд
    console.log('Переносим связи презентация-слайд...');
    const presentationSlides = await query('SELECT * FROM PresentationSlide');
    for (const presSlide of presentationSlides) {
      await prisma.presentationSlide.upsert({
        where: { id: presSlide.id },
        update: {},
        create: {
          id: presSlide.id,
          presentationId: presSlide.presentationId,
          slideId: presSlide.slideId,
          order: presSlide.order,
        },
      });
    }
    console.log(`✓ Перенесено ${presentationSlides.length} связей презентация-слайд`);

    // 7. Переносим историю поиска
    console.log('Переносим историю поиска...');
    const searchHistory = await query('SELECT * FROM SearchHistory');
    for (const search of searchHistory) {
      await prisma.searchHistory.upsert({
        where: { id: search.id },
        update: {},
        create: {
          id: search.id,
          query: search.query,
          results: search.results || 0,
          userId: search.userId,
          createdAt: new Date(search.createdAt),
        },
      });
    }
    console.log(`✓ Перенесено ${searchHistory.length} записей истории поиска`);

    // 8. Переносим синхронизацию Figma
    try {
      console.log('Переносим синхронизацию Figma...');
      const figmaSync = await query('SELECT * FROM FigmaFileSync');
      for (const sync of figmaSync) {
        await prisma.figmaFileSync.upsert({
          where: { id: sync.id },
          update: {},
          create: {
            id: sync.id,
            figmaFileId: sync.figmaFileId,
            lastModified: new Date(sync.lastModified),
            lastChecked: new Date(sync.lastChecked),
            isActive: Boolean(sync.isActive),
          },
        });
      }
      console.log(`✓ Перенесено ${figmaSync.length} записей синхронизации Figma`);
    } catch (err) {
      console.log('! Таблица FigmaFileSync не найдена, пропускаем...');
    }

    // 9. Переносим избранные
    try {
      console.log('Переносим избранные...');
      const favorites = await query('SELECT * FROM FavoriteSlide');
      for (const favorite of favorites) {
        await prisma.favoriteSlide.upsert({
          where: { id: favorite.id },
          update: {},
          create: {
            id: favorite.id,
            userId: favorite.userId,
            slideId: favorite.slideId,
            createdAt: new Date(favorite.createdAt),
          },
        });
      }
      console.log(`✓ Перенесено ${favorites.length} избранных`);
    } catch (err) {
      console.log('! Таблица FavoriteSlide не найдена, пропускаем...');
    }

    db.close();
    console.log('\n🎉 Перенос данных завершен успешно!');

  } catch (error) {
    console.error('❌ Ошибка при переносе данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Проверяем, запущен ли скрипт напрямую
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData }; 