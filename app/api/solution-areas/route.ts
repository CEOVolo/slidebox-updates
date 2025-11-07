import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { metadataService } from '@/lib/metadata-service';

const prisma = new PrismaClient();

// @ts-ignore - Prisma types will be generated after migration

// GET - получить все solution areas
export async function GET() {
  try {
    // @ts-ignore - Prisma types will be generated after migration
    const solutionAreas = await prisma.solutionArea.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        code: true,
        name: true,
        _count: {
          select: {
            slides: true
          }
        }
      }
    });

    return NextResponse.json({ solutionAreas });
  } catch (error) {
    console.error('Error fetching solution areas:', error);
    return NextResponse.json({ error: 'Failed to fetch solution areas' }, { status: 500 });
  }
}

// POST - создать новую solution area
export async function POST(request: NextRequest) {
  try {
    const { code, name } = await request.json();

    if (!code || !name || typeof code !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // Проверяем, существует ли уже такая area
    // @ts-ignore
    const existingArea = await prisma.solutionArea.findUnique({
      where: { code: code.toLowerCase().trim() }
    });

    if (existingArea) {
      return NextResponse.json({ error: 'Solution area with this code already exists' }, { status: 409 });
    }

    // @ts-ignore
    const solutionArea = await prisma.solutionArea.create({
      data: {
        code: code.toLowerCase().trim(),
        name: name.trim()
      }
    });

    // Invalidate cache
    metadataService.invalidate('solutionAreas');

    return NextResponse.json({ solutionArea });
  } catch (error) {
    console.error('Error creating solution area:', error);
    return NextResponse.json({ error: 'Failed to create solution area' }, { status: 500 });
  }
}

// PUT - обновить solution area
export async function PUT(request: NextRequest) {
  try {
    const { code, name } = await request.json();

    if (!code || !name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // @ts-ignore
    const solutionArea = await prisma.solutionArea.update({
      where: { code },
      data: {
        name: name.trim()
      }
    });

    // Invalidate cache
    metadataService.invalidate('solutionAreas');

    return NextResponse.json({ solutionArea });
  } catch (error) {
    console.error('Error updating solution area:', error);
    return NextResponse.json({ error: 'Failed to update solution area' }, { status: 500 });
  }
}

// DELETE - удалить solution area
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Сначала находим solution area по коду
    // @ts-ignore
    const solutionArea = await prisma.solutionArea.findUnique({
      where: { code }
    });

    if (!solutionArea) {
      return NextResponse.json({ error: 'Solution area not found' }, { status: 404 });
    }

    // Удаляем связи со слайдами
    // @ts-ignore
    await prisma.slideSolutionArea.deleteMany({
      where: { solutionAreaId: solutionArea.id }
    });

    // Удаляем саму solution area
    // @ts-ignore
    await prisma.solutionArea.delete({
      where: { id: solutionArea.id }
    });

    // Invalidate cache
    metadataService.invalidate('solutionAreas');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting solution area:', error);
    return NextResponse.json({ error: 'Failed to delete solution area' }, { status: 500 });
  }
} 