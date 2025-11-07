import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все форматы
export async function GET() {
  try {
    const formats = await prisma.format.findMany({
      orderBy: {
        order: 'asc'
      }
    });

    return NextResponse.json({ formats });
  } catch (error) {
    console.error('Error fetching formats:', error);
    return NextResponse.json({ error: 'Failed to fetch formats' }, { status: 500 });
  }
}

// POST - создать новый формат
export async function POST(request: NextRequest) {
  try {
    const { code, name, order } = await request.json();

    if (!code || !name || typeof code !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // Проверяем, существует ли уже такой формат
    const existingFormat = await prisma.format.findUnique({
      where: { code: code.toLowerCase().trim() }
    });

    if (existingFormat) {
      return NextResponse.json({ error: 'Format with this code already exists' }, { status: 409 });
    }

    const format = await prisma.format.create({
      data: {
        code: code.toLowerCase().trim(),
        name: name.trim(),
        order: order || 0
      }
    });

    return NextResponse.json({ format });
  } catch (error) {
    console.error('Error creating format:', error);
    return NextResponse.json({ error: 'Failed to create format' }, { status: 500 });
  }
}

// PUT - обновить формат
export async function PUT(request: NextRequest) {
  try {
    const { code, name, order } = await request.json();

    if (!code || !name || typeof code !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    const format = await prisma.format.update({
      where: { code },
      data: {
        name: name.trim(),
        order: order || 0
      }
    });

    return NextResponse.json({ format });
  } catch (error) {
    console.error('Error updating format:', error);
    return NextResponse.json({ error: 'Failed to update format' }, { status: 500 });
  }
}

// DELETE - удалить формат
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    await prisma.format.delete({
      where: { code }
    });

    return NextResponse.json({ message: 'Format deleted successfully' });
  } catch (error) {
    console.error('Error deleting format:', error);
    return NextResponse.json({ error: 'Failed to delete format' }, { status: 500 });
  }
} 