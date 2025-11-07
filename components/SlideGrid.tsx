'use client';

import { useState } from 'react';
import { Eye, Heart, Plus, Edit, ExternalLink } from 'lucide-react';
import { Slide } from '@/lib/types';
import SlideCard from './SlideCard';

interface SlideGridProps {
  slides: Slide[];
  viewMode: 'grid' | 'list';
  onSlideClick: (slide: Slide) => void;
  onAddToPresentation: (slide: Slide) => void;
  onEditSlide: (slide: Slide) => void;
  onToggleFavorite: (slide: Slide) => void;
}

export default function SlideGrid({
  slides,
  viewMode,
  onSlideClick,
  onAddToPresentation,
  onEditSlide,
  onToggleFavorite
}: SlideGridProps) {
  const [hoveredSlide, setHoveredSlide] = useState<string | null>(null);

  if (slides.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No slides found</h3>
        <p className="text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSlideClick(slide)}
            onMouseEnter={() => setHoveredSlide(slide.id)}
            onMouseLeave={() => setHoveredSlide(null)}
          >
            <div className="flex items-center space-x-4">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <div className="w-24 h-18 bg-gray-100 rounded border overflow-hidden">
                  <img
                    src={slide.figmaFileId && slide.figmaNodeId
                      ? `/api/figma/image-proxy?fileId=${slide.figmaFileId}&nodeId=${slide.figmaNodeId}`
                      : `https://via.placeholder.com/96x72/6366f1/ffffff?text=${encodeURIComponent(slide.title)}`
                    }
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/96x72/6366f1/ffffff?text=${encodeURIComponent(slide.title)}`;
                    }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {slide.title}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {slide.description || 'No description'}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {slide.viewCount} views
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">
                    {slide.useCount} uses
                  </span>
                  {/* TODO: Add author field to Slide type if needed */}
                  {/* {slide.author && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        {slide.author}
                      </span>
                    </>
                  )} */}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(slide);
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    slide.isFavorite
                      ? 'text-red-500 bg-red-50'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Heart className="w-4 h-4" fill={slide.isFavorite ? 'currentColor' : 'none'} />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToPresentation(slide);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSlide(slide);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                {slide.figmaUrl && (
                  <a
                    href={slide.figmaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {slides.map((slide) => (
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
        />
      ))}
    </div>
  );
} 