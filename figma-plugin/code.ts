// =================================================================================
// SlideDeck 2.0 - Figma Plugin Code
// VERSION: 5.2 (Deep Nesting & Groups Support)
// =================================================================================

// --- TYPE DEFINITIONS ---

interface SlideInfo {
  id: string; // Unique ID from web app
  title: string;
  figmaFileId: string;
  figmaNodeId: string;
  webAppUrl: string; // Base URL of the web app
  width?: number;
  height?: number;
}

interface PresentationRequest {
  presentationId: string;
  title: string;
  slides: SlideInfo[];
  webAppUrl: string;
}

interface NodeDataResponse {
  fileId: string;
  nodeId: string;
  node?: any; // Full node structure from Figma API
  imageUrl?: string; // URL for placeholder image
  imageData?: string; // Base64 for placeholder image
}

// Map to store handlers for async requests to the UI
const requestHandlers = new Map<string, (msg: any) => void>();

const API_URL = 'http://localhost:3000/api'; // Ensure this is correct

// --- GLOBAL COUNTERS FOR DIAGNOSTICS ---
let nodeCounter = {
    total: 0,
    byType: {} as Record<string, number>,
    byDepth: {} as Record<number, number>,
    maxDepth: 0
};

// --- INITIALIZATION ---

figma.showUI(__html__, { width: 340, height: 480, themeColors: true });
console.log('=== SlideDeck 2.0 Plugin Initialized ===');
console.log('VERSION: 5.2 (Deep Nesting & Groups Support)');
console.log('Улучшения: поддержка глубокой вложенности, правильные GROUP, статистика узлов');

// --- MESSAGE HANDLING ---

figma.ui.onmessage = async (msg) => {
  console.log(`[PLUGIN] Received message: ${msg.type}`, msg.payload);
  
  switch (msg.type) {
    case 'FETCH_PRESENTATION':
      await handleFetchPresentation();
      break;
    case 'COPY_SLIDES':
      await handleCopySlides(msg.payload);
      break;
    case 'OPEN_WEBAPP':
      figma.openExternal(`${API_URL.replace('/api', '')}`);
      break;
    default:
      console.warn(`[PLUGIN] Unknown message type: ${msg.type}`);
  }
};

// --- CORE LOGIC ---

async function handleFetchPresentation() {
  try {
    const response = await fetch(`${API_URL}/presentations/plugin/latest`);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.log('[PLUGIN] Fetched presentation data:', data);

    if (data.success && data.presentation) {
      figma.ui.postMessage({ type: 'PRESENTATION_LOADED', payload: data.presentation });
    } else {
      figma.ui.postMessage({ type: 'PRESENTATION_LOADED', payload: null });
    }
  } catch (error: any) {
    console.error('[PLUGIN] Error fetching presentation:', error);
    figma.ui.postMessage({ type: 'FETCH_ERROR', payload: { error: error.message } });
  }
}

async function handleCopySlides(slides: any[]) {
    if (!slides || slides.length === 0) {
        figma.notify('Нет слайдов для копирования.', { error: true });
        return;
    }
    
    console.log(`[COPY] Starting copy of ${slides.length} slides.`);
    const newPage = figma.createPage();
    newPage.name = `[SlideDeck] Копия презентации`;
    figma.currentPage = newPage;

    const createdNodes: SceneNode[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const [index, slideInfo] of slides.entries()) {
        figma.ui.postMessage({ 
            type: 'COPY_PROGRESS', 
            payload: { copied: index + 1, total: slides.length }
        });

        try {
            const node = await fetchAndRecreateNode(slideInfo, newPage);
            if (node) {
                // Позиционируем сразу, чтобы слайды не накладывались
                node.x = index * (node.width + 100);
                node.y = 0;
                createdNodes.push(node);
                successCount++;
            } else {
                errorCount++;
            }
        } catch (e) {
            console.error(`[COPY] Failed to process slide ${slideInfo.id}`, e);
            figma.notify(`Ошибка при копировании слайда ${index + 1}: ${slideInfo.title}`, { error: true });
            errorCount++;
        }
    }

    if (createdNodes.length > 0) {
        // arrangeNodes уже не нужна, так как мы позиционировали при создании
        figma.viewport.scrollAndZoomIntoView(createdNodes);
    }

    figma.ui.postMessage({ type: 'COPY_COMPLETE' });
    
    // Выводим статистику
    console.log('\n=== СТАТИСТИКА КОПИРОВАНИЯ ===');
    console.log(`Всего обработано узлов: ${nodeCounter.total}`);
    console.log(`Максимальная глубина: ${nodeCounter.maxDepth}`);
    console.log('Узлы по типам:', nodeCounter.byType);
    console.log('Узлы по глубине:', nodeCounter.byDepth);
    
    // Сбрасываем счётчики для следующего запуска
    nodeCounter = { total: 0, byType: {}, byDepth: {}, maxDepth: 0 };
    
    if (errorCount > 0) {
        figma.notify(`Копирование завершено с ошибками. Успешно: ${successCount}, Ошибок: ${errorCount}`, { error: true });
    } else {
        figma.notify(`Копирование успешно завершено. Скопировано слайдов: ${successCount}`);
    }
}

