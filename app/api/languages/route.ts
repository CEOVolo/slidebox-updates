import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все языки
export async function GET() {
  try {
    const languages = await prisma.language.findMany({
      orderBy: {
        order: 'asc'
      }
    });

    return NextResponse.json({ languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json({ error: 'Failed to fetch languages' }, { status: 500 });
  }
}

// POST - создать новый язык
export async function POST(request: NextRequest) {
  try {
    const { code, name, order } = await request.json();

    if (!code || !name || typeof code !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // Проверяем, существует ли уже такой язык
    const existingLanguage = await prisma.language.findUnique({
      where: { code: code.toLowerCase().trim() }
    });

    if (existingLanguage) {
      return NextResponse.json({ error: 'Language with this code already exists' }, { status: 409 });
    }

    const language = await prisma.language.create({
      data: {
        code: code.toLowerCase().trim(),
        name: name.trim(),
        order: order || 0
      }
    });

    return NextResponse.json({ language });
  } catch (error) {
    console.error('Error creating language:', error);
    return NextResponse.json({ error: 'Failed to create language' }, { status: 500 });
  }
}

// PUT - обновить язык
export async function PUT(request: NextRequest) {
  try {
    const { code, name, order } = await request.json();

    if (!code || !name || typeof code !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    const language = await prisma.language.update({
      where: { code },
      data: {
        name: name.trim(),
        order: order || 0
      }
    });

    return NextResponse.json({ language });
  } catch (error) {
    console.error('Error updating language:', error);
    return NextResponse.json({ error: 'Failed to update language' }, { status: 500 });
  }
}

// DELETE - удалить язык
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    await prisma.language.delete({
      where: { code }
    });

    return NextResponse.json({ message: 'Language deleted successfully' });
  } catch (error) {
    console.error('Error deleting language:', error);
    return NextResponse.json({ error: 'Failed to delete language' }, { status: 500 });
  }
} 