'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, User, Star, TrendingUp } from 'lucide-react';
import { SearchFilters, Category, CATEGORY_LABELS, CategoryNode, CATEGORIES, findCategoryById } from '@/lib/types';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  filteredSlides?: any[];
  searchQuery?: string;
}

export default function FilterPanel({ filters, onFiltersChange, filteredSlides = [], searchQuery = '' }: FilterPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(filters.category || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [author, setAuthor] = useState(filters.author || '');
  const [sortBy, setSortBy] = useState(filters.sortBy || 'relevance');
  const [sortOrder, setSortOrder] = useState(filters.sortOrder || 'desc');
  const [onlyFavorites, setOnlyFavorites] = useState(filters.isFavorite || false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Загрузка доступных тегов
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const tags = await response.json();
          setAvailableTags(tags.map((tag: any) => tag.name));
        }
      } catch (error) {
        console.error('Error loading tags:', error);
        // Fallback теги
        setAvailableTags([
          'react', 'typescript', 'figma', 'веб', 'мобильное',
          'кейс', 'дизайн', 'разработка', 'ui', 'ux'
        ]);
      }
    };
    
    loadTags();
  }, []);

  // Вычисляем статистику категорий из отфильтрованных слайдов
  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    
    filteredSlides.forEach((slide: any) => {
      if (slide.category) {
        stats[slide.category] = (stats[slide.category] || 0) + 1;
      }
    });
    
    return stats;
  };

  // Получаем доступные категории (только те, где есть слайды)
  const getAvailableCategories = () => {
    const categoryStats = getCategoryStats();
    
    // Если нет поискового запроса, показываем все категории
    if (!searchQuery.trim()) {
      return CATEGORIES;
    }
    
    // При поиске показываем только категории с результатами
    function filterCategories(nodes: CategoryNode[]): CategoryNode[] {
      return nodes.filter(node => {
        // Проверяем есть ли слайды в этой категории
        const hasSlides = categoryStats[node.id] > 0;
        
        // Проверяем есть ли слайды в подкатегориях
        let hasChildSlides = false;
        if (node.children) {
          hasChildSlides = node.children.some((child: CategoryNode) => categoryStats[child.id] > 0);
        }
        
        return hasSlides || hasChildSlides;
      }).map(node => ({
        ...node,
        children: node.children ? filterCategories(node.children) : []
      }));
    }
    
    return filterCategories(CATEGORIES);
  };

  // Применение фильтров
  const applyFilters = () => {
    const newFilters: SearchFilters = {
      ...filters,
      category: selectedCategory.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      author: author.trim() || undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      isFavorite: onlyFavorites,
    };
    
    onFiltersChange(newFilters);
  };

  // Сброс фильтров
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedTags([]);
    setAuthor('');
    setSortBy('relevance');
    setSortOrder('desc');
    setOnlyFavorites(false);
    
    onFiltersChange({ query: filters.query });
  };

  // Обработка изменения категорий
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
  };

  // Обработка изменения тегов
  const handleTagChange = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
  };

  const availableCategories = getAvailableCategories();
  const categoryStats = getCategoryStats();
  const hasActiveFilters = selectedCategory || selectedTags.length > 0 || 
                          author || onlyFavorites || sortBy !== 'relevance';

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Фильтры</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Сбросить все
          </button>
        )}
      </div>

      {/* Быстрые фильтры */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Быстрые фильтры</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`filter-button ${onlyFavorites ? 'active' : ''}`}
          >
            <Star className="w-4 h-4 mr-1" />
            Избранное
          </button>
        </div>
      </div>

      {/* Категории */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Категории</h3>
        <div className="space-y-2">
          {availableCategories.map((node) => (
            <label key={node.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategory === node.id}
                onChange={() => handleCategoryChange(node.id)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">{node.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Теги */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Теги</h3>
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagChange(tag)}
              className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-accent'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Автор */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Автор</h3>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Имя автора..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Сортировка */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Сортировка</h3>
        <div className="space-y-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
          >
            <option value="relevance">По релевантности</option>
            <option value="date">По дате</option>
            <option value="popularity">По популярности</option>
            <option value="alphabetical">По алфавиту</option>
          </select>
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
          >
            <option value="desc">По убыванию</option>
            <option value="asc">По возрастанию</option>
          </select>
        </div>
      </div>

      {/* Кнопка применения */}
      <button
        onClick={applyFilters}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Применить фильтры
      </button>

      {/* Активные фильтры */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Активные фильтры:</h4>
          <div className="flex flex-wrap gap-1">
            {selectedCategory && (
              <span
                className="inline-flex items-center px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full"
              >
                {findCategoryById(selectedCategory)?.label}
                <button
                  onClick={() => handleCategoryChange(selectedCategory)}
                  className="ml-1 hover:text-primary-foreground/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full"
              >
                {tag}
                <button
                  onClick={() => handleTagChange(tag)}
                  className="ml-1 hover:text-secondary-foreground/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {onlyFavorites && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                Избранное
                <button
                  onClick={() => setOnlyFavorites(false)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 