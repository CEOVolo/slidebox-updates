import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    code: 'company-overview',
    name: 'Company Overview',
    icon: '🏢',
    order: 1,
    children: [
      { code: 'mission-vision-values-location', name: 'Mission, Vision, Values, Location', icon: '🎯', order: 1 },
      { code: 'company-experience', name: 'Company Experience (Industry Focused)', icon: '🏭', order: 2 },
      { code: 'company-capabilities-key-facts', name: 'Company Capabilities and Key Facts', icon: '📊', order: 3 },
      { code: 'organizational-structure', name: 'Organizational Structure', icon: '🏗️', order: 4 }
    ]
  },
  {
    code: 'core-business-processes',
    name: 'Core Business Processes',
    icon: '⚙️',
    order: 2,
    children: [
      { code: 'recruitment-processes', name: 'Recruitment Processes', icon: '👥', order: 1 },
      { code: 'hr-processes', name: 'HR Processes', icon: '📋', order: 2 },
      { code: 'delivery-processes', name: 'Delivery Processes', icon: '🚀', order: 3 },
      { code: 'internal-training-process-slides', name: 'Internal Training and Process Slides', icon: '🎓', order: 4 },
      { code: 'client-facing-templates-forms', name: 'Client-Facing: Document Templates and Forms', icon: '📄', order: 5 }
    ]
  },
  {
    code: 'project-management',
    name: 'Project Management',
    icon: '📈',
    order: 3,
    children: [
      { code: 'methodologies', name: 'Methodologies', icon: '📐', order: 1 },
      { code: 'roadmaps-communication-plans', name: 'Roadmaps and Communication Plans', icon: '🗺️', order: 2 },
      { code: 'reporting-documentation-standards', name: 'Reporting and Documentation Standards', icon: '📝', order: 3 },
      { code: 'feedback-handling-objection-management', name: 'Feedback Handling and Objection Management', icon: '💬', order: 4 },
      { code: 'governance-escalation-paths', name: 'Governance and Escalation Paths', icon: '🔝', order: 5 },
      { code: 'knowledge-transfer', name: 'Knowledge Transfer', icon: '🎯', order: 6 },
      { code: 'engagement-models', name: 'Engagement Models', icon: '🤝', order: 7 }
    ]
  },
  {
    code: 'industry-specific-solution',
    name: 'Industry Specific Solution',
    icon: '🏭',
    order: 4,
    children: [
      { code: 'industry-offerings', name: 'Industry Offerings (Capabilities, Logos, Certifications)', icon: '🏆', order: 1 },
      { code: 'regulatory-requirements-compliance', name: 'Regulatory Requirements and Compliance Standards', icon: '⚖️', order: 2 },
      { code: 'best-practices-by-industry', name: 'Best Practices by Industry', icon: '✨', order: 3 },
      { code: 'sales-battlecards', name: 'Sales Battlecards', icon: '⚔️', order: 4 },
      { code: 'industry-specific-case-studies', name: 'Industry-Specific Case Studies', icon: '📊', order: 5 }
    ]
  },
  {
    code: 'cross-functional-expertise',
    name: 'Cross-Functional Expertise',
    icon: '🔧',
    order: 5,
    children: [
      { code: 'customer-application-development', name: 'Customer Application Development', icon: '💻', order: 1 },
      { code: 'qa', name: 'QA', icon: '🧪', order: 2 },
      { code: 'devops-sre', name: 'DevOps and SRE', icon: '🛠️', order: 3 },
      { code: 'cloud-engineering', name: 'Cloud Engineering', icon: '☁️', order: 4 },
      { code: 'security', name: 'Security', icon: '🔒', order: 5 },
      { code: 'design-ux-ui', name: 'Design (UX/UI)', icon: '🎨', order: 6 },
      { code: 'data-analytics-ai', name: 'Data and Analytics AI', icon: '📊', order: 7 },
      { code: 'support-it-operations', name: 'Support and IT Operations', icon: '🔧', order: 8 },
      { code: 'architecture', name: 'Architecture', icon: '🏛️', order: 9 },
      { code: 'legacy-modernization', name: 'Legacy Modernization', icon: '🔄', order: 10 }
    ]
  },
  {
    code: 'success-stories-references',
    name: 'Success Stories and References',
    icon: '⭐',
    order: 6,
    children: [
      { code: 'project-highlights-technologies', name: 'Project Highlights and Technologies Used', icon: '💡', order: 1 },
      { code: 'client-testimonials-use-cases', name: 'Client Testimonials and Use Cases', icon: '💬', order: 2 },
      { code: 'client-success-stories', name: 'Client Success Stories', icon: '🌟', order: 3 },
      { code: 'company-portfolio', name: 'Company Portfolio', icon: '📁', order: 4 }
    ]
  },
  {
    code: 'proposal-library',
    name: 'Proposal Library',
    icon: '📚',
    order: 7,
    children: [
      { code: 'proposal-templates-presentation-decks', name: 'Proposal Templates and Presentation Decks', icon: '📑', order: 1 },
      { code: 'transition-slide-templates', name: 'Transition Slide Templates', icon: '🔀', order: 2 },
      { code: 'customer-faqs-response-library', name: 'Customer FAQs and Response Library', icon: '❓', order: 3 },
      { code: 'competitive-comparison', name: 'Competitive Comparison', icon: '⚖️', order: 4 },
      { code: 'lessons-learned', name: 'Lessons Learned', icon: '📖', order: 5 }
    ]
  }
];

async function seedCategories() {
  console.log('Seeding categories...');
  
  // First, delete all existing categories
  console.log('Deleting existing categories...');
  try {
    // @ts-ignore - Prisma types will be generated after migration
    await prisma.category.deleteMany({});
    console.log('✓ All existing categories deleted');
  } catch (error) {
    console.error('Error deleting categories:', error);
  }
  
  // Now create new categories
  for (const category of categories) {
    try {
      // Create parent category
      // @ts-ignore - Prisma types will be generated after migration
      const parent = await prisma.category.upsert({
        where: { code: category.code },
        update: { 
          name: category.name,
          icon: category.icon,
          order: category.order
        },
        create: {
          code: category.code,
          name: category.name,
          icon: category.icon,
          order: category.order
        }
      });
      console.log(`✓ Parent category: ${category.name}`);
      
      // Create children
      for (const child of category.children) {
        // @ts-ignore - Prisma types will be generated after migration
        await prisma.category.upsert({
          where: { code: child.code },
          update: {
            name: child.name,
            icon: child.icon,
            order: child.order,
            parentId: parent.id
          },
          create: {
            code: child.code,
            name: child.name,
            icon: child.icon,
            order: child.order,
            parentId: parent.id
          }
        });
        console.log(`  ✓ Child category: ${child.name}`);
      }
    } catch (error) {
      console.error(`Error creating category ${category.name}:`, error);
    }
  }
  
  console.log('Categories seeded successfully!');
}

export default seedCategories;

// Auto-run if script is executed directly
if (require.main === module) {
  seedCategories()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 