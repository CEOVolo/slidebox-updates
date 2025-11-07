import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @ts-ignore - Prisma types will be generated after migration

// GET - get all domains
export async function GET() {
  try {
    // @ts-ignore - Prisma types will be generated after migration
    const domains = await prisma.domain.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        code: true,
        name: true,
        _count: {
          select: {
            slides: true
          }
        }
      }
    });

    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
  }
}

// POST - create new domain
export async function POST(request: NextRequest) {
  try {
    const { code, name } = await request.json();

    if (!code || !name || typeof code !== 'string' || typeof name !== 'string') {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // Check if domain already exists
    // @ts-ignore
    const existingDomain = await prisma.domain.findUnique({
      where: { code: code.toLowerCase().trim() }
    });

    if (existingDomain) {
      return NextResponse.json({ error: 'Domain with this code already exists' }, { status: 409 });
    }

    // @ts-ignore
    const domain = await prisma.domain.create({
      data: {
        code: code.toLowerCase().trim(),
        name: name.trim()
      }
    });

    return NextResponse.json({ domain });
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json({ error: 'Failed to create domain' }, { status: 500 });
  }
}

// PUT - update domain
export async function PUT(request: NextRequest) {
  try {
    const { id, name } = await request.json();

    if (!id || !name || typeof name !== 'string') {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    }

    // @ts-ignore
    const domain = await prisma.domain.update({
      where: { id },
      data: {
        name: name.trim()
      }
    });

    return NextResponse.json({ domain });
  } catch (error) {
    console.error('Error updating domain:', error);
    return NextResponse.json({ error: 'Failed to update domain' }, { status: 500 });
  }
}

// DELETE - delete domain
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Delete slide-domain relations
    // @ts-ignore
    await prisma.slideDomain.deleteMany({
      where: { domainId: id }
    });

    // Delete domain
    // @ts-ignore
    await prisma.domain.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 });
  }
} 