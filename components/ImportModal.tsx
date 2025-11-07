'use client';

import { useState } from 'react';
import { X, Upload, FileText, AlertCircle, Loader2, Eye, Check, Plus, ChevronDown } from 'lucide-react';
import { useMetadata } from '@/contexts/MetadataContext';
import { CategoryNode } from '@/lib/types';
import CreateCategoryModal from './CreateCategoryModal';

interface FigmaFrame {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
  width?: number;
  height?: number;
  isVertical?: boolean;
  category?: string;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
}

export default function ImportModal({ isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [previewFrames, setPreviewFrames] = useState<FigmaFrame[]>([]);
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  
  const { metadata, loading: metadataLoading } = useMetadata();
  const categories = metadata?.categories || [];

  if (!isOpen) return null;

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!figmaUrl.trim()) return;

    setIsLoading(true);
    setError('');
    setProgress('Loading preview...');

    try {
      const response = await fetch('/api/figma/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ figmaUrl: figmaUrl.trim() }),
      });

      if (response.ok) {
        const result = await response.json();
        const framesWithCategories = (result.frames || []).map((frame: FigmaFrame) => ({
          ...frame,
          category: 'company-overview'
        }));
        setPreviewFrames(framesWithCategories);
        setSelectedFrames(new Set(framesWithCategories.map((f: FigmaFrame) => f.id)));
        setShowPreview(true);
        setProgress('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load preview');
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (selectedFrames.size === 0) {
      setError('Please select at least one slide to import');
      return;
    }

    setIsLoading(true);
    setError('');
    setProgress('Importing selected slides...');

    try {
      const selectedFramesData = previewFrames
        .filter(frame => selectedFrames.has(frame.id))
        .map(frame => ({
          id: frame.id,
          category: frame.category
        }));

      // ОПТИМИЗАЦИЯ: Собираем URL изображений из preview для передачи в import
      const preloadedImages: Record<string, string> = {};
      previewFrames.forEach(frame => {
        if (frame.imageUrl && selectedFrames.has(frame.id)) {
          preloadedImages[frame.id] = frame.imageUrl;
        }
      });

      console.log(`Passing ${Object.keys(preloadedImages).length} preloaded images to import`);

      const response = await fetch('/api/slides/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          figmaUrl: figmaUrl.trim(),
          selectedFrames: Array.from(selectedFrames),
          framesWithCategories: selectedFramesData,
          preloadedImages // Передаем предзагруженные изображения
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setProgress('Import completed!');
        
        // Формируем детальное сообщение о результатах
        let message = `Success! ${result.slidesCount} slides imported to moderation queue.\n\n`;
        
        if (result.imageStats) {
          message += `Images: ${result.imageStats.withImages} successful`;
          if (result.imageStats.withoutImages > 0) {
            message += `, ${result.imageStats.withoutImages} failed (will be processed manually)`;
          }
          message += '\n\n';
        }
        
        message += 'Slides will be available after admin review and approval.';
        
        setTimeout(() => {
          alert(message);
          onClose();
          resetModal();
          onImportComplete?.(); // Вызываем колбэк после успешного импорта
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to import slides');
      }
    } catch (error) {
      console.error('Error importing slides:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
      if (!error) {
        setTimeout(() => setProgress(''), 2000);
      }
    }
  };

  const resetModal = () => {
    setFigmaUrl('');
    setPreviewFrames([]);
    setSelectedFrames(new Set());
    setShowPreview(false);
    setProgress('');
    setError('');
  };

  const toggleFrameSelection = (frameId: string) => {
    const newSelected = new Set(selectedFrames);
    if (newSelected.has(frameId)) {
      newSelected.delete(frameId);
    } else {
      newSelected.add(frameId);
    }
    setSelectedFrames(newSelected);
  };

  const selectAll = () => {
    setSelectedFrames(new Set(previewFrames.map(f => f.id)));
  };

  const selectNone = () => {
    setSelectedFrames(new Set());
  };

  const handleCategoryChange = (frameId: string, categoryId: string) => {
    setPreviewFrames(frames => 
      frames.map(frame => 
        frame.id === frameId 
          ? { ...frame, category: categoryId }
          : frame
      )
    );
  };

  const handleCategoryCreated = (newCategory: CategoryNode) => {
    // Categories will be automatically updated through context
    setShowCreateCategory(false);
  };

  const getFlatCategories = (categories: Category[]): Category[] => {
    const result: Category[] = [];
    const addCategories = (cats: Category[]) => {
      cats.forEach(cat => {
        result.push(cat);
        if (cat.children) {
          addCategories(cat.children);
        }
      });
    };
    addCategories(categories);
    return result;
  };

  const flatCategories = getFlatCategories(categories);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Upload className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">Import from Figma</h2>
            </div>
            <button
              onClick={() => {
                onClose();
                resetModal();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {!showPreview ? (
              <form onSubmit={handlePreview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Figma File URL
                  </label>
                  <input
                    type="url"
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                    placeholder="https://www.figma.com/file/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Progress indicator */}
                {isLoading && progress && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-700 font-medium">{progress}</p>
                      <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {!isLoading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">How it works:</p>
                        <ul className="space-y-1">
                          <li>• Paste a Figma file URL</li>
                          <li>• Preview all available frames</li>
                          <li>• Select which slides to import and assign categories</li>
                          <li>• Slides will be automatically tagged based on content</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      resetModal();
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !figmaUrl.trim()}
                    className="px-4 py-2 bg-yellow-400 text-gray-800 rounded-md hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Slides
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Preview header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Select Slides and Assign Categories</h3>
                    <p className="text-sm text-gray-600">
                      Found {previewFrames.length} slides • {selectedFrames.size} selected
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowCreateCategory(true)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New Category
                    </button>
                    <button
                      onClick={selectAll}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={selectNone}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Select None
                    </button>
                  </div>
                </div>

                {/* Preview grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto">
                  {previewFrames.map((frame) => (
                    <div
                      key={frame.id}
                      className={`relative bg-white border-2 rounded-lg overflow-hidden transition-all shadow-sm hover:shadow-md ${
                        selectedFrames.has(frame.id)
                          ? 'border-yellow-400 bg-yellow-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Adaptive aspect ratio for different slide types - smaller */}
                      <div 
                        className={`bg-gray-100 cursor-pointer ${frame.isVertical ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}
                        onClick={() => toggleFrameSelection(frame.id)}
                      >
                        <img
                          src={frame.imageUrl || `https://via.placeholder.com/300x200/6366f1/ffffff?text=${encodeURIComponent(frame.name)}`}
                          alt={frame.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://via.placeholder.com/300x200/6366f1/ffffff?text=${encodeURIComponent(frame.name)}`;
                          }}
                        />
                      </div>
                      
                      <div className="p-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-700 font-medium line-clamp-1 pr-1">{frame.name}</p>
                          {selectedFrames.has(frame.id) && (
                            <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-gray-800" />
                            </div>
                          )}
                        </div>
                        
                        {/* Category Selector - более компактный */}
                        <div>
                          <select
                            value={frame.category || ''}
                            onChange={(e) => handleCategoryChange(frame.id, e.target.value)}
                            className="w-full text-xs px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 bg-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Select category</option>
                            {categories.map((category: any) => (
                              <optgroup key={category.id} label={category.name}>
                                {/* Родительские категории - только как заголовки, не для выбора */}
                                {category.children?.map((subCategory: any) => (
                                  <option key={subCategory.id} value={subCategory.id}>
                                    {subCategory.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Selection overlay */}
                      {selectedFrames.has(frame.id) && (
                        <div className="absolute inset-0 bg-yellow-400 bg-opacity-10 rounded-lg pointer-events-none"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Import progress */}
                {isLoading && progress && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-700 font-medium">{progress}</p>
                      <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Preview actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowPreview(false)}
                    disabled={isLoading}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Back
                  </button>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        onClose();
                        resetModal();
                      }}
                      disabled={isLoading}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={isLoading || selectedFrames.size === 0}
                      className="px-4 py-2 bg-yellow-400 text-gray-800 rounded-md hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import {selectedFrames.size} Slides
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Category Modal */}
      {showCreateCategory && (
        <CreateCategoryModal
          isOpen={showCreateCategory}
          onClose={() => setShowCreateCategory(false)}
          onCategoryCreated={handleCategoryCreated}
        />
      )}
    </>
  );
} 