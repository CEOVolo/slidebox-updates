import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categoriesData = [
  {
    code: 'company-overview',
    name: 'Company Overview',
    icon: '🏢',
    order: 1,
    children: [
      {
        code: 'mission-vision-values',
        name: 'Mission, Vision, Values, Location',
        icon: '🎯',
        order: 1
      },
      {
        code: 'company-experience',
        name: 'Company Experience (Industry Focused)',
        icon: '🌟',
        order: 2
      },
      {
        code: 'company-capabilities',
        name: 'Company Capabilities and Key Facts',
        icon: '💼',
        order: 3
      },
      {
        code: 'organizational-structure',
        name: 'Organizational Structure',
        icon: '🏗️',
        order: 4
      }
    ]
  },
  {
    code: 'core-business-processes',
    name: 'Core Business Processes',
    icon: '⚙️',
    order: 2,
    children: [
      {
        code: 'recruitment-processes',
        name: 'Recruitment Processes',
        icon: '👥',
        order: 1
      },
      {
        code: 'hr-processes',
        name: 'HR Processes',
        icon: '🤝',
        order: 2
      },
      {
        code: 'delivery-processes',
        name: 'Delivery Processes',
        icon: '🚀',
        order: 3
      },
      {
        code: 'internal-training',
        name: 'Internal Training and Process Slides',
        icon: '🎓',
        order: 4
      },
      {
        code: 'client-facing-documents',
        name: 'Client-Facing: Document Templates and Forms',
        icon: '📋',
        order: 5
      }
    ]
  },
  {
    code: 'project-management',
    name: 'Project Management',
    icon: '📊',
    order: 3,
    children: [
      {
        code: 'methodologies',
        name: 'Methodologies',
        icon: '🔄',
        order: 1
      },
      {
        code: 'roadmaps-communication',
        name: 'Roadmaps and Communication Plans',
        icon: '🗺️',
        order: 2
      },
      {
        code: 'reporting-documentation',
        name: 'Reporting and Documentation Standards',
        icon: '📄',
        order: 3
      },
      {
        code: 'feedback-objection-management',
        name: 'Feedback Handling and Objection Management',
        icon: '💬',
        order: 4
      },
      {
        code: 'governance-escalation',
        name: 'Governance and Escalation Paths',
        icon: '🔝',
        order: 5
      },
      {
        code: 'knowledge-transfer',
        name: 'Knowledge Transfer',
        icon: '🧠',
        order: 6
      },
      {
        code: 'engagement-models',
        name: 'Engagement Models',
        icon: '🤝',
        order: 7
      }
    ]
  },
  {
    code: 'industry-specific-solution',
    name: 'Industry Specific Solution',
    icon: '🏭',
    order: 4,
    children: [
      {
        code: 'industry-offerings',
        name: 'Industry Offerings (Capabilities, Logos, Certifications)',
        icon: '🏆',
        order: 1
      },
      {
        code: 'regulatory-compliance',
        name: 'Regulatory Requirements and Compliance Standards',
        icon: '⚖️',
        order: 2
      },
      {
        code: 'best-practices-industry',
        name: 'Best Practices by Industry',
        icon: '✨',
        order: 3
      },
      {
        code: 'sales-battlecards',
        name: 'Sales Battlecards',
        icon: '🎯',
        order: 4
      },
      {
        code: 'industry-case-studies',
        name: 'Industry-Specific Case Studies',
        icon: '📊',
        order: 5
      }
    ]
  },
  {
    code: 'cross-functional-expertise',
    name: 'Cross-Functional Expertise',
    icon: '🔧',
    order: 5,
    children: [
      {
        code: 'customer-app-development',
        name: 'Customer Application Development',
        icon: '💻',
        order: 1
      },
      {
        code: 'qa',
        name: 'QA',
        icon: '🧪',
        order: 2
      },
      {
        code: 'devops-sre',
        name: 'DevOps and SRE',
        icon: '🔧',
        order: 3
      },
      {
        code: 'cloud-engineering',
        name: 'Cloud Engineering',
        icon: '☁️',
        order: 4
      },
      {
        code: 'security',
        name: 'Security',
        icon: '🔒',
        order: 5
      },
      {
        code: 'design-ux-ui',
        name: 'Design (UX/UI)',
        icon: '🎨',
        order: 6
      },
      {
        code: 'data-analytics-ai',
        name: 'Data and Analytics AI',
        icon: '🤖',
        order: 7
      },
      {
        code: 'support-it-operations',
        name: 'Support and IT Operations',
        icon: '🛠️',
        order: 8
      },
      {
        code: 'architecture',
        name: 'Architecture',
        icon: '🏗️',
        order: 9
      },
      {
        code: 'legacy-modernization',
        name: 'Legacy Modernization',
        icon: '🔄',
        order: 10
      }
    ]
  },
  {
    code: 'success-stories-references',
    name: 'Success Stories and References',
    icon: '🌟',
    order: 6,
    children: [
      {
        code: 'project-highlights-technologies',
        name: 'Project Highlights and Technologies Used',
        icon: '🚀',
        order: 1
      },
      {
        code: 'client-testimonials-use-cases',
        name: 'Client Testimonials and Use Cases',
        icon: '💬',
        order: 2
      },
      {
        code: 'client-success-stories',
        name: 'Client Success Stories',
        icon: '✨',
        order: 3
      },
      {
        code: 'company-portfolio',
        name: 'Company Portfolio',
        icon: '📁',
        order: 4
      }
    ]
  },
  {
    code: 'proposal-library',
    name: 'Proposal Library',
    icon: '📚',
    order: 7,
    children: [
      {
        code: 'proposal-templates-decks',
        name: 'Proposal Templates and Presentation Decks',
        icon: '📝',
        order: 1
      },
      {
        code: 'transition-slide-templates',
        name: 'Transition Slide Templates',
        icon: '🔄',
        order: 2
      },
      {
        code: 'customer-faqs-response',
        name: 'Customer FAQs and Response Library',
        icon: '❓',
        order: 3
      },
      {
        code: 'competitive-comparison',
        name: 'Competitive Comparison',
        icon: '⚔️',
        order: 4
      },
      {
        code: 'lessons-learned',
        name: 'Lessons Learned',
        icon: '📖',
        order: 5
      }
    ]
  }
];

