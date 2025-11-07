import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Получаем все неактивные (draft) слайды
    const drafts = await prisma.slide.findMany({
      where: {
        isActive: false
      },
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
        // @ts-ignore - Prisma types might not be updated
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Форматируем данные
    const slides = drafts.map((slide: any) => ({
      id: slide.id,
      title: slide.title,
      category: slide.category,
      figmaNodeId: slide.figmaNodeId,
      figmaFileId: slide.figmaFileId,
      figmaFileName: slide.figmaFileName || '',
      imageUrl: slide.imageUrl || '',
      width: slide.width || 0,
      height: slide.height || 0,
      extractedText: slide.extractedText,
      tags: slide.tags.map((st: any) => ({
        id: st.tag.id,
        name: st.tag.name
      })),
      createdAt: slide.createdAt.toISOString(),
      // Добавляем все метаданные
      status: slide.status,
      format: slide.format,
      language: slide.language,
      region: slide.region,
      domain: slide.domain,
      department: slide.department,
      authorName: slide.authorName,
      isCaseStudy: slide.isCaseStudy,
      yearStart: slide.yearStart,
      yearFinish: slide.yearFinish,
      // Добавляем связанные данные
      products: slide.products?.map((sp: any) => ({
        id: sp.id,
        product: sp.product
      })) || [],
      confidentiality: slide.SlideConfidentiality?.map((sc: any) => ({
        id: sc.id,
        confidentiality: sc.Confidentiality
      })) || [],
      components: slide.components?.map((sc: any) => ({
        id: sc.id,
        component: sc.component
      })) || [],
      integrations: slide.integrations?.map((si: any) => ({
        id: si.id,
        integration: si.integration
      })) || [],
      solutionAreas: (slide as any).solutionAreas?.map((ss: any) => ({
        id: ss.id,
        solutionArea: ss.solutionArea
      })) || [],
      // ИСПРАВЛЕНИЕ: Добавляем категории
      categories: slide.SlideCategory?.map((sc: any) => ({
        categoryId: sc.categoryId,
        category: sc.Category
      })) || []
    }));

    return NextResponse.json({ slides });
  } catch (error) {
    console.error('Error fetching draft slides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft slides' },
      { status: 500 }
    );
  }
} 
