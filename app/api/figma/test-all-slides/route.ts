import { NextRequest, NextResponse } from 'next/server';
import { parseFigmaUrl } from '@/lib/figma';
import axios from 'axios';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

// Функция для поиска всех фреймов-слайдов
function findFrameSlides(node: any, depth = 0, path = ''): any {
  const result = {
    pages: [] as any[],
    slides: [] as any[]
  };
  
  const currentPath = path ? `${path} > ${node.name}` : node.name;
  
  // Если это страница (CANVAS), ищем фреймы внутри неё
  if (node.type === 'CANVAS') {
    const page = {
      id: node.id,
      name: node.name,
      type: node.type,
      path: currentPath,
      depth: depth,
      children: node.children?.length || 0,
      slides: [] as any[]
    };
    
    // Ищем фреймы-слайды внутри этой страницы
    if (node.children) {
      for (const child of node.children) {
        const childResult = findFrameSlides(child, depth + 1, currentPath);
        page.slides.push(...childResult.slides);
        result.slides.push(...childResult.slides);
      }
    }
    
    result.pages.push(page);
  }
  // Если это фрейм верхнего уровня (внутри страницы), проверяем как слайд
  else if (node.type === 'FRAME' && depth <= 2) {
    const bounds = node.absoluteBoundingBox;
    
    if (bounds) {
      const isLargeEnough = bounds.width >= 600 && bounds.height >= 400;
      const isSlideSize = 
        // Стандартные размеры презентаций
        (bounds.width >= 1200 && bounds.height >= 600) || // Wide slides
        (bounds.width >= 800 && bounds.height >= 600) ||  // Standard slides
        (bounds.width >= 1920 && bounds.height >= 1080); // Full HD slides
      
      // Фильтрация названий для слайдов
      const hasGoodName = !['icon', 'button', 'component', 'symbol', 'group', 'mask', 'overlay', 'popup', 'modal', 'tooltip']
        .some(word => node.name.toLowerCase().includes(word));
      
      // Дополнительная проверка: слайд должен быть достаточно большим
      const isProbablySlide = bounds.width >= 800 && bounds.height >= 500;
      
      // Проверяем, что это фрейм верхнего уровня на странице
      const isTopLevelFrame = depth === 1; // Прямо внутри страницы
      
      const slide = {
        id: node.id,
        name: node.name,
        type: node.type,
        width: bounds.width,
        height: bounds.height,
        path: currentPath,
        depth: depth,
        isLargeEnough,
        isSlideSize,
        hasGoodName,
        isProbablySlide,
        isTopLevelFrame,
        score: (isLargeEnough ? 1 : 0) + 
               (isSlideSize ? 2 : 0) + 
               (hasGoodName ? 1 : 0) + 
               (isProbablySlide ? 1 : 0) + 
               (isTopLevelFrame ? 2 : 0), // Бонус для фреймов верхнего уровня
        children: node.children?.length || 0
      };
      
      result.slides.push(slide);
    }
  }
  
  // Рекурсивно ищем в дочерних узлах (только если не слишком глубоко)
  if (node.children && depth < 3) {
    for (const child of node.children) {
      const childResult = findFrameSlides(child, depth + 1, currentPath);
      result.pages.push(...childResult.pages);
      result.slides.push(...childResult.slides);
    }
  }
  
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { figmaUrl } = await request.json();

    if (!figmaUrl) {
      return NextResponse.json({ error: 'Figma URL обязателен' }, { status: 400 });
    }

    const parsed = parseFigmaUrl(figmaUrl);
    if (!parsed) {
      return NextResponse.json({ error: 'Неверный формат Figma URL' }, { status: 400 });
    }

    const { getFigmaAccessToken } = await import('@/lib/figma-token');
    const figmaAccessToken = await getFigmaAccessToken();
    if (!figmaAccessToken) {
      return NextResponse.json({ error: 'FIGMA_ACCESS_TOKEN не настроен. Обновите его в Settings.' }, { status: 401 });
    }

    console.log(`Тестируем поиск страниц и слайдов в файле: ${parsed.fileId}`);

    // Получаем файл
    const response = await axios.get(`${FIGMA_API_BASE}/files/${parsed.fileId}`, {
      headers: {
        'X-Figma-Token': figmaAccessToken,
      },
    });

    const file = response.data;
    console.log(`Файл получен: ${file.name}`);

    // Ищем все страницы и слайды
    const result = findFrameSlides(file.document);
    
    console.log(`Найдено страниц: ${result.pages.length}`);
    console.log(`Найдено слайдов: ${result.slides.length}`);

    // Сортируем слайды по score (лучшие кандидаты сверху)
    const sortedSlides = result.slides.sort((a: any, b: any) => b.score - a.score);

    // Фильтруем слайды по качеству
    const excellentSlides = sortedSlides.filter((slide: any) => slide.score >= 4);
    const goodSlides = sortedSlides.filter((slide: any) => slide.score >= 2 && slide.score < 4);
    const okSlides = sortedSlides.filter((slide: any) => slide.score === 1);
    const poorSlides = sortedSlides.filter((slide: any) => slide.score === 0);

    // Получаем превью для лучших слайдов (топ 10)
    const topSlides = sortedSlides.slice(0, 20);
    const slideIds = topSlides.map((slide: any) => slide.id);
    
    let slidesWithImages = topSlides;
    
    if (slideIds.length > 0) {
      try {
        console.log(`Получаем превью для ${slideIds.length} слайдов...`);
        
        const imageResponse = await axios.get(`${FIGMA_API_BASE}/images/${parsed.fileId}`, {
          params: {
            ids: slideIds.join(','),
            format: 'png',
            scale: 0.5, // Маленькое превью для быстрой загрузки
          },
          headers: {
            'X-Figma-Token': figmaAccessToken,
          },
        });

        const images = imageResponse.data.images;
        console.log(`Получено изображений: ${Object.keys(images).length}`);

        // Добавляем URL изображений к слайдам
        slidesWithImages = topSlides.map((slide: any) => ({
          ...slide,
          imageUrl: images[slide.id] || null
        }));
        
      } catch (imageError) {
        console.warn('Ошибка получения изображений:', imageError);
        // Продолжаем без изображений
      }
    }

    return NextResponse.json({
      success: true,
      fileInfo: {
        id: parsed.fileId,
        name: file.name,
        lastModified: file.lastModified
      },
      statistics: {
        totalPages: result.pages.length,
        totalSlides: result.slides.length,
        excellentSlides: excellentSlides.length,
        goodSlides: goodSlides.length,
        okSlides: okSlides.length,
        poorSlides: poorSlides.length
      },
      pages: result.pages.map((page: any) => ({
        ...page,
        slidesCount: page.slides.length
      })),
      slides: {
        excellent: excellentSlides.slice(0, 20), // Топ 20 отличных
        good: goodSlides.slice(0, 20),           // Топ 20 хороших  
        ok: okSlides.slice(0, 10),               // Топ 10 средних
        all: sortedSlides.slice(0, 50),           // Все топ 50
        withImages: slidesWithImages
      }
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: `Ошибка тестирования: ${error}` },
      { status: 500 }
    );
  }
} 