async function updateCategories() {
  console.log('🚀 Starting categories update from Knowledge Base CSV...');

  try {
    // Удаляем все существующие категории
    console.log('🗑️ Clearing existing categories...');
    // @ts-ignore
    await prisma.category.deleteMany();

    // Создаем новые категории
    for (const parentCategory of categoriesData) {
      console.log(`📁 Creating parent category: ${parentCategory.name}`);
      
      // Создаем родительскую категорию
      // @ts-ignore
      const parent = await prisma.category.create({
        data: {
          code: parentCategory.code,
          name: parentCategory.name,
          icon: parentCategory.icon,
          order: parentCategory.order,
          parentId: null
        }
      });

      // Создаем подкатегории
      if (parentCategory.children) {
        for (const childCategory of parentCategory.children) {
          console.log(`  📄 Creating child category: ${childCategory.name}`);
          
          // @ts-ignore
          await prisma.category.create({
            data: {
              code: childCategory.code,
              name: childCategory.name,
              icon: childCategory.icon,
              order: childCategory.order,
              parentId: parent.id
            }
          });
        }
      }
    }

    console.log('✅ Categories updated successfully!');
    
    // Показываем итоговую статистику
    // @ts-ignore
    const totalCategories = await prisma.category.count();
    // @ts-ignore
    const parentCategories = await prisma.category.count({ where: { parentId: null } });
    // @ts-ignore
    const childCategories = await prisma.category.count({ where: { parentId: { not: null } } });
    
    console.log(`📊 Total categories: ${totalCategories}`);
    console.log(`📁 Parent categories: ${parentCategories}`);
    console.log(`📄 Child categories: ${childCategories}`);

  } catch (error) {
    console.error('❌ Error updating categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем только если файл выполняется напрямую
if (require.main === module) {
  updateCategories().catch(console.error);
}

export { updateCategories }; 