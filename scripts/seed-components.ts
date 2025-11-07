import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const components = [
  { code: 'table', name: 'Table' },
  { code: 'chart', name: 'Chart' },
  { code: 'logo', name: 'Logo' },
  { code: 'shift', name: 'Shift' },
  { code: 'roadmap', name: 'Roadmap' },
  { code: 'team-content', name: 'Team Content' },
  { code: 'benefits-content', name: 'Benefits Content' },
  { code: 'services-content', name: 'Services Content' },
  { code: 'plan', name: 'Plan' },
  { code: 'schedule', name: 'Schedule' },
  { code: 'certifications', name: 'Certifications' },
  { code: 'company-metrics', name: 'Company Metrics' },
  { code: 'delivery-process', name: 'Delivery Process' }
];

async function seedComponents() {
  console.log('Seeding components...');
  
  for (const component of components) {
    try {
      // @ts-ignore - Prisma types will be generated after migration
      await prisma.component.upsert({
        where: { code: component.code },
        update: { name: component.name },
        create: component
      });
      console.log(`✓ Component: ${component.name}`);
    } catch (error) {
      console.error(`Error creating component ${component.name}:`, error);
    }
  }
  
  console.log('Components seeded successfully!');
}

export default seedComponents;

// Auto-run if script is executed directly
if (require.main === module) {
  seedComponents()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 