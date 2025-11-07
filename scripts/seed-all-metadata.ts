import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function runScript(scriptPath: string, description: string) {
  console.log(`\n${description}...`);
  try {
    const { stdout, stderr } = await execAsync(`npx tsx ${scriptPath}`);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error);
    throw error;
  }
}

async function seedAllMetadata() {
  console.log('🌱 Starting comprehensive metadata seeding...');
  console.log('📅 Started at:', new Date().toISOString());
  
  try {
    // Seed all metadata in correct order
    // 1. Static values first (languages, regions, formats, statuses)
    await runScript('scripts/seed-static-values.ts', '📊 Seeding static values (languages, regions, formats, statuses)');
    
    // 2. Categories
    await runScript('scripts/seed-categories.ts', '📁 Seeding categories');
    
    // 3. Domains
    await runScript('scripts/seed-domains.ts', '🌐 Seeding domains');
    
    // 4. Solution areas (may depend on domains)
    await runScript('scripts/seed-solution-areas.ts', '💡 Seeding solution areas');
    
    // 5. Products
    await runScript('scripts/seed-products.ts', '📦 Seeding products');
    
    // 6. Components
    await runScript('scripts/seed-components.ts', '🧩 Seeding components');
    
    // 7. Integrations
    await runScript('scripts/seed-integrations.ts', '🔌 Seeding integrations');
    
    // 8. User types
    await runScript('scripts/seed-confidentiality.ts', '🔒 Seeding confidentiality levels');
    
    console.log('\n🎉 All metadata seeded successfully!');
    console.log('📅 Completed at:', new Date().toISOString());
    
    // Verify seeding
    console.log('\n🔍 Verifying metadata counts...');
    
    const counts = await Promise.all([
      prisma.category.count(),
      prisma.language.count(),
      prisma.region.count(),
      prisma.format.count(),
      prisma.status.count(),
      prisma.domain.count(),
      prisma.solutionArea.count(),
      prisma.product.count(),
      prisma.component.count(),
      prisma.integration.count(),
      prisma.confidentiality.count(),
    ]);
    
    console.log('📊 Final counts:');
    console.log(`   Categories: ${counts[0]}`);
    console.log(`   Languages: ${counts[1]}`);
    console.log(`   Regions: ${counts[2]}`);
    console.log(`   Formats: ${counts[3]}`);
    console.log(`   Statuses: ${counts[4]}`);
    console.log(`   Domains: ${counts[5]}`);
    console.log(`   Solution Areas: ${counts[6]}`);
    console.log(`   Products: ${counts[7]}`);
    console.log(`   Components: ${counts[8]}`);
    console.log(`   Integrations: ${counts[9]}`);
    console.log(`   Confidentiality Levels: ${counts[10]}`);
    
  } catch (error) {
    console.error('\n❌ Metadata seeding failed:', error);
    console.log('💡 Check individual script files and database connection');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
if (require.main === module) {
  seedAllMetadata().catch(console.error);
} 