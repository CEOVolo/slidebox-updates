import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProduction() {
  console.log('🌱 Starting production database seeding...');
  
  try {
    // Clear existing metadata (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing metadata...');
    await prisma.slideTag.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.slideProduct.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.slideConfidentiality.deleteMany({});
    await prisma.confidentiality.deleteMany({});
    await prisma.slideComponent.deleteMany({});
    await prisma.component.deleteMany({});
    await prisma.slideIntegration.deleteMany({});
    await prisma.integration.deleteMany({});
    await prisma.slideSolutionArea.deleteMany({});
    await prisma.solutionArea.deleteMany({});
    await prisma.slideDomain.deleteMany({});
    await prisma.domain.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.status.deleteMany({});
    await prisma.format.deleteMany({});
    await prisma.language.deleteMany({});
    await prisma.region.deleteMany({});

    // Seed Categories
    console.log('📁 Seeding categories...');
    const seedCategories = (await import('./seed-categories')).default;
    await seedCategories();

    // Seed Products
    console.log('📦 Seeding products...');
    const seedProducts = (await import('./seed-products')).default;
    await seedProducts();

    // Seed Solution Areas
    console.log('💡 Seeding solution areas...');
    const seedSolutionAreas = (await import('./seed-solution-areas')).default;
    await seedSolutionAreas();

    // Seed Domains
    console.log('🌐 Seeding domains...');
    const seedDomains = (await import('./seed-domains')).default;
    await seedDomains();

    // Seed Components
    console.log('🧩 Seeding components...');
    const seedComponents = (await import('./seed-components')).default;
    await seedComponents();

    // Seed Confidentiality
    console.log('🔒 Seeding confidentiality levels...');
    const seedConfidentiality = (await import('./seed-confidentiality')).default;
    await seedConfidentiality();

    // Seed Integrations
    console.log('🔌 Seeding integrations...');
    const seedIntegrations = (await import('./seed-integrations')).default;
    await seedIntegrations();

    // Seed Static Values (statuses, formats, languages, regions)
    console.log('📊 Seeding static values...');
    const seedStaticValues = (await import('./seed-static-values')).default;
    await seedStaticValues();

    console.log('\n✅ Production database seeded successfully!');
    
    // Print summary
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
    
    console.log('\n📊 Seeded data summary:');
    Object.entries(counts).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seedProduction(); 