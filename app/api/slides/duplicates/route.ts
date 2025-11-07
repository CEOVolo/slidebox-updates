import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Функция для вычисления Jaccard similarity между двумя текстами
function calculateJaccardSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  // Нормализация текста
  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Удаляем пунктуацию
      .replace(/\s+/g, ' ') // Нормализуем пробелы
      .trim()
      .split(' ')
      .filter(word => word.length > 2); // Убираем короткие слова
  };
  
  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  // Пересечение множеств
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  // Объединение множеств
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// GET /api/slides/duplicates - найти дубликаты
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threshold = parseFloat(searchParams.get('threshold') || '0.7'); // Порог схожести (70% по умолчанию)
    const includePublished = searchParams.get('includePublished') === 'true';
    
    // Получаем все слайды с извлеченным текстом
    const slides = await prisma.slide.findMany({
      where: {
        extractedText: { not: null },
        ...(includePublished ? {} : { status: 'draft' })
      },
      select: {
        id: true,
        title: true,
        status: true,
        isActive: true,
        extractedText: true,
        figmaNodeId: true,
        imageUrl: true,
        createdAt: true,
        // @ts-ignore - Prisma types
        SlideCategory: {
          include: {
            Category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Группы дубликатов
    const duplicateGroups: Array<{
      id: string;
      slides: Array<{
        slide: typeof slides[0];
        similarity: number;
      }>;
      maxSimilarity: number;
    }> = [];
    
    // Отслеживаем уже обработанные слайды
    const processedSlides = new Set<string>();
    
    // Сравниваем каждый слайд с каждым
    for (let i = 0; i < slides.length; i++) {
      if (processedSlides.has(slides[i].id)) continue;
      
      const currentGroup: typeof duplicateGroups[0] = {
        id: `group-${duplicateGroups.length + 1}`,
        slides: [{
          slide: slides[i],
          similarity: 1.0 // Сам с собой - 100% схожесть
        }],
        maxSimilarity: 0
      };
      
      // Ищем похожие слайды
      for (let j = i + 1; j < slides.length; j++) {
        if (processedSlides.has(slides[j].id)) continue;
        
        // Проверка по Figma Node ID (точный дубликат)
        const isExactDuplicate = slides[i].figmaNodeId === slides[j].figmaNodeId;
        
        // Проверка по тексту
        const textSimilarity = calculateJaccardSimilarity(
          slides[i].extractedText || '',
          slides[j].extractedText || ''
        );
        
        const similarity = isExactDuplicate ? 1.0 : textSimilarity;
        
        if (similarity >= threshold) {
          currentGroup.slides.push({
            slide: slides[j],
            similarity
          });
          processedSlides.add(slides[j].id);
          currentGroup.maxSimilarity = Math.max(currentGroup.maxSimilarity, similarity);
        }
      }
      
      // Добавляем группу только если есть дубликаты
      if (currentGroup.slides.length > 1) {
        processedSlides.add(slides[i].id);
        // Сортируем слайды в группе по схожести
        currentGroup.slides.sort((a, b) => b.similarity - a.similarity);
        duplicateGroups.push(currentGroup);
      }
    }
    
    // Сортируем группы по максимальной схожести
    duplicateGroups.sort((a, b) => b.maxSimilarity - a.maxSimilarity);
    
    // Статистика
    const stats = {
      totalSlides: slides.length,
      duplicateGroups: duplicateGroups.length,
      duplicateSlides: duplicateGroups.reduce((sum, group) => sum + group.slides.length, 0),
      threshold
    };
    
    return NextResponse.json({
      stats,
      groups: duplicateGroups
    });
  } catch (error) {
    console.error('Error finding duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to find duplicates' },
      { status: 500 }
    );
  }
}

// POST /api/slides/duplicates/check - проверить конкретный слайд на дубликаты
export async function POST(request: NextRequest) {
  try {
    const { slideId, text } = await request.json();
    const threshold = 0.7;
    
    if (!slideId && !text) {
      return NextResponse.json(
        { error: 'Either slideId or text is required' },
        { status: 400 }
      );
    }
    
    let targetText = text;
    let targetNodeId = null;
    
    // Если передан slideId, получаем его данные
    if (slideId) {
      const slide = await prisma.slide.findUnique({
        where: { id: slideId }
      });
      
      if (!slide) {
        return NextResponse.json(
          { error: 'Slide not found' },
          { status: 404 }
        );
      }
      
      targetText = slide.extractedText || '';
      targetNodeId = slide.figmaNodeId;
    }
    
    // Получаем все слайды для сравнения
    const slides = await prisma.slide.findMany({
      where: {
        extractedText: { not: null },
        ...(slideId ? { id: { not: slideId } } : {})
      },
      include: {
        // @ts-ignore - Prisma types
        SlideCategory: {
          include: {
            Category: true
          }
        }
      }
    });
    
    // Находим похожие слайды
    const duplicates = slides
      .map(slide => {
        const isExactDuplicate = targetNodeId && slide.figmaNodeId === targetNodeId;
        const textSimilarity = calculateJaccardSimilarity(targetText, slide.extractedText || '');
        const similarity = isExactDuplicate ? 1.0 : textSimilarity;
        
        return {
          slide,
          similarity,
          isExactDuplicate
        };
      })
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);
    
    return NextResponse.json({
      duplicatesFound: duplicates.length,
      duplicates
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    );
  }
} 