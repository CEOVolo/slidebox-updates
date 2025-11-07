import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractSlidesFromFigma } from '@/lib/figma';
import { FigmaImportRequest, FigmaImportResult } from '@/lib/types';
import { getFigmaAccessToken } from '@/lib/figma-token';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body: FigmaImportRequest = await request.json();
    const { figmaUrl, selectedNodeIds, autoExtractTags = true, defaultCategory = 'OTHER' } = body;

    const figmaAccessToken = await getFigmaAccessToken();
    if (!figmaAccessToken) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Figma access token не настроен. Добавьте FIGMA_ACCESS_TOKEN в .env.local или обновите его в Settings.',
          importedSlides: 0,
          skippedSlides: 0,
          errors: ['Токен доступа не найден'],
          slides: [],
        } as FigmaImportResult,
        { status: 500 }
      );
    }

    // Извлекаем слайды из Figma
    const extractResult = await extractSlidesFromFigma(figmaUrl, figmaAccessToken);
    
    let slidesToImport = extractResult.slides;
    
    // Фильтруем по выбранным узлам, если указаны
    if (selectedNodeIds && selectedNodeIds.length > 0) {
      slidesToImport = slidesToImport.filter(slide => 
        selectedNodeIds.includes(slide.nodeId)
      );
    }

    const importResult: FigmaImportResult = {
      success: true,
      importedSlides: 0,
      skippedSlides: 0,
      errors: [],
      slides: [],
    };

    // Импортируем каждый слайд
    for (const slideData of slidesToImport) {
      try {
        // Проверяем, существует ли уже такой слайд
        const existingSlide = await prisma.slide.findFirst({
          where: {
            figmaFileId: extractResult.fileInfo.id,
            figmaNodeId: slideData.nodeId,
          },
        });

        if (existingSlide) {
          // Обновляем существующий слайд
          const updatedSlide = await prisma.slide.update({
            where: { id: existingSlide.id },
            data: {
              title: slideData.name,
              imageUrl: slideData.imageUrl,
              extractedText: slideData.extractedText,
              category: slideData.category,
              figmaFileName: extractResult.fileInfo.name,
              updatedAt: new Date(),
            },
          });

          importResult.slides.push(updatedSlide as any);
          importResult.importedSlides++;
        } else {
          // Создаем новый слайд
          const newSlide = await prisma.slide.create({
            data: {
              title: slideData.name,
              category: slideData.category || defaultCategory,
              imageUrl: slideData.imageUrl,
              figmaFileId: extractResult.fileInfo.id,
              figmaNodeId: slideData.nodeId,
              figmaFileName: extractResult.fileInfo.name,
              extractedText: slideData.extractedText,
              width: slideData.width,
              height: slideData.height,
              version: '1.0',
              isActive: true,
           
              viewCount: 0,
              useCount: 0,
            },
          });

          // Теги теперь создаются только при извлечении текста, не при импорте
          // if (autoExtractTags && slideData.tags.length > 0) {
          //   await addTagsToSlide(newSlide.id, slideData.tags);
          // }

          importResult.slides.push(newSlide as any);
          importResult.importedSlides++;
        }
      } catch (error) {
        console.error(`Error importing slide ${slideData.name}:`, error);
        importResult.errors.push(`Ошибка импорта слайда "${slideData.name}": ${error}`);
        importResult.skippedSlides++;
      }
    }

    return NextResponse.json(importResult);
  } catch (error) {
    console.error('Error importing from Figma:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Ошибка импорта из Figma: ${error}`,
        importedSlides: 0,
        skippedSlides: 0,
        errors: [error as string],
        slides: [],
      } as FigmaImportResult,
      { status: 500 }
    );
  }
}

// Вспомогательная функция для добавления тегов к слайду
// ВНИМАНИЕ: Функция оставлена для обратной совместимости
// Теги теперь создаются только при извлечении текста через API
async function addTagsToSlide(slideId: string, tagNames: string[]) {
  for (const tagName of tagNames) {
    // Находим или создаем тег
    let tag = await prisma.tag.findUnique({
      where: { name: tagName },
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          name: tagName,
          isAutomatic: true,
        },
      });
    }

    // Проверяем, не существует ли уже связь
    const existingRelation = await prisma.slideTag.findUnique({
      where: {
        slideId_tagId: {
          slideId,
          tagId: tag.id,
        },
      },
    });

    if (!existingRelation) {
      await prisma.slideTag.create({
        data: {
          slideId,
          tagId: tag.id,
        },
      });
    }
  }
} 
