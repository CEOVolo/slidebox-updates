import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все integrations
export async function GET() {
  try {
    const integrations = await prisma.integration.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { slides: true }
        }
      }
    });

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }
}

// POST - создать новый integration
export async function POST(request: Request) {
  try {
    const { code, name } = await request.json();

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // Проверить уникальность code
    const existing = await prisma.integration.findUnique({
      where: { code }
    });

    if (existing) {
      return NextResponse.json({ error: 'Integration with this code already exists' }, { status: 400 });
    }

    const integration = await prisma.integration.create({
      data: { code, name },
      include: {
        _count: {
          select: { slides: true }
        }
      }
    });

    return NextResponse.json({ integration });
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 });
  }
}

// PUT - обновить integration
export async function PUT(request: Request) {
  try {
    const { id, name } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    }

    const integration = await prisma.integration.update({
      where: { id },
      data: { name },
      include: {
        _count: {
          select: { slides: true }
        }
      }
    });

    return NextResponse.json({ integration });
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
  }
}

// DELETE - удалить integration
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.integration.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 });
  }
} 