import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - добавить в избранное
// DELETE - удалить из избранного
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slideId = params.id;
    const body = await request.json();
    const userId = body.userId;
    const userEmail = body.userEmail; // Email пользователя для создания если нужно

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Проверяем существует ли слайд
    const slide = await prisma.slide.findUnique({
      where: { id: slideId }
    });

    if (!slide) {
      return NextResponse.json(
        { error: 'Slide not found' },
        { status: 404 }
      );
    }

    // Проверяем существует ли пользователь, если нет - создаем
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      // Если пользователь не найден, пытаемся создать его
      if (!userEmail) {
        return NextResponse.json(
          { error: 'User not found and email is required to create user' },
          { status: 400 }
        );
      }

      // Проверяем существует ли пользователь с таким email
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (existingUserByEmail) {
        // Используем существующего пользователя
        user = existingUserByEmail;
      } else {
        // Создаем нового пользователя
        user = await prisma.user.create({
          data: {
            id: userId,
            email: userEmail,
            name: body.userName || userEmail.split('@')[0],
            role: body.userRole || 'USER'
          }
        });
        console.log(`✅ Created new user: ${user.id} (${user.email})`);
      }
    }

    // Проверяем не добавлен ли уже в избранное
    const existing = await prisma.favoriteSlide.findUnique({
      where: {
        userId_slideId: {
          userId: user.id,
          slideId
        }
      }
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        isFavorite: true,
        message: 'Already in favorites'
      });
    }

    // Добавляем в избранное
    await prisma.favoriteSlide.create({
      data: {
        userId: user.id,
        slideId
      }
    });

    return NextResponse.json({
      success: true,
      isFavorite: true
    });
  } catch (error: any) {
    console.error('Error adding to favorites:', error);
    
    // Более детальная обработка ошибок
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'User or slide not found in database' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add to favorites', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slideId = params.id;
    const body = await request.json();
    const userId = body.userId;
    const userEmail = body.userEmail; // Email пользователя для поиска если нужно

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Проверяем существует ли пользователь
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Если пользователь не найден по ID, пытаемся найти по email
    if (!user && userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Удаляем из избранного
    await prisma.favoriteSlide.deleteMany({
      where: {
        userId: user.id,
        slideId
      }
    });

    return NextResponse.json({
      success: true,
      isFavorite: false
    });
  } catch (error: any) {
    console.error('Error removing from favorites:', error);
    
    // Более детальная обработка ошибок
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'User or slide not found in database' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to remove from favorites', details: error.message },
      { status: 500 }
    );
  }
}
