'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { Slide } from '@/lib/types';
import { useMetadata } from '@/contexts/MetadataContext';
import SlideCard from './SlideCard';

interface GroupedSlideGridProps {
  slides: Slide[];
  viewMode: 'grid' | 'list';
  selectedCategory?: string;
  searchQuery?: string;
  onSlideClick: (slide: Slide) => void;
  onAddToPresentation: (slide: Slide) => void;
  onEditSlide?: (slide: Slide) => void;
  onToggleFavorite?: (slide: Slide) => void;
}

interface SlideGroup {
  category: any | null;
  slides: Slide[];
  count: number;
}

export default function GroupedSlideGrid({
  slides,
  viewMode,
  selectedCategory,
  searchQuery,
  onSlideClick,
  onAddToPresentation,
  onEditSlide,
  onToggleFavorite
}: GroupedSlideGridProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [hoveredSlide, setHoveredSlide] = useState<string | null>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const { metadata } = useMetadata();
  const categories = metadata?.categories || [];

  // Автоматически раскрываем выбранную категорию и прокручиваем к ней
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'all') {
      // Раскрываем категорию
      setExpandedCategories(prev => new Set([...prev, selectedCategory]));
      
      // Прокручиваем к категории с небольшой задержкой для рендеринга
      setTimeout(() => {
        const categoryElement = categoryRefs.current[selectedCategory];
        if (categoryElement) {
          // Вычисляем позицию с учетом sticky заголовка
          const headerHeight = 80; // Примерная высота заголовка
          const elementRect = categoryElement.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const middle = absoluteElementTop - headerHeight;
          
          window.scrollTo({
            top: middle,
            behavior: 'smooth'
          });
        }
      }, 200); // Увеличиваем задержку для более надежного рендеринга
    }
  }, [selectedCategory]);

  // Группируем слайды по категориям
  const groupSlidesByCategory = (): SlideGroup[] => {
    const groups: Map<string, SlideGroup> = new Map();

    // Создаем группы для всех категорий (включая родительские)
    const addCategory = (category: any) => {
      if (!groups.has(category.id)) {
        groups.set(category.id, {
          category,
          slides: [],
          count: 0
        });
      }
      
      // Добавляем дочерние категории
      if (category.children) {
        category.children.forEach(addCategory);
      }
    };

    categories.forEach(addCategory);

    // Добавляем группу для неопределенных слайдов
    groups.set('uncategorized', {
      category: null,
      slides: [],
      count: 0
    });

    // Distribute slides by all their categories (support both SlideCategory and legacy shapes)
    const extractCategoryIds = (s: any): string[] => {
      const relations = s?.SlideCategory || s?.categories || [];
      const ids: string[] = [];
      for (const rel of relations) {
        if (!rel) continue;
        if (typeof rel === 'string') {
          ids.push(rel);
        } else if (rel.categoryId) {
          ids.push(rel.categoryId);
        } else if (rel.category?.id) {
          ids.push(rel.category.id);
        } else if (rel.id) {
          ids.push(rel.id);
        }
      }
      return ids;
    };

    slides.forEach(slide => {
      const categoryIds = extractCategoryIds(slide);
      if (categoryIds.length > 0) {
        categoryIds.forEach((categoryId: string) => {
          if (groups.has(categoryId)) {
            const group = groups.get(categoryId)!;
            group.slides.push(slide);
            group.count++;
          }
        });
      } else {
        // Slides without categories
        const uncategorizedGroup = groups.get('uncategorized')!;
        uncategorizedGroup.slides.push(slide);
        uncategorizedGroup.count++;
      }
    });

    // Вычисляем количество слайдов для родительских категорий (сумма подкатегорий)
    categories.forEach(parentCategory => {
      if (parentCategory.children) {
        const parentGroup = groups.get(parentCategory.id);
        if (parentGroup) {
          // Считаем общее количество слайдов во всех подкатегориях
          const totalSubcategorySlides = parentCategory.children.reduce((total: number, child: any) => {
            const childGroup = groups.get(child.id);
            return total + (childGroup ? childGroup.count : 0);
          }, 0);
          
          // Обновляем счетчик родительской категории (прямые слайды + слайды подкатегорий)
          parentGroup.count = parentGroup.slides.length + totalSubcategorySlides;
        }
      }
    });

    // Возвращаем группы согласно выбранной категории
    const orderedGroups: SlideGroup[] = [];

    const isParentSelection = selectedCategory 
      ? categories.some((parent: any) => parent.id === selectedCategory)
      : false;
    const isChildSelection = selectedCategory 
      ? categories.some((parent: any) => parent.children?.some((child: any) => child.id === selectedCategory))
      : false;

    if (selectedCategory && selectedCategory !== 'all') {
      if (isParentSelection) {
        // Для выбранной родительской категории: показываем только её подкатегории с слайдами
        const parent = categories.find((p: any) => p.id === selectedCategory);
        if (parent?.children) {
          parent.children.forEach((child: any) => {
            const childGroup = groups.get(child.id);
            if (childGroup && childGroup.slides.length > 0) {
              orderedGroups.push(childGroup);
            }
          });
        }
        // Не добавляем родителя и не добавляем uncategorized
        return orderedGroups;
      }
      if (isChildSelection) {
        // Для выбранной подкатегории: показываем только её группу
        const childGroup = groups.get(selectedCategory);
        if (childGroup && childGroup.slides.length > 0) {
          orderedGroups.push(childGroup);
        }
        return orderedGroups;
      }
      // Если выбранная категория не найдена как родитель/дочерняя — вернем пустой список
      return orderedGroups;
    }

    // Режим All Slides: родительские + дочерние (с слайдами)
    categories.forEach(parentCategory => {
      const parentGroup = groups.get(parentCategory.id);

      const hasDirectSlides = parentGroup && parentGroup.slides.length > 0;
      const hasSubcategorySlides = parentCategory.children?.some((child: any) => {
        const childGroup = groups.get(child.id);
        return childGroup && childGroup.slides.length > 0;
      });

      if (parentGroup && (hasDirectSlides || hasSubcategorySlides)) {
        orderedGroups.push(parentGroup);
      }

      if (parentCategory.children) {
        parentCategory.children.forEach((childCategory: any) => {
          const childGroup = groups.get(childCategory.id);
          if (childGroup && childGroup.slides.length > 0) {
            orderedGroups.push(childGroup);
          }
        });
      }
    });

    // В режиме All Slides добавляем Uncategorized ПЕРВЫМ
    const uncategorizedGroup = groups.get('uncategorized');
    if (selectedCategory === 'all' && uncategorizedGroup && uncategorizedGroup.count > 0) {
      orderedGroups.unshift(uncategorizedGroup);
    }

    return orderedGroups;
  };

  // При первой загрузке раскрываем все категории с небольшим количеством слайдов
  // При поиске раскрываем все категории с найденными слайдами
  useEffect(() => {
    if (slides.length === 0) return;

    const autoExpand = new Set<string>();
    const slideGroups = groupSlidesByCategory();

    if (selectedCategory === 'all') {
      // Поиск: раскрываем категории с результатами; без поиска — всё свернуто по умолчанию
      if (searchQuery && searchQuery.trim()) {
        slideGroups.forEach(group => {
          if (group.slides.length > 0) {
            const categoryId = group.category?.id || 'uncategorized';
            autoExpand.add(categoryId);
          }
        });
      }
    } else {
      // Не 'all'
      const isParentSelection = selectedCategory 
        ? categories.some((parent: any) => parent.id === selectedCategory)
        : false;
      const isChildSelection = selectedCategory 
        ? categories.some((parent: any) => parent.children?.some((child: any) => child.id === selectedCategory))
        : false;

      if (isParentSelection) {
        // Для родителя — оставить все свернутыми (ничего не добавляем)
      } else if (isChildSelection && selectedCategory) {
        // Для подкатегории — раскрыть её одну
        autoExpand.add(selectedCategory);
      }
    }

    setExpandedCategories(autoExpand);
  }, [slides, selectedCategory, searchQuery]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const slideGroups = groupSlidesByCategory();

  if (slideGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No slides found</h3>
        <p className="text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  const renderSlideGroup = (group: SlideGroup) => {
    const categoryId = group.category?.id || 'uncategorized';
    const isExpanded = expandedCategories.has(categoryId);
    const isUncategorized = !group.category;
    
    // Проверяем, является ли это подкатегорией
    const isSubcategory = group.category ? categories.some((parent: any) => 
      parent.children?.some((child: any) => child.id === group.category!.id)
    ) : false;

    // Проверяем, является ли это родительской категорией
    const isParentCategory = group.category ? categories.some((parent: any) => parent.id === group.category!.id) : false;

    // Для родительских категорий не показываем прямые слайды, только служат как заголовки
    const slidesToShow = isParentCategory ? [] : group.slides;
    const displayCount = isParentCategory ? group.count : group.slides.length;

    return (
      <div key={categoryId} className={`mb-6 ${isSubcategory ? 'ml-4' : ''}`}>
        {/* Category Header */}
        <div 
          ref={(el) => { categoryRefs.current[categoryId] = el; }}
          className={`
            flex items-center justify-between mb-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors
            ${isSubcategory ? 'border-l-4 border-l-blue-200' : ''}
            ${isParentCategory ? 'bg-gradient-to-r from-blue-50 to-white font-semibold' : ''}
          `}
          onClick={() => !isParentCategory && toggleCategory(categoryId)}
        >
          <div className="flex items-center">
            {!isParentCategory && (
              <button className="p-1 hover:bg-gray-100 rounded mr-2">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}
            
            <div className="flex items-center">
              <span className={`mr-2 ${isSubcategory ? 'text-base' : 'text-lg'}`}>
                {isUncategorized ? '📂' : ''}
              </span>
              <h3 className={`font-semibold text-gray-900 ${isSubcategory ? 'text-base' : 'text-lg'}`}>
                {isUncategorized ? 'Uncategorized' : group.category!.name}
              </h3>
              {isParentCategory && (
                <span className="ml-2 text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded-full">
                  Category
                </span>
              )}
            </div>
          </div>
          
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {displayCount} {displayCount === 1 ? 'slide' : 'slides'}
          </span>
        </div>

        {/* Slides Grid - только для подкатегорий и uncategorized */}
        {!isParentCategory && isExpanded && slidesToShow.length > 0 && (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
            : "space-y-2"
          }>
            {slidesToShow.map((slide) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                onSlideClick={onSlideClick}
                onAddToPresentation={onAddToPresentation}
                onEditSlide={onEditSlide}
                onToggleFavorite={onToggleFavorite}
                isHovered={hoveredSlide === slide.id}
                onMouseEnter={() => setHoveredSlide(slide.id)}
                onMouseLeave={() => setHoveredSlide(null)}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {slideGroups.map(renderSlideGroup)}
    </div>
  );
} 