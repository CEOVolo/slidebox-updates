import axios from 'axios';
import { FigmaFile, FigmaNode, FigmaImageResponse, Category } from './types';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

class FigmaAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async request<T>(url: string, config: any = {}): Promise<T> {
    try {
      const response = await axios.get(`${FIGMA_API_BASE}${url}`, {
        headers: {
          'X-Figma-Token': this.accessToken,
        },
        ...config,
      });
      return response.data;
    } catch (error) {
      console.error('Figma API error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Figma API request failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Figma API request failed: ${error}`);
    }
  }

  // Получение файла по ID
  async getFile(fileId: string, params: object = {}): Promise<FigmaFile> {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<FigmaFile>(`/files/${fileId}${queryString ? `?${queryString}`: ''}`);
  }

  // Получение конкретных узлов
  async getNodes(fileId: string, nodeIds: string[]): Promise<any> {
    const ids = nodeIds.join(',');
    const url = `/files/${fileId}/nodes?ids=${ids}&geometry=paths`;
    console.log(`[FIGMA_API] Запрос к Figma API: ${url}`);
    
    const result = await this.request(url) as any;
    
    // Логирование ответа
    console.log(`[FIGMA_API] Ответ получен:`, {
      hasNodes: !!result.nodes,
      nodeCount: result.nodes ? Object.keys(result.nodes).length : 0
    });
    
    // Проверяем векторные данные в ответе
    if (result.nodes) {
      Object.entries(result.nodes).forEach(([nodeId, nodeWrapper]: [string, any]) => {
        const document = nodeWrapper.document;
        if (document) {
          const checkVectorInResponse = (node: any, path: string = '') => {
            if (node.type === 'VECTOR' || node.type === 'LINE' || node.type === 'STAR' || node.type === 'POLYGON' || node.type === 'ELLIPSE') {
              const hasVectorPaths = node.vectorPaths && node.vectorPaths.length > 0;
              const hasVectorNetwork = node.vectorNetwork && node.vectorNetwork.vertices && node.vectorNetwork.vertices.length > 0;
              
              if (hasVectorPaths || hasVectorNetwork) {
                console.log(`[FIGMA_API] ${path}${node.name} (${node.type}) - векторные данные НАЙДЕНЫ`);
              } else {
                console.log(`[FIGMA_API] ${path}${node.name} (${node.type}) - векторные данные ОТСУТСТВУЮТ`);
              }
            }
            
            if (node.children) {
              node.children.forEach((child: any) => checkVectorInResponse(child, path + '  '));
            }
          };
          
          checkVectorInResponse(document, `${nodeId}: `);
        }
      });
    }
    
    return result;
  }

  // Получение URL-ов для скачивания изображений
  async getImageURLs(
    fileId: string, 
    ids: string[],
    options: {
      format?: 'jpg' | 'png' | 'svg' | 'pdf';
      scale?: number;
      use_absolute_bounds?: boolean;
    } = {}
  ): Promise<FigmaImageResponse> {
    const params = new URLSearchParams({
      ids: ids.join(','),
      format: 'jpg',
      scale: (options.scale || 0.5).toString(), // Use smaller scale for previews
      use_absolute_bounds: 'true',
    });
    return this.request<FigmaImageResponse>(`/images/${fileId}?${params}`);
  }

  // Получение ссылок на выгрузку изображений по их ref
  async getImageFillURLs(fileId: string, imageRefs: string[]): Promise<{ images: Record<string, string> }> {
      return this.request<{ images: Record<string, string> }>(`/images/${fileId}?ids=${imageRefs.join(',')}`);
  }
}

// Парсинг URL Figma
export function parseFigmaUrl(url: string): { fileId: string; nodeId?: string; } | null {
  const patterns = [
    /https:\/\/www\.figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)\/(?:[^\/?]+)?(?:.*?node-id=([\w%-]+))?/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        fileId: match[1],
        nodeId: match[2]?.replace(/%3A/g, ':').replace(/-/g, ':'),
      };
    }
  }

  return null;
}

// Извлечение текста из узла Figma
export function extractTextFromNode(node: FigmaNode): string {
  let text = '';
  if (node.type === 'TEXT' && node.characters) {
    text += node.characters + ' ';
  }
  if (node.children) {
    for (const child of node.children) {
      text += extractTextFromNode(child);
    }
  }
  return text.trim();
}

