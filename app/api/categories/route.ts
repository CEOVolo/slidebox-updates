import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { metadataService } from '@/lib/metadata-service';

const prisma = new PrismaClient();

// @ts-ignore - Prisma types will be generated after migration

// GET - get all categories with hierarchy
export async function GET() {
  try {
    // @ts-ignore
    const categories = await prisma.category.findMany({
      where: {
        parentId: null // Only root categories
      },
      include: {
        children: {
          include: {
            children: true // Support 3 levels deep
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return hardcoded categories if DB not available
    return NextResponse.json({ 
      categories: getHardcodedCategories() 
    });
  }
}

// POST - create new category
export async function POST(request: NextRequest) {
  try {
    const { code, name, icon, parentId, order } = await request.json();

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // @ts-ignore
    const category = await prisma.category.create({
      data: {
        code: code.toLowerCase().trim(),
        name: name.trim(),
        icon,
        parentId,
        order: order || 0
      }
    });

    // Invalidate cache
    metadataService.invalidate('categories');
    metadataService.invalidate('categoriesFlat');

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// PUT - update category
export async function PUT(request: NextRequest) {
  try {
    const { id, name, icon, parentId, order } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // @ts-ignore
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name?.trim(),
        icon,
        parentId,
        order
      }
    });

    // Invalidate cache
    metadataService.invalidate('categories');
    metadataService.invalidate('categoriesFlat');

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE - delete category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if category has children
    // @ts-ignore
    const hasChildren = await prisma.category.count({
      where: { parentId: id }
    });

    if (hasChildren > 0) {
      return NextResponse.json({ error: 'Cannot delete category with children' }, { status: 400 });
    }

    // @ts-ignore
    await prisma.category.delete({
      where: { id }
    });

    // Invalidate cache
    metadataService.invalidate('categories');
    metadataService.invalidate('categoriesFlat');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

// Hardcoded categories as fallback
function getHardcodedCategories() {
  return [
    {
      code: 'company',
      name: 'Company',
      icon: '🏢',
      children: [
        { code: 'company-overview', name: 'Company Overview', icon: '📊' },
        { code: 'mission-values', name: 'Mission & Values', icon: '🎯' },
        { code: 'awards-recognition', name: 'Awards & Recognition', icon: '🏆' },
        { code: 'team-culture', name: 'Team & Culture', icon: '👥' },
        { code: 'history-milestones', name: 'History & Milestones', icon: '📅' }
      ]
    },
    {
      code: 'services',
      name: 'Services',
      icon: '💼',
      children: [
        { code: 'custom-software', name: 'Custom Software Development', icon: '💻' },
        { code: 'mobile-development', name: 'Mobile Development', icon: '📱' },
        { code: 'web-development', name: 'Web Development', icon: '🌐' },
        { code: 'cloud-solutions', name: 'Cloud Solutions', icon: '☁️' },
        { code: 'devops', name: 'DevOps & Infrastructure', icon: '🔧' },
        { code: 'consulting', name: 'IT Consulting', icon: '💡' },
        { code: 'qa-testing', name: 'QA & Testing', icon: '🧪' },
        { code: 'ui-ux-design', name: 'UI/UX Design', icon: '🎨' }
      ]
    },
    {
      code: 'technologies',
      name: 'Technologies',
      icon: '🔧',
      children: [
        { code: 'frontend', name: 'Frontend', icon: '⚛️' },
        { code: 'backend', name: 'Backend', icon: '⚙️' },
        { code: 'databases', name: 'Databases', icon: '🗄️' },
        { code: 'cloud-platforms', name: 'Cloud Platforms', icon: '☁️' },
        { code: 'mobile-tech', name: 'Mobile Technologies', icon: '📲' },
        { code: 'devops-tools', name: 'DevOps Tools', icon: '🛠️' },
        { code: 'ai-ml', name: 'AI & Machine Learning', icon: '🤖' },
        { code: 'security', name: 'Security', icon: '🔒' }
      ]
    },
    {
      code: 'portfolio',
      name: 'Portfolio',
      icon: '📁',
      children: [
        { code: 'case-studies', name: 'Case Studies', icon: '📋' },
        { code: 'success-stories', name: 'Success Stories', icon: '🌟' },
        { code: 'client-testimonials', name: 'Client Testimonials', icon: '💬' },
        { code: 'industry-solutions', name: 'Industry Solutions', icon: '🏭' }
      ]
    },
    {
      code: 'partnership',
      name: 'Partnership',
      icon: '🤝',
      children: [
        { code: 'partner-programs', name: 'Partner Programs', icon: '📝' },
        { code: 'technology-partners', name: 'Technology Partners', icon: '🔗' },
        { code: 'certifications', name: 'Certifications', icon: '📜' },
        { code: 'alliances', name: 'Strategic Alliances', icon: '🌐' }
      ]
    },
    {
      code: 'resources',
      name: 'Resources',
      icon: '📚',
      children: [
        { code: 'whitepapers', name: 'Whitepapers', icon: '📄' },
        { code: 'blog-articles', name: 'Blog Articles', icon: '✍️' },
        { code: 'webinars', name: 'Webinars', icon: '🎥' },
        { code: 'templates', name: 'Templates', icon: '📝' },
        { code: 'best-practices', name: 'Best Practices', icon: '✨' }
      ]
    }
  ];
} 