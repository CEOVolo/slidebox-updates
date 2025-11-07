import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

interface ExportNodesRequest {
  slides: Array<{
    figmaFileId: string;
    figmaNodeId: string;
  }>;
}

// Для демо режима - тестовые данные
const DEMO_SLIDE_DATA = {
  type: 'FRAME',
  name: 'Demo Slide',
  width: 1920,
  height: 1080,
  fills: [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95, a: 1 } }],
  children: [
    {
      type: 'TEXT',
      name: 'Title',
      characters: 'Это демо слайд',
      style: {
        fontSize: 72,
        fontName: { family: 'Inter', style: 'Bold' },
        textAlignHorizontal: 'CENTER',
      },
      x: 960,
      y: 400,
      width: 800,
      height: 100,
    }
  ]
};

// Константы
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB – лимит Figma для createImage
const INLINE_LIMIT_BYTES = 512 * 1024; // 512 KB - Максимальный размер для инлайн base64, чтобы избежать переполнения

// Конвертация изображения в base64
async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const startTime = Date.now();
    console.log('Конвертируем изображение в base64:', url);
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Ошибка загрузки изображения:', response.status);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    const duration = Date.now() - startTime;
    console.log(`Base64 длина: ${base64.length}, время: ${duration}мс`);
    return base64;
  } catch (error) {
    console.error('Ошибка конвертации в base64:', error);
    return null;
  }
}

