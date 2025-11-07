import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateDomains() {
  console.log('Starting domain migration...');
  
  try {
    // Get all slides with domain field
    const slides = await prisma.slide.findMany({
      where: {
        domain: {
          not: null
        }
      },
      select: {
        id: true,
        domain: true
      }
    });
    
    console.log(`Found ${slides.length} slides with domain data`);
    
    for (const slide of slides) {
      if (!slide.domain) continue;
      
      try {
        // Find or create domain
        // @ts-ignore - Prisma types will be generated after migration
        const domain = await prisma.domain.upsert({
          where: { code: slide.domain },
          update: {},
          create: {
            code: slide.domain,
            name: slide.domain.charAt(0).toUpperCase() + slide.domain.slice(1).replace(/-/g, ' ')
          }
        });
        
        // Create slide-domain relation
        // @ts-ignore - Prisma types will be generated after migration
        await prisma.slideDomain.create({
          data: {
            slideId: slide.id,
            domainId: domain.id
          }
        });
        
        console.log(`✓ Migrated slide ${slide.id} to domain ${domain.name}`);
      } catch (error) {
        console.error(`Error migrating slide ${slide.id}:`, error);
      }
    }
    
    console.log('Domain migration completed!');
    
    // Optionally, you can now remove the domain field from slides
    // This would require another schema migration
    console.log('\nNote: The old domain field on slides can now be removed with a schema migration.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateDomains()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 