import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const confidentialityLevels = [
  { code: 'internal', name: 'Internal' },
  { code: 'external', name: 'External' }
];

async function seedConfidentiality() {
  console.log('Seeding confidentiality levels...');
  
  for (const level of confidentialityLevels) {
    try {
      // @ts-ignore - Prisma types will be generated after migration
      await prisma.confidentiality.upsert({
        where: { code: level.code },
        update: { name: level.name },
        create: level
      });
      console.log(`✓ Confidentiality: ${level.name}`);
    } catch (error) {
      console.error(`Error creating confidentiality level ${level.name}:`, error);
    }
  }
  
  console.log('Confidentiality levels seeded successfully!');
}

export default seedConfidentiality;

// Auto-run if script is executed directly
if (require.main === module) {
  seedConfidentiality()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 