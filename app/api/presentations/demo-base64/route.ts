import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { exportNodes } from '@/lib/figma';

const prisma = new PrismaClient();

// Встроенные демо изображения в base64 - валидные PNG 100x100
const DEMO_IMAGES = {
  // Красный квадрат 100x100 - более крупный для видимости
  red: 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4yMfEgaZUAAAETSURBVHhe7dExAQAwEAOh+jf9IKCPF0lAz8zsQSiBEAIhBEIIhBAIIRBCIIRACIEQAiEEQgiEEAghEEIghEAIgRACIQRCCIQQCCEQQiCEQAiBEAIhBEIIhBAIIRBCIIRACIEQAiEEQgiEEAghEEIghEAIgRACIQRCCIQQCCEQQiCEQAiBEAIhBEIIhBAIIRBCIIRACIEQAiEEQgiEEAghEEIghEAIgRACIQRCCIQQCCEQQiCEfO0HQowDFyQUMkQAAAAASUVORK5CYII=',
  // Зелёный квадрат 100x100 - более крупный для видимости
  green: 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4yMfEgaZUAAAETSURBVHhe7dExAQAwEAOh+ldNKKLPiyQgZ2b2IJRACIEQAiEEQgiEEAghEEIghEAIgRACIQRCCIQQCCEQQiCEQAiBEAIhBEIIhBAIIRBCIIRACIEQAiEEQgiEEAghEEIghEAIgRACIQRCCIQQCCEQQiCEQAiBEAIhBEIIhBAIIRBCIIRACIEQAiEEQgiEEAghEEIghEAIgRACIQRCCIQQCCEQQiCEfO0HTYsDFyT/6F0AAAAASUVORK5CYII=',
  // Синий квадрат 100x100 - более крупный для видимости
  blue: 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4yMfEgaZUAAAETSURBVHhe7dExAQAwEAOh+jdNJIbOiyQgZ2b2IJRACIEQAiEEQgiEEAghEEIghEAIgRACIQRCCIQQCCEQQiCEQAiBEAIhBEIIhBAIIRBCIIRACIEQAiEEQgiEEAghEEIghEAIgRACIQRCCIQQCCEQQiCEQAiBEAIhBEIIhBAIIRBCIIRACIEQAiEEQgiEEAghEEIghEAIgRACIQRCCIQQCCEQQiCEfO0HQowDFyQUMkQAAAAASUVORK5CYII='
};

// Создаём демо презентацию с base64 изображениями для тестирования
export async function GET(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Создаём демо слайды со встроенными base64 изображениями БЕЗ префикса
    const slides = [
      {
        id: 'demo-slide-1',
        title: 'Демо слайд 1 (Красный)',
        figmaFileId: 'demo-file',
        figmaNodeId: 'demo-node-1',
        imageUrl: null,
        imageData: DEMO_IMAGES.red, // Без префикса!
        order: 0,
        width: 1920,  // Добавляем размеры
        height: 1080
      },
      {
        id: 'demo-slide-2',
        title: 'Демо слайд 2 (Зелёный)',
        figmaFileId: 'demo-file',
        figmaNodeId: 'demo-node-2',
        imageUrl: null,
        imageData: DEMO_IMAGES.green, // Без префикса!
        order: 1,
        width: 2480,  // A4 размер
        height: 3508
      },
      {
        id: 'demo-slide-3',
        title: 'Демо слайд 3 (Синий)',
        figmaFileId: 'demo-file',
        figmaNodeId: 'demo-node-3',
        imageUrl: null,
        imageData: DEMO_IMAGES.blue, // Без префикса!
        order: 2,
        width: 1080,  // Квадратный слайд
        height: 1080
      }
    ];

    // Формируем ответ в формате плагина
    const pluginData = {
      presentationId: 'demo-presentation-base64',  // Добавляем уникальный ID
      title: 'Демо презентация с Base64',
      description: 'Тестовая презентация для проверки загрузки изображений через base64 (валидные PNG 100x100 без префикса)',
      slides: slides,
      webAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    };

    console.log('Демо презентация создана с', slides.length, 'слайдами');
    console.log('Первый слайд imageData длина:', slides[0].imageData?.length);
    console.log('Префикс включён:', slides[0].imageData?.startsWith('data:') ? 'ДА' : 'НЕТ, чистый base64');

    return NextResponse.json({
      success: true,
      data: pluginData,
      message: 'Демо презентация с base64 изображениями готова'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Ошибка создания демо презентации:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Ошибка создания демо презентации' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Этот эндпоинт используется для демонстрации
// немедленного импорта слайдов с base64
export async function POST(request: NextRequest) {
  try {
    const { slideIds } = await request.json();

    if (!slideIds || !Array.isArray(slideIds)) {
      return NextResponse.json({ error: 'slideIds is required' }, { status: 400 });
    }

    const slides = await prisma.slide.findMany({
      where: {
        id: { in: slideIds },
    },
  });

    if (slides.length === 0) {
      return NextResponse.json({ error: 'Slides not found' }, { status: 404 });
    }

    const { getFigmaAccessToken } = await import('@/lib/figma-token');
    const figmaAccessToken = await getFigmaAccessToken();
    if (!figmaAccessToken) {
      return NextResponse.json({ error: 'Figma access token is not configured. Please update it in Settings.' }, { status: 500 });
    }

    const { nodes, imageBase64Map } = await exportNodes(slides[0].figmaFileId, slideIds, figmaAccessToken);
    
    return NextResponse.json({ success: true, nodes, imageBase64Map });

  } catch (error) {
    console.error('Error in demo-base64 endpoint:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 