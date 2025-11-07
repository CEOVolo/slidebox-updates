import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const integrations = [
  { code: 'jira', name: 'Jira' },
  { code: 'slack', name: 'Slack' },
  { code: 'crm', name: 'CRM' },
  { code: 'google', name: 'Google' }
];

async function seedIntegrations() {
  console.log('Seeding integrations...');
  
  for (const integration of integrations) {
    try {
      // @ts-ignore - Prisma types will be generated after migration
      await prisma.integration.upsert({
        where: { code: integration.code },
        update: { name: integration.name },
        create: integration
      });
      console.log(`✓ Integration: ${integration.name}`);
    } catch (error) {
      console.error(`Error creating integration ${integration.name}:`, error);
    }
  }
  
  console.log('Integrations seeded successfully!');
}

export default seedIntegrations;

// Auto-run if script is executed directly
if (require.main === module) {
  seedIntegrations()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 