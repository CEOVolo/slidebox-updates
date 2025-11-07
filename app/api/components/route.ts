import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все components
export async function GET() {
  try {
    const components = await prisma.component.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { slides: true }
        }
      }
    });

    return NextResponse.json({ components });
  } catch (error) {
    console.error('Error fetching components:', error);
    return NextResponse.json({ error: 'Failed to fetch components' }, { status: 500 });
  }
}

// POST - создать новый component
export async function POST(request: Request) {
  try {
    const { code, name } = await request.json();

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // Проверить уникальность code
    const existing = await prisma.component.findUnique({
      where: { code }
    });

    if (existing) {
      return NextResponse.json({ error: 'Component with this code already exists' }, { status: 400 });
    }

    const component = await prisma.component.create({
      data: { code, name },
      include: {
        _count: {
          select: { slides: true }
        }
      }
    });

    return NextResponse.json({ component });
  } catch (error) {
    console.error('Error creating component:', error);
    return NextResponse.json({ error: 'Failed to create component' }, { status: 500 });
  }
}

// PUT - обновить component
export async function PUT(request: Request) {
  try {
    const { id, name } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    }

    const component = await prisma.component.update({
      where: { id },
      data: { name },
      include: {
        _count: {
          select: { slides: true }
        }
      }
    });

    return NextResponse.json({ component });
  } catch (error) {
    console.error('Error updating component:', error);
    return NextResponse.json({ error: 'Failed to update component' }, { status: 500 });
  }
}

// DELETE - удалить component
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.component.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting component:', error);
    return NextResponse.json({ error: 'Failed to delete component' }, { status: 500 });
  }
} 