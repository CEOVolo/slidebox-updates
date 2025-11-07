import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/slides/stats - получить статистику по категориям
export async function GET(request: NextRequest) {
  try {
    // Получаем все слайды с их категориями через many-to-many связь
    const slides = await prisma.slide.findMany({
      where: { isActive: true },
      include: {
        // @ts-ignore - Prisma types
        SlideCategory: {
          include: {
            Category: true
          }
        }
      }
    });

    // Получаем все категории из базы данных
    // @ts-ignore - Prisma types
    const dbCategories = await prisma.category.findMany({
      select: {
        id: true,
        code: true,
        name: true
      }
    });

    // Создаем набор валидных ID категорий
    const validCategoryIds = new Set<string>(dbCategories.map((cat: any) => cat.id));
    
    // Подсчитываем количество слайдов по категориям
    const categoryStats: Record<string, number> = {};
    let uncategorizedCount = 0;
    
    slides.forEach(slide => {
      if ((slide as any).SlideCategory && (slide as any).SlideCategory.length > 0) {
        // Для каждой категории слайда увеличиваем счетчик
        (slide as any).SlideCategory.forEach((catRel: any) => {
          if (validCategoryIds.has(catRel.categoryId)) {
            categoryStats[catRel.categoryId] = (categoryStats[catRel.categoryId] || 0) + 1;
          }
        });
      } else {
        // Если у слайда нет категорий, считаем как uncategorized
        uncategorizedCount++;
      }
    });

    // Подсчитываем общее количество
    const totalSlides = slides.length;

    return NextResponse.json({
      totalSlides,
      categoryStats,
      uncategorizedCount
    });
  } catch (error) {
    console.error('Error fetching slide stats:', error);
    return NextResponse.json({ error: 'Failed to fetch slide stats' }, { status: 500 });
  }
} 