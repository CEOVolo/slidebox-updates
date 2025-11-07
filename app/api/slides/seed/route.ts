import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check if we already have slides
    const existingSlides = await prisma.slide.count();
    if (existingSlides > 0) {
      return NextResponse.json({
        message: 'Database already has slides',
        count: existingSlides
      });
    }

    // Create demo slides
    const demoSlides = [
      {
        title: 'IT Services Presentation Cover',
        description: 'Modern cover design for IT company presentation',
        category: 'covers-main',
        figmaFileId: 'demo-file-1',
        figmaNodeId: 'demo-node-1',
        figmaFileName: 'IT Services Presentation',
        extractedText: 'IT Services. Development, consulting, support',
        imageUrl: 'https://via.placeholder.com/400x300/6366f1/ffffff?text=IT+Services+Cover',
        author: 'Designer',
        tags: ['cover', 'it', 'services']
      },
      {
        title: 'Web Development Services',
        description: 'Comprehensive web development service overview',
        category: 'services-web',
        figmaFileId: 'demo-file-2',
        figmaNodeId: 'demo-node-2',
        figmaFileName: 'IT Services Presentation',
        extractedText: 'Web Development. React, Node.js, TypeScript',
        imageUrl: 'https://via.placeholder.com/400x300/10b981/ffffff?text=Web+Development',
        author: 'Developer',
        tags: ['web', 'development', 'react']
      },
      {
        title: 'E-commerce Case Study',
        description: 'Successful e-commerce project showcase',
        category: 'cases-ecommerce',
        figmaFileId: 'demo-file-3',
        figmaNodeId: 'demo-node-3',
        figmaFileName: 'IT Services Presentation',
        extractedText: 'E-commerce platform. 200% revenue increase',
        imageUrl: 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=E-commerce+Case',
        author: 'Project Manager',
        tags: ['ecommerce', 'case-study', 'success']
      }
    ];

    const createdSlides = [];

    for (const slideData of demoSlides) {
      // Create slide
      const slide = await prisma.slide.create({
        data: {
          title: slideData.title,
          description: slideData.description,
          category: slideData.category,
          figmaFileId: slideData.figmaFileId,
          figmaNodeId: slideData.figmaNodeId,
          figmaFileName: slideData.figmaFileName,
          extractedText: slideData.extractedText,
          imageUrl: slideData.imageUrl,
          // TODO: Add proper authorId from authenticated user
          // author: slideData.author,
          isActive: true,
        },
      });

      // Create tags
      for (const tagName of slideData.tags) {
        let tag = await prisma.tag.findUnique({
          where: { name: tagName },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              isAutomatic: true,
            },
          });
        }

        await prisma.slideTag.create({
          data: {
            slideId: slide.id,
            tagId: tag.id,
          },
        });
      }

      createdSlides.push(slide);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdSlides.length} demo slides`,
      slides: createdSlides
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
} 