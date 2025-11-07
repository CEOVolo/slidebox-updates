import { PrismaClient } from '@prisma/client';
import { 
  MIGRATION_CONFIG, 
  MigrationTableConfig, 
  getOrderedTables, 
  getTablesByCategory,
  validateDependencies 
} from '../config/migration-config';

// Инициализация Prisma клиентов
const devDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_DEV
    }
  }
});

const prodDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_PROD
    }
  }
});

interface MigrationOptions {
  categories?: string[]; // Какие категории мигрировать
  tables?: string[]; // Какие конкретные таблицы мигрировать
  dryRun?: boolean; // Тестовый запуск без изменений
  clearTarget?: boolean; // Очистить целевую БД перед миграцией
  batchSize?: number; // Размер батча по умолчанию
}

interface MigrationStats {
  tableName: string;
  sourceCount: number;
  migratedCount: number;
  skippedCount: number;
  errorCount: number;
  duration: number;
}

class UniversalDataMigrator {
  private stats: MigrationStats[] = [];
  private totalStartTime = Date.now();

  constructor(private options: MigrationOptions = {}) {}

  async migrate(): Promise<void> {
    console.log('🚀 Начинаем универсальную миграцию данных...\n');
    console.log(`📅 Время начала: ${new Date().toISOString()}\n`);

    // Валидация конфигурации
    const validation = validateDependencies();
    if (!validation.valid) {
      console.error('❌ Ошибки в конфигурации:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
      throw new Error('Конфигурация содержит ошибки');
    }

    try {
      // Получение списка таблиц для миграции
      const tablesToMigrate = this.getTablesList();
      
      if (tablesToMigrate.length === 0) {
        console.log('ℹ️  Нет таблиц для миграции');
        return;
      }

      console.log('📋 Планируется мигрировать следующие таблицы:');
      tablesToMigrate.forEach(table => {
        console.log(`   ${table.icon} ${table.displayName} (${table.tableName})`);
      });
      console.log('');

      if (this.options.dryRun) {
        console.log('🔍 ТЕСТОВЫЙ РЕЖИМ - изменения не будут применены\n');
      }

      // Очистка целевой БД если требуется
      if (this.options.clearTarget && !this.options.dryRun) {
        await this.clearTargetDatabase(tablesToMigrate);
      }

      // Миграция таблиц
      for (const table of tablesToMigrate) {
        await this.migrateTable(table);
      }

      this.printSummary();

    } catch (error) {
      console.error('\n❌ Ошибка миграции:', error);
      throw error;
    } finally {
      await devDb.$disconnect();
      await prodDb.$disconnect();
    }
  }

  private getTablesList(): MigrationTableConfig[] {
    if (this.options.tables && this.options.tables.length > 0) {
      // Мигрируем конкретные таблицы
      return getOrderedTables().filter(table => 
        this.options.tables!.includes(table.tableName)
      );
    } else if (this.options.categories && this.options.categories.length > 0) {
      // Мигрируем конкретные категории
      const result: MigrationTableConfig[] = [];
      for (const categoryName of this.options.categories) {
        result.push(...getTablesByCategory(categoryName));
      }
      return result;
    } else {
      // Мигрируем все таблицы
      return getOrderedTables();
    }
  }

  private async clearTargetDatabase(tables: MigrationTableConfig[]): Promise<void> {
    console.log('🧹 Очищаем целевую базу данных...\n');

    // Очищаем в обратном порядке для соблюдения foreign key constraints
    const reversedTables = [...tables].reverse();

    for (const table of reversedTables) {
      try {
        const count = await this.getTableCount(prodDb, table.tableName);
        if (count > 0) {
          await (prodDb as any)[table.tableName].deleteMany({});
          console.log(`   ✅ Очищена таблица ${table.displayName} (${count} записей)`);
        }
      } catch (error) {
        console.log(`   ⚠️  Ошибка очистки ${table.tableName}:`, error);
      }
    }
    console.log('');
  }

  private async migrateTable(table: MigrationTableConfig): Promise<void> {
    const startTime = Date.now();
    console.log(`${table.icon} Мигрируем ${table.displayName}...`);

    const stats: MigrationStats = {
      tableName: table.tableName,
      sourceCount: 0,
      migratedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      duration: 0
    };

    try {
      // Получаем исходные данные
      const sourceData = await this.getSourceData(table);
      stats.sourceCount = sourceData.length;

      if (sourceData.length === 0) {
        console.log(`   ℹ️  Нет данных для миграции в таблице ${table.tableName}`);
        stats.duration = Date.now() - startTime;
        this.stats.push(stats);
        return;
      }

      // Мигрируем данные
      await this.migrateTableData(table, sourceData, stats);

      stats.duration = Date.now() - startTime;
      console.log(`   ✅ Мигрировано: ${stats.migratedCount}/${stats.sourceCount} записей за ${stats.duration}мс`);

    } catch (error) {
      stats.duration = Date.now() - startTime;
      stats.errorCount++;
      console.error(`   ❌ Ошибка миграции ${table.tableName}:`, error);
    }

    this.stats.push(stats);
  }

  private async getSourceData(table: MigrationTableConfig): Promise<any[]> {
    const sourceTable = (devDb as any)[table.tableName];
    
    if (table.specialHandling === 'hierarchical' && table.tableName === 'category') {
      // Особая обработка для иерархических структур
      return await sourceTable.findMany({
        orderBy: { order: 'asc' }
      });
    } else {
      return await sourceTable.findMany();
    }
  }

  private async migrateTableData(
    table: MigrationTableConfig, 
    sourceData: any[], 
    stats: MigrationStats
  ): Promise<void> {
    
    if (this.options.dryRun) {
      stats.migratedCount = sourceData.length;
      return;
    }

    const targetTable = (prodDb as any)[table.tableName];
    
    if (table.specialHandling === 'hierarchical' && table.tableName === 'category') {
      await this.migrateHierarchicalData(targetTable, sourceData, table, stats);
    } else if (table.specialHandling === 'batch' || (table.batchSize && sourceData.length > table.batchSize)) {
      await this.migrateBatchData(targetTable, sourceData, table, stats);
    } else {
      await this.migrateSimpleData(targetTable, sourceData, table, stats);
    }
  }

  private async migrateHierarchicalData(
    targetTable: any, 
    sourceData: any[], 
    table: MigrationTableConfig, 
    stats: MigrationStats
  ): Promise<void> {
    // Сначала корневые элементы
    const rootItems = sourceData.filter(item => !item.parentId);
    for (const item of rootItems) {
      try {
        const cleanData = this.cleanData(item, table);
        await targetTable.create({ data: cleanData });
        stats.migratedCount++;
      } catch (error) {
        stats.errorCount++;
        console.error(`     ❌ Ошибка создания корневого элемента ${item.id}:`, error);
      }
    }

    // Затем дочерние элементы
    const childItems = sourceData.filter(item => item.parentId);
    for (const item of childItems) {
      try {
        const cleanData = this.cleanData(item, table);
        await targetTable.create({ data: cleanData });
        stats.migratedCount++;
      } catch (error) {
        stats.errorCount++;
        console.error(`     ❌ Ошибка создания дочернего элемента ${item.id}:`, error);
      }
    }
  }

  private async migrateBatchData(
    targetTable: any, 
    sourceData: any[], 
    table: MigrationTableConfig, 
    stats: MigrationStats
  ): Promise<void> {
    const batchSize = table.batchSize || this.options.batchSize || 100;
    
    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize);
      
      try {
        const cleanBatch = batch.map(item => this.cleanData(item, table));
        await targetTable.createMany({ 
          data: cleanBatch,
          skipDuplicates: true 
        });
        stats.migratedCount += batch.length;
        
        console.log(`     📦 Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} записей`);
      } catch (error) {
        stats.errorCount += batch.length;
        console.error(`     ❌ Ошибка batch ${Math.floor(i/batchSize) + 1}:`, error);
      }
    }
  }

  private async migrateSimpleData(
    targetTable: any, 
    sourceData: any[], 
    table: MigrationTableConfig, 
    stats: MigrationStats
  ): Promise<void> {
    for (const item of sourceData) {
      const cleanData = this.cleanData(item, table);
      
      try {
        await targetTable.create({ data: cleanData });
        stats.migratedCount++;
      } catch (error) {
        // Пробуем upsert для избежания дубликатов
        try {
          if (item.id) {
            await targetTable.upsert({
              where: { id: item.id },
              update: cleanData,
              create: cleanData
            });
            stats.migratedCount++;
          } else {
            stats.errorCount++;
          }
        } catch (upsertError) {
          stats.errorCount++;
          console.error(`     ❌ Ошибка создания/обновления записи:`, error);
        }
      }
    }
  }

  private cleanData(item: any, table: MigrationTableConfig): any {
    const cleanItem = { ...item };

    // Удаляем исключенные поля
    if (table.excludeFields) {
      table.excludeFields.forEach(field => {
        delete cleanItem[field];
      });
    }

    // Применяем трансформации
    if (table.transformations) {
      Object.entries(table.transformations).forEach(([field, transform]) => {
        if (cleanItem[field] !== undefined) {
          cleanItem[field] = transform(cleanItem[field]);
        }
      });
    }

    return cleanItem;
  }

  private async getTableCount(db: PrismaClient, tableName: string): Promise<number> {
    try {
      return await (db as any)[tableName].count();
    } catch {
      return 0;
    }
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.totalStartTime;
    
    console.log('\n🎉 Миграция завершена!\n');
    console.log('📊 Сводка миграции:');
    console.log('═'.repeat(80));
    
    let totalSource = 0;
    let totalMigrated = 0;
    let totalErrors = 0;

    this.stats.forEach(stat => {
      const status = stat.errorCount > 0 ? '❌' : stat.migratedCount === stat.sourceCount ? '✅' : '⚠️';
      console.log(`${status} ${stat.tableName.padEnd(20)} | ${stat.migratedCount.toString().padStart(6)}/${stat.sourceCount.toString().padStart(6)} | ${stat.duration.toString().padStart(6)}мс`);
      
      totalSource += stat.sourceCount;
      totalMigrated += stat.migratedCount;
      totalErrors += stat.errorCount;
    });

    console.log('═'.repeat(80));
    console.log(`📈 ИТОГО: ${totalMigrated}/${totalSource} записей, ${totalErrors} ошибок`);
    console.log(`⏱️  Общее время: ${totalDuration}мс`);
    console.log(`📅 Завершено: ${new Date().toISOString()}`);

    if (totalErrors > 0) {
      console.log('\n⚠️  Обнаружены ошибки. Проверьте логи выше.');
    }
  }
}

