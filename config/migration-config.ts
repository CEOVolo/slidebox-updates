export interface MigrationTableConfig {
  tableName: string;
  displayName: string;
  icon: string;
  dependencies?: string[]; // Зависимые таблицы, которые должны быть мигрированы первыми
  specialHandling?: 'hierarchical' | 'batch' | 'custom'; // Специальная обработка
  batchSize?: number; // Размер батча для больших таблиц
  customMigrationFunction?: string; // Имя функции для кастомной миграции
  excludeFields?: string[]; // Поля, которые не нужно мигрировать
  transformations?: Record<string, (value: any) => any>; // Трансформации данных
}

export interface DataCategory {
  categoryName: string;
  description: string;
  tables: MigrationTableConfig[];
  order: number; // Порядок выполнения категории
}

// Конфигурация для миграции всех типов данных
export const MIGRATION_CONFIG: DataCategory[] = [
  {
    categoryName: 'static_metadata',
    description: 'Статические метаданные',
    order: 1,
    tables: [
      {
        tableName: 'status',
        displayName: 'Статусы',
        icon: '📊'
      },
      {
        tableName: 'format',
        displayName: 'Форматы',
        icon: '📄'
      },
      {
        tableName: 'language',
        displayName: 'Языки',
        icon: '🌍'
      },
      {
        tableName: 'region',
        displayName: 'Регионы',
        icon: '🗺️'
      }
    ]
  },
  {
    categoryName: 'core_metadata',
    description: 'Основные метаданные',
    order: 2,
    tables: [
      {
        tableName: 'category',
        displayName: 'Категории',
        icon: '📁',
        specialHandling: 'hierarchical' // Требует особой обработки parent-child
      },
      {
        tableName: 'tag',
        displayName: 'Теги',
        icon: '🏷️'
      },
      {
        tableName: 'domain',
        displayName: 'Домены',
        icon: '🌐'
      },
      {
        tableName: 'solutionArea',
        displayName: 'Области решений',
        icon: '💡',
        dependencies: ['domain']
      }
    ]
  },
  {
    categoryName: 'business_metadata',
    description: 'Бизнес метаданные',
    order: 3,
    tables: [
      {
        tableName: 'product',
        displayName: 'Продукты',
        icon: '📦'
      },
      {
        tableName: 'component',
        displayName: 'Компоненты',
        icon: '🧩'
      },
      {
        tableName: 'integration',
        displayName: 'Интеграции',
        icon: '🔌'
      },
      {
        tableName: 'userType',
        displayName: 'Типы пользователей',
        icon: '👥'
      }
    ]
  },
  {
    categoryName: 'content_data',
    description: 'Контентные данные',
    order: 4,
    tables: [
      {
        tableName: 'slide',
        displayName: 'Слайды',
        icon: '🖼️',
        batchSize: 100,
        specialHandling: 'batch',
        excludeFields: ['figmaUrl', 'previewUrl'] // Не мигрируем URL'ы
      }
    ]
  },
  {
    categoryName: 'user_data',
    description: 'Пользовательские данные',
    order: 5,
    tables: [
      {
        tableName: 'user',
        displayName: 'Пользователи',
        icon: '👤',
        excludeFields: ['password', 'resetToken', 'resetTokenExpiry'], // Исключаем чувствительные данные
        transformations: {
          email: (email: string) => email.toLowerCase() // Нормализация email
        }
      }
    ]
  },
  {
    categoryName: 'relationship_data',
    description: 'Связи между сущностями',
    order: 6,
    tables: [
      {
        tableName: 'slideTag',
        displayName: 'Связи слайдов и тегов',
        icon: '🔗',
        dependencies: ['slide', 'tag']
      },
      {
        tableName: 'slideProduct',
        displayName: 'Связи слайдов и продуктов',
        icon: '🔗',
        dependencies: ['slide', 'product']
      },
      {
        tableName: 'slideUserType',
        displayName: 'Связи слайдов и типов пользователей',
        icon: '🔗',
        dependencies: ['slide', 'userType']
      },
      {
        tableName: 'slideComponent',
        displayName: 'Связи слайдов и компонентов',
        icon: '🔗',
        dependencies: ['slide', 'component']
      },
      {
        tableName: 'slideIntegration',
        displayName: 'Связи слайдов и интеграций',
        icon: '🔗',
        dependencies: ['slide', 'integration']
      },
      {
        tableName: 'slideSolutionArea',
        displayName: 'Связи слайдов и областей решений',
        icon: '🔗',
        dependencies: ['slide', 'solutionArea']
      },
      {
        tableName: 'slideDomain',
        displayName: 'Связи слайдов и доменов',
        icon: '🔗',
        dependencies: ['slide', 'domain']
      }
    ]
  }
];

// Вспомогательные функции
export function getCategoryByName(categoryName: string): DataCategory | undefined {
  return MIGRATION_CONFIG.find(cat => cat.categoryName === categoryName);
}

export function getTableByName(tableName: string): MigrationTableConfig | undefined {
  for (const category of MIGRATION_CONFIG) {
    const table = category.tables.find(t => t.tableName === tableName);
    if (table) return table;
  }
  return undefined;
}

export function getOrderedTables(): MigrationTableConfig[] {
  return MIGRATION_CONFIG
    .sort((a, b) => a.order - b.order)
    .flatMap(category => category.tables);
}

export function getTablesByCategory(categoryName: string): MigrationTableConfig[] {
  const category = getCategoryByName(categoryName);
  return category ? category.tables : [];
}

export function validateDependencies(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allTableNames = getOrderedTables().map(t => t.tableName);
  
  for (const table of getOrderedTables()) {
    if (table.dependencies) {
      for (const dep of table.dependencies) {
        if (!allTableNames.includes(dep)) {
          errors.push(`Table "${table.tableName}" depends on "${dep}" which is not defined in config`);
        }
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
} 