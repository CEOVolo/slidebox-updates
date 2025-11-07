import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Этот эндпоинт используется Figma плагином для получения
// самой последней созданной презентации
export async function GET(request: NextRequest) {
  try {
    // Ищем самую последнюю презентацию по дате создания
    const latestPresentation = await prisma.presentation.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        slides: {
          orderBy: {
            order: 'asc',
          },
          include: {
            slide: true,
          }
        },
      },
    });

    if (!latestPresentation) {
      return NextResponse.json({ error: 'Презентации не найдены' }, { status: 404 });
    }
    
    // Возвращаем данные в формате, удобном для плагина
    return NextResponse.json({
      success: true,
      presentation: {
        presentationId: latestPresentation.id,
        title: latestPresentation.title,
        slides: latestPresentation.slides.map(presentationSlide => ({
          id: presentationSlide.slide.id,
          title: presentationSlide.slide.title,
          figmaFileId: presentationSlide.slide.figmaFileId,
          figmaNodeId: presentationSlide.slide.figmaNodeId,
          order: presentationSlide.order,
          imageUrl: presentationSlide.slide.imageUrl,
        })),
        webAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
    });

  } catch (error) {
    console.error('Ошибка получения последней презентации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// OPTIONS метод для CORS - БОЛЬШЕ НЕ НУЖЕН, обрабатывается в next.config.js
/*
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
*/ 