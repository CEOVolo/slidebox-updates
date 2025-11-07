'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, Download, FileText, Send } from 'lucide-react';
import { Slide } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface PresentationBuilderProps {
  onClose: () => void;
}

interface PresentationSlide {
  id: string;
  slide: Slide;
  order: number;
}

export default function PresentationBuilder({ onClose }: PresentationBuilderProps) {
  const [availableSlides, setAvailableSlides] = useState<Slide[]>([]);
  const [presentationSlides, setPresentationSlides] = useState<PresentationSlide[]>([]);
  const [presentationTitle, setPresentationTitle] = useState('Новая презентация');
  const [presentationDescription, setPresentationDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [step, setStep] = useState<'builder' | 'creating' | 'result'>('builder');
  const [resultUrl, setResultUrl] = useState('');
  const [usePlugin, setUsePlugin] = useState(false);
  const [pluginStatus, setPluginStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  // Загружаем доступные слайды
  useEffect(() => {
    loadAvailableSlides();
  }, []);

  const loadAvailableSlides = async () => {
    setLoadingSlides(true);
    try {
      const response = await fetch('/api/slides?limit=100');
      const data = await response.json();
      setAvailableSlides(data.slides || []);
    } catch (error) {
      console.error('Ошибка загрузки слайдов:', error);
      setError('Не удалось загрузить слайды');
    } finally {
      setLoadingSlides(false);
    }
  };

  // Добавление слайда в презентацию
  const addSlideToPresentation = (slide: Slide) => {
    const newSlide: PresentationSlide = {
      id: `pres-${slide.id}-${Date.now()}`,
      slide,
      order: presentationSlides.length,
    };
    setPresentationSlides([...presentationSlides, newSlide]);
  };

  // Удаление слайда из презентации
  const removeSlideFromPresentation = (slideId: string) => {
    const filtered = presentationSlides.filter(ps => ps.id !== slideId);
    // Перенумеровываем порядок
    const reordered = filtered.map((ps, index) => ({ ...ps, order: index }));
    setPresentationSlides(reordered);
  };

  // Перемещение слайда в презентации
  const moveSlide = (fromIndex: number, toIndex: number) => {
    const slides = [...presentationSlides];
    const [movedSlide] = slides.splice(fromIndex, 1);
    slides.splice(toIndex, 0, movedSlide);
    
    // Перенумеровываем порядок
    const reordered = slides.map((ps, index) => ({ ...ps, order: index }));
    setPresentationSlides(reordered);
  };

  // Создание презентации в Figma
  const createPresentation = async () => {
    if (presentationSlides.length === 0) {
      setError('Добавьте хотя бы один слайд в презентацию');
      return;
    }

    setStep('creating');
    setError('');

    try {
      const response = await fetch('/api/presentations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: presentationTitle,
          description: presentationDescription,
          slides: presentationSlides.map(ps => ({
            slideId: ps.slide.id,
            order: ps.order,
          })),
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setResultUrl(result.figmaUrl);
        setStep('result');
      } else {
        setError(result.error || 'Ошибка создания презентации');
        setStep('builder');
      }
    } catch (error) {
      console.error('Ошибка создания презентации:', error);
      setError('Ошибка при создании презентации в Figma');
      setStep('builder');
    }
  };

  // Функция создания презентации через плагин
  const createPresentationWithPlugin = async () => {
    if (presentationSlides.length === 0) return;

    setStep('creating');
    setPluginStatus('connecting');

    try {
      // Подготавливаем данные для плагина
      const pluginData = {
        title: presentationTitle.trim() || 'Новая презентация',
        description: presentationDescription.trim(),
        slides: presentationSlides.map((slide, index) => ({
          id: slide.slide.id,
          title: slide.slide.title,
          figmaFileId: slide.slide.figmaFileId,
          figmaNodeId: slide.slide.figmaNodeId,
          imageUrl: slide.slide.imageUrl,
          order: index
        })),
        webAppUrl: window.location.origin
      };

      // Вместо попытки открыть плагин через URL, сохраняем данные для плагина
      // Плагин сам заберёт данные через API когда будет запущен
      console.log('Данные подготовлены для плагина:', pluginData);
      
      // Также показываем инструкции пользователю
      setPluginStatus('connected');
      
      // Создаём виртуальную презентацию в базе данных для отслеживания
      const response = await fetch('/api/presentations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: presentationTitle.trim() || 'Новая презентация',
          description: presentationDescription.trim(),
          slides: presentationSlides.map((slide, index) => ({
            slideId: slide.slide.id,
            order: index
          })),
          usePlugin: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Показываем успешный результат с инструкциями по плагину
        setResultUrl(result.figmaUrl);
        setStep('result');
      } else {
        throw new Error('Ошибка создания презентации в базе данных');
      }

    } catch (error) {
      console.error('Ошибка создания презентации через плагин:', error);
      setError('Ошибка интеграции с Figma плагином');
      setPluginStatus('error');
    } finally {
      setStep('builder');
    }
  };

  // Обработчик выбора метода создания
  const handleCreatePresentation = () => {
    if (usePlugin) {
      createPresentationWithPlugin();
    } else {
      createPresentation();
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, slide: Slide) => {
    e.dataTransfer.setData('application/json', JSON.stringify(slide));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const slideData = e.dataTransfer.getData('application/json');
      const slide: Slide = JSON.parse(slideData);
      addSlideToPresentation(slide);
    } catch (error) {
      console.error('Ошибка при перетаскивании:', error);
    }
  };

  const handleSortDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSortDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSortDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== toIndex) {
      moveSlide(fromIndex, toIndex);
    }
  };

  if (step === 'creating') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="loading-spinner mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {usePlugin ? 'Передача данных в Figma плагин...' : 'Создаём презентацию в Figma'}
          </h2>
          <p className="text-muted-foreground mb-2">
            {usePlugin 
              ? `Подготавливаем ${presentationSlides.length} слайдов для плагина...`
              : `Копируем ${presentationSlides.length} слайдов в новый файл...`
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {usePlugin 
              ? 'Пожалуйста, проверьте Figma для активации плагина'
              : 'Это может занять несколько минут'
            }
          </p>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-lg w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {usePlugin ? 'Плагин активирован!' : 'Презентация создана!'}
          </h2>
          
          {usePlugin ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Данные переданы в Figma плагин. Проверьте Figma для создания презентации.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🚀 Автоматическое копирование слайдов</h4>
                
                <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">
                    ✨ Новинка: Полностью автоматическое копирование!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Плагин автоматически воссоздаёт слайды из любых файлов Figma с сохранением всех свойств
                  </p>
                </div>
                
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-3">
                  <li><strong>1. Установите плагин (если ещё не установлен):</strong>
                    <ul className="ml-4 mt-1 text-xs space-y-1">
                      <li>• Откройте Figma Desktop</li>
                      <li>• Перейдите в Plugins → Development → Import plugin from manifest...</li>
                      <li>• Выберите файл: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">figma-plugin/dist/manifest.json</code></li>
                    </ul>
                  </li>
                  
                  <li><strong>2. Создайте презентацию:</strong>
                    <ul className="ml-4 mt-1 text-xs space-y-1">
                      <li>• Запустите плагин "SlideDeck 2.0 - Presentation Creator"</li>
                      <li>• Нажмите "Получить данные презентации"</li>
                      <li>• Плагин автоматически воссоздаст все слайды из разных файлов!</li>
                      <li>• Все элементы будут полностью редактируемыми 🎉</li>
                    </ul>
                  </li>
                </ol>
                
                <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs text-purple-700 dark:text-purple-300">
                  <strong>Как это работает:</strong> Плагин получает полную структуру слайдов через REST API и программно воссоздаёт все элементы, тексты, стили и эффекты
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground mb-6">
              Ваша презентация "{presentationTitle}" готова в Figma
            </p>
          )}

          <div className="flex flex-col gap-3 mt-6">
            {resultUrl && !usePlugin && (
              <a
                href={resultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Открыть в Figma
              </a>
            )}
            <button
              onClick={() => {
                setStep('builder');
                setPresentationSlides([]);
                setPresentationTitle('Новая презентация');
                setPresentationDescription('');
                setResultUrl('');
                setError('');
                setUsePlugin(false);
                setPluginStatus('idle');
              }}
              className="px-6 py-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              Создать новую
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex-1">
              <input
                type="text"
                value={presentationTitle}
                onChange={(e) => setPresentationTitle(e.target.value)}
                className="text-xl font-semibold text-foreground bg-transparent border-none outline-none focus:bg-accent focus:px-2 focus:py-1 rounded"
                placeholder="Название презентации"
              />
              <input
                type="text"
                value={presentationDescription}
                onChange={(e) => setPresentationDescription(e.target.value)}
                className="block text-sm text-muted-foreground bg-transparent border-none outline-none focus:bg-accent focus:px-2 focus:py-1 rounded mt-1 w-full"
                placeholder="Описание презентации (необязательно)"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreatePresentation}
                disabled={loading || presentationSlides.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                {usePlugin ? 'Создать в Figma' : 'Создать презентацию'} ({presentationSlides.length})
              </button>
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex gap-6 p-6 overflow-hidden">
            {/* Библиотека слайдов */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Библиотека слайдов
              </h3>
              
              {loadingSlides ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {availableSlides.map((slide) => {
                      // Determine aspect ratio
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

                      const openInFigma = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (slide.figmaUrl) {
                          window.open(slide.figmaUrl, '_blank');
                        } else if (slide.figmaFileId && slide.figmaNodeId) {
                          const figmaUrl = `https://www.figma.com/file/${slide.figmaFileId}?node-id=${slide.figmaNodeId}`;
                          window.open(figmaUrl, '_blank');
                        }
                      };

                      return (
                        <div
                          key={slide.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, slide)}
                          className="group relative border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-750"
                        >
                          {/* Figma indicator */}
                          {(slide.figmaFileId || slide.figmaUrl) && (
                            <div className="absolute top-2 left-2 z-10 p-1 bg-purple-500 rounded text-white text-xs">
                              <FileText className="w-3 h-3" />
                            </div>
                          )}

                          <div className={`bg-slate-100 dark:bg-slate-700 flex items-center justify-center ${aspectRatioClass} relative overflow-hidden`}>
                            <img
                              src={slide.figmaFileId && slide.figmaNodeId
                                ? `/api/figma/image-proxy?fileId=${slide.figmaFileId}&nodeId=${slide.figmaNodeId}`
                                : slide.imageUrl || `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=${encodeURIComponent(slide.title)}`
                              }
                              alt={slide.title}
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=${encodeURIComponent(slide.title)}`;
                              }}
                            />

                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => addSlideToPresentation(slide)}
                                  className="p-2 bg-yellow-400 rounded-full hover:bg-yellow-500 transition-all shadow-sm"
                                  title="Add to presentation"
                                >
                                  <Plus className="w-4 h-4 text-gray-800" />
                                </button>
                                
                                {(slide.figmaFileId || slide.figmaUrl) && (
                                  <button
                                    onClick={openInFigma}
                                    className="p-2 bg-purple-500 rounded-full hover:bg-purple-600 transition-all shadow-sm"
                                    title="Open in Figma"
                                  >
                                    <FileText className="w-4 h-4 text-white" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3">
                            <h4 className="font-medium text-foreground text-sm truncate">
                              {slide.title}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {slide.figmaFileName || slide.figmaFileId}
                            </p>
                            {slide.width && slide.height && (
                              <p className="text-xs text-muted-foreground">
                                {slide.width}×{slide.height}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Презентация */}
            <div className="w-80 flex flex-col">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Презентация
              </h3>
              
              {/* Выбор метода создания */}
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-750 rounded-lg">
                <h4 className="text-sm font-semibold text-foreground mb-3">Метод создания:</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!usePlugin}
                      onChange={() => {
                        setUsePlugin(false);
                        setPluginStatus('idle');
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">Виртуальная презентация</div>
                      <div className="text-xs text-muted-foreground">Быстро, сохраняется структура в базе</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={usePlugin}
                      onChange={() => setUsePlugin(true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">Figma плагин</div>
                      <div className="text-xs text-muted-foreground">Создает реальный файл в Figma</div>
                    </div>
                  </label>
                </div>

                {/* Статус плагина */}
                {usePlugin && (
                  <div className="mt-3 p-2 rounded text-xs">
                    {pluginStatus === 'idle' && (
                      <div className="text-blue-600 flex items-center">
                        🔌 Будет использован Figma плагин
                      </div>
                    )}
                    {pluginStatus === 'connecting' && (
                      <div className="text-yellow-600 flex items-center">
                        🔄 Подключение к Figma плагину...
                      </div>
                    )}
                    {pluginStatus === 'connected' && (
                      <div className="text-green-600 flex items-center">
                        ✅ Плагин активирован в Figma
                      </div>
                    )}
                    {pluginStatus === 'error' && (
                      <div className="text-red-600 flex items-center">
                        ❌ Ошибка подключения к плагину
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div
                className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 overflow-y-auto"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {presentationSlides.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Download className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">
                      Перетащите слайды сюда для создания презентации
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {presentationSlides.map((presSlide, index) => {
                      const openInFigma = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (presSlide.slide.figmaUrl) {
                          window.open(presSlide.slide.figmaUrl, '_blank');
                        } else if (presSlide.slide.figmaFileId && presSlide.slide.figmaNodeId) {
                          const figmaUrl = `https://www.figma.com/file/${presSlide.slide.figmaFileId}?node-id=${presSlide.slide.figmaNodeId}`;
                          window.open(figmaUrl, '_blank');
                        }
                      };

                      return (
                        <div
                          key={presSlide.id}
                          draggable
                          onDragStart={(e) => handleSortDragStart(e, index)}
                          onDragOver={handleSortDragOver}
                          onDrop={(e) => handleSortDrop(e, index)}
                          className="group relative bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden cursor-move hover:shadow-md transition-all"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mx-3 my-2">
                              {index + 1}
                            </div>
                            
                            <div className="flex-1">
                              <div className="aspect-video bg-slate-100 dark:bg-slate-700 flex items-center justify-center w-24 h-16 relative">
                                <img
                                  src={presSlide.slide.figmaFileId && presSlide.slide.figmaNodeId
                                    ? `/api/figma/image-proxy?fileId=${presSlide.slide.figmaFileId}&nodeId=${presSlide.slide.figmaNodeId}`
                                    : presSlide.slide.imageUrl || `https://via.placeholder.com/96x64/f3f4f6/6b7280?text=${encodeURIComponent(presSlide.slide.title.slice(0, 2))}`
                                  }
                                  alt={presSlide.slide.title}
                                  className="w-full h-full object-cover object-top"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://via.placeholder.com/96x64/f3f4f6/6b7280?text=${encodeURIComponent(presSlide.slide.title.slice(0, 2))}`;
                                  }}
                                />
                                
                                {/* Figma indicator */}
                                {(presSlide.slide.figmaFileId || presSlide.slide.figmaUrl) && (
                                  <div className="absolute top-1 left-1 p-0.5 bg-purple-500 rounded text-white text-xs">
                                    <FileText className="w-2 h-2" />
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-1 px-3 py-2">
                              <h4 className="font-medium text-foreground text-xs truncate">
                                {presSlide.slide.title}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">
                                {presSlide.slide.figmaFileName || presSlide.slide.figmaFileId}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-1 pr-3">
                              {(presSlide.slide.figmaFileId || presSlide.slide.figmaUrl) && (
                                <button
                                  onClick={openInFigma}
                                  className="p-1 text-purple-600 hover:text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Open in Figma"
                                >
                                  <FileText className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                              >
                                <GripVertical className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeSlideFromPresentation(presSlide.id)}
                                className="p-1 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {presentationSlides.length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-750 rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    📊 {presentationSlides.length} слайдов готовы к экспорту
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 