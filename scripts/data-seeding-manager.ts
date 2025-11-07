import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { 
  MIGRATION_CONFIG, 
  getTablesByCategory,
  getOrderedTables,
  validateDependencies 
} from '../config/migration-config';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface SeedingOptions {
  categories?: string[]; // Какие категории засеять
  tables?: string[]; // Какие конкретные таблицы засеять
  environment?: 'dev' | 'prod'; // Целевая среда
  parallel?: boolean; // Параллельное выполнение
  maxConcurrency?: number; // Максимальное количество параллельных процессов
  skipExisting?: boolean; // Пропускать таблицы с данными
  force?: boolean; // Принудительно перезаписать данные
}

interface SeedingResult {
  tableName: string;
  success: boolean;
  count: number;
  duration: number;
  error?: string;
}

class DataSeedingManager {
  private results: SeedingResult[] = [];
  private totalStartTime = Date.now();

  constructor(private options: SeedingOptions = {}) {}

  async seed(): Promise<void> {
    console.log('🌱 Начинаем засев данных...');
    console.log(`📅 Время начала: ${new Date().toISOString()}`);
    console.log(`🎯 Среда: ${this.options.environment || 'текущая'}\n`);

    // Валидация конфигурации
    const validation = validateDependencies();
    if (!validation.valid) {
      console.error('❌ Ошибки в конфигурации:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
      throw new Error('Конфигурация содержит ошибки');
    }

    try {
      const categoriesToSeed = this.getCategoriesToSeed();
      
      if (categoriesToSeed.length === 0) {
        console.log('ℹ️  Нет категорий для засева');
        return;
      }

      console.log('📋 Планируется засеять следующие категории:');
      categoriesToSeed.forEach(category => {
        console.log(`   📁 ${category.description}`);
        category.tables.forEach(table => {
          console.log(`      ${table.icon} ${table.displayName}`);
        });
      });
      console.log('');

      // Проверка существующих данных
      if (this.options.skipExisting) {
        await this.checkExistingData(categoriesToSeed);
      }

      // Засев данных
      if (this.options.parallel) {
        await this.seedParallel(categoriesToSeed);
      } else {
        await this.seedSequential(categoriesToSeed);
      }

      this.printSummary();

    } catch (error) {
      console.error('\n❌ Ошибка засева:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private getCategoriesToSeed() {
    if (this.options.categories && this.options.categories.length > 0) {
      return MIGRATION_CONFIG
        .filter(cat => this.options.categories!.includes(cat.categoryName))
        .sort((a, b) => a.order - b.order);
    } else if (this.options.tables && this.options.tables.length > 0) {
      // Создаем временные категории для конкретных таблиц
      const tables = getOrderedTables().filter(table => 
        this.options.tables!.includes(table.tableName)
      );
      
      return [{
        categoryName: 'custom',
        description: 'Пользовательский выбор таблиц',
        order: 1,
        tables
      }];
    } else {
      return MIGRATION_CONFIG.sort((a, b) => a.order - b.order);
    }
  }

  private async checkExistingData(categories: any[]): Promise<void> {
    console.log('🔍 Проверяем существующие данные...\n');

    for (const category of categories) {
      for (const table of category.tables) {
        try {
          const count = await this.getTableCount(table.tableName);
          if (count > 0) {
            console.log(`   ⚠️  ${table.displayName}: ${count} записей (будет пропущена)`);
            // Удаляем таблицу из списка для засева
            const index = category.tables.indexOf(table);
            if (index > -1) {
              category.tables.splice(index, 1);
            }
          } else {
            console.log(`   ✅ ${table.displayName}: пустая (будет засеяна)`);
          }
        } catch (error) {
          console.log(`   ❓ ${table.displayName}: ошибка проверки`);
        }
      }
    }
    console.log('');
  }

  private async seedSequential(categories: any[]): Promise<void> {
    console.log('🔄 Последовательный засев...\n');

    for (const category of categories) {
      console.log(`📁 Засеваем категорию: ${category.description}`);
      
      for (const table of category.tables) {
        await this.seedTable(table);
      }
      console.log('');
    }
  }

  private async seedParallel(categories: any[]): Promise<void> {
    const maxConcurrency = this.options.maxConcurrency || 3;
    console.log(`⚡ Параллельный засев (макс. ${maxConcurrency} потоков)...\n`);

    for (const category of categories) {
      console.log(`📁 Засеваем категорию: ${category.description}`);
      
      // Группируем таблицы по батчам для параллельного выполнения
      const batches = this.chunkArray(category.tables, maxConcurrency);
      
      for (const batch of batches) {
        const promises = batch.map(table => this.seedTable(table));
        await Promise.allSettled(promises);
      }
      console.log('');
    }
  }

  private async seedTable(table: any): Promise<void> {
    const startTime = Date.now();
    const result: SeedingResult = {
      tableName: table.tableName,
      success: false,
      count: 0,
      duration: 0
    };

    try {
      console.log(`   ${table.icon} Засеваем ${table.displayName}...`);

      // Определяем скрипт для засева
      const scriptPath = this.getScriptPath(table.tableName);
      
      if (!scriptPath) {
        result.error = 'Скрипт не найден';
        console.log(`   ⚠️  Скрипт не найден для ${table.tableName}`);
        return;
      }

      // Выполняем засев
      const envPrefix = this.getEnvironmentPrefix();
      const command = `${envPrefix}npx tsx ${scriptPath}`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('warning')) {
        throw new Error(stderr);
      }

      // Подсчитываем количество записей
      result.count = await this.getTableCount(table.tableName);
      result.success = true;
      result.duration = Date.now() - startTime;

      console.log(`   ✅ ${table.displayName}: ${result.count} записей за ${result.duration}мс`);

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      console.error(`   ❌ ${table.displayName}: ${result.error}`);
    }

    this.results.push(result);
  }

  private getScriptPath(tableName: string): string | null {
    // Карта таблиц на скрипты
    const scriptMap: Record<string, string> = {
      'status': 'scripts/seed-static-values.ts',
      'format': 'scripts/seed-static-values.ts',
      'language': 'scripts/seed-static-values.ts',
      'region': 'scripts/seed-static-values.ts',
      'category': 'scripts/seed-categories.ts',
      'tag': 'scripts/seed-categories.ts', // Теги могут засеваться вместе с категориями
      'domain': 'scripts/seed-domains.ts',
      'solutionArea': 'scripts/seed-solution-areas.ts',
      'product': 'scripts/seed-products.ts',
      'component': 'scripts/seed-components.ts',
      'integration': 'scripts/seed-integrations.ts',
      'confidentiality': 'scripts/seed-confidentiality.ts'
    };

    return scriptMap[tableName] || null;
  }

  private getEnvironmentPrefix(): string {
    if (this.options.environment === 'prod') {
      return 'DATABASE_URL=$DATABASE_URL_PROD ';
    } else if (this.options.environment === 'dev') {
      return 'DATABASE_URL=$DATABASE_URL_DEV ';
    }
    return '';
  }

  private async getTableCount(tableName: string): Promise<number> {
    try {
      return await (prisma as any)[tableName].count();
    } catch {
      return 0;
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.totalStartTime;
    
    console.log('🎉 Засев завершен!\n');
    console.log('📊 Сводка засева:');
    console.log('═'.repeat(80));
    
    let totalTables = 0;
    let successTables = 0;
    let totalRecords = 0;

    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const error = result.error ? ` (${result.error})` : '';
      console.log(`${status} ${result.tableName.padEnd(20)} | ${result.count.toString().padStart(6)} записей | ${result.duration.toString().padStart(6)}мс${error}`);
      
      totalTables++;
      if (result.success) {
        successTables++;
        totalRecords += result.count;
      }
    });

    console.log('═'.repeat(80));
    console.log(`📈 ИТОГО: ${successTables}/${totalTables} таблиц, ${totalRecords} записей`);
    console.log(`⏱️  Общее время: ${totalDuration}мс`);
    console.log(`📅 Завершено: ${new Date().toISOString()}`);

    if (successTables < totalTables) {
      console.log('\n⚠️  Обнаружены ошибки. Проверьте логи выше.');
    }
  }
}

// Функция для запуска засева
export async function runDataSeeding(options: SeedingOptions = {}): Promise<void> {
  const manager = new DataSeedingManager(options);
  await manager.seed();
}

// CLI интерфейс
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: SeedingOptions = {};

