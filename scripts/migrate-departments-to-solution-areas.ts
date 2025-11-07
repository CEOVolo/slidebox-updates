import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting department to solution areas migration...');
  
  // Get all slides with departments
  const slides = await prisma.slide.findMany({
    where: {
      department: {
        not: null
      }
    },
    select: {
      id: true,
      department: true
    }
  });
  
  console.log(`Found ${slides.length} slides with departments`);
  
  let migrated = 0;
  
  for (const slide of slides) {
    if (slide.department) {
      try {
        // Find the solution area
        const solutionArea = await prisma.solutionArea.findUnique({
          where: { code: slide.department }
        });
        
        if (solutionArea) {
          // Create the relationship
          await prisma.slideSolutionArea.create({
            data: {
              slideId: slide.id,
              solutionAreaId: solutionArea.id
            }
          });
          
          migrated++;
          console.log(`Migrated slide ${slide.id}: ${slide.department} -> ${solutionArea.name}`);
        } else {
          console.warn(`Solution area not found for department: ${slide.department}`);
        }
      } catch (error) {
        console.error(`Error migrating slide ${slide.id}:`, error);
      }
    }
  }
  
  console.log(`Migration completed! Migrated ${migrated} slides`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 