import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractTextFromFigmaNode, generateCombinedTags, generateSmartTitleFromText, autoFillMetadata } from '@/lib/textExtraction';
import FigmaAPI from '@/lib/figma';
import { getFigmaAccessToken } from '@/lib/figma-token';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slideId = params.id;
    console.log('🚀 Starting text extraction for slide:', slideId);

    // Получаем слайд
    const slide = await prisma.slide.findUnique({
      where: { id: slideId }
    });
    console.log('📄 Slide found:', slide ? { id: slide.id, title: slide.title, figmaFileId: slide.figmaFileId, figmaNodeId: slide.figmaNodeId } : 'NOT FOUND');

    if (!slide) {
      return NextResponse.json(
        { error: 'Slide not found' },
        { status: 404 }
      );
    }

    const figmaAccessToken = await getFigmaAccessToken();
    console.log('🔑 Figma token status:', figmaAccessToken ? 'CONFIGURED' : 'NOT CONFIGURED');
    if (!figmaAccessToken) {
      return NextResponse.json(
        { error: 'Figma access token not configured. Please add FIGMA_ACCESS_TOKEN to your environment variables or update it in Settings.' },
        { status: 500 }
      );
    }

    // Получаем данные узла из Figma API
    const figmaUrl = `https://api.figma.com/v1/files/${slide.figmaFileId}/nodes?ids=${slide.figmaNodeId}`;
    console.log('📡 Making Figma API request:', figmaUrl);
    
    const nodesResponse = await fetch(figmaUrl, {
      headers: {
        'X-Figma-Token': figmaAccessToken,
      },
    });
    
    console.log('📡 Figma API response status:', nodesResponse.status, nodesResponse.statusText);

    if (!nodesResponse.ok) {
      const errorText = await nodesResponse.text();
      console.error('❌ Figma API error:', { status: nodesResponse.status, error: errorText });
      return NextResponse.json(
        { error: 'Failed to fetch node data from Figma', details: errorText },
        { status: 400 }
      );
    }

    const nodesData = await nodesResponse.json();
    console.log('📡 Figma API data received:', { 
      hasNodes: !!nodesData.nodes, 
      nodeKeys: Object.keys(nodesData.nodes || {}),
      targetNodeExists: !!nodesData.nodes?.[slide.figmaNodeId]
    });
    
    const nodeData = nodesData.nodes[slide.figmaNodeId];

    if (!nodeData) {
      console.error('❌ Node not found in Figma response:', { 
        slideNodeId: slide.figmaNodeId, 
        availableNodes: Object.keys(nodesData.nodes || {}) 
      });
      return NextResponse.json(
        { error: 'Node not found in Figma' },
        { status: 404 }
      );
    }
    
    console.log('✅ Figma node data obtained successfully');

    // Извлекаем текст
    console.log('📝 Starting text extraction from Figma node...');
    const extractedText = extractTextFromFigmaNode(nodeData.document);
    console.log('📝 Text extracted:', { 
      length: extractedText.length, 
      preview: extractedText.substring(0, 100) 
    });
    
    // Генерируем умное название
    console.log('💡 Generating smart title...');
    const smartTitle = generateSmartTitleFromText(nodeData.document);
    console.log('💡 Smart title generated:', smartTitle);
    
    // АВТОЗАПОЛНЕНИЕ МЕТАДАННЫХ на основе текста и Figma узла
    const currentMetadata = {
      status: slide.status,
      format: slide.format,
      language: slide.language,
      region: slide.region,
      domain: slide.domain,
      department: slide.department,
      authorName: slide.authorName,
      isCaseStudy: slide.isCaseStudy,
      yearStart: slide.yearStart,
      yearFinish: slide.yearFinish
    };
    
    const autoFilledMetadata = autoFillMetadata(
      extractedText, 
      slide.title, 
      nodeData.document, 
      currentMetadata
    );
    
    console.log('🔥 DETAILED METADATA LOG:', {
      slideId,
      slideTitle: slide.title,
      extractedTextPreview: extractedText.substring(0, 200),
      currentMetadata,
      autoFilledMetadata,
      isCaseStudyChanged: autoFilledMetadata.isCaseStudy !== currentMetadata.isCaseStudy,
      domainChanged: autoFilledMetadata.domain !== currentMetadata.domain
    });
    
    // Генерируем теги на основе автозаполненных метаданных
    const tagNames = generateCombinedTags(extractedText, autoFilledMetadata);
    
    // Обновляем слайд с автозаполненными метаданными
    const updatedSlide = await prisma.$transaction(async (tx) => {
      // Обновляем основные поля слайда
      const updatedSlideData = await tx.slide.update({
        where: { id: slideId },
        data: {
          extractedText: extractedText,
          title: smartTitle && smartTitle.trim() ? smartTitle : slide.title,
          // Сохраняем автозаполненные метаданные
          status: autoFilledMetadata.status || slide.status,
          format: autoFilledMetadata.format || slide.format,
          language: autoFilledMetadata.language || slide.language,
          region: autoFilledMetadata.region || slide.region,
          domain: autoFilledMetadata.domain || slide.domain,
          department: autoFilledMetadata.department || slide.department,
          authorName: autoFilledMetadata.authorName || slide.authorName,
          isCaseStudy: autoFilledMetadata.isCaseStudy !== undefined ? autoFilledMetadata.isCaseStudy : slide.isCaseStudy,
          yearStart: autoFilledMetadata.yearStart || slide.yearStart,
          yearFinish: autoFilledMetadata.yearFinish || slide.yearFinish
        }
      });
      
      // Обновляем solution areas если они были определены
      if (autoFilledMetadata.solutionAreaCodes && autoFilledMetadata.solutionAreaCodes.length > 0) {
        // Удаляем существующие связи
        // @ts-ignore - Prisma types not updated
        await tx.slideSolutionArea.deleteMany({
          where: { slideId: slideId }
        });
        
        // Добавляем новые solution areas
        for (const areaCode of autoFilledMetadata.solutionAreaCodes) {
          // @ts-ignore - Prisma types not updated
          const solutionArea = await tx.solutionArea.findUnique({
            where: { code: areaCode }
          });
          
          if (solutionArea) {
            // @ts-ignore - Prisma types not updated
            await tx.slideSolutionArea.create({
              data: {
                slideId: slideId,
                solutionAreaId: solutionArea.id
              }
            });
          }
        }
      }
      
      return updatedSlideData;
    });
    
    console.log('💾 SLIDE UPDATED IN DATABASE:', {
      slideId,
      oldCaseStudy: slide.isCaseStudy,
      newCaseStudy: updatedSlide.isCaseStudy,
      oldDomain: slide.domain,
      newDomain: updatedSlide.domain,
      oldTitle: slide.title,
      newTitle: updatedSlide.title
    });
    
    console.log(`Updated slide ${slideId}:`, {
      oldTitle: slide.title,
      newTitle: updatedSlide.title,
      extractedText: extractedText.substring(0, 100),
      smartTitle: smartTitle
    });

    // Создаем или находим теги
    console.log('🏷️ Processing tags:', tagNames);
    const tags = [];
    for (const tagName of tagNames) {
      let tag = await prisma.tag.findUnique({
        where: { name: tagName }
      });

      if (!tag) {
        console.log('🏷️ Creating new tag:', tagName);
        tag = await prisma.tag.create({
          data: {
            name: tagName,
            isAutomatic: true
          }
        });
      }

      // Создаем связь
      await prisma.slideTag.upsert({
        where: {
          slideId_tagId: {
            slideId: slideId,
            tagId: tag.id
          }
        },
        create: {
          slideId: slideId,
          tagId: tag.id
        },
        update: {}
      });

      tags.push({ id: tag.id, name: tag.name });
    }
    console.log('🏷️ Tags processed successfully:', tags.length);

    const response = {
      extractedText,
      tags,
      suggestedTitle: smartTitle,
      autoFilledMetadata: {
        original: currentMetadata,
        updated: autoFilledMetadata,
        changes: Object.keys(autoFilledMetadata).filter(
          key => autoFilledMetadata[key] !== (currentMetadata as any)[key]
        )
      }
    };
    
    console.log('✅ Text extraction completed successfully:', {
      slideId,
      textLength: extractedText.length,
      tagsCount: tags.length,
      metadataChanges: response.autoFilledMetadata.changes
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ DETAILED ERROR LOG:', {
      slideId: params?.id,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });
    
    // Возвращаем более детальную ошибку в development
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      { 
        error: 'Failed to extract text',
        details: isDev ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
} 