  // Парсинг аргументов командной строки
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--categories':
        options.categories = args[++i]?.split(',');
        break;
      case '--tables':
        options.tables = args[++i]?.split(',');
        break;
      case '--env':
        options.environment = args[++i] as 'dev' | 'prod';
        break;
      case '--parallel':
        options.parallel = true;
        break;
      case '--max-concurrency':
        options.maxConcurrency = parseInt(args[++i]) || 3;
        break;
      case '--skip-existing':
        options.skipExisting = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--help':
        console.log(`
Менеджер засева данных

Использование:
  npm run seed:managed [опции]

Опции:
  --categories category1,category2  Засеять только указанные категории
  --tables table1,table2           Засеять только указанные таблицы
  --env dev|prod                   Целевая среда
  --parallel                       Параллельное выполнение
  --max-concurrency N              Максимум параллельных потоков
  --skip-existing                  Пропустить таблицы с данными
  --force                          Принудительно перезаписать данные

Категории:
  static_metadata     - Статические метаданные
  core_metadata      - Основные метаданные  
  business_metadata  - Бизнес метаданные
  content_data       - Контентные данные
  user_data          - Пользовательские данные
  relationship_data  - Связи между сущностями

Примеры:
  npm run seed:managed --categories static_metadata,core_metadata
  npm run seed:managed --tables category,tag,product --env prod
  npm run seed:managed --parallel --skip-existing --env dev
        `);
        process.exit(0);
    }
  }

  runDataSeeding(options).catch(console.error);
} 