// Функция для запуска миграции
export async function runUniversalMigration(options: MigrationOptions = {}): Promise<void> {
  const migrator = new UniversalDataMigrator(options);
  await migrator.migrate();
}

// CLI интерфейс
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {};

  // Парсинг аргументов командной строки
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--categories':
        options.categories = args[++i]?.split(',');
        break;
      case '--tables':
        options.tables = args[++i]?.split(',');
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--clear':
        options.clearTarget = true;
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[++i]) || 100;
        break;
      case '--help':
        console.log(`
Универсальная миграция данных

Использование:
  npm run migrate:universal [опции]

Опции:
  --categories category1,category2  Мигрировать только указанные категории
  --tables table1,table2           Мигрировать только указанные таблицы
  --dry-run                        Тестовый запуск без изменений
  --clear                          Очистить целевую БД перед миграцией
  --batch-size N                   Размер батча для больших таблиц

Категории:
  static_metadata     - Статические метаданные
  core_metadata      - Основные метаданные  
  business_metadata  - Бизнес метаданные
  content_data       - Контентные данные
  user_data          - Пользовательские данные
  relationship_data  - Связи между сущностями

Примеры:
  npm run migrate:universal --categories static_metadata,core_metadata
  npm run migrate:universal --tables category,tag,product --dry-run
  npm run migrate:universal --clear --batch-size 50
        `);
        process.exit(0);
    }
  }

  runUniversalMigration(options).catch(console.error);
} 