import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все уровни конфиденциальности
export async function GET() {
  try {
    const confidentiality = await prisma.confidentiality.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { SlideConfidentiality: true }
        }
      }
    });

    return NextResponse.json({ confidentiality });
  } catch (error) {
    console.error('Error fetching confidentiality:', error);
    return NextResponse.json({ error: 'Failed to fetch confidentiality' }, { status: 500 });
  }
}

// POST - создать новый уровень конфиденциальности
export async function POST(request: Request) {
  try {
    const { code, name } = await request.json();

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // Проверить уникальность code
    const existing = await prisma.confidentiality.findUnique({
      where: { code }
    });

    if (existing) {
      return NextResponse.json({ error: 'Confidentiality with this code already exists' }, { status: 400 });
    }

    const confidentialityItem = await prisma.confidentiality.create({
      data: { code, name },
      include: {
        _count: {
          select: { SlideConfidentiality: true }
        }
      }
    });

    return NextResponse.json({ confidentiality: confidentialityItem });
  } catch (error) {
    console.error('Error creating confidentiality:', error);
    return NextResponse.json({ error: 'Failed to create confidentiality' }, { status: 500 });
  }
}

// PUT - обновить уровень конфиденциальности
export async function PUT(request: Request) {
  try {
    const { id, name } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    }

    const confidentialityItem = await prisma.confidentiality.update({
      where: { id },
      data: { name },
      include: {
        _count: {
          select: { SlideConfidentiality: true }
        }
      }
    });

    return NextResponse.json({ confidentiality: confidentialityItem });
  } catch (error) {
    console.error('Error updating confidentiality:', error);
    return NextResponse.json({ error: 'Failed to update confidentiality' }, { status: 500 });
  }
}

// DELETE - удалить уровень конфиденциальности
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.confidentiality.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting confidentiality:', error);
    return NextResponse.json({ error: 'Failed to delete confidentiality' }, { status: 500 });
  }
} 