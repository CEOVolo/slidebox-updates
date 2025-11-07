import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMetadata() {
  console.log('🔍 Verifying metadata in production database...\n');
  
  try {
    const counts = {
      categories: await prisma.category.count(),
      tags: await prisma.tag.count(),
      products: await prisma.product.count(),
      confidentiality: await prisma.confidentiality.count(),
      components: await prisma.component.count(),
      integrations: await prisma.integration.count(),
      solutionAreas: await prisma.solutionArea.count(),
      domains: await prisma.domain.count(),
      statuses: await prisma.status.count(),
      formats: await prisma.format.count(),
      languages: await prisma.language.count(),
      regions: await prisma.region.count()
    };
    
    console.log('📊 Production Database Metadata Counts:');
    console.log('=====================================');
    Object.entries(counts).forEach(([key, value]) => {
      console.log(`${key.padEnd(20)} : ${value}`);
    });
    
    // Check for categories with parent relationships
    const parentCategories = await prisma.category.findMany({
      where: { parentId: null }
    });
    const childCategories = await prisma.category.findMany({
      where: { parentId: { not: null } }
    });
    
    console.log(`\n📁 Category Structure:`);
    console.log(`   Parent categories: ${parentCategories.length}`);
    console.log(`   Child categories: ${childCategories.length}`);
    
    // Sample some data
    console.log('\n📝 Sample Data:');
    
    const sampleCategories = await prisma.category.findMany({ take: 3 });
    console.log('\nCategories:');
    sampleCategories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.code})`);
    });
    
    const sampleTags = await prisma.tag.findMany({ take: 3 });
    if (sampleTags.length > 0) {
      console.log('\nTags:');
      sampleTags.forEach(tag => {
        console.log(`   - ${tag.name}`);
      });
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyMetadata(); 