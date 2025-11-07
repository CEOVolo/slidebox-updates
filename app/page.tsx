'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Grid, List, Filter, Sparkles, Search, FileText, Import, Shield } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import GroupedSlideGrid from '@/components/GroupedSlideGrid';
import CategoryTree from '@/components/CategoryTree';
import SlideModal from '@/components/SlideModal';
import ImportModal from '@/components/ImportModal';
import SlideEditModal from '@/components/SlideEditModal';
import PresentationPanel from '@/components/PresentationPanel';
import EnhancedSearchBar from '@/components/EnhancedSearchBar';
import MetadataFilter from '@/components/MetadataFilter';
import Header from '@/components/Header';
import { Slide, SearchFilters, getAllCategories, findCategoryById } from '@/lib/types';
import CategoryDropdown from '@/components/CategoryDropdown';
import { sortSearchResults, searchSlides } from '@/lib/searchUtils';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [filteredSlides, setFilteredSlides] = useState<Slide[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [presentationSlides, setPresentationSlides] = useState<Slide[]>([]);
  const [isPresentationPanelOpen, setIsPresentationPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metadataFilters, setMetadataFilters] = useState<any>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [categoryStats, setCategoryStats] = useState<{
    totalSlides: number;
    categoryStats: Record<string, number>;
    uncategorizedCount: number;
  }>({ totalSlides: 0, categoryStats: {}, uncategorizedCount: 0 });
  
  const auth = useAuth();

  // Handle URL search params for tag filtering
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, []);

  // Helper to build query string (без пагинации - загружаем все слайды сразу)
  const buildQuery = () => {
    const params = new URLSearchParams();
    // Убираем пагинацию - загружаем все слайды сразу
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    
    // Обработка специальных запросов Quick Filters
    let processedQuery = searchQuery.trim();
    let favoriteFilter = false;
    let dateFilter: { days?: number } | null = null;
    
    if (processedQuery === 'favorite:true') {
      favoriteFilter = true;
      processedQuery = ''; // Очищаем query для обычного поиска
    } else if (processedQuery.startsWith('recent:')) {
      const daysMatch = processedQuery.match(/recent:(\d+)d/);
      if (daysMatch) {
        dateFilter = { days: parseInt(daysMatch[1]) };
        processedQuery = ''; // Очищаем query для обычного поиска
      }
    } else if (processedQuery.startsWith('category:')) {
      const categoryMatch = processedQuery.match(/category:(.+)/);
      if (categoryMatch) {
        const categoryCode = categoryMatch[1];
        // Найти категорию по коду или имени
        // Пока просто устанавливаем в selectedCategory (будет обработано отдельно)
        params.set('category', categoryCode);
        processedQuery = '';
      }
    }
    
    if (processedQuery) params.set('query', processedQuery);
    if (favoriteFilter) params.set('favorite', 'true');
    if (dateFilter?.days) params.set('days', String(dateFilter.days));
    
    // Добавляем userId для загрузки статуса избранного
    if (auth.user?.id) params.set('userId', auth.user.id);
    return `/api/slides?${params.toString()}`;
  };

  // Загрузка всех слайдов при изменении категории или поиска
  useEffect(() => {
    const loadAllSlides = async () => {
      setLoading(true);
      try {
        const response = await fetch(buildQuery());
        if (response.ok) {
          const data = await response.json();
          // Загружаем все слайды сразу без пагинации
          setSlides(data.slides || []);
          setFilteredSlides(data.slides || []);
        } else {
          setSlides([]);
          setFilteredSlides([]);
        }
      } catch (error) {
        console.error('Error loading slides:', error);
        setSlides([]);
        setFilteredSlides([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllSlides();
    loadCategoryStats();
  }, [selectedCategory, searchQuery]);


  const loadCategoryStats = async () => {
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
      console.error('Error loading category stats:', error);
    }
  };

  // Префетч больше не нужен - загружаем все слайды сразу
  const handleCategoryExpand = async (categoryId: string) => {
    // Пустая функция для совместимости с CategoryTree
  };

  // Filter slides based on metadata filters only (category/search теперь серверные)
  useEffect(() => {
    let filtered = [...slides];
    // искать по тексту и категорию больше не фильтруем локально

    // Apply metadata filters
    if (Object.keys(metadataFilters).length > 0) {
      filtered = filtered.filter(slide => {
        // Tags filter
        if (metadataFilters.tags?.length > 0) {
          const slideTags = slide.tags?.map(t => t.tagId) || [];
          if (!metadataFilters.tags.some((tag: string) => slideTags.includes(tag))) {
            return false;
          }
        }

        // Domain filter
        if (metadataFilters.domains?.length > 0) {
          if (!slide.domain || !metadataFilters.domains.includes(slide.domain)) {
            return false;
          }
        }

        // Solution areas filter
        if (metadataFilters.solutionAreas?.length > 0) {
          const slideAreas = slide.solutionAreas?.map(a => a.solutionAreaId) || [];
          if (!metadataFilters.solutionAreas.some((area: string) => slideAreas.includes(area))) {
            return false;
          }
        }

        // Products filter
        if (metadataFilters.products?.length > 0) {
          const slideProducts = slide.products?.map(p => p.productId) || [];
          if (!metadataFilters.products.some((prod: string) => slideProducts.includes(prod))) {
            return false;
          }
        }

        // Components filter
        if (metadataFilters.components?.length > 0) {
          const slideComponents = slide.components?.map(c => c.componentId) || [];
          if (!metadataFilters.components.some((comp: string) => slideComponents.includes(comp))) {
            return false;
          }
        }

        // Integrations filter
        if (metadataFilters.integrations?.length > 0) {
          const slideIntegrations = slide.integrations?.map(i => i.integrationId) || [];
          if (!metadataFilters.integrations.some((int: string) => slideIntegrations.includes(int))) {
            return false;
          }
        }

        // Confidentiality filter
        if (metadataFilters.confidentiality?.length > 0) {
          const slideConfidentiality = (slide as any).SlideConfidentiality?.map((c: any) => c.confidentialityId) || [];
          if (!metadataFilters.confidentiality.some((level: string) => slideConfidentiality.includes(level))) {
            return false;
          }
        }

        // Status filter
        if (metadataFilters.statuses?.length > 0) {
          if (!slide.status || !metadataFilters.statuses.includes(slide.status)) {
            return false;
          }
        }

        // Format filter
        if (metadataFilters.formats?.length > 0) {
          if (!slide.format || !metadataFilters.formats.includes(slide.format)) {
            return false;
          }
        }

        // Language filter
        if (metadataFilters.languages?.length > 0) {
          if (!slide.language || !metadataFilters.languages.includes(slide.language)) {
            return false;
          }
        }

        // Region filter
        if (metadataFilters.regions?.length > 0) {
          if (!slide.region || !metadataFilters.regions.includes(slide.region)) {
            return false;
          }
        }

        return true;
      });
    }

    setFilteredSlides(filtered);
  }, [slides, searchQuery, selectedCategory, metadataFilters]);

  const handleCategorySelect = (categoryId: string) => {
    // При выборе категории сбрасываем поиск, чтобы избежать конфликтов
    if (searchQuery && searchQuery.trim()) {
      setSearchQuery('');
    }
    setSelectedCategory(categoryId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleMetadataFilterChange = (filters: any) => {
    setMetadataFilters(filters);
  };

  const handleSlideClick = (slide: Slide) => {
    setSelectedSlide(slide);
    setIsSlideModalOpen(true);
  };

  const handleNavigateToSlide = (slide: Slide) => {
    setSelectedSlide(slide);
  };

  const handleAddToPresentation = (slide: Slide) => {
    if (!presentationSlides.find(s => s.id === slide.id)) {
      setPresentationSlides(prev => [...prev, slide]);
      setIsPresentationPanelOpen(true);
    }
  };

  const handleRemoveFromPresentation = (slideId: string) => {
    setPresentationSlides(prev => prev.filter(s => s.id !== slideId));
  };

  const handleReorderSlides = (newSlides: Slide[]) => {
    setPresentationSlides(newSlides);
  };

  const handleEditSlide = (slide: Slide) => {
    setEditingSlide(slide);
    setIsEditModalOpen(true);
  };

  const handleSaveSlide = async (slideData: Partial<Slide>) => {
    if (!editingSlide) return;

    try {
      // Подготавливаем данные для отправки, конвертируя undefined в null
      const updateData: any = {};
      
      // Только измененные поля
      if (slideData.title !== undefined) updateData.title = slideData.title;
      if (slideData.description !== undefined) updateData.description = slideData.description;
      if (slideData.status !== undefined) updateData.status = slideData.status || null;
      if (slideData.format !== undefined) updateData.format = slideData.format || null;
      if (slideData.language !== undefined) updateData.language = slideData.language || null;
      if (slideData.region !== undefined) updateData.region = slideData.region || null;
      if (slideData.domain !== undefined) updateData.domain = slideData.domain || null;
      if (slideData.authorName !== undefined) updateData.authorName = slideData.authorName || null;
      if (slideData.department !== undefined) updateData.department = slideData.department || null;
      if (slideData.isCaseStudy !== undefined) updateData.isCaseStudy = slideData.isCaseStudy;
      if (slideData.yearStart !== undefined) updateData.yearStart = slideData.yearStart || null;
      if (slideData.yearFinish !== undefined) updateData.yearFinish = slideData.yearFinish || null;
      
      // Связанные данные
      if ((slideData as any).productCodes !== undefined) updateData.productCodes = (slideData as any).productCodes;
      if ((slideData as any).confidentialityCodes !== undefined) updateData.confidentialityCodes = (slideData as any).confidentialityCodes;
      if ((slideData as any).componentCodes !== undefined) updateData.componentCodes = (slideData as any).componentCodes;
      if ((slideData as any).integrationCodes !== undefined) updateData.integrationCodes = (slideData as any).integrationCodes;
      if ((slideData as any).solutionAreaCodes !== undefined) updateData.solutionAreaCodes = (slideData as any).solutionAreaCodes;
      if ((slideData as any).categoryIds !== undefined) updateData.categoryIds = (slideData as any).categoryIds;
      if (slideData.tags !== undefined) updateData.tags = slideData.tags;

      console.log('📤 Отправляем обновления:', updateData);

      const response = await fetch(`/api/slides/${editingSlide.id}`, {
        method: 'PATCH', // Используем PATCH как в модерации
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Успешно обновлено:', responseData);

        // Заменяем элемент полностью свежим responseData
        setSlides(prev => prev.map(s => (s.id === editingSlide.id ? responseData : s)));

        // Обновляем текущее редактируемое состояние полным ответом
        setEditingSlide(responseData);

        // Обновляем статистику категорий, т.к. связи могли измениться
        loadCategoryStats();

        // Не закрываем модальное окно, чтобы пользователь мог видеть результат
      } else {
        const errorData = await response.json();
        console.error('❌ Ошибка сохранения:', errorData);
        alert('Ошибка при сохранении слайда. Проверьте консоль для деталей.');
      }
    } catch (error) {
      console.error('Error updating slide:', error);
      alert('Произошла ошибка при сохранении. Проверьте консоль.');
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    try {
      const response = await fetch(`/api/slides/${slideId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSlides(prev => prev.filter(s => s.id !== slideId));
        setPresentationSlides(prev => prev.filter(s => s.id !== slideId));
        setIsEditModalOpen(false);
        setEditingSlide(null);
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
    }
  };

  const handleToggleFavorite = async (slide: Slide) => {
    if (!auth.user?.id) {
      alert('Please log in to add slides to favorites');
      return;
    }

    try {
      const isCurrentlyFavorite = slide.isFavorite;
      const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/slides/${slide.id}/favorite`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: auth.user.id,
          userEmail: auth.user.email, // Передаем email для создания пользователя если нужно
          userName: auth.user.name,
          userRole: auth.user.role
        }),
      });

      if (response.ok) {
        // Обновляем статус избранного в локальном состоянии
        setSlides(prev => prev.map(s => 
          s.id === slide.id ? { ...s, isFavorite: !isCurrentlyFavorite } : s
        ));
        setFilteredSlides(prev => prev.map(s => 
          s.id === slide.id ? { ...s, isFavorite: !isCurrentlyFavorite } : s
        ));
      } else {
        const errorData = await response.json();
        console.error('Error toggling favorite:', errorData);
        alert('Failed to update favorite status');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('An error occurred while updating favorite status');
    }
  };

  // Check if user is authenticated
  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-purple-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">SlideBox by Andersen</h1>
          <p className="text-purple-200 mb-8 max-w-md">
            Slide management system with Figma integration. 
            Sign in to access functionality.
          </p>
          <Header
            onImportClick={() => setIsImportModalOpen(true)}
            onSearchFocus={() => {}}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* New Header Component */}
      <Header
        onImportClick={() => setIsImportModalOpen(true)}
        onSearchFocus={() => {
          // Focus on search bar
          searchInputRef.current?.focus();
        }}
      />

      {/* Toolbar with Search and Controls */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Enhanced Search Bar */}
            <div className="flex-1 max-w-2xl mr-8">
              <EnhancedSearchBar
                value={searchQuery}
                onChange={handleSearch}
                resultsCount={filteredSlides.length}
                totalCount={slides.length}
                placeholder="Search slides, text, categories..."
                inputRef={searchInputRef}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              {/* Metadata Filter */}
              <MetadataFilter
                onFilterChange={handleMetadataFilterChange}
                currentFilters={metadataFilters}
              />

              {/* Quick Filters */}
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={() => handleSearch('favorite:true')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    searchQuery === 'favorite:true'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  ⭐ Favorites
                </button>
                <button
                  onClick={() => handleSearch('recent:7d')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    searchQuery === 'recent:7d'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  🕒 Recent
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                    viewMode === 'list'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
              <CategoryTree
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                onCategoryExpand={handleCategoryExpand}
                categoryStats={categoryStats}
                filteredSlides={filteredSlides}
                searchQuery={searchQuery}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading slides...</span>
              </div>
            ) : filteredSlides.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery || Object.keys(metadataFilters).length > 0 ? 'No slides found' : 'No slides available'}
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery || Object.keys(metadataFilters).length > 0
                      ? 'Try adjusting your search terms or clear filters' 
                      : 'Import slides from Figma to get started'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <GroupedSlideGrid
                slides={filteredSlides}
                viewMode={viewMode}
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
                onSlideClick={handleSlideClick}
                onAddToPresentation={handleAddToPresentation}
                onEditSlide={auth.canEditSlides ? handleEditSlide : undefined}
                onToggleFavorite={auth.canFavoriteSlides ? handleToggleFavorite : undefined}
              />
            )}
            {/* Кнопка Load More больше не нужна - загружаем все слайды сразу */}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SlideModal
        slide={selectedSlide}
        isOpen={isSlideModalOpen}
        onClose={() => setIsSlideModalOpen(false)}
        onAddToPresentation={handleAddToPresentation}
        searchQuery={searchQuery}
        searchResults={filteredSlides}
        onNavigateToSlide={handleNavigateToSlide}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <SlideEditModal
        slide={editingSlide}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveSlide}
        onDelete={handleDeleteSlide}
      />

      {/* Presentation Panel */}
      <PresentationPanel
        slides={presentationSlides}
        isOpen={isPresentationPanelOpen}
        onClose={() => setIsPresentationPanelOpen(false)}
        onRemoveSlide={handleRemoveFromPresentation}
        onReorderSlides={handleReorderSlides}
        onExport={() => {}}
        onSlidePreview={handleSlideClick}
      />
    </div>
  );
} 