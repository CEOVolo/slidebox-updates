import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Маркируем как динамический: используется request.url (category, query, favorite, days)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Убираем пагинацию - загружаем все слайды сразу
    // Используем очень большой лимит для загрузки всех слайдов
    const limit = 10000; // Достаточно большой лимит для загрузки всех слайдов
    const category = searchParams.get('category');
    const query = searchParams.get('query');
    const userId = searchParams.get('userId'); // Optional userId for favorites
    const favorite = searchParams.get('favorite') === 'true'; // Filter by favorites
    const days = searchParams.get('days'); // Filter by days (recent slides)

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Filter by favorites (requires userId)
    if (favorite && userId) {
      // Get favorite slide IDs for this user
      const favoriteSlides = await prisma.favoriteSlide.findMany({
        where: { userId },
        select: { slideId: true }
      });
      const favoriteSlideIds = favoriteSlides.map(f => f.slideId);
      if (favoriteSlideIds.length > 0) {
        where.id = { in: favoriteSlideIds };
      } else {
        // No favorites, return empty result
        where.id = { in: [] };
      }
    }

    // Filter by date (recent slides)
    if (days) {
      const daysNum = parseInt(days);
      if (!isNaN(daysNum) && daysNum > 0) {
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - daysNum);
        where.createdAt = { gte: dateThreshold };
      }
    }

    // Category filter (supports 'all', 'uncategorized', and parent categories including descendants)
    if (category && category !== 'all') {
      if (category === 'uncategorized') {
        // Slides without any categories
        // @ts-ignore - Prisma types
        where.SlideCategory = { none: {} };
      } else {
        // Resolve descendants for parent category selection (up to 2 levels deep)
        // @ts-ignore - Prisma types
        const selectedCategory = await prisma.category.findUnique({
          where: { id: category },
          include: {
            children: {
              include: { children: true }
            }
          }
        });

        const categoryIds: string[] = [];
        if (selectedCategory) {
          categoryIds.push(selectedCategory.id);
          if (selectedCategory.children) {
            for (const child of selectedCategory.children as any[]) {
              if (child?.id) categoryIds.push(child.id);
              if (child?.children) {
                for (const grand of child.children as any[]) {
                  if (grand?.id) categoryIds.push(grand.id);
                }
              }
            }
          }
        }

        // @ts-ignore - Prisma types
        where.SlideCategory = categoryIds.length > 0
          ? { some: { categoryId: { in: categoryIds } } }
          : { some: { categoryId: category } };
      }
    }

    // Server-side text search
    if (query && query.trim()) {
      const text = query.trim();
      where.OR = [
        { title: { contains: text, mode: 'insensitive' } },
        { description: { contains: text, mode: 'insensitive' } },
        { extractedText: { contains: text, mode: 'insensitive' } },
        // @ts-ignore - Prisma types
        { tags: { some: { tag: { name: { contains: text, mode: 'insensitive' } } } } }
      ];
    }

    // Get slides from database
    const slides = await prisma.slide.findMany({
      where,
      include: {
        // @ts-ignore - Prisma types
        SlideCategory: {
          include: {
            Category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        solutionAreas: {
          include: {
            solutionArea: true,
          },
        },
        products: {
          include: {
            product: true,
          },
        },
        // @ts-ignore - Prisma types
        SlideConfidentiality: {
          include: {
            Confidentiality: true,
          },
        },
        components: {
          include: {
            component: true,
          },
        },
        integrations: {
          include: {
            integration: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      // Убираем skip и take - загружаем все слайды сразу
      take: limit,
    });

    // Get total count
    const total = await prisma.slide.count({ where });

    // Если передан userId, добавляем информацию об избранном для каждого слайда
    let slidesWithFavorites = slides;
    if (userId) {
      const slideIds = slides.map(s => s.id);
      const favorites = await prisma.favoriteSlide.findMany({
        where: {
          userId,
          slideId: { in: slideIds }
        }
      });
      const favoriteSlideIds = new Set(favorites.map(f => f.slideId));
      
      slidesWithFavorites = slides.map(slide => ({
        ...slide,
        isFavorite: favoriteSlideIds.has(slide.id)
      }));
    } else {
      // Если userId не передан, просто добавляем false
      slidesWithFavorites = slides.map(slide => ({
        ...slide,
        isFavorite: false
      }));
    }

    return NextResponse.json({
      slides: slidesWithFavorites,
      total,
      // Убираем информацию о пагинации из ответа
    });
  } catch (error) {
    console.error('Error fetching slides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, categoryIds, figmaFileId, figmaNodeId, imageUrl, extractedText, tags } = body;

    // Create slide
    const slide = await prisma.slide.create({
      data: {
        title,
        description,
        figmaFileId,
        figmaNodeId,
        imageUrl,
        extractedText,
        // @ts-ignore - Prisma types
        SlideCategory: categoryIds && Array.isArray(categoryIds) ? {
          create: categoryIds.map((categoryId: string) => ({ categoryId }))
        } : undefined,
      },
      include: {
        // @ts-ignore - Prisma types
        SlideCategory: {
          include: {
            Category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Get updated slide with all relations
    const updatedSlide = await prisma.slide.findUnique({
      where: { id: slide.id },
      include: {
        // @ts-ignore - Prisma types
        SlideCategory: {
          include: {
            Category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSlide, { status: 201 });
  } catch (error) {
    console.error('Error creating slide:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 