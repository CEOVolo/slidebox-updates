'use client';

import { Heart, Plus, Edit, ExternalLink, FileText, Folder } from 'lucide-react';
import { Slide } from '@/lib/types';
import { useMetadata } from '@/contexts/MetadataContext';
import { highlightSearchTerm, highlightSearchTermWithContext } from '@/lib/searchUtils';
import { useState } from 'react';

interface SlideCardProps {
  slide: Slide;
  onSlideClick: (slide: Slide) => void;
  onAddToPresentation: (slide: Slide) => void;
  onEditSlide?: (slide: Slide) => void;
  onToggleFavorite?: (slide: Slide) => void;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  searchQuery?: string;
}

export default function SlideCard({
  slide,
  onSlideClick,
  onAddToPresentation,
  onEditSlide,
  onToggleFavorite,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  searchQuery
}: SlideCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  const [isThumbLoaded, setIsThumbLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(slide.isFavorite || false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const imageUrl = slide.imageUrl;
  
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
  
  // Restore aspectRatioClass logic
  let aspectRatioClass = 'aspect-[16/9]'; // Default horizontal
  if (slide.width && slide.height) {
    const ratio = slide.width / slide.height;
    if (ratio < 0.9) {
      aspectRatioClass = 'aspect-[3/4]';
    } else if (ratio > 1.6) {
      aspectRatioClass = 'aspect-[16/9]';
    } else {
      aspectRatioClass = 'aspect-[4/3]';
    }
  }

  // Restore openInFigma logic
  const openInFigma = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (slide.figmaUrl) {
      window.open(slide.figmaUrl, '_blank');
    } else if (slide.figmaFileId && slide.figmaNodeId) {
      const figmaUrl = `https://www.figma.com/file/${slide.figmaFileId}?node-id=${slide.figmaNodeId}`;
      window.open(figmaUrl, '_blank');
    }
  };

  const getDomainName = () => {
    if (!slide.domain || !metadata?.domains) return null;
    const domain = metadata.domains.find((d: any) => d.code === slide.domain);
    return domain?.name;
  };

  const getSolutionAreaName = () => {
    if (!slide.solutionAreas || slide.solutionAreas.length === 0 || !metadata?.solutionAreas) return null;
    const firstArea = slide.solutionAreas[0];
    if (!firstArea) return null;
    const area = metadata.solutionAreas.find((a: any) => a.id === firstArea.solutionAreaId);
    return area?.name;
  };

  const formatMetadataValue = (value: any) => {
    if (!value || !metadata) return null;
    
    // Проверяем форматы
    if (metadata.formats) {
      const format = metadata.formats.find((f: any) => f.code === value);
      if (format) return format.name;
    }
    
    // Проверяем языки
    if (metadata.languages) {
      const language = metadata.languages.find((l: any) => l.code === value);
      if (language) return language.name;
    }
    
    // Проверяем регионы
    if (metadata.regions) {
      const region = metadata.regions.find((r: any) => r.code === value);
      if (region) return region.name;
    }
    
    // Проверяем статусы
    if (metadata.statuses) {
      const status = metadata.statuses.find((s: any) => s.code === value);
      if (status) return status.name;
    }
    
    return value;
  };

  return (
    <div
      className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-yellow-300 transition-all duration-200"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Slide preview - Adaptive aspect ratio based on slide dimensions */}
      <div 
        className={`relative bg-gray-50 overflow-hidden cursor-pointer ${aspectRatioClass}`}
        onClick={() => onSlideClick(slide)}
      >
        {/* LQIP/thumbnail: сначала используем сохранённый preview (imageUrl), иначе Figma proxy */}
        <img
          src={(() => {
            if (slide.thumbUrl) return slide.thumbUrl;
            if (slide.imageUrl) return slide.imageUrl;
            if (slide.figmaFileId && slide.figmaNodeId) {
              return `/api/figma/image-proxy?fileId=${slide.figmaFileId}&nodeId=${slide.figmaNodeId}&scale=0.3&format=jpg`;
            }
            const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-family='Arial, Helvetica, sans-serif' font-size='20'>Slide</text></svg>";
            return `data:image/svg+xml,${encodeURIComponent(svg)}`;
          })()}
          alt={slide.title}
          className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 ${isThumbLoaded ? 'blur-0' : 'blur-sm'}`}
          loading="lazy"
          onLoad={() => setIsThumbLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-family='Arial, Helvetica, sans-serif' font-size='20'>Slide</text></svg>";
            target.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
          }}
        />

        {/* High-res в гриде не грузим, чтобы избежать 403 и лишних запросов */}

        {/* Overlay with actions */}
        <div className={`
          absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center gap-3
          transition-opacity duration-200 pointer-events-none
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToPresentation(slide);
            }}
            className="p-2.5 bg-yellow-400 rounded-full hover:bg-yellow-500 transition-all shadow-sm pointer-events-auto"
            title="Add to presentation"
          >
            <Plus className="w-4 h-4 text-gray-800" />
          </button>
          
          {(slide.figmaFileId || slide.figmaUrl) && (
            <button
              onClick={openInFigma}
              className="p-2.5 bg-purple-500 rounded-full hover:bg-purple-600 transition-all shadow-sm pointer-events-auto"
              title="Open in Figma"
            >
              <FileText className="w-4 h-4 text-white" />
            </button>
          )}
          
          {onEditSlide && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditSlide(slide);
            }}
            className="p-2.5 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all shadow-sm pointer-events-auto"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-gray-700" />
          </button>
          )}
        </div>
        
        {/* Favorite button */}
        {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(slide);
          }}
          className={`
            absolute top-3 right-3 p-1.5 rounded-full transition-all shadow-sm
            ${slide.isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white bg-opacity-90 text-gray-600 hover:bg-opacity-100'
            }
          `}
          title={slide.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className="w-4 h-4" fill={slide.isFavorite ? 'currentColor' : 'none'} />
        </button>
        )}
      </div>
      
      {/* Slide information */}
      <div className="p-4">
        <h3 
          className="font-medium text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
          onClick={() => onSlideClick(slide)}
          dangerouslySetInnerHTML={{
            __html: highlightSearchTerm(slide.title, searchQuery || '')
          }}
        />
        
        {slide.description && (
          <p 
            className="text-sm text-gray-600 mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: highlightSearchTerm(slide.description, searchQuery || '')
            }}
          />
        )}
        
        {/* Search context - show found text when searching */}
        {searchQuery && searchQuery.trim() && slide.extractedText && !searchQuery.includes(':') && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <div className="flex items-center gap-1 mb-1 text-yellow-800">
              <span>🔍</span>
              <span className="font-medium">Found:</span>
            </div>
            <p 
              className="text-gray-700 line-clamp-2"
              dangerouslySetInnerHTML={{
                __html: highlightSearchTermWithContext(slide.extractedText, searchQuery, 80)
              }}
            />
          </div>
        )}
        
        {/* Tags */}
        {slide.tags && slide.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {slide.tags.slice(0, 3).map((slideTag) => (
              <span
                key={slideTag.id}
                className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded hover:bg-gray-200 cursor-pointer transition-colors"
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
            {slide.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                +{slide.tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center">
            <Folder className="w-3 h-3 mr-1" />
            {(() => {
              // Проверяем наличие категорий более тщательно
              const slideCategories = (slide as any).SlideCategory || slide.categories || [];
              const hasCategories = Array.isArray(slideCategories) && slideCategories.length > 0;
              
              if (hasCategories) {
                const categoryNames = slideCategories
                  .map((catRel: any) => catRel.Category?.name || catRel.category?.name)
                  .filter((name: string) => name && name !== 'Uncategorized');
                
                if (categoryNames.length > 0) {
                  return categoryNames.map((name: string, index: number) => (
                    <span key={index}>
                      {name}
                      {index !== categoryNames.length - 1 && ' • '}
                    </span>
                  ));
                }
              }
              return 'Uncategorized';
            })()}
          </span>
          {slide.authorName && (
            <span>• {slide.authorName}</span>
          )}
          {getDomainName() && (
            <span className="text-blue-600">• {getDomainName()}</span>
          )}
          {getSolutionAreaName() && (
            <span className="text-green-600">• {getSolutionAreaName()}</span>
          )}
          {slide.format && (
            <span>• {formatMetadataValue(slide.format)}</span>
          )}
          {slide.language && (
            <span>• {formatMetadataValue(slide.language)}</span>
          )}
          {slide.status && slide.status !== 'draft' && (
            <span className="text-orange-600">• {formatMetadataValue(slide.status)}</span>
          )}
        </div>
      </div>
    </div>
  );
} 