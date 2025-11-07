import Fuse from 'fuse.js';
import { Slide, SearchFilters, SearchResult, Category } from './types';

// Синонимы для русского языка
const SYNONYMS: Record<string, string[]> = {
  'веб': ['web', 'website', 'сайт'],
  'web': ['веб', 'website', 'сайт'],
  'сайт': ['web', 'website', 'веб'],
  'website': ['web', 'веб', 'сайт'],
  'кейс': ['case', 'проект', 'project'],
  'case': ['кейс', 'проект', 'project'],
  'проект': ['кейс', 'case', 'project'],
  'project': ['кейс', 'case', 'проект'],
  'приложение': ['app', 'application', 'апп'],
  'app': ['приложение', 'application', 'апп'],
  'мобильное': ['mobile', 'мобильн'],
  'mobile': ['мобильное', 'мобильн'],
  'технологии': ['tech', 'технолог'],
  'tech': ['технологии', 'технолог'],
  'дизайн': ['design', 'ui', 'ux'],
  'design': ['дизайн', 'ui', 'ux'],
  'разработка': ['development', 'dev', 'девелопмент'],
  'development': ['разработка', 'dev', 'девелопмент'],
};

// Весовые коэффициенты для поиска
const SEARCH_WEIGHTS = {
  title: 0.4,
  extractedText: 0.3,
  tags: 0.2,
  description: 0.1,
};

// Конфигурация Fuse.js для полнотекстового поиска
const FUSE_OPTIONS: any = {
  includeScore: true,
  threshold: 0.4, // Чувствительность поиска (0 = точное совпадение, 1 = любое совпадение)
  keys: [
    { name: 'title', weight: SEARCH_WEIGHTS.title },
    { name: 'extractedText', weight: SEARCH_WEIGHTS.extractedText },
    { name: 'tags.tag.name', weight: SEARCH_WEIGHTS.tags },
    { name: 'description', weight: SEARCH_WEIGHTS.description },
  ],
  getFn: (obj: any, path: string) => {
    if (path === 'tags.tag.name') {
      return obj.tags?.map((t: any) => t.tag.name).join(' ') || '';
    }
    // Простая реализация getFn для доступа к вложенным полям
    return path.split('.').reduce((o, p) => o && o[p], obj);
  },
};

// Расширение поискового запроса синонимами
function expandQueryWithSynonyms(query: string): string {
  const words = query.toLowerCase().split(/\s+/);
  const expandedWords: Set<string> = new Set(words);
  
  for (const word of words) {
    if (SYNONYMS[word]) {
      SYNONYMS[word].forEach(synonym => expandedWords.add(synonym));
    }
  }
  
  return Array.from(expandedWords).join(' ');
}

// Вычисление релевантности по популярности
function calculatePopularityScore(slide: Slide): number {
  const viewWeight = 0.3;
  const useWeight = 0.7;
  const favoriteBonus = slide.isFavorite ? 10 : 0;
  
  return ((slide.viewCount || 0) * viewWeight + (slide.useCount || 0) * useWeight) + favoriteBonus;
}

// Применение фильтров
function applyFilters(slides: Slide[], filters: SearchFilters): Slide[] {
  let filtered = slides;

    // Фильтр по категории
  if (filters.category) {
    filtered = filtered.filter(slide =>
      slide.categories?.some((catRel: any) => 
        catRel.Category?.name === filters.category || 
        catRel.category?.name === filters.category
      ) || false
    );
  }

  // Фильтр по тегам
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(slide => 
      slide.tags?.some(slideTag => 
        filters.tags!.includes(slideTag.tag.name)
      ) || false
    );
  }

  // TODO: Фильтр по автору (нужно добавить поле author в тип Slide)
  // if (filters.author) {
  //   filtered = filtered.filter(slide => 
  //     slide.author?.toLowerCase().includes(filters.author!.toLowerCase())
  //   );
  // }

  // Закомментировано: фильтр по дате (можно добавить в будущем)
  // if (filters.dateFrom) {
  //   filtered = filtered.filter(slide => 
  //     slide.createdAt >= filters.dateFrom!
  //   );
  // }

  // if (filters.dateTo) {
  //   filtered = filtered.filter(slide => 
  //     slide.createdAt <= filters.dateTo!
  //   );
  // }

  // TODO: Фильтр только избранное (добавить в тип SearchFilters)
  // if (filters.onlyFavorites) {
  //   filtered = filtered.filter(slide => slide.isFavorite);
  // }

     // TODO: Фильтр только популярные (добавить в тип SearchFilters)
   // if (filters.onlyPopular) {
   //   const sortedByUse = [...filtered].sort((a, b) => (b.useCount || 0) - (a.useCount || 0));
   //   const topCount = Math.ceil(sortedByUse.length * 0.2);
   //   const topSlides = sortedByUse.slice(0, topCount);
   //   filtered = filtered.filter(slide => topSlides.includes(slide));
   // }

  return filtered;
}

