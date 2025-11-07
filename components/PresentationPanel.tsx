'use client';

import { useState } from 'react';
import { 
  X, 
  GripVertical, 
  ExternalLink, 
  Download, 
  Plus,
  FileText,
  Trash2
} from 'lucide-react';
import { Slide } from '@/lib/types';

interface PresentationPanelProps {
  slides: Slide[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveSlide: (slideId: string) => void;
  onReorderSlides: (slides: Slide[]) => void;
  onExport: () => void;
  onSlidePreview?: (slide: Slide) => void;
}

export default function PresentationPanel({
  slides,
  isOpen,
  onClose,
  onRemoveSlide,
  onReorderSlides,
  onExport,
  onSlidePreview
}: PresentationPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newSlides = [...slides];
    const [draggedSlide] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(dropIndex, 0, draggedSlide);
    
    onReorderSlides(newSlides);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const openInFigma = (slide: Slide) => {
    if (slide.figmaUrl) {
      window.open(slide.figmaUrl, '_blank');
    } else if (slide.figmaFileId && slide.figmaNodeId) {
      // Fallback to constructing Figma URL
      const figmaUrl = `https://www.figma.com/file/${slide.figmaFileId}?node-id=${slide.figmaNodeId}`;
      window.open(figmaUrl, '_blank');
    }
  };

  const createPresentation = async () => {
    try {
      const response = await fetch('/api/presentations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Presentation ${new Date().toLocaleDateString()}`,
          description: `Presentation with ${slides.length} slides`,
          slides: slides.map((slide, index) => ({
            slideId: slide.id,
            order: index
          }))
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Presentation created successfully! ID: ${result.id}`);
        onClose();
      } else {
        throw new Error('Failed to create presentation');
      }
    } catch (error) {
      console.error('Error creating presentation:', error);
      alert('Failed to create presentation. Please try again.');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-50 to-yellow-50 border-t border-yellow-200 shadow-xl z-40">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-gray-800 font-bold text-sm">A</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">SlideBox by Andersen</h3>
                <p className="text-xs text-gray-600">
                  {slides.length} slide{slides.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={createPresentation}
              className="px-3 py-1.5 bg-yellow-400 text-gray-800 text-sm rounded-md hover:bg-yellow-500 transition-colors flex items-center shadow-sm font-medium"
            >
              <Plus className="w-3 h-3 mr-1" />
              Create
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slides List */}
        <div className="px-4 py-3 max-h-36 overflow-x-auto overflow-y-hidden">
          {slides.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">No slides selected</p>
              <p className="text-xs text-gray-400">Add slides from the library above</p>
            </div>
          ) : (
            <div className="flex space-x-3 pb-2">
              {slides.map((slide, index) => (
                <div
                  key={`${slide.id}-${index}`}
                  className={`
                    group flex-shrink-0 relative
                    ${draggedIndex === index ? 'scale-110' : ''}
                    ${draggedIndex !== null && draggedIndex !== index ? 'opacity-50' : ''}
                    transition-all cursor-move
                  `}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Square Slide Preview - увеличенный размер */}
                  <div 
                    className="w-24 h-24 bg-gray-100 relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-yellow-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => onSlidePreview?.(slide)}
                    title="Click to preview"
                  >
                    {/* Slide Number */}
                    <div className="absolute top-1 left-1 z-10">
                      <span className="text-xs font-bold text-gray-800 bg-yellow-400 px-1.5 py-0.5 rounded-full shadow-sm">
                        {index + 1}
                      </span>
                    </div>

                    {/* Figma indicator */}
                    {(slide.figmaFileId || slide.figmaUrl) && (
                      <div className="absolute top-1 right-1 z-10 p-0.5 bg-purple-500 rounded text-white text-xs">
                        <FileText className="w-2 h-2" />
                      </div>
                    )}

                    <img
                      src={slide.figmaFileId && slide.figmaNodeId
                        ? `/api/figma/image-proxy?fileId=${slide.figmaFileId}&nodeId=${slide.figmaNodeId}`
                        : `https://via.placeholder.com/96x96/f3f4f6/6b7280?text=${encodeURIComponent(slide.title.slice(0, 2))}`
                      }
                      alt={slide.title}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/96x96/f3f4f6/6b7280?text=${encodeURIComponent(slide.title.slice(0, 2))}`;
                      }}
                    />
                    
                    {/* Overlay Controls - показываются при наведении */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
                      <div className="flex space-x-1">
                        {/* Preview Icon */}
                        <div className="p-1.5 bg-white bg-opacity-90 rounded-full shadow-sm">
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>

                        {/* Figma Link */}
                        {(slide.figmaFileId || slide.figmaUrl) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openInFigma(slide);
                            }}
                            className="p-1.5 bg-purple-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all shadow-sm"
                            title="Open in Figma"
                          >
                            <FileText className="w-3 h-3 text-white" />
                          </button>
                        )}
                        
                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveSlide(slide.id);
                          }}
                          className="p-1.5 bg-red-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all shadow-sm"
                          title="Remove from presentation"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Title under the slide */}
                  <div className="mt-1 text-center">
                    <h4 className="text-xs font-medium text-gray-800 truncate max-w-[96px]" title={slide.title}>
                      {slide.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 