// Генерация тегов теперь происходит только при извлечении текста
// Функция оставлена для обратной совместимости, но не используется
export function generateTagsFromContent(name: string, text: string): string[] {
  return []; // Теги создаются только через generateCombinedTags
}

// Определение категории по содержимому
export function detectCategory(name: string, text: string): Category {
  const content = (name + ' ' + text).toLowerCase();
    if (content.includes('обложк') || content.includes('титул') || content.includes('cover')) return 'COVERS';
    if (content.includes('услуг') || content.includes('сервис') || content.includes('service')) return 'SERVICES';
    if (content.includes('кейс') || content.includes('проект') || content.includes('case') || content.includes('портфолио')) return 'CASES';
    if (content.includes('технолог') || content.includes('стек') || content.includes('tech')) return 'TECHNOLOGIES';
    if (content.includes('цен') || content.includes('стоимост') || content.includes('тариф') || content.includes('price')) return 'PRICES';
    if (content.includes('контакт') || content.includes('связ') || content.includes('телефон') || content.includes('email')) return 'CONTACTS';
  return 'OTHER';
}

/**
 * Оптимизированная функция для извлечения слайдов для превью.
 */
export async function extractSlidesFromFigma(figmaUrl: string, accessToken: string) {
  const figmaAPI = new FigmaAPI(accessToken);
  const parsed = parseFigmaUrl(figmaUrl);
  if (!parsed) throw new Error('Некорректный URL Figma файла');
  const { fileId, nodeId } = parsed;

  const fileMeta = await figmaAPI.getFile(fileId, { depth: 1 });
  const fileInfo = { id: fileId, name: fileMeta.name };

  let potentialSlides: (FigmaNode & { pageInfo: { id: string; name: string; } })[] = [];

  if (nodeId) {
    // --- СЦЕНАРИЙ С NODE-ID ---
    const apiNodeId = nodeId.replace(/%3A/g, ':').replace(/-/g, ':'); // Консистентная обработка с parseFigmaUrl
    console.log(`[extractSlides] Обнаружен node-id: ${nodeId}. Конвертирован в ${apiNodeId} для API. Запрос конкретного узла.`);
    const nodesData = await figmaAPI.getNodes(fileId, [apiNodeId]);
    const node = nodesData.nodes?.[apiNodeId]?.document;

    if (!node) {
      throw new Error(`Узел с ID ${apiNodeId} не найден в файле.`);
    }

    const findFramesRecursive = (n: FigmaNode, pageInfo: {id: string, name: string}): FigmaNode[] => {
        let frames: FigmaNode[] = [];
        if (n.type === 'FRAME') {
            frames.push(n);
        }
        if (n.children) {
            for (const child of n.children) {
                frames.push(...findFramesRecursive(child, pageInfo));
            }
        }
        return frames;
    };
    
    let pageInfo = { id: 'unknown', name: 'Unknown Page' };
    if (node.type === 'CANVAS') {
        pageInfo = { id: node.id, name: node.name };
    }
    
    const foundFrames = findFramesRecursive(node, pageInfo);

    potentialSlides = foundFrames
        .filter(frame => {
            if (!frame.absoluteBoundingBox) return false;
            const { width, height } = frame.absoluteBoundingBox;
            const isSlideSize = (width >= 1024 && height >= 768) || (width >= 1280 && height >= 720) || (width >= 1920 && height >= 1080);
            return isSlideSize && !frame.name.toLowerCase().match(/icon|button|component|symbol|mask|overlay|popup|modal|tooltip/);
        })
        .map(frame => ({...frame, pageInfo}));

  } else {
    // --- СЦЕНАРИЙ БЕЗ NODE-ID (ВЕСЬ ФАЙЛ) ---
    console.log(`[extractSlides] 1. Получение метаданных для файла ${fileId}`);
    const pages = fileMeta.document?.children?.filter(child => child.type === 'CANVAS') || [];
    if (!pages.length) return { slides: [], fileInfo: { id: fileId, name: fileMeta.name } };
    
    console.log(`[extractSlides] 2. Найдено ${pages.length} страниц. Получение фреймов...`);
    const pageNodeIds = pages.map(p => p.id);
    const nodesData = await figmaAPI.getNodes(fileId, pageNodeIds);
    
    Object.values(nodesData.nodes).forEach((pageNode: any) => {
      if (pageNode.document && pageNode.document.children) {
        const pageInfo = { id: pageNode.document.id, name: pageNode.document.name };
        const framesOnPage = pageNode.document.children.filter((child: FigmaNode) => {
          if (child.type !== 'FRAME' || !child.absoluteBoundingBox) return false;
          const { width, height } = child.absoluteBoundingBox;
          const isSlideSize = (width >= 1024 && height >= 768) || (width >= 1280 && height >= 720) || (width >= 1920 && height >= 1080);
          return isSlideSize && !child.name.toLowerCase().match(/icon|button|component|symbol|mask|overlay|popup|modal|tooltip/);
        });
        framesOnPage.forEach((frame: FigmaNode) => potentialSlides.push({ ...frame, pageInfo }));
      }
    });
  }

  console.log(`[extractSlides] 3. Найдено ${potentialSlides.length} потенциальных слайдов. Запрос превью...`);
  if (!potentialSlides.length) return { slides: [], fileInfo: fileInfo };

  const slideNodeIds = potentialSlides.map(s => s.id);
  const imagesResponse = await figmaAPI.getImageURLs(fileId, slideNodeIds);

  const finalSlides = potentialSlides.map(node => {
    const imageUrl = imagesResponse.images?.[node.id] || '';
        const extractedText = extractTextFromNode(node);
    return {
          nodeId: node.id,
          name: node.name,
      imageUrl,
          extractedText,
      tags: [], // Теги больше не генерируются при импорте
      category: detectCategory(node.name, extractedText),
      width: node.absoluteBoundingBox?.width,
      height: node.absoluteBoundingBox?.height,
      pageId: node.pageInfo.id,
      pageName: node.pageInfo.name,
    };
  });

  return { slides: finalSlides, fileInfo: fileInfo };
}

