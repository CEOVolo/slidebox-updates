import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все теги
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        isAutomatic: true,
        usageCount: true,
        _count: {
          select: {
            slides: true
          }
        }
      }
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

// POST - создать новый тег
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    // Проверяем, существует ли уже такой тег
    const existingTag = await prisma.tag.findUnique({
      where: { name: name.toLowerCase().trim() }
    });

    if (existingTag) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.toLowerCase().trim(),
        isAutomatic: false
      }
    });

    return NextResponse.json({ tag });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}

// PUT - обновить тег
export async function PUT(request: NextRequest) {
  try {
    const { id, name } = await request.json();

    if (!id || !name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Tag ID and name are required' }, { status: 400 });
    }

    // Проверяем, существует ли тег с таким именем (кроме текущего)
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: name.toLowerCase().trim(),
        NOT: { id }
      }
    });

    if (existingTag) {
      return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 409 });
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name: name.toLowerCase().trim()
      }
    });

    return NextResponse.json({ tag });
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

// DELETE - удалить тег
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Удаляем связи со слайдами
    await prisma.slideTag.deleteMany({
      where: { tagId: id }
    });

    // Удаляем сам тег
    await prisma.tag.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
} 