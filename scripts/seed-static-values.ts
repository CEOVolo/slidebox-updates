import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const staticData = {
  statuses: [
    { code: 'draft', name: 'Draft', order: 1 },
    { code: 'in_review', name: 'In Review', order: 2 },
    { code: 'approved', name: 'Approved', order: 3 },
    { code: 'archived', name: 'Archived', order: 4 }
  ],
  formats: [
    { code: 'vertical', name: 'Vertical', order: 1 },
    { code: 'horizontal', name: 'Horizontal', order: 2 }
  ],
  languages: [
    { code: 'en', name: 'English', order: 1 },
    { code: 'fr', name: 'French', order: 2 },
    { code: 'de', name: 'German', order: 3 },
    { code: 'multilang', name: 'Multilingual', order: 4 }
  ],
  regions: [
    { code: 'global', name: 'Global', order: 1 },
    { code: 'emea', name: 'Europe, Middle East, Africa', order: 2 },
    { code: 'na', name: 'North America', order: 3 },
    { code: 'apac', name: 'Asia-Pacific', order: 4 },
    { code: 'latam', name: 'Latin America', order: 5 }
  ]
};

async function seedStaticValues() {
  console.log('Seeding static values...');
  
  // Seed statuses
  console.log('Seeding statuses...');
  for (const status of staticData.statuses) {
    try {
      // @ts-ignore - Prisma types will be generated after migration
      await prisma.status.upsert({
        where: { code: status.code },
        update: { name: status.name, order: status.order },
        create: status
      });
      console.log(`✓ Status: ${status.name}`);
    } catch (error) {
      console.error(`Error creating status ${status.name}:`, error);
    }
  }
  
  // Seed formats
  console.log('Seeding formats...');
  for (const format of staticData.formats) {
    try {
      // @ts-ignore - Prisma types will be generated after migration
      await prisma.format.upsert({
        where: { code: format.code },
        update: { name: format.name, order: format.order },
        create: format
      });
      console.log(`✓ Format: ${format.name}`);
    } catch (error) {
      console.error(`Error creating format ${format.name}:`, error);
    }
  }
  
  // Seed languages
  console.log('Seeding languages...');
  for (const language of staticData.languages) {
    try {
      // @ts-ignore - Prisma types will be generated after migration
      await prisma.language.upsert({
        where: { code: language.code },
        update: { name: language.name, order: language.order },
        create: language
      });
      console.log(`✓ Language: ${language.name}`);
    } catch (error) {
      console.error(`Error creating language ${language.name}:`, error);
    }
  }
  
  // Seed regions
  console.log('Seeding regions...');
  for (const region of staticData.regions) {
    try {
      // @ts-ignore - Prisma types will be generated after migration
      await prisma.region.upsert({
        where: { code: region.code },
        update: { name: region.name, order: region.order },
        create: region
      });
      console.log(`✓ Region: ${region.name}`);
    } catch (error) {
      console.error(`Error creating region ${region.name}:`, error);
    }
  }
  
  console.log('Static values seeded successfully!');
}

export default seedStaticValues;

// Auto-run if script is executed directly
if (require.main === module) {
  seedStaticValues()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 