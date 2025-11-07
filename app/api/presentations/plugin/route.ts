import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CORS заголовки для Figma плагина
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// POST - Получение результата от плагина
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      presentationId, 
      success, 
      figmaFileId, 
      figmaUrl, 
      pageId, 
      pageName,
      copiedSlides,
      errors,
      slides 
    } = body;

    if (!presentationId) {
      return NextResponse.json(
        { error: 'presentationId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Проверяем, является ли это демо презентацией
    const isDemoPresentation = presentationId.startsWith('demo-');
    
    let updatedPresentation = null;
    
    if (isDemoPresentation) {
      // Для демо презентаций просто возвращаем успех без обновления БД
      console.log('Обработка демо презентации:', presentationId);
      updatedPresentation = {
        id: presentationId,
        title: 'Демо презентация',
        description: 'Демо презентация создана успешно',
        figmaFileId: success ? figmaFileId : null,
        figmaUrl: success ? figmaUrl : null,
        slides: slides || []
      };
    } else {
      // Обновляем обычную презентацию с результатами от плагина
      updatedPresentation = await prisma.presentation.update({
        where: { id: presentationId },
        data: {
          // TODO: Add figmaFileId and figmaUrl fields to Presentation model if needed
          // figmaFileId: success ? figmaFileId : null,
          // figmaUrl: success ? figmaUrl : null,
          updatedAt: new Date()
        },
        include: {
          slides: {
            include: {
              slide: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });
    }

    // Логируем результат для отладки
    console.log('Результат от Figma плагина:', {
      presentationId,
      success,
      figmaFileId,
      copiedSlides,
      errors
    });

    return NextResponse.json({
      success: true,
      presentation: updatedPresentation,
      pluginResult: {
        success,
        copiedSlides,
        errors,
        figmaUrl,
        pageId,
        pageName
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Ошибка обработки результата плагина:', error);
    return NextResponse.json(
      { error: 'Ошибка обработки результата плагина' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET - Получение данных презентации для плагина
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "This is the plugin API endpoint." });
}

// OPTIONS - Обработка preflight запросов для CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
} 