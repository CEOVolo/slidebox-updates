import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportMetadata() {
  console.log('📦 Starting metadata export from DEV database...');
  
  try {
    // Export all metadata tables
    const data = {
      exportDate: new Date().toISOString(),
      environment: 'development',
      metadata: {
        categories: await prisma.category.findMany({
          orderBy: { order: 'asc' }
        }),
        tags: await prisma.tag.findMany({
          orderBy: { name: 'asc' }
        }),
        products: await prisma.product.findMany({
          orderBy: { name: 'asc' }
        }),
        // @ts-ignore
        confidentiality: await prisma.confidentiality.findMany({
          orderBy: { name: 'asc' }
        }),
        components: await prisma.component.findMany({
          orderBy: { name: 'asc' }
        }),
        integrations: await prisma.integration.findMany({
          orderBy: { name: 'asc' }
        }),
        solutionAreas: await prisma.solutionArea.findMany({
          orderBy: { name: 'asc' }
        }),
        domains: await prisma.domain.findMany({
          orderBy: { name: 'asc' }
        }),
        statuses: await prisma.status.findMany({
          orderBy: { order: 'asc' }
        }),
        formats: await prisma.format.findMany({
          orderBy: { order: 'asc' }
        }),
        languages: await prisma.language.findMany({
          orderBy: { order: 'asc' }
        }),
        regions: await prisma.region.findMany({
          orderBy: { order: 'asc' }
        })
      },
      counts: {
        categories: await prisma.category.count(),
        tags: await prisma.tag.count(),
        products: await prisma.product.count(),
        // @ts-ignore
        confidentiality: await prisma.confidentiality.count(),
        components: await prisma.component.count(),
        integrations: await prisma.integration.count(),
        solutionAreas: await prisma.solutionArea.count(),
        domains: await prisma.domain.count(),
        statuses: await prisma.status.count(),
        formats: await prisma.format.count(),
        languages: await prisma.language.count(),
        regions: await prisma.region.count()
      }
    };

    // Save to file
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    const filename = `metadata-export-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log('✅ Export completed successfully!');
    console.log(`📄 File saved to: ${filepath}`);
    console.log('\n📊 Exported counts:');
    Object.entries(data.counts).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run export
exportMetadata(); 