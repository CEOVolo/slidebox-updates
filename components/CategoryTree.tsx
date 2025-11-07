'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { useMetadata } from '@/contexts/MetadataContext';

interface CategoryTreeProps {
  selectedCategory?: string;
  onCategorySelect: (categoryId: string) => void;
  onCategoryExpand?: (categoryId: string) => void;
  showAllSlides?: boolean;
  categoryStats?: {
    totalSlides: number;
    categoryStats: Record<string, number>;
    uncategorizedCount: number;
  };
  filteredSlides?: any[]; // Отфильтрованные слайды
  searchQuery?: string; // Поисковый запрос
}

interface CategoryStats {
  totalSlides: number;
  categoryStats: Record<string, number>;
  uncategorizedCount: number;
}

export default function CategoryTree({ 
  selectedCategory, 
  onCategorySelect, 
  onCategoryExpand,
  showAllSlides = true,
  categoryStats: externalCategoryStats,
  filteredSlides,
  searchQuery
}: CategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({ totalSlides: 0, categoryStats: {}, uncategorizedCount: 0 });
  const [loading, setLoading] = useState(true);
  
  const { metadata, loading: metadataLoading } = useMetadata();
  const categories = metadata?.categories || [];

  // Вычисляем статистику категорий из отфильтрованных слайдов
  const getFilteredCategoryStats = () => {
    if (!filteredSlides) return {};
    
    const stats: Record<string, number> = {};
    
    filteredSlides.forEach((slide: any) => {
      if (slide.category) {
        stats[slide.category] = (stats[slide.category] || 0) + 1;
      }
    });
    
    return stats;
  };

  // Auto-expand categories with small number of slides on first load
  useEffect(() => {
    if (categoryStats.totalSlides > 0 && expandedCategories.size === 0) {
      const autoExpand = new Set<string>();
      
      // Get categories with 10 or fewer slides, limit to 3 categories
      const smallCategories = Object.entries(categoryStats.categoryStats)
        .filter(([_, count]) => count <= 10)
        .slice(0, 3)
        .map(([categoryId]) => categoryId);
      
      smallCategories.forEach(categoryId => autoExpand.add(categoryId));
      setExpandedCategories(autoExpand);
    }
  }, [categoryStats]);

  useEffect(() => {
    if (externalCategoryStats) {
      setCategoryStats(externalCategoryStats);
      setLoading(false);
    } else {
      const fetchStats = async () => {
        try {
          const response = await fetch('/api/slides/stats');
          if (response.ok) {
            const data = await response.json();
            setCategoryStats({
              totalSlides: data.totalSlides || 0,
              categoryStats: data.categoryStats || {},
              uncategorizedCount: data.uncategorizedCount || 0
            });
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchStats();
    }
  }, [externalCategoryStats]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      // Префетч при раскрытии
      if (onCategoryExpand) {
        onCategoryExpand(categoryId);
      }
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryCount = (categoryId: string): number => {
    // При поиске используем статистику отфильтрованных слайдов
    if (searchQuery && searchQuery.trim() && filteredSlides) {
      const filteredStats = getFilteredCategoryStats();
      return filteredStats[categoryId] || 0;
    }
    // Иначе используем обычную статистику
    return categoryStats.categoryStats[categoryId] || 0;
  };

  const getParentCategoryCount = (node: any): number => {
    if (!node.children) return getCategoryCount(node.id);
    
    let total = getCategoryCount(node.id);
    node.children.forEach((child: any) => {
      total += getParentCategoryCount(child);
    });
    return total;
  };

  // Фильтруем категории - показываем только те, в которых есть слайды
  const getVisibleCategories = (): any[] => {
    const filterCategories = (categories: any[]): any[] => {
      return categories.map(category => {
        const categoryCount = getParentCategoryCount(category);
        
        // Всегда скрываем категории без слайдов
        if (categoryCount === 0) {
          return null;
        }

        // Фильтруем дочерние категории
        let filteredChildren: any[] | undefined;
        if (category.children) {
          filteredChildren = filterCategories(category.children);
          if (filteredChildren.length === 0) filteredChildren = undefined;
        }

        return {
          ...category,
          children: filteredChildren
        };
      }).filter(Boolean) as any[];
    };

    return filterCategories(categories);
  };

  // Подсчитываем количество слайдов без категории
  const getUncategorizedCount = (): number => {
    // При поиске считаем uncategorized слайды из отфильтрованных результатов
    if (searchQuery && searchQuery.trim() && filteredSlides) {
      return filteredSlides.filter((slide: any) => !slide.category || slide.category === 'uncategorized').length;
    }
    // Иначе используем обычную статистику
    return categoryStats.uncategorizedCount || 0;
  };

  // Подсчитываем общее количество слайдов
  const getTotalSlidesCount = (): number => {
    // При поиске используем количество отфильтрованных слайдов
    if (searchQuery && searchQuery.trim() && filteredSlides) {
      return filteredSlides.length;
    }
    // Иначе используем обычную статистику
    return categoryStats.totalSlides || 0;
  };

  const renderCategoryNode = (node: any, level: number = 0) => {
    const isExpanded = expandedCategories.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedCategory === node.id;
    const slideCount = hasChildren ? getParentCategoryCount(node) : getCategoryCount(node.id);

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-md transition-colors group
            ${isSelected 
              ? 'bg-yellow-100 text-gray-800 border-r-2 border-yellow-400 font-medium' 
              : 'hover:bg-gray-100 text-gray-700'
            }
            ${level > 0 ? 'ml-3' : ''}
          `}
          onClick={() => onCategorySelect(node.id)}
        >
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(node.id);
                }}
                className="p-1 hover:bg-gray-200 rounded mr-1 flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            )}
            
            {!hasChildren && <div className="w-5 mr-1 flex-shrink-0" />}
            
            <span className="flex-1 truncate pr-2 text-sm">{node.name}</span>
          </div>
          
          {!loading && slideCount > 0 && (
            <span className={`
              text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600 font-medium flex-shrink-0
              ${isSelected ? 'bg-yellow-200 text-gray-700' : ''}
              ${hasChildren ? 'bg-blue-100 text-blue-600' : ''}
            `}>
              {slideCount}
            </span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {node.children!.map((child: any) => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const visibleCategories = getVisibleCategories();
  const uncategorizedCount = getUncategorizedCount();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      <div className="p-3 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h3 className="text-base font-semibold text-gray-900 flex items-center justify-between">
          Categories
          {!loading && (
            <span className="text-xs text-gray-500 font-normal">
              {getTotalSlidesCount()} slides
            </span>
          )}
        </h3>
      </div>
      
      <div className="py-2">
        {showAllSlides && (
          <div
            className={`
              flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-md transition-colors
              ${selectedCategory === 'all' 
                ? 'bg-yellow-100 text-gray-800 border-r-2 border-yellow-400 font-medium' 
                : 'hover:bg-gray-100 text-gray-700'
              }
            `}
            onClick={() => onCategorySelect('all')}
          >
            <div className="flex items-center">
              <span className="mr-2 text-lg">📋</span>
              <span>All Slides</span>
            </div>
            {!loading && (
              <span className={`
                text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600 font-medium
                ${selectedCategory === 'all' ? 'bg-yellow-200 text-gray-700' : ''}
              `}>
                {getTotalSlidesCount()}
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="px-3 py-4 text-center text-sm text-gray-500">
            Loading categories...
          </div>
        ) : (
          <>
            {visibleCategories.map(category => renderCategoryNode(category))}
            
            {/* Uncategorized категория - показывать только в режиме All Slides */}
            {!loading && selectedCategory === 'all' && uncategorizedCount > 0 && (
              <div
                className={`
                  flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-md transition-colors mt-2 border-t border-gray-100
                  hover:bg-gray-100 text-gray-700
                `}
                onClick={() => onCategorySelect('uncategorized')}
              >
                <div className="flex items-center">
                  <span className="mr-2 text-lg">📂</span>
                  <span>Uncategorized</span>
                </div>
                <span className={`
                  text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600 font-medium
                `}>
                  {uncategorizedCount}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 