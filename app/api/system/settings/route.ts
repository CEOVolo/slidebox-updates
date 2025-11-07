import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Получить настройку
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const setting = await prisma.systemSettings.findUnique({
      where: { key }
    });

    if (!setting) {
      return NextResponse.json({ value: null });
    }

    // Для Figma токена возвращаем маскированную версию
    if (key === 'FIGMA_ACCESS_TOKEN' && setting.value) {
      const maskedValue = setting.value.substring(0, 10) + '...' + setting.value.substring(setting.value.length - 4);
      return NextResponse.json({ 
        value: setting.value,
        maskedValue 
      });
    }

    return NextResponse.json({ value: setting.value });
  } catch (error) {
    console.error('Error fetching system setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Обновить настройку
export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json();

    if (!key || !value) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    // Проверяем права администратора (в будущем можно добавить более строгую проверку)
    // TODO: Add proper admin authentication check

    const setting = await prisma.systemSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error('Error updating system setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Удалить настройку
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    await prisma.systemSettings.delete({
      where: { key }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting system setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 