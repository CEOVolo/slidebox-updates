import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const solutionAreas = [
    { code: 'marketing', name: 'Marketing' },
    { code: 'sales', name: 'Sales' },
    { code: 'engineering', name: 'Engineering' },
    { code: 'design', name: 'Design' },
    { code: 'consulting', name: 'Consulting' },
    { code: 'management', name: 'Management' },
    { code: 'hr', name: 'Human Resources' },
    { code: 'finance', name: 'Finance' }
  ];

  for (const area of solutionAreas) {
    await prisma.solutionArea.upsert({
      where: { code: area.code },
      update: {},
      create: area
    });
  }

  console.log('Solution areas seeded successfully!');
}

export default main;

// Auto-run if script is executed directly
if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 