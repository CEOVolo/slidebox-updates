import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const userTypes = [
  { code: 'client', name: 'Client' },
  { code: 'employee', name: 'Employee' },
  { code: 'partner', name: 'Partner' }
];

async function seedUserTypes() {
  console.log('Seeding user types...');
  
  for (const userType of userTypes) {
    try {
      // @ts-ignore - Prisma types will be generated after migration
      await prisma.userType.upsert({
        where: { code: userType.code },
        update: { name: userType.name },
        create: userType
      });
      console.log(`✓ User Type: ${userType.name}`);
    } catch (error) {
      console.error(`Error creating user type ${userType.name}:`, error);
    }
  }
  
  console.log('User types seeded successfully!');
}

export default seedUserTypes;

// Auto-run if script is executed directly
if (require.main === module) {
  seedUserTypes()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 