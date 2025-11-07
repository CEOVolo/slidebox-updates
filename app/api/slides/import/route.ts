import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getFigmaAccessToken } from '@/lib/figma-token';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { figmaUrl, selectedFrames, preloadedImages } = body;

    if (!figmaUrl) {
      return NextResponse.json(
        { error: 'Figma URL is required' },
        { status: 400 }
      );
    }

    // Extract file ID from Figma URL (support both old and new formats)
    const fileIdMatch = figmaUrl.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    if (!fileIdMatch) {
      return NextResponse.json(
        { error: 'Invalid Figma URL format. Please provide a valid Figma file URL.' },
        { status: 400 }
      );
    }

    const figmaFileId = fileIdMatch[1];
    const figmaAccessToken = await getFigmaAccessToken();

    if (!figmaAccessToken) {
      return NextResponse.json(
        { error: 'Figma access token not configured. Please add FIGMA_ACCESS_TOKEN to your environment variables or update it in Settings.' },
        { status: 500 }
      );
    }

    console.log(`Importing from Figma file: ${figmaFileId}`);
    console.log(`Selected frames: ${selectedFrames?.join(',') || 'none'}`);
    console.log(`Preloaded images: ${preloadedImages ? Object.keys(preloadedImages).length : 0}`);

    // Если есть выбранные фреймы, используем прямой доступ через nodes API
    if (selectedFrames && selectedFrames.length > 0) {
      console.log('Using direct node access for selected frames');
      
      try {
        // Получаем информацию о выбранных узлах напрямую
        const nodesResponse = await fetch(
          `https://api.figma.com/v1/files/${figmaFileId}/nodes?ids=${selectedFrames.join(',')}`,
          {
            headers: {
              'X-Figma-Token': figmaAccessToken,
            },
          }
        );

        if (!nodesResponse.ok) {
          const errorText = await nodesResponse.text();
          console.error('Figma API error:', errorText);
          return NextResponse.json(
            { error: `Failed to fetch nodes: ${nodesResponse.status} ${nodesResponse.statusText}` },
            { status: 400 }
          );
        }

        const nodesData = await nodesResponse.json();
        console.log(`Received data for ${Object.keys(nodesData.nodes).length} nodes`);

        // Собираем все фреймы из полученных узлов
        const framesToImport: any[] = [];
        
        for (const [nodeId, nodeWrapper] of Object.entries(nodesData.nodes)) {
          const node = (nodeWrapper as any).document;
          if (node && (node.type === 'FRAME' || node.type === 'COMPONENT')) {
            framesToImport.push(node);
          }
        }

        console.log(`Found ${framesToImport.length} frames to import`);

        // Получаем изображения для фреймов
        const frameIds = framesToImport.map(f => f.id);
        let imageUrls: Record<string, string> = {};

        // ОПТИМИЗАЦИЯ: Используем предзагруженные изображения если они есть
        if (preloadedImages && Object.keys(preloadedImages).length > 0) {
          console.log('Using preloaded images from preview');
          imageUrls = preloadedImages;
        } else if (frameIds.length > 0) {
          console.log('No preloaded images, fetching from Figma API...');
          // Обрабатываем по одному фрейму за раз
          const batchSize = 1;
          for (let i = 0; i < frameIds.length; i += batchSize) {
            const batchIds = frameIds.slice(i, i + batchSize);
            console.log(`Fetching images for frame ${i + 1}/${frameIds.length}: ${batchIds.join(',')}`);
            
            // Пробуем разные масштабы
            const scales = [0.1, 0.05, 0.02];
            let batchSuccess = false;
            
            for (const scale of scales) {
              try {
                const imageResponse = await fetch(
                  `https://api.figma.com/v1/images/${figmaFileId}?ids=${batchIds.join(',')}&format=jpg&scale=${scale}`,
                  {
                    headers: {
                      'X-Figma-Token': figmaAccessToken,
                    },
                  }
                );

                if (imageResponse.ok) {
                  const imageData = await imageResponse.json();
                  Object.assign(imageUrls, imageData.images || {});
                  console.log(`Frame ${i + 1} succeeded with scale=${scale}`);
                  batchSuccess = true;
                  break;
                } else {
                  const errorText = await imageResponse.text();
                  console.log(`Frame ${i + 1} failed with scale=${scale}: ${errorText}`);
                }
              } catch (error) {
                console.error(`Error in frame ${i + 1} with scale=${scale}:`, error);
              }
            }
            
            if (!batchSuccess) {
              console.log(`Skipping image for frame: ${batchIds.join(',')}. It will be imported without preview.`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Создаем слайды
        const slidesData = framesToImport.map(frame => ({
          title: frame.name || 'Untitled Slide',
          description: null,
          category: 'uncategorized',
          figmaFileId: figmaFileId,
          figmaNodeId: frame.id,
          figmaFileName: 'Imported from Figma', // Без имени файла, так как мы его не загружали
          extractedText: null,
          width: frame.absoluteBoundingBox?.width || 0,
          height: frame.absoluteBoundingBox?.height || 0,
          imageUrl: imageUrls[frame.id] || '',
          isActive: false,
        }));

        const createdSlides = await prisma.slide.createMany({
          data: slidesData,
        });

        console.log(`Import completed. Created ${createdSlides.count} draft slides`);
        
        return NextResponse.json({
          success: true,
          slidesCount: createdSlides.count,
          message: `Successfully imported ${createdSlides.count} slides to moderation queue`,
          isDraft: true,
          imageStats: {
            withImages: slidesData.filter(s => s.imageUrl).length,
            withoutImages: slidesData.filter(s => !s.imageUrl).length
          }
        });

      } catch (error) {
        console.error('Error importing selected frames:', error);
        return NextResponse.json(
          { error: 'Failed to import selected frames. Please check the server logs for details.' },
          { status: 500 }
        );
      }
    }

    // Если фреймы не выбраны, пытаемся загрузить весь файл (старая логика)
    console.log('No frames selected, attempting to load full file');
    
    // Get file info from Figma API
    const fileResponse = await fetch(`https://api.figma.com/v1/files/${figmaFileId}`, {
      headers: {
        'X-Figma-Token': figmaAccessToken,
      },
    });

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.error('Figma API error:', errorText);
      
      // Специальная обработка для больших файлов
      if (errorText.includes('Request too large')) {
        console.log('Figma file is too large. Trying to import with limited data...');
        
        return NextResponse.json(
          { 
            error: 'Figma file is too large to process.',
            suggestion: 'Please try one of the following:\n1. Select fewer frames to import\n2. Split your Figma file into smaller files\n3. Organize content into separate pages',
            details: 'The Figma API has size limitations. Large files with many complex frames may exceed these limits.'
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to fetch Figma file: ${fileResponse.status} ${fileResponse.statusText}` },
        { status: 400 }
      );
    }

    const fileData = await fileResponse.json();
    console.log(`File name: ${fileData.name}`);
    
    // Extract node ID from URL if specified
    const nodeIdMatch = figmaUrl.match(/node-id=([^&]+)/);
    let framesToImport: any[] = [];

    if (nodeIdMatch) {
      // Import specific node
      const nodeId = nodeIdMatch[1].replace(/-/g, ':');
      console.log(`Importing specific node: ${nodeId}`);

      try {
        const nodesResponse = await fetch(
          `https://api.figma.com/v1/files/${figmaFileId}/nodes?ids=${nodeId}`,
          {
            headers: {
              'X-Figma-Token': figmaAccessToken,
            },
          }
        );

        if (!nodesResponse.ok) {
          throw new Error(`Failed to fetch node: ${nodesResponse.statusText}`);
        }

        const nodesData = await nodesResponse.json();
        const nodeData = nodesData.nodes[nodeId];

        if (!nodeData) {
          throw new Error(`Node ${nodeId} not found`);
        }

        const rootNode = nodeData.document;
        console.log(`Found root node: ${rootNode.name} (${rootNode.type})`);

        // Функция для поиска всех фреймов внутри узла
        function findAllFrames(node: any): any[] {
          let frames: any[] = [];
          
          if (node.type === 'FRAME') {
            frames.push(node);
          }
          
          if (node.children) {
            for (const child of node.children) {
              frames = frames.concat(findAllFrames(child));
            }
          }
          
          return frames;
        }

        // Находим все фреймы внутри родительского узла
        const allFrames = findAllFrames(rootNode);
        console.log(`Found ${allFrames.length} frames in node`);

        // Фильтруем только выбранные фреймы
        framesToImport = allFrames.filter(frame =>
          !selectedFrames || selectedFrames.includes(frame.id)
        );

      } catch (error) {
        console.error('Error fetching specific node:', error);
        return NextResponse.json(
          { error: 'Failed to fetch the specified node from Figma' },
          { status: 500 }
        );
      }
    } else {
      // Import all frames from all pages
      console.log('Importing all frames from file');
      
      function findFrames(node: any): any[] {
        let frames: any[] = [];
        
        if (node.type === 'FRAME') {
          frames.push(node);
        }
        
        if (node.children) {
          for (const child of node.children) {
            frames = frames.concat(findFrames(child));
          }
        }
        
        return frames;
      }

      // Find all frames
      const allFrames: any[] = [];
      if (fileData.document?.children) {
        for (const page of fileData.document.children) {
          if (page.children) {
            allFrames.push(...findFrames(page));
          }
        }
      }

      console.log(`Found ${allFrames.length} total frames`);

      // Filter to only selected frames
      framesToImport = allFrames.filter(frame => 
        !selectedFrames || selectedFrames.includes(frame.id)
      );
    }

    console.log(`Processing ${framesToImport.length} frames for import`);

    // Получаем изображения для всех фреймов
    const frameIds = framesToImport.map(f => f.id);
    let imageUrls: Record<string, string> = {};

    // ОПТИМИЗАЦИЯ: Используем предзагруженные изображения если они есть
    if (preloadedImages && Object.keys(preloadedImages).length > 0) {
      console.log('Using preloaded images from preview');
      imageUrls = preloadedImages;
    } else if (frameIds.length > 0) {
      console.log('No preloaded images, fetching from Figma API...');
      try {
        if (frameIds.length === 1) {
          // Специальная обработка для одиночных фреймов
          console.log(`Fetching image for single frame: ${frameIds[0]}`);
          
          // Пробуем разные параметры сжатия
          const attempts = [
            { scale: 0.05, format: 'jpg' },  // Экстремальное сжатие 5%
            { scale: 0.1, format: 'jpg' },   // 10%
            { scale: 0.25, format: 'jpg' },  // 25%
            { scale: 0.02, format: 'jpg' }   // Минимальное сжатие 2%
          ];
          
          for (const attempt of attempts) {
            try {
              const imageResponse = await fetch(
                `https://api.figma.com/v1/images/${figmaFileId}?ids=${frameIds[0]}&format=${attempt.format}&scale=${attempt.scale}`,
                {
                  headers: {
                    'X-Figma-Token': figmaAccessToken,
                  },
                }
              );

              if (imageResponse.ok) {
                const imageData = await imageResponse.json();
                if (imageData.images && imageData.images[frameIds[0]]) {
                  imageUrls = imageData.images;
                  console.log(`Successfully fetched image with scale=${attempt.scale}, format=${attempt.format}`);
                  break;
                }
              } else {
                const errorText = await imageResponse.text();
                console.log(`Attempt failed (scale=${attempt.scale}): ${errorText}`);
              }
            } catch (attemptError) {
              console.log(`Attempt failed (scale=${attempt.scale}):`, attemptError);
            }
            
            // Задержка между попытками
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Если все попытки с images API не удались, пробуем альтернативный подход
          if (!Object.keys(imageUrls).length) {
            console.log('All image API attempts failed. Trying alternative approach...');
            
            // Попробуем получить изображение через прямой экспорт узла
            try {
              const exportResponse = await fetch(
                `https://api.figma.com/v1/images/${figmaFileId}?ids=${frameIds[0]}&format=jpg&scale=0.01`, // Минимально возможный масштаб
                {
                  headers: {
                    'X-Figma-Token': figmaAccessToken,
                  },
                }
              );
              
              if (exportResponse.ok) {
                const exportData = await exportResponse.json();
                if (exportData.images && exportData.images[frameIds[0]]) {
                  imageUrls = exportData.images;
                  console.log('Successfully fetched image with minimal scale 0.01');
                }
              } else {
                const errorText = await exportResponse.text();
                console.log('Alternative approach also failed:', errorText);
                // Проверяем, если это ошибка "Request too large"
                if (errorText.includes('Request too large')) {
                  console.log('Frame is too large for Figma API. Will import without preview image.');
                  console.log('Recommendation: Split this frame into smaller parts or reduce complexity.');
                }
              }
            } catch (finalError) {
              console.log('Final attempt failed:', finalError);
              console.log('Will create slide without image - can be added manually later');
            }
          }
        } else {
          // Батчевая обработка для множественных фреймов
          const batchSize = 1; // Уменьшаем до 1 для избежания ошибок
          for (let i = 0; i < frameIds.length; i += batchSize) {
            const batchIds = frameIds.slice(i, i + batchSize);
            console.log(`Fetching images for batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(frameIds.length/batchSize)}: ${batchIds.join(',')}`);
            
            // Пробуем разные масштабы для каждого батча
            const scales = [0.1, 0.05, 0.02]; // 10%, 5%, 2%
            let batchSuccess = false;
            
            for (const scale of scales) {
              try {
                const imageResponse = await fetch(
                  `https://api.figma.com/v1/images/${figmaFileId}?ids=${batchIds.join(',')}&format=jpg&scale=${scale}`,
                  {
                    headers: {
                      'X-Figma-Token': figmaAccessToken,
                    },
                  }
                );

                if (imageResponse.ok) {
                  const imageData = await imageResponse.json();
                  Object.assign(imageUrls, imageData.images || {});
                  console.log(`Batch ${Math.floor(i/batchSize) + 1} succeeded with scale=${scale}`);
                  batchSuccess = true;
                  break;
                } else {
                  const errorText = await imageResponse.text();
                  console.log(`Batch ${Math.floor(i/batchSize) + 1} failed with scale=${scale}: ${errorText}`);
                  
                  // Если ошибка "Request too large", пробуем меньший масштаб
                  if (!errorText.includes('Request too large') && scale === scales[scales.length - 1]) {
                    console.error(`Final attempt failed for batch ${i}: ${errorText}`);
                  }
                }
              } catch (error) {
                console.error(`Error in batch ${Math.floor(i/batchSize) + 1} with scale=${scale}:`, error);
              }
            }
            
            if (!batchSuccess) {
              console.log(`Skipping images for frames: ${batchIds.join(',')}. They will be imported without preview.`);
            }
            
            // Увеличиваем задержку между запросами для стабильности
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    }

    // УПРОЩЕННЫЙ ИМПОРТ: Создаем слайды как drafts без обработки
    const slidesData = framesToImport.map(frame => ({
      title: frame.name || 'Untitled Slide',
      description: null,
      category: 'uncategorized', // Все слайды идут в "неразобранное"
      figmaFileId: figmaFileId,
      figmaNodeId: frame.id,
      figmaFileName: fileData.name,
      extractedText: null, // Обработка будет позже
      width: frame.absoluteBoundingBox?.width || 0,
      height: frame.absoluteBoundingBox?.height || 0,
      imageUrl: imageUrls[frame.id] || '',
      isActive: false, // ВАЖНО: слайды не активны до модерации
    }));

    // Создаем все слайды одним запросом
    const createdSlides = await prisma.slide.createMany({
      data: slidesData,
    });

    console.log(`Import completed. Created ${createdSlides.count} draft slides`);
    
    // Логируем информацию о созданных слайдах
    const slidesWithImages = slidesData.filter(slide => slide.imageUrl).length;
    const slidesWithoutImages = slidesData.length - slidesWithImages;
    
    console.log(`Images: ${slidesWithImages} successful, ${slidesWithoutImages} failed`);

    return NextResponse.json({
      success: true,
      slidesCount: createdSlides.count,
      message: `Successfully imported ${createdSlides.count} slides to moderation queue`,
      isDraft: true,
      imageStats: {
        withImages: slidesWithImages,
        withoutImages: slidesWithoutImages
      }
    });

  } catch (error) {
    console.error('Error importing slides:', error);
    return NextResponse.json(
      { error: 'Failed to import slides. Please check the server logs for details.' },
      { status: 500 }
    );
  }
} 