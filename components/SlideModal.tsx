'use client';

import { X, ExternalLink, Plus, Heart, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Slide } from '@/lib/types';
import { useMetadata } from '@/contexts/MetadataContext';
import { highlightSearchTerm, highlightSearchTermWithContext } from '@/lib/searchUtils';

interface SlideModalProps {
  slide: Slide | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToPresentation: (slide: Slide) => void;
  searchQuery?: string;
  searchResults?: Slide[];
  onNavigateToSlide?: (slide: Slide) => void;
}

export default function SlideModal({
  slide,
  isOpen,
  onClose,
  onAddToPresentation,
  searchQuery,
  searchResults = [],
  onNavigateToSlide
}: SlideModalProps) {
  if (!isOpen || !slide) return null;

  const { metadata } = useMetadata();
  const categories = metadata?.categories || [];
  
  // Find category by ID
  const findCategoryById = (categoryId: string): any | null => {
    for (const cat of categories) {
      if (cat.id === categoryId) return cat;
      if (cat.children) {
        for (const child of cat.children) {
          if (child.id === categoryId) return child;
        }
      }
    }
    return null;
  };
  
  // Get slide categories from many-to-many relationship
  const slideCategories = slide.categories?.map((catRel: any) => 
    findCategoryById(catRel.categoryId)
  ).filter(Boolean) || [];
  
  // Helper function to get metadata names
  const getDomainName = (code: string) => {
    if (!metadata?.domains) return code;
    const domain = metadata.domains.find((d: any) => d.code === code);
    return domain?.name || code;
  };
  
  const getSolutionAreaName = (id: string) => {
    if (!metadata?.solutionAreas) return id;
    const area = metadata.solutionAreas.find((a: any) => a.id === id);
    return area?.name || id;
  };
  
  const getProductName = (id: string) => {
    if (!metadata?.products) return id;
    const product = metadata.products.find((p: any) => p.id === id);
    return product?.name || id;
  };
  
  const getComponentName = (id: string) => {
    if (!metadata?.components) return id;
    const component = metadata.components.find((c: any) => c.id === id);
    return component?.name || id;
  };
  
  const getIntegrationName = (id: string) => {
    if (!metadata?.integrations) return id;
    const integration = metadata.integrations.find((i: any) => i.id === id);
    return integration?.name || id;
  };
  
  const getStatusName = (code: string) => {
    if (!metadata?.statuses) return code;
    const status = metadata.statuses.find((s: any) => s.code === code);
    return status?.name || code;
  };
  
  const getFormatName = (code: string) => {
    if (!metadata?.formats) return code;
    const format = metadata.formats.find((f: any) => f.code === code);
    return format?.name || code;
  };
  
  const getLanguageName = (code: string) => {
    if (!metadata?.languages) return code;
    const language = metadata.languages.find((l: any) => l.code === code);
    return language?.name || code;
  };
  
  const getRegionName = (code: string) => {
    if (!metadata?.regions) return code;
    const region = metadata.regions.find((r: any) => r.code === code);
    return region?.name || code;
  };

  // Find current slide index in search results
  const currentIndex = searchResults.findIndex(s => s.id === slide.id);
  const hasSearchResults = searchResults.length > 1;
  const hasPrevious = hasSearchResults && currentIndex > 0;
  const hasNext = hasSearchResults && currentIndex < searchResults.length - 1;

  const handlePrevious = () => {
    if (hasPrevious && onNavigateToSlide) {
      onNavigateToSlide(searchResults[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigateToSlide) {
      onNavigateToSlide(searchResults[currentIndex + 1]);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && hasPrevious) {
      handlePrevious();
    } else if (e.key === 'ArrowRight' && hasNext) {
      handleNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Determine aspect ratio based on slide dimensions
  let aspectRatioClass = 'aspect-[16/9]'; // Default horizontal
  
  if (slide.width && slide.height) {
    const ratio = slide.width / slide.height;
    if (ratio < 0.9) {
      // Vertical slides (A4, portrait)
      aspectRatioClass = 'aspect-[3/4]';
    } else if (ratio > 1.6) {
      // Wide horizontal slides (16:9, 16:10)
      aspectRatioClass = 'aspect-[16/9]';
    } else {
      // Square or nearly square slides (4:3)
      aspectRatioClass = 'aspect-[4/3]';
    }
  }

  const openInFigma = () => {
    if (slide.figmaUrl) {
      window.open(slide.figmaUrl, '_blank');
    } else if (slide.figmaFileId && slide.figmaNodeId) {
      // Fallback to constructing Figma URL
      const figmaUrl = `https://www.figma.com/file/${slide.figmaFileId}?node-id=${slide.figmaNodeId}`;
      window.open(figmaUrl, '_blank');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Close button - outside modal */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 text-gray-700 transition-all"
        title="Close (Escape)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation arrows - outside modal */}
      {hasSearchResults && (
        <>
          {/* Previous button */}
          <button
            onClick={handlePrevious}
            disabled={!hasPrevious}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full shadow-lg transition-all ${
              hasPrevious 
                ? 'bg-white hover:bg-gray-50 text-gray-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Previous slide (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={!hasNext}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full shadow-lg transition-all ${
              hasNext 
                ? 'bg-white hover:bg-gray-50 text-gray-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Next slide (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 
              className="text-xl font-semibold text-gray-900"
              dangerouslySetInnerHTML={{
                __html: highlightSearchTerm(slide.title, searchQuery || '')
              }}
            />
            {(slide.figmaFileId || slide.figmaUrl) && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                <FileText className="w-4 h-4" />
                <span>Figma</span>
              </div>
            )}
            {hasSearchResults && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                <span>{currentIndex + 1} of {searchResults.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Slide Preview */}
            <div>
              <div className={`bg-gray-100 rounded-lg overflow-hidden border ${aspectRatioClass}`}>
                <img
                  src={slide.figmaFileId && slide.figmaNodeId
                    ? `/api/figma/image-proxy?fileId=${slide.figmaFileId}&nodeId=${slide.figmaNodeId}`
                    : slide.imageUrl || `https://via.placeholder.com/600x450/6366f1/ffffff?text=${encodeURIComponent(slide.title)}`
                  }
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/600x450/6366f1/ffffff?text=${encodeURIComponent(slide.title)}`;
                  }}
                />
              </div>
              
              {/* Search highlight preview - показываем найденный текст */}
              {searchQuery && searchQuery.trim() && slide.extractedText && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <span>🔍</span>
                    Found text in slide:
                  </h4>
                  <p 
                    className="text-sm text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTermWithContext(slide.extractedText, searchQuery, 200)
                    }}
                  />
                </div>
              )}
              
              {/* Slide dimensions info */}
              {slide.width && slide.height && (
                <div className="mt-3 text-sm text-gray-600 text-center">
                  Dimensions: {slide.width} × {slide.height} px
                </div>
              )}
            </div>

            {/* Slide Details */}
            <div className="space-y-6">
              {/* Title and Description */}
              <div>
                <h3 
                  className="text-lg font-semibold text-gray-900 mb-2"
                  dangerouslySetInnerHTML={{
                    __html: highlightSearchTerm(slide.title, searchQuery || '')
                  }}
                />
                {slide.description && (
                  <p 
                    className="text-gray-600"
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTerm(slide.description, searchQuery || '')
                    }}
                  />
                )}
              </div>

              {/* Category */}
              {slideCategories.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {slideCategories.map((category) => (
                      <span
                        key={category.id}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {slide.tags && slide.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {slide.tags.map((slideTag) => (
                      <span
                        key={slideTag.id}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Filter by tag
                          window.location.href = `/?search=tag:${encodeURIComponent(slideTag.tag.name)}`;
                        }}
                        dangerouslySetInnerHTML={{
                          __html: highlightSearchTerm(slideTag.tag.name, searchQuery || '')
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Metadata */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Metadata</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Basic info */}
                  <div>
                    <span className="text-gray-500">Views:</span>
                    <span className="ml-2 text-gray-900">{slide.viewCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Uses:</span>
                    <span className="ml-2 text-gray-900">{slide.useCount}</span>
                  </div>
                  
                  {/* Domain */}
                  {slide.domain && (
                    <div>
                      <span className="text-gray-500">Domain:</span>
                      <span className="ml-2 text-gray-900">{getDomainName(slide.domain)}</span>
                    </div>
                  )}
                  
                  {/* Solution Areas */}
                  {slide.solutionAreas && slide.solutionAreas.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Solution Areas:</span>
                      <div className="inline-flex flex-wrap gap-1 ml-2">
                        {slide.solutionAreas.map((area) => (
                          <span key={area.id} className="text-gray-900">
                            {getSolutionAreaName(area.solutionAreaId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Products */}
                  {slide.products && slide.products.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Products:</span>
                      <div className="inline-flex flex-wrap gap-1 ml-2">
                        {slide.products.map((prod) => (
                          <span key={prod.id} className="text-gray-900">
                            {getProductName(prod.productId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Components */}
                  {slide.components && slide.components.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Components:</span>
                      <div className="inline-flex flex-wrap gap-1 ml-2">
                        {slide.components.map((comp) => (
                          <span key={comp.id} className="text-gray-900">
                            {getComponentName(comp.componentId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Integrations */}
                  {slide.integrations && slide.integrations.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Integrations:</span>
                      <div className="inline-flex flex-wrap gap-1 ml-2">
                        {slide.integrations.map((int) => (
                          <span key={int.id} className="text-gray-900">
                            {getIntegrationName(int.integrationId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Status, Format, Language, Region */}
                  {slide.status && (
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2 text-gray-900">{getStatusName(slide.status)}</span>
                    </div>
                  )}
                  
                  {slide.format && (
                    <div>
                      <span className="text-gray-500">Format:</span>
                      <span className="ml-2 text-gray-900">{getFormatName(slide.format)}</span>
                    </div>
                  )}
                  
                  {slide.language && (
                    <div>
                      <span className="text-gray-500">Language:</span>
                      <span className="ml-2 text-gray-900">{getLanguageName(slide.language)}</span>
                    </div>
                  )}
                  
                  {slide.region && (
                    <div>
                      <span className="text-gray-500">Region:</span>
                      <span className="ml-2 text-gray-900">{getRegionName(slide.region)}</span>
                    </div>
                  )}
                  
                  {/* Dates */}
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(slide.createdAt).toLocaleDateString('en-US')}
                    </span>
                  </div>
                  
                  {slide.updatedAt && (
                    <div>
                      <span className="text-gray-500">Updated:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(slide.updatedAt).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  )}
                  
                  {/* Figma info */}
                  {slide.figmaFileName && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Figma file:</span>
                      <span className="ml-2 text-gray-900">{slide.figmaFileName}</span>
                    </div>
                  )}
                  
                  {/* Author */}
                  {slide.authorName && (
                    <div>
                      <span className="text-gray-500">Author:</span>
                      <span className="ml-2 text-gray-900">{slide.authorName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={() => onAddToPresentation(slide)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to presentation
                </button>
                
                {(slide.figmaFileId || slide.figmaUrl) && (
                  <button
                    onClick={openInFigma}
                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Open in Figma
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}