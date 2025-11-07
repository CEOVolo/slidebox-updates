import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все статусы
export async function GET() {
  try {
    // @ts-ignore - Prisma types
    const statuses = await prisma.status.findMany({
      orderBy: {
        order: 'asc'
      }
    });

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json({ error: 'Failed to fetch statuses' }, { status: 500 });
  }
}

// POST - создать новый статус
export async function POST(request: NextRequest) {
  try {
    const { code, name, order } = await request.json();

    if (!code || !name || typeof code !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // Проверяем, существует ли уже такой статус
    // @ts-ignore - Prisma types
    const existingStatus = await prisma.status.findUnique({
      where: { code: code.toLowerCase().trim() }
    });

    if (existingStatus) {
      return NextResponse.json({ error: 'Status with this code already exists' }, { status: 409 });
    }

    // @ts-ignore - Prisma types
    const status = await prisma.status.create({
      data: {
        code: code.toLowerCase().trim(),
        name: name.trim(),
        order: order || 0
      }
    });

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error creating status:', error);
    return NextResponse.json({ error: 'Failed to create status' }, { status: 500 });
  }
}

// PUT - обновить статус
export async function PUT(request: NextRequest) {
  try {
    const { code, name, order } = await request.json();

    if (!code || !name || typeof code !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // @ts-ignore - Prisma types
    const status = await prisma.status.update({
      where: { code },
      data: {
        name: name.trim(),
        order: order || 0
      }
    });

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

// DELETE - удалить статус
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // @ts-ignore - Prisma types
    await prisma.status.delete({
      where: { code }
    });

    return NextResponse.json({ message: 'Status deleted successfully' });
  } catch (error) {
    console.error('Error deleting status:', error);
    return NextResponse.json({ error: 'Failed to delete status' }, { status: 500 });
  }
} 