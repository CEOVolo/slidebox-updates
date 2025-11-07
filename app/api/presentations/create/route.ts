import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const FIGMA_API_BASE = 'https://api.figma.com/v1';

interface CreatePresentationRequest {
  title: string;
  description?: string;
  slides: Array<{
    slideId: string;
    order: number;
  }>;
  usePlugin?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, slides } = body;

    if (!title || !slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Create presentation
    const presentation = await prisma.presentation.create({
      data: {
        title,
        description,
        // TODO: Add proper user authentication and get authorId from auth context
        // authorId: userId, // Should be passed from authenticated user
        isTemplate: false,
      },
    });

    // Add slides to presentation
    const presentationSlides = await Promise.all(
      slides.map((slideData: { slideId: string; order: number }) =>
        prisma.presentationSlide.create({
          data: {
            presentationId: presentation.id,
            slideId: slideData.slideId,
            order: slideData.order,
          },
        })
      )
    );

    return NextResponse.json({
      id: presentation.id,
      title: presentation.title,
      slidesCount: presentationSlides.length,
      createdAt: presentation.createdAt,
    });
  } catch (error) {
    console.error('Error creating presentation:', error);
    return NextResponse.json(
      { error: 'Failed to create presentation' },
      { status: 500 }
    );
  }
}

// ЗАМЕТКА: Полное копирование слайдов в новый файл Figma требует:
// 1. Figma Plugin API (недоступен через REST)
// 2. Специальные права доступа
// 3. Более сложную архитектуру
// 
// Пока что мы создаём виртуальную презентацию в базе данных
// и предоставляем ссылки на исходные слайды
//
// В будущих версиях планируется интеграция с Figma Plugins 