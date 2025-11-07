import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Этот роут использует request.url (параметры запроса), поэтому запрещаем статическую генерацию
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Получаем презентации из базы данных
    const presentations = await prisma.presentation.findMany({
      include: {
        slides: {
          include: {
            slide: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Получаем общее количество презентаций
    const total = await prisma.presentation.count();

    return NextResponse.json({
      presentations,
      total,
      page,
      limit,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    });

  } catch (error) {
    console.error('Error fetching presentations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 