/**
 * Извлекает полную структуру указанных узлов и base64 изображений.
 */
export async function exportNodes(fileId: string, nodeIds: string[], accessToken: string) {
  const figmaAPI = new FigmaAPI(accessToken);
  console.log(`[exportNodes] Экспорт ${nodeIds.length} узлов из файла ${fileId}`);
  
  const nodesData = await figmaAPI.getNodes(fileId, nodeIds);
  if (!nodesData.nodes) throw new Error('Не удалось получить данные узлов');

  const nodes = Object.values(nodesData.nodes).map((n: any) => n.document);
  const imageFills = new Set<string>();

  function findImageFills(node: any) {
    if (node.fills?.some((fill: any) => fill.type === 'IMAGE' && fill.imageRef)) {
        node.fills.forEach((fill: any) => {
            if (fill.type === 'IMAGE' && fill.imageRef) imageFills.add(fill.imageRef);
        });
    }
    node.children?.forEach(findImageFills);
  }
  nodes.forEach(findImageFills);

  console.log(`[exportNodes] Найдено ${imageFills.size} уникальных изображений.`);
  let imageBase64Map: Record<string, string> = {};

  if (imageFills.size > 0) {
    const imageRefArray = Array.from(imageFills);
    const imageDownloadUrlsResponse = await figmaAPI.getImageFillURLs(fileId, imageRefArray);

    if (imageDownloadUrlsResponse.images) {
      const downloadPromises = Object.entries(imageDownloadUrlsResponse.images).map(async ([imageRef, url]) => {
        if (!url) return;
        try {
          const response = await axios.get(url, { responseType: 'arraybuffer' });
          const base64 = Buffer.from(response.data, 'binary').toString('base64');
          imageBase64Map[imageRef] = `data:image/png;base64,${base64}`;
        } catch (error) {
          console.error(`[exportNodes] Не удалось загрузить изображение для ref ${imageRef}:`, error);
        }
      });
      await Promise.all(downloadPromises);
      console.log(`[exportNodes] Успешно загружено ${Object.keys(imageBase64Map).length} изображений в base64.`);
    }
  }

  return { nodes, imageBase64Map };
}

export default FigmaAPI; 