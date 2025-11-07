import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateCombinedTags } from '@/lib/textExtraction';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slideId = params.id;
    const { metadata, extractedText } = await request.json();
    
    // Get the slide to ensure it exists
    const slide = await prisma.slide.findUnique({
      where: { id: slideId }
    }) as any;
    
    if (!slide) {
      return NextResponse.json(
        { error: 'Slide not found' },
        { status: 404 }
      );
    }
    
    // Combine metadata from request with solution areas from database
    const fullMetadata = {
      ...metadata,
      solutionAreas: metadata.solutionAreaCodes || []
    };
    
    // Generate tags based on text and metadata
    const tagNames = generateCombinedTags(extractedText || slide.extractedText || '', fullMetadata);
    
    // Create or find tags
    const tags = [];
    for (const tagName of tagNames) {
      let tag = await prisma.tag.findUnique({
        where: { name: tagName }
      });

      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            name: tagName,
            isAutomatic: true
          }
        });
      }

      tags.push({
        id: tag.id,
        slideId: slideId,
        tagId: tag.id,
        tag: {
          id: tag.id,
          name: tag.name,
          isAutomatic: tag.isAutomatic,
          usageCount: tag.usageCount,
          createdAt: tag.createdAt
        }
      });
    }
    
    return NextResponse.json({ tags });
    
  } catch (error) {
    console.error('Error generating tags:', error);
    return NextResponse.json(
      { error: 'Failed to generate tags' },
      { status: 500 }
    );
  }
} 