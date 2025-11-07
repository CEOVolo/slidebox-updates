import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  { code: 'it-services', name: 'IT Services' },
  { code: 'application-support', name: 'Application Support' },
  { code: 'it-management', name: 'IT Management' },
  { code: 'security', name: 'Security' },
  { code: 'tco-optimisation', name: 'TCO Optimisation' }
];

async function seedProducts() {
  console.log('Seeding products...');
  
  for (const product of products) {
    try {
      // @ts-ignore - Prisma types will be generated after migration
      await prisma.product.upsert({
        where: { code: product.code },
        update: { name: product.name },
        create: product
      });
      console.log(`✓ Product: ${product.name}`);
    } catch (error) {
      console.error(`Error creating product ${product.name}:`, error);
    }
  }
  
  console.log('Products seeded successfully!');
}

export default seedProducts;

// Auto-run if script is executed directly
if (require.main === module) {
  seedProducts()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 