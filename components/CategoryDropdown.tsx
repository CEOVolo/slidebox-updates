'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useMetadata } from '@/contexts/MetadataContext';
import { Autocomplete } from '@/components/ui/autocomplete';

interface CategoryDropdownProps {
  selectedCategory?: string;
  onCategorySelect: (categoryId: string) => void;
  categoryStats?: Record<string, number>;
  uncategorizedCount?: number;
  filteredSlides?: any[]; // Отфильтрованные слайды
  searchQuery?: string; // Поисковый запрос
  enableSearch?: boolean; // Включить поиск
  placeholder?: string;
  className?: string;
}

// Функция для создания плоского списка категорий для поиска
function flattenCategories(categories: any[]): Array<{value: string, label: string}> {
  const result: Array<{value: string, label: string}> = [];
  
  function traverse(nodes: any[], prefix = '') {
    nodes.forEach(node => {
      result.push({
        value: node.id,
        label: `${prefix}${node.name}`
      });
      
      if (node.children && node.children.length > 0) {
        traverse(node.children, `${prefix}  `); // Добавляем отступ для подкатегорий
      }
    });
  }
  
  traverse(categories);
  return result;
}

export default function CategoryDropdown({ 
  selectedCategory, 
  onCategorySelect,
  categoryStats = {},
  uncategorizedCount,
  filteredSlides = [],
  searchQuery = '',
  enableSearch = false,
  placeholder = "Select category",
  className = ''
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { metadata } = useMetadata();
  const categories = metadata?.categories || [];

  // Закрываем выпадающий список при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Если включен поиск, используем Autocomplete
  if (enableSearch) {
    const categoryOptions = flattenCategories(categories);
    
    return (
      <div className={className}>
        <Autocomplete
          options={categoryOptions}
          value={selectedCategory}
          onValueChange={onCategorySelect}
          placeholder={placeholder}
          searchPlaceholder="Search categories..."
          emptyText="No categories found"
          className="w-full"
        />
      </div>
    );
  }

  // Вычисляем статистику категорий из отфильтрованных слайдов
  const getFilteredCategoryStats = () => {
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
    // Если нет поискового запроса, показываем все категории с обычной статистикой
    if (!searchQuery.trim()) {
      return categories;
    }
    
    // При поиске показываем только категории с результатами
    const filteredStats = getFilteredCategoryStats();
    
    function filterCategories(nodes: any[]): any[] {
      return nodes.filter(node => {
        // Проверяем есть ли слайды в этой категории
        const hasSlides = filteredStats[node.id] > 0;
        
        // Проверяем есть ли слайды в подкатегориях
        let hasChildSlides = false;
        if (node.children) {
          hasChildSlides = node.children.some((child: any) => filteredStats[child.id] > 0);
        }
        
        return hasSlides || hasChildSlides;
      }).map(node => ({
        ...node,
        children: node.children ? filterCategories(node.children) : []
      }));
    }
    
    return filterCategories(categories);
  };

  const getCategoryCount = (categoryId: string): number => {
    // При поиске используем статистику отфильтрованных слайдов
    if (searchQuery.trim()) {
      const filteredStats = getFilteredCategoryStats();
      const count = filteredStats[categoryId] || 0;
      return isNaN(count) ? 0 : count;
    }
    // Иначе используем обычную статистику
    const count = categoryStats[categoryId] || 0;
    return isNaN(count) ? 0 : count;
  };

  const getParentCategoryCount = (node: any): number => {
    if (!node.children) {
      const count = getCategoryCount(node.id);
      return isNaN(count) ? 0 : count;
    }
    
    let total = getCategoryCount(node.id);
    node.children.forEach((child: any) => {
      total += getParentCategoryCount(child);
    });
    return isNaN(total) ? 0 : total;
  };

  const getCurrentCategory = (): any | null => {
    if (!selectedCategory || selectedCategory === 'all') return null;
    if (selectedCategory === 'uncategorized') return null;
    
    // Функция поиска категории по ID
    const findById = (cats: any[]): any | null => {
      for (const cat of cats) {
        if (cat.id === selectedCategory) return cat;
        if (cat.children) {
          const found = findById(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findById(categories);
  };

  const getParentCategory = (categoryId: string): any | null => {
    for (const category of categories) {
      if (category.id === categoryId) return category;
      if (category.children) {
        for (const child of category.children) {
          if (child.id === categoryId) return category;
        }
      }
    }
    return null;
  };

  const currentCategory = getCurrentCategory();
  const parentCategory = currentCategory ? getParentCategory(currentCategory.id) : null;
  const displayCategory = parentCategory || currentCategory;

  const handleCategorySelect = (categoryId: string) => {
    onCategorySelect(categoryId);
    setIsOpen(false);
  };

  const renderCategoryOption = (node: any, isChild: boolean = false) => {
    const slideCount = isChild ? getCategoryCount(node.id) : getParentCategoryCount(node);
    const isSelected = selectedCategory === node.id;

    return (
      <div
        key={node.id}
        className={`
          px-4 py-2 cursor-pointer transition-colors flex items-center justify-between
          ${isSelected ? 'bg-yellow-100 text-gray-800' : 'hover:bg-gray-50 text-gray-700'}
          ${isChild ? 'pl-8 text-sm' : 'font-medium'}
        `}
        onClick={() => handleCategorySelect(node.id)}
      >
        <div className="flex items-center">
          <span>{node.name}</span>
        </div>
        {slideCount > 0 && (
          <span className="text-xs text-gray-500 ml-2">{slideCount}</span>
        )}
      </div>
    );
  };

  if (!displayCategory) {
    return (
      <div className={className} ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 bg-white rounded-md border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center justify-between text-left"
          >
            <span className="text-gray-500">{placeholder}</span>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
              {/* Search input */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                {getAvailableCategories()
                  .filter(category => 
                    !searchTerm || 
                    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    category.children?.some((child: any) => 
                      child.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                  )
                  .map(category => (
                    <div key={category.id}>
                      {renderCategoryOption(category)}
                      {category.children?.filter((child: any) => 
                        !searchTerm || 
                        child.name.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((child: any) => renderCategoryOption(child, true))}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className} ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 bg-white rounded-md border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center justify-between text-left"
        >
          <div className="flex items-center">
            <span className="text-gray-900 truncate">
              {displayCategory.name}
              {currentCategory && parentCategory && currentCategory.id !== displayCategory.id && (
                <span className="text-gray-500 font-normal"> (in {parentCategory.name})</span>
              )}
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* All Categories option */}
            <div
              className={`
                px-4 py-2 cursor-pointer transition-colors flex items-center justify-between
                ${selectedCategory === 'all' || !selectedCategory ? 'bg-yellow-100 text-gray-800' : 'hover:bg-gray-50 text-gray-700'}
                font-medium
              `}
              onClick={() => handleCategorySelect('all')}
            >
              <div className="flex items-center">
                <span className="mr-2">📋</span>
                <span>All Categories</span>
              </div>
                <span className="text-xs text-gray-500 ml-2">
                  {(() => {
                    const total = Object.values(categoryStats).reduce((a, b) => {
                      const aVal = isNaN(a) ? 0 : a;
                      const bVal = isNaN(b) ? 0 : b;
                      return aVal + bVal;
                    }, 0);
                    return isNaN(total) ? 0 : total;
                  })()}
                </span>
            </div>

            {/* Uncategorized option */}
            {uncategorizedCount && uncategorizedCount > 0 && (
              <div
                className={`
                  px-4 py-2 cursor-pointer transition-colors flex items-center justify-between
                  ${selectedCategory === 'uncategorized' ? 'bg-yellow-100 text-gray-800' : 'hover:bg-gray-50 text-gray-700'}
                  font-medium
                `}
                onClick={() => handleCategorySelect('uncategorized')}
              >
                <div className="flex items-center">
                  <span className="mr-2">📂</span>
                  <span>Uncategorized</span>
                </div>
                <span className="text-xs text-gray-500 ml-2">{uncategorizedCount}</span>
              </div>
            )}

            {/* Categories */}
            <div className="border-t border-gray-200">
              {getAvailableCategories()
                .filter(category => 
                  !searchTerm || 
                  category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  category.children?.some((child: any) => 
                    child.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                )
                .map(category => (
                  <div key={category.id}>
                    {renderCategoryOption(category)}
                    {category.children?.filter((child: any) => 
                      !searchTerm || 
                      child.name.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((child: any) => renderCategoryOption(child, true))}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 