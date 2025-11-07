import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slideId = params.id;
    const body = await request.json();
    
    // Если переданы данные для обновления, сначала обновляем слайд
    // Это позволяет сохранить изменения перед публикацией
    if (body && Object.keys(body).length > 0) {
      const updateData: any = {
        isActive: true,
        updatedAt: new Date()
      };
      
      // Обновляем только переданные поля
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.status !== undefined) updateData.status = body.status === 'none' || body.status === '' || body.status === null ? null : body.status;
      if (body.format !== undefined) updateData.format = body.format === 'none' || body.format === '' || body.format === null ? null : body.format;
      if (body.language !== undefined) updateData.language = body.language === 'none' || body.language === '' || body.language === null ? null : body.language;
      if (body.region !== undefined) updateData.region = body.region === 'none' || body.region === '' || body.region === null ? null : body.region;
      if (body.domain !== undefined) updateData.domain = body.domain === 'none' || body.domain === '' || body.domain === null ? null : body.domain;
      if (body.authorName !== undefined) updateData.authorName = body.authorName === 'none' || body.authorName === '' || body.authorName === null ? null : body.authorName;
      if (body.department !== undefined) updateData.department = body.department === 'none' || body.department === '' || body.department === null ? null : body.department;
      if (body.isCaseStudy !== undefined) updateData.isCaseStudy = body.isCaseStudy;
      if (body.yearStart !== undefined) updateData.yearStart = body.yearStart === 'none' || body.yearStart === '' || body.yearStart === null || body.yearStart === 0 ? null : body.yearStart;
      if (body.yearFinish !== undefined) updateData.yearFinish = body.yearFinish === 'none' || body.yearFinish === '' || body.yearFinish === null || body.yearFinish === 0 ? null : body.yearFinish;
      
      // Обновляем связанные данные через транзакцию
      await prisma.$transaction(async (tx) => {
        // Обновляем основные поля
        await tx.slide.update({
          where: { id: slideId },
          data: updateData
        });
        
        // Обновляем категории, если переданы
        if (body.categoryIds !== undefined) {
          // @ts-ignore - Prisma types
          await tx.slideCategory.deleteMany({ where: { slideId } });
          if (body.categoryIds.length > 0) {
            // @ts-ignore - Prisma types
            await tx.slideCategory.createMany({
              data: body.categoryIds.map((categoryId: string) => ({
                slideId,
                categoryId
              }))
            });
          }
        }
        
        // Обновляем другие связи аналогично PATCH route
        // (products, confidentiality, components, integrations, solutionAreas)
        // Для краткости здесь только категории, остальное можно добавить при необходимости
      });
    } else {
      // Если данных нет, просто публикуем слайд
      await prisma.slide.update({
        where: { id: slideId },
        data: {
          isActive: true,
          updatedAt: new Date()
        }
      });
    }

    // Возвращаем обновленный слайд со всеми связями
    const updatedSlide = await prisma.slide.findUnique({
      where: { id: slideId },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        products: {
          include: {
            product: true
          }
        },
        // @ts-ignore - Prisma types
        SlideConfidentiality: {
          include: {
            Confidentiality: true
          }
        },
        components: {
          include: {
            component: true
          }
        },
        integrations: {
          include: {
            integration: true
          }
        },
        // @ts-ignore - Prisma types not updated
        solutionAreas: {
          include: {
            solutionArea: true
          }
        },
        // @ts-ignore - Prisma types
        SlideCategory: {
          include: {
            Category: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      slide: updatedSlide
    });

  } catch (error) {
    console.error('Error publishing slide:', error);
    return NextResponse.json(
      { error: 'Failed to publish slide' },
      { status: 500 }
    );
  }
} 