// Получение полной структуры узлов для воссоздания в плагине
export async function POST(request: NextRequest) {
  const apiStartTime = Date.now();

  try {
    const body: ExportNodesRequest = await request.json();
    const { slides } = body;
    
    console.log('\n=== EXPORT NODES API - НАЧАЛО ===');
    console.log('Получен запрос на экспорт узлов:');
    console.log('Количество слайдов:', slides.length);
    slides.forEach((slide, index) => {
      console.log(`Слайд ${index + 1}:`, {
        figmaFileId: slide.figmaFileId,
        figmaNodeId: slide.figmaNodeId
      });
    });

    const { getFigmaAccessToken } = await import('@/lib/figma-token');
    const figmaAccessToken = await getFigmaAccessToken();
    console.log('Токен настроен:', !!figmaAccessToken);
    
    if (!figmaAccessToken) {
      console.warn('ВНИМАНИЕ: Figma access token не настроен. Обновите его в Settings. Возвращаем демо-данные.');
      
      // Загружаем демо изображение и конвертируем в base64
      const demoImageUrl = 'https://via.placeholder.com/1920x1080/4F46E5/ffffff?text=Demo+Slide';
      const demoImageBase64 = await imageUrlToBase64(demoImageUrl);
      
      // Возвращаем демо-данные для тестирования без токена
      return NextResponse.json({
        success: true,
        nodes: slides.map((slide, index) => ({
          fileId: slide.figmaFileId,
          nodeId: slide.figmaNodeId,
          node: {
            id: slide.figmaNodeId,
            name: `Demo Slide ${index + 1}`,
            type: 'FRAME',
            width: 1920,
            height: 1080,
            x: 0,
            y: 0,
            fills: [{
              type: 'SOLID',
              color: { r: 0.95, g: 0.95, b: 0.95 }
            }],
            children: [
              // Фоновое изображение
              {
                id: `${slide.figmaNodeId}-bg`,
                name: 'Background',
                type: 'RECTANGLE',
                x: 0,
                y: 0,
                width: 1920,
                height: 1080,
                fills: demoImageBase64 ? [{
                  type: 'IMAGE',
                  imageData: demoImageBase64,
                  scaleMode: 'FILL'
                }] : [{
                  type: 'SOLID',
                  color: { r: 0.9, g: 0.9, b: 0.9 }
                }]
              },
              {
                id: `${slide.figmaNodeId}-text`,
                name: 'Title',
                type: 'TEXT',
                characters: `Слайд ${index + 1} (Демо режим)`,
                style: {
                  fontSize: 48,
                  fontName: { family: "Inter", style: "Bold" }
                },
                x: 100,
                y: 100,
                width: 800,
                height: 100
              }
            ]
          },
          imageUrl: null,
          imageData: demoImageBase64
        })),
        count: slides.length,
                  warning: 'Работает в демо-режиме. Для полной функциональности добавьте FIGMA_ACCESS_TOKEN в .env.local'
      });
    }

    // Группируем слайды по файлам
    const slidesByFile = slides.reduce((acc, slide) => {
      if (!acc[slide.figmaFileId]) {
        acc[slide.figmaFileId] = [];
      }
      acc[slide.figmaFileId].push(slide.figmaNodeId);
      return acc;
    }, {} as Record<string, string[]>);

    const exportedNodes = [];

    // Для каждого файла получаем полную информацию о узлах
    for (const [fileId, nodeIds] of Object.entries(slidesByFile)) {
      try {
        console.log(`\n=== Обработка файла ${fileId} ===`);
        
        let imageUrlMap: Record<string, string> = {};
        try {
            const imageFillsStartTime = Date.now();
            const imageFillsResponse = await axios.get(
              `${FIGMA_API_BASE}/files/${fileId}/image-fills`,
              { headers: { 'X-Figma-Token': figmaAccessToken } }
            );
            imageUrlMap = imageFillsResponse.data.meta.images || {};
            console.log(`[OK] Image-Fills API ответил за ${Date.now() - imageFillsStartTime}мс. Найдено ${Object.keys(imageUrlMap).length} картинок.`);
        } catch(e: any) {
            console.warn(`[ПРЕДУПРЕЖДЕНИЕ] Не удалось получить image-fills для файла ${fileId}. Копирование растровых изображений может не работать.`, e.message);
            // Пробуем альтернативный метод - экспорт изображений напрямую из узлов
            try {
              console.log(`[АЛЬТЕРНАТИВА] Пытаемся экспортировать изображения напрямую из узлов...`);
              
              // Сначала экспортируем основные узлы
              const imagesResponse = await axios.get(
                `${FIGMA_API_BASE}/images/${fileId}?ids=${nodeIds.join(',')}&format=png&scale=1`,
                { headers: { 'X-Figma-Token': figmaAccessToken } }
              );
              if (imagesResponse.data?.images) {
                // Сохраняем URL изображений узлов для fallback
                for (const [nodeId, imageUrl] of Object.entries(imagesResponse.data.images)) {
                  if (imageUrl) {
                    imageUrlMap[`node_${nodeId}`] = imageUrl as string;
                  }
                }
                console.log(`[OK] Получено ${Object.keys(imagesResponse.data.images).length} изображений основных узлов.`);
              }
              
              // Теперь пробуем получить изображения для дочерних узлов с IMAGE fills
                      const nodesData = await axios.get(
          `${FIGMA_API_BASE}/files/${fileId}/nodes?ids=${nodeIds.join(',')}&geometry=paths`,
          { headers: { 'X-Figma-Token': figmaAccessToken } }
        );
              
              if (nodesData.data?.nodes) {
                const childNodesWithImages: string[] = [];
                const nodeToImageRefMap: Record<string, string[]> = {}; // Маппинг nodeId -> imageRefs
                
                // Рекурсивно ищем дочерние узлы с изображениями
                const findNodesWithImages = (node: any) => {
                  if (node && node.id && node.fills) {
                    const imageRefs: string[] = [];
                    node.fills.forEach((fill: any) => {
                      if (fill.type === 'IMAGE' && fill.imageRef) {
                        imageRefs.push(fill.imageRef);
                      }
                    });
                    
                    if (imageRefs.length > 0) {
                      childNodesWithImages.push(node.id);
                      nodeToImageRefMap[node.id] = imageRefs;
                    }
                  }
                  if (node.children) {
                    node.children.forEach(findNodesWithImages);
                  }
                };
                
                Object.values(nodesData.data.nodes).forEach((nodeWrapper: any) => {
                  if (nodeWrapper.document) {
                    findNodesWithImages(nodeWrapper.document);
                  }
                });
                
                // Экспортируем найденные дочерние узлы
                if (childNodesWithImages.length > 0) {
                  console.log(`[АЛЬТЕРНАТИВА] Найдено ${childNodesWithImages.length} дочерних узлов с изображениями. Разбиваем на пакеты...`);
                  
                  // Разбиваем на пакеты по 5, чтобы не превышать лимиты URL
                  const batchSize = 5;
                  const batches = [];
                  for (let i = 0; i < childNodesWithImages.length; i += batchSize) {
                    batches.push(childNodesWithImages.slice(i, i + batchSize));
                  }

                  await Promise.all(batches.map(async (batch, index) => {
                    try {
                      console.log(`[АЛЬТЕРНАТИВА] Запрос пакета ${index + 1}/${batches.length} (${batch.length} узлов)...`);
                      const childImagesResponse = await axios.get(
                        `${FIGMA_API_BASE}/images/${fileId}?ids=${batch.join(',')}&format=png&scale=1`,
                        { headers: { 'X-Figma-Token': figmaAccessToken } }
                      );
                      
                      if (childImagesResponse.data?.images) {
                        for (const [nodeId, imageUrl] of Object.entries(childImagesResponse.data.images)) {
                          if (imageUrl) {
                            // Сохраняем для nodeId
                            imageUrlMap[`child_${nodeId}`] = imageUrl as string;
                            
                            // И для всех imageRef этого узла
                            if (nodeToImageRefMap[nodeId]) {
                              nodeToImageRefMap[nodeId].forEach(imageRef => {
                                imageUrlMap[imageRef] = imageUrl as string;
                              });
                            }
                          }
                        }
                        console.log(`[OK] Пакет ${index + 1} успешно обработан. Получено ${Object.keys(childImagesResponse.data.images).length} изображений.`);
                      }
                    } catch (batchError: any) {
                      console.error(`[ОШИБКА] Не удалось обработать пакет ${index + 1}:`, batchError.message);
                    }
                  }));
                }
              }
              
              console.log(`[OK] Всего получено ${Object.keys(imageUrlMap).length} изображений через альтернативный метод.`);
              console.log(`[DEBUG] Содержимое imageUrlMap:`, Object.keys(imageUrlMap).map(key => ({
                key,
                url: imageUrlMap[key]?.substring(0, 80) + '...'
              })));
            } catch(fallbackError: any) {
              console.error(`[ОШИБКА] Альтернативный метод тоже не сработал:`, fallbackError.message);
            }
        }

        const nodesStartTime = Date.now();
        const nodeResponse = await axios.get(
          `${FIGMA_API_BASE}/files/${fileId}/nodes?ids=${nodeIds.join(',')}&geometry=paths`,
          { headers: { 'X-Figma-Token': figmaAccessToken } }
        );
        
        // Nodes API возвращает структуру { nodes: { nodeId: { document: ... } } }
        // Нужно извлечь документ из первого узла
        const nodeData = nodeResponse.data.nodes?.[nodeIds[0]];
        const document = nodeData?.document;
        
        console.log(`[OK] Nodes API ответил за ${Date.now() - nodesStartTime}мс.`);
        
        // ЛОГИРОВАНИЕ: Проверяем что пришло от Figma API
        console.log('\n=== FIGMA API RESPONSE DEBUG ===');
        console.log('Request URL:', `${FIGMA_API_BASE}/files/${fileId}/nodes?ids=${nodeIds.join(',')}&geometry=paths`);
        console.log('Response status:', nodeResponse.status);
        console.log('Response structure:', {
          hasNodes: !!nodeResponse.data.nodes,
          nodeCount: nodeResponse.data.nodes ? Object.keys(nodeResponse.data.nodes).length : 0,
          firstNodeId: nodeIds[0],
          hasDocument: !!document,
          documentType: document?.type
        });
        
        // Кэш для скачанных изображений в рамках одного файла
        const downloadCache = new Map<string, { data: string | null; big: boolean }>();
        
        // Обрабатываем все узлы из ответа Nodes API
        const nodesData = nodeResponse.data.nodes || {};
        
        for (const nodeId of nodeIds) {
          const nodeWrapper = nodesData[nodeId];
          const nodeData = nodeWrapper?.document;
          
          if (nodeData) {
            console.log(`\n--- Обработка узла ${nodeId}: ${nodeData.name} ---`);
            
            // ЛОГИРОВАНИЕ: Проверяем векторные данные в исходном узле
            const checkVectorDataInNode = (node: any, path: string = '') => {
              if (!node) return;
              
              const hasVectorPaths = node.vectorPaths && node.vectorPaths.length > 0;
              const hasVectorNetwork = node.vectorNetwork && node.vectorNetwork.vertices && node.vectorNetwork.vertices.length > 0;
              
              if (node.type === 'VECTOR' || node.type === 'LINE' || node.type === 'STAR' || node.type === 'POLYGON' || node.type === 'ELLIPSE') {
                console.log(`[FIGMA_RESPONSE] ${path}${node.name} (${node.type}):`, {
                  hasVectorPaths,
                  hasVectorNetwork,
                  vectorPathsLength: node.vectorPaths?.length || 0,
                  vectorNetworkVertices: node.vectorNetwork?.vertices?.length || 0,
                  vectorPathsData: node.vectorPaths ? 'ПРИСУТСТВУЕТ' : 'ОТСУТСТВУЕТ',
                  vectorNetworkData: node.vectorNetwork ? 'ПРИСУТСТВУЕТ' : 'ОТСУТСТВУЕТ'
                });
              }
              
              if (node.children) {
                node.children.forEach((child: any, index: number) => {
                  checkVectorDataInNode(child, `${path}  ${index + 1}. `);
                });
              }
            };
            
            console.log('=== ВЕКТОРНЫЕ ДАННЫЕ В ОТВЕТЕ FIGMA API ===');
            checkVectorDataInNode(nodeData);
            console.log('=== КОНЕЦ ПРОВЕРКИ FIGMA API ===\n');
            
            // Если есть экспортированное изображение узла и нет image-fills
            const nodeImageUrl = imageUrlMap[`node_${nodeId}`];
            if (nodeImageUrl && Object.keys(imageUrlMap).filter(k => !k.startsWith('node_') && !k.startsWith('child_')).length === 0) {
              console.log(`[FALLBACK] Используем экспортированное изображение узла для всех IMAGE fills`);
              // Рекурсивно находим все IMAGE fills и присваиваем им URL узла
              assignNodeImageToFills(nodeData, nodeImageUrl, imageUrlMap);
              
              // Также добавляем в imageUrlMap все imageRef из узла
              const collectImageRefs = (node: any) => {
                if (node?.fills) {
                  node.fills.forEach((fill: any) => {
                    if (fill.type === 'IMAGE' && fill.imageRef) {
                      imageUrlMap[fill.imageRef] = nodeImageUrl;
                      console.log(`[FALLBACK] Присвоен URL для imageRef: ${fill.imageRef}`);
                    }
                  });
                }
                if (node?.children) {
                  node.children.forEach(collectImageRefs);
                }
              };
              collectImageRefs(nodeData);
            }
            
            // Асинхронно обогащаем изображения
            await enrichImageFills(nodeData, imageUrlMap, downloadCache);
            
            // Проверяем результат обогащения
            let nodeImageStats = { total: 0, withUrl: 0, withData: 0 };
            const checkNodeImages = (node: any) => {
              if (node?.fills) {
                node.fills.forEach((fill: any) => {
                  if (fill.type === 'IMAGE') {
                    nodeImageStats.total++;
                    if (fill.imageUrl) nodeImageStats.withUrl++;
                    if (fill.imageData) nodeImageStats.withData++;
                  }
                });
              }
              if (node?.children) {
                node.children.forEach(checkNodeImages);
              }
            };
            checkNodeImages(nodeData);
            console.log(`[УЗЕЛ ${nodeId}] После обогащения:`, nodeImageStats);
            
            // ФИНАЛЬНАЯ ПРОВЕРКА: Есть ли векторные данные в обработанном узле
            console.log('\n=== ФИНАЛЬНАЯ ПРОВЕРКА ВЕКТОРНЫХ ДАННЫХ ===');
            const finalVectorCheck = (node: any, path: string = '') => {
              if (!node) return;
              
              if (node.type === 'VECTOR' || node.type === 'LINE' || node.type === 'STAR' || node.type === 'POLYGON' || node.type === 'ELLIPSE') {
                const hasVectorPaths = node.vectorPaths && node.vectorPaths.length > 0;
                const hasVectorNetwork = node.vectorNetwork && node.vectorNetwork.vertices && node.vectorNetwork.vertices.length > 0;
                
                console.log(`[FINAL_CHECK] ${path}${node.name} (${node.type}):`, {
                  векторныеПути: hasVectorPaths ? `✅ ЕСТЬ (${node.vectorPaths.length})` : '❌ НЕТ',
                  векторнаяСеть: hasVectorNetwork ? `✅ ЕСТЬ (${node.vectorNetwork.vertices.length})` : '❌ НЕТ'
                });
              }
              
              if (node.children) {
                node.children.forEach((child: any, index: number) => {
                  finalVectorCheck(child, `${path}  ${index + 1}. `);
                });
              }
            };
            finalVectorCheck(nodeData);
            console.log('=== КОНЕЦ ФИНАЛЬНОЙ ПРОВЕРКИ ===\n');
            
            exportedNodes.push({
              fileId,
              nodeId,
              node: nodeData,
              imageUrl: imageUrlMap[`node_${nodeId}`] || null, 
            });
          } else {
            console.error(`Узел ${nodeId} не найден в ответе Nodes API. Возможно, узел был удален или нет доступа.`);
          }
        }
      } catch (error: any) {
        console.error(`Ошибка экспорта из файла ${fileId}:`, error);
        console.error('Детали ошибки:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        
        // Если ошибка 403/404, вероятно нет доступа к файлу
        if (error.response?.status === 403) {
          console.error(`❌ Нет доступа к файлу ${fileId}. Проверьте, что токен имеет доступ к этому файлу.`);
        } else if (error.response?.status === 404) {
          console.error(`❌ Файл ${fileId} не найден.`);
        }
      }
    }

    const totalTime = Date.now() - apiStartTime;
    console.log(`\n=== EXPORT NODES API ЗАВЕРШЁН ===`);
    console.log(`Общее время выполнения: ${totalTime}мс (${(totalTime / 1000).toFixed(1)}с)`);
    console.log('Запрошено слайдов:', exportedNodes.length);
    
    if (exportedNodes.length > 0) {
      console.log('Первый экспортированный узел:', {
        fileId: exportedNodes[0].fileId,
        nodeId: exportedNodes[0].nodeId,
        hasNode: !!exportedNodes[0].node,
        nodeType: exportedNodes[0].node?.type,
        nodeChildrenCount: exportedNodes[0].node?.children?.length,
        hasImageUrl: !!exportedNodes[0].imageUrl
      });
      
      // Проверяем наличие изображений в fills
      let imageStats = { total: 0, withUrl: 0, withData: 0, big: 0 };
      const checkImageFills = (node: any) => {
        if (node?.fills) {
          node.fills.forEach((fill: any) => {
            if (fill.type === 'IMAGE') {
              imageStats.total++;
              if (fill.imageUrl) imageStats.withUrl++;
              if (fill.imageData) imageStats.withData++;
              if (fill.big) imageStats.big++;
            }
          });
        }
        if (node?.children) {
          node.children.forEach(checkImageFills);
        }
      };
      
      exportedNodes.forEach(node => checkImageFills(node.node));
      console.log('Статистика изображений:', imageStats);
    }

    return NextResponse.json({
      success: true,
      nodes: exportedNodes,
      count: exportedNodes.length,
    });

  } catch (error) {
    console.error('Ошибка экспорта узлов:', error);
    return NextResponse.json(
      { error: 'Ошибка экспорта узлов из Figma' },
      { status: 500 }
    );
  }
}

// Рекурсивная функция для внедрения URL-ов и base64 в заливки
async function enrichImageFills(
  node: any,
  imageUrlMap: Record<string, string>,
  cache: Map<string, { data: string | null; big: boolean }>
): Promise<void> {
  if (!node) return;

  // Функция скачивания и кэширования изображения
  const getImageData = async (ref: string): Promise<{ data: string | null; big: boolean }> => {
    // Проверяем кэш
    if (cache.has(ref)) return cache.get(ref)!;

    let url: string | undefined;
    
    // Если ref начинается с 'url_', это прямой URL
    if (ref.startsWith('url_')) {
      url = ref.substring(4); // Убираем префикс 'url_'
    } else {
      url = imageUrlMap[ref];
    }
    
    if (!url) {
      const res = { data: null, big: false };
      cache.set(ref, res);
      return res;
    }

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const buffer = await resp.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const isBig = bytes.byteLength > INLINE_LIMIT_BYTES;
      
      let data: string | null = null;
      if (!isBig) {
        data = `data:${resp.headers.get('content-type') || 'image/png'};base64,${Buffer.from(bytes).toString('base64')}`;
      }

      const result = { data, big: isBig };
      cache.set(ref, result);
      return result;
    } catch (e) {
      console.warn(`[enrichImageFills] Не удалось скачать изображение ${url}`, e);
      const res = { data: null, big: false };
      cache.set(ref, res);
      return res;
    }
  };

  if (Array.isArray(node.fills)) {
    // Параллельно обрабатываем все заливки узла
    await Promise.all(node.fills.map(async (fill: any) => {
      if (fill.type === 'IMAGE') {
        console.log(`[enrichImageFills] Обработка IMAGE fill в узле ${node.name || node.id}:`, {
          hasImageRef: !!fill.imageRef,
          imageRef: fill.imageRef,
          hasImageUrl: !!fill.imageUrl,
          imageUrl: fill.imageUrl?.substring(0, 50) + '...',
          hasImageRefInMap: fill.imageRef ? !!imageUrlMap[fill.imageRef] : false
        });
        
        delete fill.imageData; // Очищаем старые значения
        delete fill.big;

        // Обрабатываем изображения с imageRef
        if (fill.imageRef && imageUrlMap[fill.imageRef]) {
          fill.imageUrl = imageUrlMap[fill.imageRef];
          const { data, big } = await getImageData(fill.imageRef);
          
          console.log(`[enrichImageFills] Результат загрузки для imageRef ${fill.imageRef}:`, {
            hasData: !!data,
            dataSize: data ? data.length : 0,
            isBig: big
          });
          
          if (data) {
            fill.imageData = data; // Добавляем base64, только если файл не большой
          }
          if (big) {
            fill.big = true; // Добавляем флаг для плагина
          }
        }
        // Обрабатываем изображения с imageUrl но без imageRef (например, экспортированные узлы)
        else if (fill.imageUrl && !fill.imageRef) {
          const tempRef = `url_${fill.imageUrl}`;
          const { data, big } = await getImageData(tempRef);
          
          console.log(`[enrichImageFills] Результат загрузки для imageUrl:`, {
            hasData: !!data,
            dataSize: data ? data.length : 0,
            isBig: big
          });
          
          if (data) {
            fill.imageData = data;
          }
          if (big) {
            fill.big = true;
          }
        } else {
          console.log(`[enrichImageFills] ПРЕДУПРЕЖДЕНИЕ: IMAGE fill без доступного изображения`);
        }
      }
    }));
  }

  if (Array.isArray(node.children)) {
    // Параллельно рекурсивно обрабатываем дочерние узлы
    await Promise.all(
      node.children.map((child: any) => enrichImageFills(child, imageUrlMap, cache))
    );
  }
}

