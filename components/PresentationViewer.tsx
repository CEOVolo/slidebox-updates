'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, Calendar, User, FileText, Eye } from 'lucide-react';
import { Presentation } from '@/lib/types';

interface PresentationViewerProps {
  onClose: () => void;
}

export default function PresentationViewer({ onClose }: PresentationViewerProps) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/presentations?limit=50');
      const data = await response.json();
      setPresentations(data.presentations || []);
    } catch (error) {
      console.error('Ошибка загрузки презентаций:', error);
      setError('Не удалось загрузить презентации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Мои презентации
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Созданные презентации и коллекции слайдов
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="loading-spinner"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{error}</p>
              </div>
            </div>
          ) : presentations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Пока нет презентаций</h3>
                <p>Создайте первую презентацию, чтобы увидеть её здесь</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {presentations.map((presentation) => (
                <div
                  key={presentation.id}
                  className="group bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  {/* Preview */}
                  <div className="aspect-video bg-slate-100 dark:bg-slate-700 flex items-center justify-center relative">
                    {presentation.slides && presentation.slides.length > 0 && presentation.slides[0]?.slide?.imageUrl ? (
                      <img
                        src={presentation.slides[0].slide.imageUrl}
                        alt={`${presentation.title} - первый слайд`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-sm">Нет превью</span>
                      </div>
                    )}
                    
                    {/* Slides count overlay */}
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {presentation.slides?.length || 0} слайдов
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground text-lg truncate mb-2">
                      {presentation.title}
                    </h3>
                    
                    {presentation.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {presentation.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(presentation.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                      {presentation.author && (
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {presentation.author}
                        </div>
                      )}
                    </div>

                    {/* Slides preview */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {(presentation.slides || []).slice(0, 6).map((presSlide, index) => (
                          <div
                            key={presSlide.id}
                            className="w-8 h-6 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden"
                          >
                            {presSlide.slide.imageUrl ? (
                              <img
                                src={presSlide.slide.imageUrl}
                                alt={`Слайд ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">{index + 1}</span>
                            )}
                          </div>
                        ))}
                        {(presentation.slides?.length || 0) > 6 && (
                          <div className="w-8 h-6 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">+{(presentation.slides?.length || 0) - 6}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {presentation.figmaUrl && (
                        <a
                          href={presentation.figmaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium flex items-center justify-center"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Открыть
                        </a>
                      )}
                      <button
                        onClick={() => {
                          // TODO: Добавить функцию просмотра презентации
                          console.log('Просмотр презентации:', presentation.id);
                        }}
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium flex items-center justify-center"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Просмотр
                      </button>
                    </div>
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