import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { getFigmaAccessToken } from '@/lib/figma-token';

const prisma = new PrismaClient();
const FIGMA_API_BASE = 'https://api.figma.com/v1';

interface PrepareLibraryRequest {
  slides: Array<{
    slideId: string;
  }>;
}

// POST - Подготовка слайдов для библиотеки
export async function POST(request: NextRequest) {
  try {
    const body: PrepareLibraryRequest = await request.json();
    const { slides } = body;

    const figmaAccessToken = await getFigmaAccessToken();
    if (!figmaAccessToken) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Figma access token не настроен. Обновите его в Settings.',
        },
        { status: 500 }
      );
    }

    // Получаем слайды из базы данных
    const slideIds = slides.map(s => s.slideId);
    const dbSlides = await prisma.slide.findMany({
      where: {
        id: { in: slideIds },
        isActive: true,
      },
    });

    if (dbSlides.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Не найдено ни одного слайда' },
        { status: 400 }
      );
    }

    // Группируем слайды по файлам
    const slidesByFile = dbSlides.reduce((acc, slide) => {
      if (!acc[slide.figmaFileId]) {
        acc[slide.figmaFileId] = [];
      }
      acc[slide.figmaFileId].push(slide);
      return acc;
    }, {} as Record<string, typeof dbSlides>);

    // Для каждого файла получаем SVG слайдов
    const exportPromises = [];
    for (const [fileId, fileSlides] of Object.entries(slidesByFile)) {
      const nodeIds = fileSlides.map(s => s.figmaNodeId).join(',');
      
      // Запрашиваем SVG экспорт слайдов
      const exportPromise = axios.get(
        `${FIGMA_API_BASE}/images/${fileId}?ids=${nodeIds}&format=svg&svg_include_id=true&svg_include_node_id=true`,
        {
          headers: {
            'X-Figma-Token': figmaAccessToken,
          },
        }
      );
      
      exportPromises.push(exportPromise);
    }

    // Ждём все экспорты
    const exportResults = await Promise.all(exportPromises);
    
    // Собираем результаты
    const libraryData = {
      slides: dbSlides.map(slide => ({
        id: slide.id,
        title: slide.title,
        figmaFileId: slide.figmaFileId,
        figmaNodeId: slide.figmaNodeId,
        imageUrl: slide.imageUrl,
        svgUrl: null as string | null,
      })),
      instructions: {
        manual: [
          "Откройте каждый файл Figma, содержащий нужные слайды",
          "Выделите слайды и скопируйте их (Ctrl+C)",
          "Перейдите в файл с плагином",
          "Найдите страницу 'SlideDeck Library - Slides'",
          "Вставьте слайды (Ctrl+V)",
          "Запустите плагин для создания презентации"
        ],
        automatic: "Плагин автоматически создаст страницу-библиотеку при первом запуске"
      }
    };

    // Добавляем SVG URL из результатов экспорта
    exportResults.forEach((result, index) => {
      if (result.data && result.data.images) {
        Object.entries(result.data.images).forEach(([nodeId, url]) => {
          const slide = libraryData.slides.find(s => s.figmaNodeId === nodeId);
          if (slide) {
            slide.svgUrl = url as string;
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      libraryData,
      fileCount: Object.keys(slidesByFile).length,
      slideCount: dbSlides.length,
    });

  } catch (error) {
    console.error('Ошибка подготовки библиотеки:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Ошибка подготовки библиотеки: ${error}`,
      },
      { status: 500 }
    );
  }
}

// GET - Получение инструкций по работе с библиотекой
export async function GET() {
  return NextResponse.json({
    success: true,
    instructions: {
      overview: "SlideDeck 2.0 использует промежуточный файл-библиотеку для обхода ограничений Figma API",
      steps: [
        {
          step: 1,
          title: "Подготовка слайдов",
          description: "Скопируйте все нужные слайды в один файл Figma",
          details: [
            "Откройте файлы со слайдами",
            "Выделите и скопируйте слайды (Ctrl+C)",
            "Вставьте в файл с плагином на страницу 'SlideDeck Library'"
          ]
        },
        {
          step: 2,
          title: "Запуск плагина",
          description: "Откройте плагин SlideDeck 2.0 в Figma",
          details: [
            "Plugins → Development → SlideDeck 2.0",
            "Нажмите 'Получить данные презентации'",
            "Плагин найдёт все слайды в библиотеке"
          ]
        },
        {
          step: 3,
          title: "Создание презентации",
          description: "Плагин создаст новую страницу с презентацией",
          details: [
            "Слайды будут скопированы из библиотеки",
            "Сохранится полная редактируемость",
            "Автоматическая организация в сетке"
          ]
        }
      ],
      benefits: [
        "✅ Полное копирование слайдов с сохранением редактируемости",
        "✅ Работа со слайдами из разных файлов",
        "✅ Автоматическая организация презентации",
        "✅ Сохранение метаданных и структуры"
      ]
    }
  });
} 