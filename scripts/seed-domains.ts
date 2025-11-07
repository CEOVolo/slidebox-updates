import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const domains = [
  { code: 'automotive', name: 'Automotive' },
  { code: 'fintech', name: 'Financial Technology' },
  { code: 'retail', name: 'Retail' },
  { code: 'healthcare', name: 'Healthcare' },
  { code: 'education', name: 'Education' },
  { code: 'ecommerce', name: 'E-commerce' },
  { code: 'manufacturing', name: 'Manufacturing' },
  { code: 'consulting', name: 'Consulting' },
  { code: 'public-sector', name: 'Public Sector' },
  { code: 'government', name: 'Government' },
  { code: 'defense', name: 'Defense' },
  { code: 'logistics', name: 'Logistics' },
  { code: 'telecom', name: 'Telecommunications' },
  { code: 'travel', name: 'Travel' },
  { code: 'entertainment', name: 'Entertainment' }
];

async function seedDomains() {
  console.log('Seeding domains...');
  
  for (const domain of domains) {
    try {
      // @ts-ignore - Prisma types will be generated after migration
      await prisma.domain.upsert({
        where: { code: domain.code },
        update: { name: domain.name },
        create: domain
      });
      console.log(`✓ Domain: ${domain.name}`);
    } catch (error) {
      console.error(`Error creating domain ${domain.name}:`, error);
    }
  }
  
  console.log('Domains seeded successfully!');
}

export default seedDomains;

// Auto-run if script is executed directly
if (require.main === module) {
  seedDomains()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 