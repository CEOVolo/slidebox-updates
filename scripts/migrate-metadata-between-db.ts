import { PrismaClient } from '@prisma/client';

// Initialize Prisma clients for both databases
const devDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_DEV
    }
  }
});

const prodDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_PROD
    }
  }
});

async function clearProductionMetadata() {
  console.log('🧹 Clearing production metadata...');
  
  // Clear in correct order to avoid foreign key constraints
  await prodDb.slideTag.deleteMany({});
  await prodDb.tag.deleteMany({});
  
  await prodDb.slideProduct.deleteMany({});
  await prodDb.product.deleteMany({});
  
  await prodDb.slideConfidentiality.deleteMany({});
  await prodDb.confidentiality.deleteMany({});
  
  await prodDb.slideComponent.deleteMany({});
  await prodDb.component.deleteMany({});
  
  await prodDb.slideIntegration.deleteMany({});
  await prodDb.integration.deleteMany({});
  
  await prodDb.slideSolutionArea.deleteMany({});
  await prodDb.solutionArea.deleteMany({});
  
  await prodDb.slideDomain.deleteMany({});
  await prodDb.domain.deleteMany({});
  
  await prodDb.category.deleteMany({});
  await prodDb.status.deleteMany({});
  await prodDb.format.deleteMany({});
  await prodDb.language.deleteMany({});
  await prodDb.region.deleteMany({});
  
  console.log('✅ Production metadata cleared');
}

async function migrateMetadata() {
  console.log('🚀 Starting metadata migration from DEV to PROD...\n');
  
  try {
    // Clear production metadata first
    await clearProductionMetadata();
    
    // Migrate Categories (handle parent-child relationships)
    console.log('📁 Migrating categories...');
    const categories = await devDb.category.findMany({
      orderBy: { order: 'asc' }
    });
    
    // First insert categories without parents
    const rootCategories = categories.filter(cat => !cat.parentId);
    for (const category of rootCategories) {
      await prodDb.category.create({
        data: {
          id: category.id,
          code: category.code,
          name: category.name,
          icon: category.icon,
          order: category.order,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        }
      });
    }
    
    // Then insert child categories
    const childCategories = categories.filter(cat => cat.parentId);
    for (const category of childCategories) {
      await prodDb.category.create({
        data: {
          id: category.id,
          code: category.code,
          name: category.name,
          icon: category.icon,
          parentId: category.parentId,
          order: category.order,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${categories.length} categories`);
    
    // Migrate Tags
    console.log('🏷️  Migrating tags...');
    const tags = await devDb.tag.findMany();
    for (const tag of tags) {
      await prodDb.tag.create({ data: tag });
    }
    console.log(`✅ Migrated ${tags.length} tags`);
    
    // Migrate Products
    console.log('📦 Migrating products...');
    const products = await devDb.product.findMany();
    for (const product of products) {
      await prodDb.product.create({ data: product });
    }
    console.log(`✅ Migrated ${products.length} products`);
    
    // Migrate UserTypes
    console.log('📋 Migrating UserTypes...');
    const userTypes = await devDb.confidentiality.findMany();
    for (const userType of userTypes) {
      await prodDb.confidentiality.create({ data: userType });
    }
    console.log(`✅ Migrated ${userTypes.length} user types`);
    
    // Migrate Components
    console.log('🧩 Migrating components...');
    const components = await devDb.component.findMany();
    for (const component of components) {
      await prodDb.component.create({ data: component });
    }
    console.log(`✅ Migrated ${components.length} components`);
    
    // Migrate Integrations
    console.log('🔌 Migrating integrations...');
    const integrations = await devDb.integration.findMany();
    for (const integration of integrations) {
      await prodDb.integration.create({ data: integration });
    }
    console.log(`✅ Migrated ${integrations.length} integrations`);
    
    // Migrate SolutionAreas
    console.log('💡 Migrating solution areas...');
    const solutionAreas = await devDb.solutionArea.findMany();
    for (const area of solutionAreas) {
      await prodDb.solutionArea.create({ data: area });
    }
    console.log(`✅ Migrated ${solutionAreas.length} solution areas`);
    
    // Migrate Domains
    console.log('🌐 Migrating domains...');
    const domains = await devDb.domain.findMany();
    for (const domain of domains) {
      await prodDb.domain.create({ data: domain });
    }
    console.log(`✅ Migrated ${domains.length} domains`);
    
    // Migrate Statuses
    console.log('📊 Migrating statuses...');
    const statuses = await devDb.status.findMany();
    for (const status of statuses) {
      await prodDb.status.create({ data: status });
    }
    console.log(`✅ Migrated ${statuses.length} statuses`);
    
    // Migrate Formats
    console.log('📄 Migrating formats...');
    const formats = await devDb.format.findMany();
    for (const format of formats) {
      await prodDb.format.create({ data: format });
    }
    console.log(`✅ Migrated ${formats.length} formats`);
    
    // Migrate Languages
    console.log('🌍 Migrating languages...');
    const languages = await devDb.language.findMany();
    for (const language of languages) {
      await prodDb.language.create({ data: language });
    }
    console.log(`✅ Migrated ${languages.length} languages`);
    
    // Migrate Regions
    console.log('🗺️  Migrating regions...');
    const regions = await devDb.region.findMany();
    for (const region of regions) {
      await prodDb.region.create({ data: region });
    }
    console.log(`✅ Migrated ${regions.length} regions`);
    
    console.log('\n🎉 Migration completed successfully!');
    
    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Tags: ${tags.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   User Types: ${userTypes.length}`);
    console.log(`   Components: ${components.length}`);
    console.log(`   Integrations: ${integrations.length}`);
    console.log(`   Solution Areas: ${solutionAreas.length}`);
    console.log(`   Domains: ${domains.length}`);
    console.log(`   Statuses: ${statuses.length}`);
    console.log(`   Formats: ${formats.length}`);
    console.log(`   Languages: ${languages.length}`);
    console.log(`   Regions: ${regions.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await devDb.$disconnect();
    await prodDb.$disconnect();
  }
}

// Run migration
migrateMetadata(); 