// Сортировка результатов
function sortResults(
  slides: Array<{ item: Slide; score?: number }>, 
  sortBy: string = 'relevance', 
  sortOrder: string = 'desc'
): Slide[] {
  let sorted: Slide[];

  switch (sortBy) {
    case 'date':
      sorted = slides
        .sort((a, b) => {
          const dateA = new Date(a.item.createdAt).getTime();
          const dateB = new Date(b.item.createdAt).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        })
        .map(item => item.item);
      break;

    case 'popularity':
      sorted = slides
        .sort((a, b) => {
          const scoreA = calculatePopularityScore(a.item);
          const scoreB = calculatePopularityScore(b.item);
          return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
        })
        .map(item => item.item);
      break;

    case 'title':
    case 'alphabetical': // поддержка для обратной совместимости
      sorted = slides
        .sort((a, b) => {
          const titleA = a.item.title.toLowerCase();
          const titleB = b.item.title.toLowerCase();
          const comparison = titleA.localeCompare(titleB, 'ru');
          return sortOrder === 'desc' ? -comparison : comparison;
        })
        .map(item => item.item);
      break;

    case 'relevance':
    default:
      // Сортировка по релевантности (Fuse score + популярность)
      sorted = slides
        .sort((a, b) => {
          const scoreA = (a.score || 0) - (calculatePopularityScore(a.item) * 0.1);
          const scoreB = (b.score || 0) - (calculatePopularityScore(b.item) * 0.1);
          return sortOrder === 'desc' ? scoreA - scoreB : scoreB - scoreA;
        })
        .map(item => item.item);
      break;
  }

  return sorted;
}

// Основная функция поиска
export async function searchSlides(
  slides: Slide[],
  filters: SearchFilters = {},
  page: number = 1,
  limit: number = 100
): Promise<SearchResult> {
  let results: Array<{ item: Slide; score?: number }>;

  // Если есть поисковый запрос - используем полнотекстовый поиск
  if (filters.query && filters.query.trim()) {
    const expandedQuery = expandQueryWithSynonyms(filters.query.trim());
    const fuse = new Fuse(slides, FUSE_OPTIONS);
    const fuseResults = fuse.search(expandedQuery);
    
    results = fuseResults.map((result: any) => ({
      item: result.item,
      score: result.score,
    }));
  } else {
    // Без запроса - возвращаем все слайды
    results = slides.map(slide => ({ item: slide }));
  }

  // Применяем фильтры
  const filtered = applyFilters(
    results.map(r => r.item), 
    filters
  );

  // Восстанавливаем структуру с score для отфильтрованных элементов
  const filteredWithScore = results.filter(r => 
    filtered.includes(r.item)
  );

  // Сортировка
  const sorted = sortResults(
    filteredWithScore,
    filters.sortBy,
    filters.sortOrder
  );

  // Пагинация
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedSlides = sorted.slice(startIndex, endIndex);

  return {
    slides: paginatedSlides,
    total: sorted.length,
    page,
    limit,
    hasMore: endIndex < sorted.length,
    hasNext: endIndex < sorted.length,
    hasPrev: page > 1,
  };
}

// Поиск похожих слайдов
export function findSimilarSlides(
  targetSlide: Slide,
  allSlides: Slide[],
  limit: number = 5
): Slide[] {
  // Исключаем сам слайд из поиска
  const otherSlides = allSlides.filter(slide => slide.id !== targetSlide.id);
  
  // Поиск по категории и тегам
  const similar = otherSlides
    .map(slide => {
      let score = 0;
      
      // Бонус за ту же категорию
      const slideCategories = slide.categories?.map((cat: any) => cat.Category?.name || cat.category?.name) || [];
      const targetCategories = targetSlide.categories?.map((cat: any) => cat.Category?.name || cat.category?.name) || [];
      const commonCategories = slideCategories.filter((cat: string) => targetCategories.includes(cat));
      if (commonCategories.length > 0) {
        score += 0.5;
      }
      
      // Бонус за совпадающие теги
      const targetTags = targetSlide.tags?.map(t => t.tag.name) || [];
      const slideTags = slide.tags?.map(t => t.tag.name) || [];
      const commonTags = targetTags.filter(tag => slideTags.includes(tag));
      score += commonTags.length * 0.2;
      
      // Бонус за текстовое сходство (простая проверка общих слов)
      const targetWords = (targetSlide.extractedText || '').toLowerCase().split(/\s+/);
      const slideWords = (slide.extractedText || '').toLowerCase().split(/\s+/);
      const commonWords = targetWords.filter(word => 
        word.length > 3 && slideWords.includes(word)
      );
      score += commonWords.length * 0.1;
      
      return { slide, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.slide);
    
  return similar;
}

// Автодополнение для поисковых запросов
export function getSearchSuggestions(
  query: string,
  slides: Slide[],
  limit: number = 10
): string[] {
  const lowerQuery = query.toLowerCase();
  const suggestions: Set<string> = new Set();
  
  // Собираем все возможные термины для автодополнения
  slides.forEach(slide => {
    // Заголовки
    if (slide.title.toLowerCase().includes(lowerQuery)) {
      suggestions.add(slide.title);
    }
    
    // Теги
    slide.tags?.forEach(tagInfo => {
      if (tagInfo.tag.name.toLowerCase().includes(lowerQuery)) {
        suggestions.add(tagInfo.tag.name);
      }
    });
    
    // Слова из извлеченного текста
    if (slide.extractedText) {
      const words = slide.extractedText.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && word.includes(lowerQuery)) {
          suggestions.add(word);
        }
      });
    }
  });
  
  // Добавляем синонимы
  if (SYNONYMS[lowerQuery]) {
    SYNONYMS[lowerQuery].forEach(synonym => suggestions.add(synonym));
  }
  
  return Array.from(suggestions)
    .slice(0, limit)
    .sort((a, b) => a.localeCompare(b, 'ru'));
} 