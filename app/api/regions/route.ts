import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все регионы
export async function GET() {
  try {
    const regions = await prisma.region.findMany({
      orderBy: {
        order: 'asc'
      }
    });

    return NextResponse.json({ regions });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
  }
}

// POST - создать новый регион
export async function POST(request: NextRequest) {
  try {
    const { code, name, order } = await request.json();

    if (!code || !name || typeof code !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // Проверяем, существует ли уже такой регион
    const existingRegion = await prisma.region.findUnique({
      where: { code: code.toLowerCase().trim() }
    });

    if (existingRegion) {
      return NextResponse.json({ error: 'Region with this code already exists' }, { status: 409 });
    }

    const region = await prisma.region.create({
      data: {
        code: code.toLowerCase().trim(),
        name: name.trim(),
        order: order || 0
      }
    });

    return NextResponse.json({ region });
  } catch (error) {
    console.error('Error creating region:', error);
    return NextResponse.json({ error: 'Failed to create region' }, { status: 500 });
  }
}

// PUT - обновить регион
export async function PUT(request: NextRequest) {
  try {
    const { code, name, order } = await request.json();

    if (!code || !name || typeof code !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    const region = await prisma.region.update({
      where: { code },
      data: {
        name: name.trim(),
        order: order || 0
      }
    });

    return NextResponse.json({ region });
  } catch (error) {
    console.error('Error updating region:', error);
    return NextResponse.json({ error: 'Failed to update region' }, { status: 500 });
  }
}

// DELETE - удалить регион
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    await prisma.region.delete({
      where: { code }
    });

    return NextResponse.json({ message: 'Region deleted successfully' });
  } catch (error) {
    console.error('Error deleting region:', error);
    return NextResponse.json({ error: 'Failed to delete region' }, { status: 500 });
  }
} 