// Рекурсивный поиск узла по ID
function findNodeById(node: any, nodeId: string, depth: number = 0): any {
  // Первый вызов - логируем структуру
  if (depth === 0) {
    console.log('Начинаем поиск узла:', nodeId);
    console.log('Корневой узел:', {
      id: node?.id,
      name: node?.name,
      type: node?.type,
      hasChildren: !!node?.children
    });
  }
  
  if (!node) {
    console.log(`Узел на глубине ${depth} является null/undefined`);
    return null;
  }
  
  if (node.id === nodeId) {
    console.log(`✓ Узел найден на глубине ${depth}!`);
    return node;
  }
  
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, nodeId, depth + 1);
      if (found) return found;
    }
  }
  
  // Если это корневой вызов и узел не найден
  if (depth === 0) {
    console.log(`✗ Узел ${nodeId} не найден в дереве`);
  }
  
  return null;
}

// Асинхронное упрощение структуры узла с конвертацией изображений в base64
async function simplifyNodeWithBase64(node: any, imageFills: Record<string, string> = {}): Promise<any> {
  const simplified: any = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible !== false,
  };

  // Базовые свойства
  if (node.absoluteBoundingBox) {
    simplified.x = node.absoluteBoundingBox.x;
    simplified.y = node.absoluteBoundingBox.y;
    simplified.width = node.absoluteBoundingBox.width;
    simplified.height = node.absoluteBoundingBox.height;
  }

  // Относительная позиция (важно для детей)
  if (node.relativeTransform) {
    simplified.relativeTransform = node.relativeTransform;
  }

  // Свойства фрейма
  if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    simplified.backgroundColor = node.backgroundColor;
    simplified.clipsContent = node.clipsContent;
    simplified.layoutMode = node.layoutMode;
    simplified.paddingLeft = node.paddingLeft;
    simplified.paddingRight = node.paddingRight;
    simplified.paddingTop = node.paddingTop;
    simplified.paddingBottom = node.paddingBottom;
    simplified.itemSpacing = node.itemSpacing;
    simplified.layoutAlign = node.layoutAlign;
    simplified.counterAxisAlignItems = node.counterAxisAlignItems;
    simplified.primaryAxisAlignItems = node.primaryAxisAlignItems;
    simplified.primaryAxisSizingMode = node.primaryAxisSizingMode;
    simplified.counterAxisSizingMode = node.counterAxisSizingMode;
    simplified.layoutGrow = node.layoutGrow;
    simplified.constrainProportions = node.constrainProportions;
  }

  // Заливки и обводки с конвертацией изображений в base64
  if (node.fills) {
    simplified.fills = await Promise.all(node.fills.map(async (fill: any) => {
      if (fill.type === 'IMAGE' && fill.imageRef && imageFills[fill.imageRef]) {
        const imageUrl = imageFills[fill.imageRef];
        const imageBase64 = await imageUrlToBase64(imageUrl);
        return {
          ...fill,
          imageUrl: imageUrl,
          imageData: imageBase64 // Добавляем base64 версию
        };
      }
      return fill;
    }));
  }
  if (node.strokes) {
    simplified.strokes = node.strokes;
    simplified.strokeWeight = node.strokeWeight;
    simplified.strokeAlign = node.strokeAlign;
    simplified.strokeDashes = node.strokeDashes;
    simplified.strokeCap = node.strokeCap;
    simplified.strokeJoin = node.strokeJoin;
    simplified.strokeMiterLimit = node.strokeMiterLimit;
  }

  // Эффекты
  if (node.effects) {
    simplified.effects = node.effects;
  }

  // Текст
  if (node.type === 'TEXT') {
    simplified.characters = node.characters;
    simplified.style = node.style;
    simplified.characterStyleOverrides = node.characterStyleOverrides;
    simplified.styleOverrideTable = node.styleOverrideTable;
    simplified.fontSize = node.fontSize;
    simplified.fontName = node.fontName;
    simplified.textAlignHorizontal = node.textAlignHorizontal;
    simplified.textAlignVertical = node.textAlignVertical;
    simplified.letterSpacing = node.letterSpacing;
    simplified.lineHeight = node.lineHeight;
    simplified.textDecoration = node.textDecoration;
    simplified.textCase = node.textCase;
    simplified.hyperlink = node.hyperlink;
    simplified.textAutoResize = node.textAutoResize;
  }

  // Скругления
  if (node.cornerRadius !== undefined) {
    simplified.cornerRadius = node.cornerRadius;
  }
  if (node.rectangleCornerRadii) {
    simplified.rectangleCornerRadii = node.rectangleCornerRadii;
  }

  // Векторные данные
  if (node.type === 'VECTOR' || node.type === 'LINE' || node.type === 'REGULAR_POLYGON' || node.type === 'STAR' || node.type === 'ELLIPSE') {
    simplified.vectorPaths = node.vectorPaths;
    simplified.vectorNetwork = node.vectorNetwork;
    simplified.handleMirroring = node.handleMirroring;
    
    // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ для отладки
    const hasVectorPaths = !!(node.vectorPaths && node.vectorPaths.length > 0);
    const hasVectorNetwork = !!(node.vectorNetwork && node.vectorNetwork.vertices && node.vectorNetwork.vertices.length > 0);
    
    console.log(`[SIMPLIFY_NODE] Векторный узел "${node.name}" (${node.type}):`, {
      исходныйVectorPaths: node.vectorPaths ? `ЕСТЬ (${node.vectorPaths.length})` : 'НЕТ',
      исходныйVectorNetwork: node.vectorNetwork ? `ЕСТЬ (vertices: ${node.vectorNetwork.vertices?.length || 0})` : 'НЕТ',
      скопированоVectorPaths: simplified.vectorPaths ? `ЕСТЬ (${simplified.vectorPaths.length})` : 'НЕТ',
      скопированоVectorNetwork: simplified.vectorNetwork ? `ЕСТЬ (vertices: ${simplified.vectorNetwork.vertices?.length || 0})` : 'НЕТ',
      hasVectorPaths,
      hasVectorNetwork
    });
    
    if (!hasVectorPaths && !hasVectorNetwork) {
      console.warn(`[SIMPLIFY_NODE] ❌ Узел "${node.name}" (${node.type}) НЕ ИМЕЕТ векторных данных в исходнике!`);
      console.warn('[SIMPLIFY_NODE] Сырые данные узла:', {
        vectorPaths: node.vectorPaths,
        vectorNetwork: node.vectorNetwork,
        keys: Object.keys(node).filter(k => k.includes('vector') || k.includes('path'))
      });
    } else {
      console.log(`[SIMPLIFY_NODE] ✅ Узел "${node.name}" (${node.type}) успешно обработан с векторными данными`);
    }
  }

  // Свойства для звезд и полигонов
  if (node.type === 'STAR') {
    simplified.pointCount = node.pointCount;
    simplified.innerRadius = node.innerRadius;
  }
  if (node.type === 'REGULAR_POLYGON') {
    simplified.pointCount = node.pointCount;
  }

  // Boolean операции
  if (node.type === 'BOOLEAN_OPERATION') {
    simplified.booleanOperation = node.booleanOperation;
  }

  // Маски
  if (node.isMask !== undefined) {
    simplified.isMask = node.isMask;
  }
  if (node.maskType !== undefined) {
    simplified.maskType = node.maskType;
  }

  // Прозрачность и режим смешивания
  if (node.opacity !== undefined) {
    simplified.opacity = node.opacity;
  }
  if (node.blendMode) {
    simplified.blendMode = node.blendMode;
  }

  // Поворот
  if (node.rotation !== undefined) {
    simplified.rotation = node.rotation;
  }

  // Ограничения (constraints)
  if (node.constraints) {
    simplified.constraints = node.constraints;
  }

  // Экспорт настройки
  if (node.exportSettings) {
    simplified.exportSettings = node.exportSettings;
  }

  // Component свойства
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    simplified.componentId = node.componentId;
    simplified.componentProperties = node.componentProperties;
    simplified.overrides = node.overrides;
  }

  // Рекурсивно обрабатываем детей
  if (node.children) {
    simplified.children = await Promise.all(
      node.children.map((child: any) => simplifyNodeWithBase64(child, imageFills))
    );
  }

  return simplified;
}

// Рекурсивная функция для присвоения изображения узла всем IMAGE fills
function assignNodeImageToFills(node: any, imageUrl: string, imageUrlMap?: Record<string, string>): void {
  if (!node) return;
  
  // Проверяем, есть ли экспортированное изображение для этого конкретного узла
  const nodeSpecificImage = imageUrlMap?.[`child_${node.id}`] || imageUrlMap?.[`node_${node.id}`];
  const imageToUse = nodeSpecificImage || imageUrl;
  
  // Обрабатываем fills текущего узла
  if (Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (fill.type === 'IMAGE' && !fill.imageUrl) {
        fill.imageUrl = imageToUse;
        fill.isNodeExport = true;
        console.log(`[FALLBACK] Присвоено изображение ${nodeSpecificImage ? 'узла' : 'родителя'} для fill в ${node.name || node.id}`);
      }
    }
  }
  
  // Рекурсивно обрабатываем детей
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      assignNodeImageToFills(child, imageUrl, imageUrlMap);
    }
  }
} 