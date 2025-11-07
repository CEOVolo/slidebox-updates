import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Маппинг старых названий категорий к новым кодам категорий
const categoryMapping: Record<string, string> = {
  // Company Overview
  'about-andersen': 'mission-vision-values',
  'company': 'company-overview',
  'andersen-key-facts': 'company-capabilities',
  'key-facts': 'company-capabilities',
  'team': 'organizational-structure',
  'organization': 'organizational-structure',
  
  // Core Business Processes
  'recruitment': 'recruitment-processes',
  'hr': 'hr-processes',
  'delivery': 'delivery-processes',
  'workflow': 'delivery-processes',
  'processes': 'delivery-processes',
  'training': 'internal-training',
  'templates': 'client-facing-documents',
  'documents': 'client-facing-documents',
  
  // Project Management
  'methodology': 'methodologies',
  'roadmap': 'roadmaps-communication',
  'reporting': 'reporting-documentation',
  'governance': 'governance-escalation',
  'knowledge': 'knowledge-transfer',
  'engagement': 'engagement-models',
  
  // Industry Specific Solutions
  'industry': 'industry-offerings',
  'compliance': 'regulatory-compliance',
  'best-practices': 'best-practices-industry',
  'battlecard': 'sales-battlecards',
  'case-study': 'industry-case-studies',
  'case-studies': 'industry-case-studies',
  
  // Cross-Functional Expertise
  'development': 'customer-app-development',
  'qa': 'qa',
  'devops': 'devops-sre',
  'cloud': 'cloud-engineering',
  'security': 'security',
  'design': 'design-ux-ui',
  'ux-ui': 'design-ux-ui',
  'data': 'data-analytics-ai',
  'analytics': 'data-analytics-ai',
  'ai': 'data-analytics-ai',
  'support': 'support-it-operations',
  'it-operations': 'support-it-operations',
  'architecture': 'architecture',
  'modernization': 'legacy-modernization',
  
  // Success Stories and References
  'portfolio': 'company-portfolio',
  'testimonials': 'client-testimonials-use-cases',
  'success-stories': 'client-success-stories',
  'references': 'project-highlights-technologies',
  
  // Proposal Library
  'proposals': 'proposal-templates-decks',
  'slide-templates': 'transition-slide-templates',
  'faqs': 'customer-faqs-response',
  'competitive': 'competitive-comparison',
  'lessons': 'lessons-learned',
  
  // Old category mappings (if there were specific ones)
  'services': 'cross-functional-expertise',
  'technologies': 'cross-functional-expertise',
  'partnership': 'industry-specific-solution',
  'resources': 'proposal-library'
};

async function migrateSlideCategories() {
  console.log('🚀 Starting slide categories migration to many-to-many...');

  try {
    // Get all categories (id and name)
    const categories = await prisma.category.findMany({ select: { id: true, name: true } });
    const catIdSet = new Set(categories.map(c => c.id));

    // Get all slides with a category
    const slides = await prisma.slide.findMany({ select: { id: true, category: true } });

    let createdLinks = 0;
    let cleared = 0;
    let matchedByName = 0;

    for (const slide of slides) {
      if (slide.category && slide.category !== '' && slide.category !== 'uncategorized') {
        if (catIdSet.has(slide.category)) {
          // Direct id match
          const exists = await prisma.slideCategory.findFirst({
            where: { slideId: slide.id, categoryId: slide.category },
          });
          if (!exists) {
            await prisma.slideCategory.create({ data: { slideId: slide.id, categoryId: slide.category } });
            createdLinks++;
            console.log(`Linked slide ${slide.id} to categoryId ${slide.category}`);
          }
      } else {
          // Try to match by name
          const catByName = categories.find(c => c.name.toLowerCase() === slide.category.toLowerCase());
          if (catByName) {
            const exists = await prisma.slideCategory.findFirst({
              where: { slideId: slide.id, categoryId: catByName.id },
            });
            if (!exists) {
              await prisma.slideCategory.create({ data: { slideId: slide.id, categoryId: catByName.id } });
              matchedByName++;
              console.log(`Linked slide ${slide.id} to category by name: ${catByName.name}`);
            }
          } else {
            // No match, clear
            await prisma.slide.update({ where: { id: slide.id }, data: { category: '' } });
            cleared++;
            console.log(`Cleared category for slide ${slide.id} (no match)`);
          }
        }
      }
      // Always clear the old category field
      await prisma.slide.update({ where: { id: slide.id }, data: { category: '' } });
    }

    console.log(`✅ Migration complete. Created ${createdLinks} links by id, ${matchedByName} by name. Cleared category field for ${cleared} slides.`);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем только если файл выполняется напрямую
if (require.main === module) {
  migrateSlideCategories().catch(console.error);
}

export { migrateSlideCategories }; 