async function fetchAndRecreateNode(slideInfo: any, parent: PageNode): Promise<SceneNode | null> {
    console.log(`[NODE] Fetching data for slide: ${slideInfo.title}`);
    try {
        const response = await fetch(`${API_URL}/figma/export-nodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slides: [{ figmaFileId: slideInfo.figmaFileId, figmaNodeId: slideInfo.figmaNodeId }] })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const nodeData = data.nodes[0];

        if (!nodeData || !nodeData.node) {
            throw new Error('Invalid node data received from server.');
        }

        const recreatedNode = await recreateNode(nodeData.node, parent, true);
        if (recreatedNode) {
            parent.appendChild(recreatedNode);
            return recreatedNode;
        }
        return null;
    } catch (error) {
        console.error(`[NODE] Failed to fetch or recreate node for slide ${slideInfo.title}:`, error);
        return null;
    }
}

// --- NODE RECREATION ---

async function recreateNode(nodeData: any, parent: BaseNode, isRoot: boolean = false, depth: number = 0): Promise<SceneNode | null> {
    if (!nodeData || !nodeData.type) {
        console.error('[RECREATE] Invalid nodeData received.', nodeData);
        return null;
    }

    // Логируем глубину для отладки
    const indent = '  '.repeat(depth);
    console.log(`${indent}[RECREATE-${depth}] Processing: ${nodeData.name} (${nodeData.type})`);
    
    // Обновляем счётчики
    nodeCounter.total++;
    nodeCounter.byType[nodeData.type] = (nodeCounter.byType[nodeData.type] || 0) + 1;
    nodeCounter.byDepth[depth] = (nodeCounter.byDepth[depth] || 0) + 1;
    if (depth > nodeCounter.maxDepth) nodeCounter.maxDepth = depth;

    let node: SceneNode | null = null;
    
    // 1. Create the node itself
    try {
        switch (nodeData.type) {
            case 'FRAME': node = figma.createFrame(); break;
            case 'GROUP': 
                // GROUP нужно создавать через figma.group позже, после создания детей
                node = null; // Будет создан после обработки детей
                console.log(`${indent}[RECREATE] GROUP detected: ${nodeData.name}, will create after children`);
                break; 
            case 'RECTANGLE': node = figma.createRectangle(); break;
            case 'TEXT': node = figma.createText(); break;
            case 'VECTOR': node = figma.createVector(); break;
            case 'ELLIPSE': node = figma.createEllipse(); break;
            case 'INSTANCE': 
                // INSTANCE не может быть создан напрямую, создаем FRAME со всеми свойствами
                node = figma.createFrame();
                console.log(`[RECREATE] Converting INSTANCE to FRAME for node: ${nodeData.name}`);
                // Помечаем, что это был INSTANCE для специальной обработки
                (node as any)._wasInstance = true;
                break;
            case 'LINE':
                // LINE тоже создаем как VECTOR
                node = figma.createVector();
                console.log(`[RECREATE] Converting LINE to VECTOR for node: ${nodeData.name}`);
                // Для LINE нужно установить vectorPaths из данных узла
                if (nodeData.vectorPaths) {
                    (node as VectorNode).vectorPaths = nodeData.vectorPaths;
                } else if (nodeData.absoluteBoundingBox) {
                    // Если нет vectorPaths, создаем простую линию
                    const width = nodeData.absoluteBoundingBox.width || 100;
                    const height = nodeData.absoluteBoundingBox.height || 1;
                    (node as VectorNode).vectorPaths = [{
                        windingRule: 'NONZERO',
                        data: `M 0 0 L ${width} ${height}`
                    }];
                }
                break;
            case 'BOOLEAN_OPERATION':
                // Временно создаём контейнер для детей
                node = null; // Будет создан позже после обработки детей
                console.log(`[RECREATE] BOOLEAN_OPERATION detected: ${nodeData.name}, operation: ${nodeData.booleanOperation}`);
                break;
            case 'STAR': 
                node = figma.createStar();
                console.log(`[RECREATE] Creating STAR node: ${nodeData.name}`);
                break;
            case 'POLYGON':
            case 'REGULAR_POLYGON':
                node = figma.createPolygon();
                console.log(`[RECREATE] Creating POLYGON node: ${nodeData.name}`);
                break;
            default:
                console.warn(`[RECREATE] Unsupported node type "${nodeData.type}". Creating a placeholder frame.`);
                node = figma.createFrame();
                break;
        }
    } catch (e) {
        console.error(`[RECREATE] Error creating node of type ${nodeData.type}`, e);
        return null;
    }
    
    // 2. Apply properties (только если node существует)
    if (node) {
        node.name = nodeData.name;
        if ('visible' in nodeData) node.visible = nodeData.visible;
        if ('opacity' in nodeData) node.opacity = nodeData.opacity;
    
    if (!isRoot) {
        if (nodeData.relativeTransform) {
            const transform = nodeData.relativeTransform;
            node.relativeTransform = transform;
        } else {
            node.x = nodeData.x || 0;
            node.y = nodeData.y || 0;
        }
    }
    
    if (nodeData.absoluteBoundingBox) {
        node.resize(nodeData.absoluteBoundingBox.width || 100, nodeData.absoluteBoundingBox.height || 100);
    } else if (nodeData.width && nodeData.height) {
        node.resize(nodeData.width, nodeData.height);
    }
    
    if ('layoutMode' in node && nodeData.layoutMode) {
        const frame = node as FrameNode;
        frame.layoutMode = nodeData.layoutMode;
        if (nodeData.paddingLeft) frame.paddingLeft = nodeData.paddingLeft;
        if (nodeData.paddingRight) frame.paddingRight = nodeData.paddingRight;
        if (nodeData.paddingTop) frame.paddingTop = nodeData.paddingTop;
        if (nodeData.paddingBottom) frame.paddingBottom = nodeData.paddingBottom;
        if (nodeData.itemSpacing) frame.itemSpacing = nodeData.itemSpacing;
    }
    
    // Fills  
    if ('fills' in node && Array.isArray(nodeData.fills)) {
        console.log(`[FILLS] Processing ${nodeData.fills.length} fills for node: ${nodeData.name}`);
        nodeData.fills.forEach((fill: any, index: number) => {
            if (fill.type === 'IMAGE') {
                console.log(`[FILLS] Fill ${index} is IMAGE type:`, {
                    hasImageRef: !!fill.imageRef,
                    hasImageUrl: !!fill.imageUrl,
                    hasImageData: !!fill.imageData,
                    visible: fill.visible !== false
                });
            }
        });
        
        try {
            node.fills = await processPaints(nodeData.fills);
        } catch (e) {
            console.error(`[FILLS] Error processing fills for node ${nodeData.name}:`, e);
            // Попробуем установить пустой массив fills вместо ошибки
            node.fills = [];
        }
    }
    if ('strokes' in node && Array.isArray(nodeData.strokes)) {
        (node as any).strokes = await processPaints(nodeData.strokes);
    }
    if ('strokeWeight' in node && typeof nodeData.strokeWeight === 'number') {
        node.strokeWeight = nodeData.strokeWeight;
    }
    
    if ('strokeAlign' in node && nodeData.strokeAlign) {
        (node as any).strokeAlign = nodeData.strokeAlign;
    }

    if ('strokeCap' in node && nodeData.strokeCap) {
        (node as VectorNode).strokeCap = nodeData.strokeCap;
    }

    if ('strokeJoin' in node && nodeData.strokeJoin) {
        (node as VectorNode).strokeJoin = nodeData.strokeJoin;
    }

    if ('dashPattern' in node && Array.isArray(nodeData.dashPattern)) {
        (node as VectorNode).dashPattern = nodeData.dashPattern;
    }
    
    // Vector data for all vector types
    const hasVectorPaths = nodeData.vectorPaths && nodeData.vectorPaths.length > 0;
    const hasVectorNetwork = nodeData.vectorNetwork && nodeData.vectorNetwork.vertices && nodeData.vectorNetwork.vertices.length > 0;
    
    console.log(`[VECTOR] Node "${nodeData.name}" (${nodeData.type}) vector data check:`, {
        hasVectorPaths,
        hasVectorNetwork,
        vectorPathsLength: nodeData.vectorPaths?.length || 0,
        vectorNetworkVertices: nodeData.vectorNetwork?.vertices?.length || 0
    });
    
    if ('vectorPaths' in node && hasVectorPaths) {
        try {
            console.log(`[VECTOR] Applying vectorPaths to ${nodeData.type} node "${nodeData.name}"`);
            (node as VectorNode).vectorPaths = nodeData.vectorPaths;
            console.log(`[VECTOR] ✓ Successfully applied vectorPaths to ${nodeData.type} node "${nodeData.name}"`);
        } catch (e) {
            console.warn(`[VECTOR] ✗ Failed to apply vectorPaths to "${nodeData.name}":`, e);
            // Try vectorNetwork as fallback
            if ('vectorNetwork' in node && hasVectorNetwork) {
                try {
                    console.log(`[VECTOR] Trying vectorNetwork as fallback for "${nodeData.name}"`);
                    (node as VectorNode).vectorNetwork = nodeData.vectorNetwork;
                    console.log(`[VECTOR] ✓ Applied vectorNetwork as fallback`);
                } catch (e2) {
                    console.error(`[VECTOR] ✗ Failed to apply vectorNetwork to "${nodeData.name}":`, e2);
                }
            }
        }
    } else if ('vectorNetwork' in node && hasVectorNetwork) {
        try {
            console.log(`[VECTOR] Applying vectorNetwork to ${nodeData.type} node "${nodeData.name}"`);
            (node as VectorNode).vectorNetwork = nodeData.vectorNetwork;
            console.log(`[VECTOR] ✓ Successfully applied vectorNetwork to ${nodeData.type} node "${nodeData.name}"`);
        } catch (e) {
            console.error(`[VECTOR] ✗ Failed to apply vectorNetwork to "${nodeData.name}":`, e);
        }
    } else if (nodeData.type === 'VECTOR' || nodeData.type === 'LINE' || nodeData.type === 'STAR' || nodeData.type === 'POLYGON') {
        console.log(`[VECTOR] Node "${nodeData.name}" (${nodeData.type}) has no vector data!`);
    }
    
    // Дополнительные свойства для более точного копирования
    if ('effects' in node && Array.isArray(nodeData.effects)) {
        node.effects = nodeData.effects;
    }

    if ('blendMode' in node && nodeData.blendMode) {
        node.blendMode = nodeData.blendMode;
    }

    if ('cornerRadius' in node && typeof nodeData.cornerRadius === 'number') {
        (node as RectangleNode).cornerRadius = nodeData.cornerRadius;
    }

    if ('clipsContent' in node && typeof nodeData.clipsContent === 'boolean') {
        (node as FrameNode).clipsContent = nodeData.clipsContent;
    }

    if ('constraints' in node && nodeData.constraints) {
        // Конвертируем старые значения constraints в новые
        const convertConstraint = (value: string): 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE' => {
            switch(value) {
                case 'TOP':
                case 'LEFT':
                    return 'MIN';
                case 'BOTTOM':
                case 'RIGHT':
                    return 'MAX';
                case 'CENTER':
                    return 'CENTER';
                case 'STRETCH':
                    return 'STRETCH';
                case 'SCALE':
                    return 'SCALE';
                default:
                    return 'MIN'; // По умолчанию
            }
        };
        
        node.constraints = {
            horizontal: nodeData.constraints.horizontal ? convertConstraint(nodeData.constraints.horizontal) : 'MIN',
            vertical: nodeData.constraints.vertical ? convertConstraint(nodeData.constraints.vertical) : 'MIN'
        };
    }

    if ('layoutAlign' in node && nodeData.layoutAlign) {
        (node as any).layoutAlign = nodeData.layoutAlign;
    }

    if ('layoutGrow' in node && typeof nodeData.layoutGrow === 'number') {
        (node as any).layoutGrow = nodeData.layoutGrow;
    }
    
    // Обработка масок
    if ('isMask' in node && nodeData.isMask !== undefined) {
        (node as any).isMask = nodeData.isMask;
        console.log(`[MASK] Applied isMask=${nodeData.isMask} to node: ${nodeData.name}`);
    }
    
    if (node.type === 'TEXT' && nodeData.characters) {
        const style = nodeData.style;
        let fontLoaded: FontName | null = null;

        if (style?.fontFamily && style?.fontStyle) {
            const primaryFontName = { family: style.fontFamily, style: style.fontStyle };
            try {
                await figma.loadFontAsync(primaryFontName);
                fontLoaded = primaryFontName;
            } catch (e) {
                console.warn(`[TEXT] Failed to load primary font. Attempting fallback: ${primaryFontName.family} Regular`);
                try {
                    const fallbackFontName = { family: primaryFontName.family, style: 'Regular' };
                    await figma.loadFontAsync(fallbackFontName);
                    fontLoaded = fallbackFontName;
                } catch (e2) {
                     const safeFontName = { family: 'Roboto', style: 'Regular' };
                    console.error(`[TEXT] Fallback font also failed. Loading safe font: ${safeFontName.family} ${safeFontName.style}`, e2);
                    await figma.loadFontAsync(safeFontName);
                    fontLoaded = safeFontName;
                }
            }
        } else {
            const defaultFont = { family: 'Roboto', style: 'Regular' };
            await figma.loadFontAsync(defaultFont);
            fontLoaded = defaultFont;
        }

        if(fontLoaded) {
            node.fontName = fontLoaded;
        }
        
        // Apply other text properties
        if (style?.fontSize) {
            node.fontSize = style.fontSize;
        }
        if (style?.textAlignHorizontal) {
            node.textAlignHorizontal = style.textAlignHorizontal;
        }
        if (style?.textAlignVertical) {
            node.textAlignVertical = style.textAlignVertical;
        }
        
        // letterSpacing can be either a number or an object { value: number, unit: 'PIXELS' | 'PERCENT' }
        if (style?.letterSpacing !== undefined) {
            if (typeof style.letterSpacing === 'number') {
                node.letterSpacing = { value: style.letterSpacing, unit: 'PIXELS' };
            } else if (typeof style.letterSpacing === 'object' && style.letterSpacing.value !== undefined) {
                node.letterSpacing = style.letterSpacing;
            }
        }
        
        if (style?.lineHeight) {
            node.lineHeight = style.lineHeight;
        }

        // Must be set AFTER font is loaded and set
        node.characters = nodeData.characters;
    }
    
        // Дополнительные свойства для STAR и POLYGON
        if (nodeData.type === 'STAR' && node.type === 'STAR') {
            if (nodeData.pointCount !== undefined) {
                (node as StarNode).pointCount = nodeData.pointCount;
            }
            if (nodeData.innerRadius !== undefined) {
                (node as StarNode).innerRadius = nodeData.innerRadius;
            }
        }
        if ((nodeData.type === 'POLYGON' || nodeData.type === 'REGULAR_POLYGON') && node.type === 'POLYGON') {
            if (nodeData.pointCount !== undefined) {
                (node as PolygonNode).pointCount = nodeData.pointCount;
            }
        }
        
        // Специальная обработка для INSTANCE (компонентов)
        if ((node as any)._wasInstance && nodeData.type === 'INSTANCE') {
            // Копируем все свойства компонента
            console.log(`[INSTANCE] Processing component properties for: ${nodeData.name}`);
            
            // Применяем обрезку если она была
            if ('clipsContent' in node && nodeData.clipsContent !== undefined) {
                (node as FrameNode).clipsContent = nodeData.clipsContent;
                console.log(`[INSTANCE] Applied clipsContent=${nodeData.clipsContent}`);
            }
            
            // Сохраняем информацию о компоненте для отладки
            if (nodeData.componentId) {
                console.log(`[INSTANCE] Original componentId: ${nodeData.componentId}`);
            }
        }
    
        // 5. Process children recursively
        if ('children' in nodeData && 'appendChild' in node) {
            console.log(`${indent}[CHILDREN] Processing ${nodeData.children.length} children for node: ${nodeData.name} at depth ${depth}`);
            
            // Выводим информацию о структуре слайда для отладки
            if (nodeData.name === 'Splitter' || nodeData.name === 'Welcome to Andersen') {
                console.log(`[DEBUG] Structure of ${nodeData.name}:`, {
                    type: nodeData.type,
                    fillsCount: nodeData.fills?.length || 0,
                    childrenCount: nodeData.children?.length || 0,
                    children: nodeData.children?.map((c: any) => ({
                        name: c.name,
                        type: c.type,
                        hasFills: !!c.fills && c.fills.length > 0,
                        fillsCount: c.fills?.length || 0,
                        hasImageFills: c.fills?.some((f: any) => f.type === 'IMAGE') || false
                    }))
                });
            }
            
            for (const childData of nodeData.children) {
                console.log(`[CHILDREN] Child: ${childData.name} (${childData.type})`);
                
                // Специальная проверка для детей с масками
                if (childData.isMask) {
                    console.log(`[CHILDREN] Child ${childData.name} is a MASK`);
                }
                
                if (childData.type === 'FRAME' || childData.type === 'RECTANGLE' || childData.type === 'ELLIPSE') {
                    // Проверяем, есть ли у дочернего элемента IMAGE fills
                    if (childData.fills && Array.isArray(childData.fills)) {
                        const imageFills = childData.fills.filter((f: any) => f.type === 'IMAGE');
                        if (imageFills.length > 0) {
                            console.log(`[CHILDREN] Child ${childData.name} has ${imageFills.length} image fills`);
                            // Проверяем, есть ли проблемы с изображениями
                            imageFills.forEach((fill: any, idx: number) => {
                                if (!fill.imageUrl && !fill.imageData) {
                                    console.warn(`[CHILDREN] Image fill ${idx} in ${childData.name} has no URL or data!`);
                                }
                            });
                        }
                    }
                }
                
                const childNode = await recreateNode(childData, node, false, depth + 1);
                if (childNode) {
                    node.appendChild(childNode);
                }
            }
        }
    } // Закрываем блок if (node)

    // Специальная обработка GROUP
    if (nodeData.type === 'GROUP' && !node) {
        // Сначала создаём всех детей
        const groupChildren: SceneNode[] = [];
        if (nodeData.children) {
            for (const childData of nodeData.children) {
                const childNode = await recreateNode(childData, parent, false, depth + 1);
                if (childNode) {
                    groupChildren.push(childNode);
                }
            }
        }
        
        // Создаём группу из детей
        if (groupChildren.length > 0) {
            try {
                console.log(`${indent}[GROUP] Attempting to create GROUP "${nodeData.name}" with ${groupChildren.length} children`);
                node = figma.group(groupChildren, parent as PageNode | FrameNode);
                console.log(`${indent}[GROUP] ✓ Successfully created GROUP "${nodeData.name}" with ${groupChildren.length} children`);
            } catch (e) {
                console.error(`${indent}[GROUP] ✗ Failed to create group "${nodeData.name}":`, e);
                console.error(`${indent}[GROUP] Error details:`, {
                    childrenCount: groupChildren.length,
                    parentType: parent.type,
                    childTypes: groupChildren.map(c => c.type)
                });
                // Fallback: создаём frame
                console.log(`${indent}[GROUP] Using FRAME fallback for group "${nodeData.name}"`);
                node = figma.createFrame();
                node.name = nodeData.name;
                groupChildren.forEach(child => {
                    try {
                        (node as FrameNode).appendChild(child);
                    } catch (appendError) {
                        console.error(`${indent}[GROUP] Failed to append child to frame:`, appendError);
                    }
                });
            }
        } else {
            // Пустая группа - создаём frame
            console.log(`${indent}[GROUP] Empty group "${nodeData.name}" - creating frame`);
            node = figma.createFrame();
            node.name = nodeData.name;
        }
        
        // Применяем свойства группы
        if (node) {
            node.name = nodeData.name;
            if ('visible' in nodeData) node.visible = nodeData.visible;
            if ('opacity' in nodeData) node.opacity = nodeData.opacity;
            
            // ВАЖНО: Применяем позиционирование!
            if ('x' in nodeData && 'y' in nodeData) {
                console.log(`${indent}[GROUP] Setting position: x=${nodeData.x}, y=${nodeData.y}`);
                node.x = nodeData.x;
                node.y = nodeData.y;
            }
            
            // Применяем поворот если есть
            if ('rotation' in nodeData && nodeData.rotation) {
                console.log(`${indent}[GROUP] Setting rotation: ${nodeData.rotation}`);
                node.rotation = nodeData.rotation;
            }
        }
        
        // Не обрабатываем детей повторно
        nodeData.children = null;
    }

    // Специальная обработка BOOLEAN_OPERATION
    if (nodeData.type === 'BOOLEAN_OPERATION' && !node) {
        // Сначала создаём всех детей
        const booleanChildren: SceneNode[] = [];
        if (nodeData.children) {
            for (const childData of nodeData.children) {
                const childNode = await recreateNode(childData, parent, false, depth + 1);
                if (childNode) {
                    booleanChildren.push(childNode);
                }
            }
        }
        
        // Теперь применяем boolean операцию
        if (booleanChildren.length >= 2 && nodeData.booleanOperation) {
            try {
                console.log(`[RECREATE] Applying boolean operation: ${nodeData.booleanOperation} with ${booleanChildren.length} children`);
                
                switch (nodeData.booleanOperation) {
                    case 'UNION':
                        node = figma.union(booleanChildren, parent as PageNode | FrameNode);
                        break;
                    case 'INTERSECT':
                        node = figma.intersect(booleanChildren, parent as PageNode | FrameNode);
                        break;
                    case 'SUBTRACT':
                        node = figma.subtract(booleanChildren, parent as PageNode | FrameNode);
                        break;
                    case 'EXCLUDE':
                        node = figma.exclude(booleanChildren, parent as PageNode | FrameNode);
                        break;
                    default:
                        console.warn(`[RECREATE] Unknown boolean operation: ${nodeData.booleanOperation}`);
                        // Fallback: создаём группу
                        node = figma.group(booleanChildren, parent as PageNode | FrameNode);
                        break;
                }
                
                if (node) {
                    console.log(`[RECREATE] Boolean operation successful!`);
                } else {
                    throw new Error('Boolean operation returned null');
                }
            } catch (e) {
                console.error(`[RECREATE] Failed to create boolean operation:`, e);
                // Fallback: создаём группу из детей
                try {
                    node = figma.group(booleanChildren, parent as PageNode | FrameNode);
                    console.log(`[RECREATE] Created group as fallback for boolean operation`);
                } catch (e2) {
                    console.error(`[RECREATE] Failed to create group fallback:`, e2);
                    // Последний fallback: frame с детьми
                    node = figma.createFrame();
                    booleanChildren.forEach(child => (node as FrameNode).appendChild(child));
                }
            }
        } else if (booleanChildren.length > 0) {
            // Недостаточно детей для boolean операции, создаём группу
            node = figma.group(booleanChildren, parent as PageNode | FrameNode);
        } else {
            // Нет детей, создаём пустой frame
            node = figma.createFrame();
        }
        
        // Применяем свойства BOOLEAN_OPERATION
        if (node) {
            node.name = nodeData.name;
            if ('visible' in nodeData) node.visible = nodeData.visible;
            if ('opacity' in nodeData) node.opacity = nodeData.opacity;
            
            // ВАЖНО: Применяем позиционирование!
            if ('x' in nodeData && 'y' in nodeData) {
                console.log(`${indent}[BOOLEAN_OP] Setting position: x=${nodeData.x}, y=${nodeData.y}`);
                node.x = nodeData.x;
                node.y = nodeData.y;
            }
            
            // Применяем поворот если есть
            if ('rotation' in nodeData && nodeData.rotation) {
                console.log(`${indent}[BOOLEAN_OP] Setting rotation: ${nodeData.rotation}`);
                node.rotation = nodeData.rotation;
            }
        }
        
        // Не обрабатываем детей повторно
        nodeData.children = null;
    }

    return node;
}

async function processPaints(paints: any[]): Promise<Paint[]> {
    const processed: Paint[] = [];
    if (!paints) return processed;

    for (const p of paints) {
        if (p.visible === false) continue;

        try {
            if (p.type === 'IMAGE') {
                let image: Image | null = null;
                console.log(`[PAINTS] Processing image fill:`, {
                    hasImageData: !!p.imageData,
                    isBig: !!p.big,
                    hasImageUrl: !!p.imageUrl,
                    imageRef: p.imageRef || 'none',
                    scaleMode: p.scaleMode || 'default'
                });

                // 1. Сначала пытаемся из base64 (для небольших картинок)
                if (p.imageData) {
                    try {
                        // Проверяем формат base64
                        let base64Data = p.imageData;
                        if (p.imageData.includes(',')) {
                            base64Data = p.imageData.split(',')[1];
                        }
                        const bytes = figma.base64Decode(base64Data);
                        image = figma.createImage(bytes);
                        console.log('[PAINTS] Успешно создано изображение из base64.');
                    } catch (e) {
                        console.warn('[PAINTS] Ошибка создания изображения из base64:', e);
                        console.warn('[PAINTS] Base64 length:', p.imageData?.length || 0);
                    }
                }

                // 2. Если base64 не сработал или его не было (для больших картинок), пробуем URL
                if (!image && p.imageUrl) {
                    try {
                        console.log(`[PAINTS] Пытаемся загрузить изображение по URL: ${p.imageUrl}`);
                        image = await figma.createImageAsync(p.imageUrl);
                        console.log('[PAINTS] Успешно создано изображение из URL.');
                    } catch (e) {
                        console.error('[PAINTS] Критическая ошибка: не удалось создать изображение и из URL.', e);
                    }
                }

                if (image) {
                    // Фикс для неподдерживаемых scaleMode
                    let scaleMode = p.scaleMode || 'FILL';
                    if (scaleMode === 'STRETCH') {
                        scaleMode = 'FILL';
                    }
                    
                    const newPaint: ImagePaint = {
                        type: 'IMAGE',
                        imageHash: image.hash,
                        scaleMode: scaleMode as 'FILL' | 'FIT' | 'CROP' | 'TILE',
                        blendMode: p.blendMode,
                        opacity: p.opacity,
                        imageTransform: p.imageTransform,
                        scalingFactor: p.scalingFactor,
                        rotation: p.rotation,
                    };
                    
                    processed.push(newPaint);
                } else {
                    console.error('[PAINTS] Не удалось создать изображение ни одним из способов. Слой останется без картинки.');
                }
            } else if (p.type === 'SOLID' && p.color) {
                const { r, g, b, a } = p.color;
                processed.push({
                    type: 'SOLID',
                    color: { r, g, b },
                    opacity: p.opacity ?? a ?? 1,
                    blendMode: p.blendMode,
                });
            } else if (p.type && p.type.startsWith('GRADIENT')) {
                // Градиенты требуют обязательное поле gradientTransform
                const gradientPaint: any = {
                    type: p.type,
                    gradientTransform: p.gradientTransform || [[1, 0, 0], [0, 1, 0]], // Default identity matrix
                    gradientStops: p.gradientStops || [],
                    opacity: p.opacity ?? 1,
                };
                if (p.blendMode) gradientPaint.blendMode = p.blendMode;
                processed.push(gradientPaint);
            }
        } catch (e) {
            console.error(`[PAINTS] Failed to process a paint fill.`, { paint: p, error: e });
        }
    }

    return processed;
}

// --- FALLBACK: PLACEHOLDER IMAGE CREATION ---

async function createPlaceholderImage(nodeData: NodeDataResponse, parent: PageNode): Promise<SceneNode | null> {
  console.log(`[FALLBACK] Creating placeholder for node: ${nodeData.nodeId}`);
  const { width, height } = nodeData.node || { width: 1024, height: 768 };
  const rect = figma.createRectangle();
  rect.name = `[Placeholder] ${nodeData.node?.name || nodeData.nodeId}`;
  rect.resize(width, height);
  parent.appendChild(rect);

  let image: Image | null = null;
  
  try {
    if (nodeData.imageUrl) {
        image = await figma.createImageAsync(nodeData.imageUrl);
    }
  } catch (e) {
      console.error(`[FALLBACK] Failed to create image from URL.`, e);
      image = null;
  }

  if (!image && nodeData.imageData) {
    try {
        const imageBytes = figma.base64Decode(nodeData.imageData);
        image = figma.createImage(imageBytes);
    } catch(e) {
        console.error(`[FALLBACK] Failed to create image from Base64 data.`, e);
    }
  }

  if (image) {
    console.log(`[FALLBACK] Image created successfully. Applying as fill.`);
    rect.fills = [{ type: 'IMAGE', scaleMode: 'FIT', imageHash: image.hash }];
  } else {
    console.error(`[FALLBACK] All image creation methods failed.`);
    rect.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
    const text = figma.createText();
    text.characters = 'Image Failed to Load';
    parent.appendChild(text);
    text.x = rect.x + 50;
    text.y = rect.y + 50;
  }
  
  return rect;
}

// --- UTILITY FUNCTIONS ---

function arrangeNodes(nodes: SceneNode[]) {
  let x = 0;
  for (const node of nodes) {
    node.x = x;
    x += node.width + 100;
  }
}
