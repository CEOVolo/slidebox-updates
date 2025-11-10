'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import SlideEditModal from '@/components/SlideEditModal';
import ImportModal from '@/components/ImportModal';
import { ExternalLink, Maximize2, Settings } from 'lucide-react';
import { Autocomplete, MultiSelect } from '@/components/ui/autocomplete';
import { useMetadata } from '@/contexts/MetadataContext';

interface ApiCategory {
  id: string;
  name: string;
  parentId?: string;
  children?: ApiCategory[];
}

interface DraftSlide {
  id: string;
  title: string;
  categories?: { categoryId: string; category: { name: string } }[];
  figmaNodeId: string;
  figmaFileId: string;
  figmaFileName: string;
  imageUrl: string;
  width: number;
  height: number;
  extractedText?: string;
  tags?: { id: string; name: string }[];
  createdAt: string;
  // Metadata fields
  status?: 'draft' | 'in_review' | 'approved' | 'archived';
  format?: 'vertical' | 'horizontal';
  language?: 'en' | 'fr' | 'de' | 'multilang';
  region?: 'emea' | 'na' | 'global' | 'apac' | 'latam';
  domain?: string;
  authorName?: string;
  department?: string;
  isCaseStudy?: boolean;
  yearStart?: number;
  yearFinish?: number;
  // Related data
  products?: { id: string; product: { id: string; code: string; name: string } }[];
  userTypes?: { id: string; userType: { id: string; code: string; name: string } }[];
  components?: { id: string; component: { id: string; code: string; name: string } }[];
  integrations?: { id: string; integration: { id: string; code: string; name: string } }[];
  solutionAreas?: { id: string; solutionArea: { id: string; code: string; name: string } }[];
  isActive?: boolean;
  _qualityScale?: number; // Текущее качество превью для отслеживания в UI
}

export default function ModerationPage() {
  const auth = useAuth();
  const router = useRouter();
  const [draftSlides, setDraftSlides] = useState<DraftSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlide, setSelectedSlide] = useState<DraftSlide | null>(null);
  const [fullSlideData, setFullSlideData] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [previewSlide, setPreviewSlide] = useState<DraftSlide | null>(null);
  const [showQualityMenu, setShowQualityMenu] = useState<string | null>(null);
  const [selectedSlides, setSelectedSlides] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState<boolean>(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [sortType, setSortType] = useState<'date' | 'category' | 'status' | 'autoextract'>('date');
  const [activeTab, setActiveTab] = useState<'drafts' | 'duplicates'>('drafts');
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [duplicateThreshold, setDuplicateThreshold] = useState(0.7);

  useEffect(() => {
    // Ждем пока загрузится информация о пользователе
    console.log('Auth state:', { user: auth.user, isAdmin: auth.isAdmin, isLoading: auth.isLoading });
    
    if (!auth.isLoading) {
      setAuthChecked(true);
      if (!auth.user || !auth.isAdmin) {
        console.log('Redirecting: user not admin', { user: auth.user, isAdmin: auth.isAdmin });
        router.push('/');
      } else {
        console.log('Loading draft slides');
        loadDraftSlides();
        loadCategories();
      }
    }
  }, [auth.user, auth.isAdmin, auth.isLoading, router]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const categoriesData = await response.json();
        console.log('📋 Categories loaded:', categoriesData);
        setCategories(categoriesData.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getCategoryName = (categoryId: string): string => {
    if (!categoryId) return 'Unknown';
    if (!Array.isArray(categories) || categories.length === 0) {
      console.log('🔍 Categories not loaded yet, showing ID:', categoryId);
      return categoryId;
    }
    
    const findCategory = (cats: ApiCategory[]): ApiCategory | null => {
      for (const cat of cats) {
        if (cat.id === categoryId) return cat;
        if (cat.children && Array.isArray(cat.children)) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const category = findCategory(categories);
    const result = category?.name || categoryId;
    if (!category) {
      console.log('❌ Category not found:', categoryId, 'Available categories:', categories.map(c => c.id));
    }
    return result;
  };

  // Обработчик клавиши ESC для закрытия превью
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewSlide) {
        setPreviewSlide(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [previewSlide]);

  const loadDraftSlides = async () => {
    try {
      const response = await fetch('/api/slides/drafts');
      if (response.ok) {
        const data = await response.json();
        setDraftSlides(data.slides);
        
        // Если модальное окно открыто, обновляем selectedSlide с новыми данными из базы
        if (selectedSlide) {
          const updatedSlide = data.slides.find((s: DraftSlide) => s.id === selectedSlide.id);
          if (updatedSlide) {
            setSelectedSlide(updatedSlide);
            console.log('📝 Updated selectedSlide with fresh data:', updatedSlide);
          }
        }
      }
    } catch (error) {
      console.error('Error loading draft slides:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractTextForSlide = async (slideId: string) => {
    setProcessing(slideId);
    try {
      console.log('🚀 Starting text extraction for slide:', slideId);
      const response = await fetch(`/api/slides/${slideId}/extract-text`, {
        method: 'POST',
      });
      
      console.log('📡 Response received:', { 
        status: response.status, 
        statusText: response.statusText, 
        ok: response.ok 
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Extract response successful:', data); // Для отладки
        
        // Update slide in list with ALL data including metadata
        const updatedSlideData = draftSlides.find(s => s.id === slideId);
        if (updatedSlideData) {
          const newSlideData = {
            ...updatedSlideData,
            extractedText: data.extractedText,
            tags: data.tags,
            title: data.suggestedTitle || updatedSlideData.title,
            // Обновляем все автозаполненные метаданные
            status: data.autoFilledMetadata?.updated?.status || updatedSlideData.status,
            format: data.autoFilledMetadata?.updated?.format || updatedSlideData.format,
            language: data.autoFilledMetadata?.updated?.language || updatedSlideData.language,
            region: data.autoFilledMetadata?.updated?.region || updatedSlideData.region,
            domain: data.autoFilledMetadata?.updated?.domain || updatedSlideData.domain,
            department: data.autoFilledMetadata?.updated?.department || updatedSlideData.department,
            authorName: data.autoFilledMetadata?.updated?.authorName || updatedSlideData.authorName,
            isCaseStudy: data.autoFilledMetadata?.updated?.isCaseStudy !== undefined 
              ? data.autoFilledMetadata.updated.isCaseStudy 
              : updatedSlideData.isCaseStudy,
            yearStart: data.autoFilledMetadata?.updated?.yearStart || updatedSlideData.yearStart,
            yearFinish: data.autoFilledMetadata?.updated?.yearFinish || updatedSlideData.yearFinish
          };
          
          // Обновляем в массиве
          setDraftSlides(prev => prev.map(slide => 
            slide.id === slideId ? newSlideData : slide
          ));
          
          // Если модальное окно открыто для этого слайда, обновляем его немедленно
          if (selectedSlide && selectedSlide.id === slideId) {
            setSelectedSlide(newSlideData);
            console.log('🚀 Updated selectedSlide immediately with extracted data:', newSlideData);
          }
        }
        
        console.log('🔄 Slide state updated with metadata:', {
          slideId,
          changes: data.autoFilledMetadata?.changes || [],
          updatedMetadata: data.autoFilledMetadata?.updated || {}
        });
        
        // Показываем детальное уведомление об успехе
        const changes = data.autoFilledMetadata?.changes || [];
        let message = 'Text extracted successfully!';
        
        if (data.suggestedTitle) {
          message += `\n• New title: "${data.suggestedTitle}"`;
        }
        
        if (changes.length > 0) {
          message += `\n• Auto-filled metadata: ${changes.join(', ')}`;
          
          // Показываем конкретные значения для важных полей
          const metadata = data.autoFilledMetadata.updated;
          if (metadata.isCaseStudy) {
            message += '\n• ✅ Detected as Case Study';
          }
          if (metadata.domain) {
            message += `\n• Domain: ${metadata.domain}`;
          }
          if (metadata.department) {
            message += `\n• Department: ${metadata.department}`;
          }
        }
        
        alert(message);
        
        // Принудительно перезагружаем список слайдов из базы для полной синхронизации
        setTimeout(() => {
          loadDraftSlides();
          console.log('🔄 Slides reloaded from database');
        }, 500);
      } else {
        // Обрабатываем ошибочный ответ
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ API Error:', { 
          status: response.status, 
          statusText: response.statusText, 
          error: errorData 
        });
        
        const errorMessage = errorData.details 
          ? `Failed to extract text: ${errorData.details}` 
          : `Failed to extract text (${response.status}): ${errorData.error || response.statusText}`;
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('💥 Network/JavaScript Error:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  const publishSlide = async (slideId: string) => {
    try {
      // Сначала проверяем, есть ли открытый слайд с изменениями
      // Если есть, сначала сохраняем изменения, затем публикуем
      if (selectedSlide && selectedSlide.id === slideId && fullSlideData) {
        // Сохраняем изменения перед публикацией
        await updateSlide(slideId, {
          ...fullSlideData,
          isActive: true,
          status: 'approved'
        });
      } else {
        // Если нет открытого слайда, просто публикуем с текущими данными
        const response = await fetch(`/api/slides/${slideId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isActive: true,
            status: 'approved'
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error publishing slide:', errorData);
          alert('Failed to publish slide');
          return;
        }
      }
      
      // Remove from draft list
      setDraftSlides(prev => prev.filter(slide => slide.id !== slideId));
      // Если слайд открыт в модальном окне, закрываем его
      if (selectedSlide && selectedSlide.id === slideId) {
        setSelectedSlide(null);
        setFullSlideData(null);
      }
    } catch (error) {
      console.error('Error publishing slide:', error);
      alert('Error publishing slide');
    }
  };

  const deleteSlide = async (slideId: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    
    try {
      const response = await fetch(`/api/slides/${slideId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDraftSlides(prev => prev.filter(slide => slide.id !== slideId));
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
    }
  };

  const updateSlide = async (slideId: string, updates: any) => {
    try {
      // Process metadata fields - используем ту же логику что и в API
      const updateData: any = {};
      
      // Основные поля
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.status !== undefined) updateData.status = updates.status === 'none' || updates.status === '' || updates.status === null ? null : updates.status;
      if (updates.format !== undefined) updateData.format = updates.format === 'none' || updates.format === '' || updates.format === null ? null : updates.format;
      if (updates.language !== undefined) updateData.language = updates.language === 'none' || updates.language === '' || updates.language === null ? null : updates.language;
      if (updates.region !== undefined) updateData.region = updates.region === 'none' || updates.region === '' || updates.region === null ? null : updates.region;
      if (updates.domain !== undefined) updateData.domain = updates.domain === 'none' || updates.domain === '' || updates.domain === null ? null : updates.domain;
      if (updates.authorName !== undefined) updateData.authorName = updates.authorName === 'none' || updates.authorName === '' || updates.authorName === null ? null : updates.authorName;
      if (updates.department !== undefined) updateData.department = updates.department === 'none' || updates.department === '' || updates.department === null ? null : updates.department;
      if (updates.isCaseStudy !== undefined) updateData.isCaseStudy = updates.isCaseStudy;
      if (updates.yearStart !== undefined) updateData.yearStart = updates.yearStart === 'none' || updates.yearStart === '' || updates.yearStart === null || updates.yearStart === 0 ? null : updates.yearStart;
      if (updates.yearFinish !== undefined) updateData.yearFinish = updates.yearFinish === 'none' || updates.yearFinish === '' || updates.yearFinish === null || updates.yearFinish === 0 ? null : updates.yearFinish;
      
      // Связанные данные (массивы)
      if (updates.productCodes !== undefined) updateData.productCodes = updates.productCodes;
      if (updates.confidentialityCodes !== undefined) updateData.confidentialityCodes = updates.confidentialityCodes;
      if (updates.componentCodes !== undefined) updateData.componentCodes = updates.componentCodes;
      if (updates.integrationCodes !== undefined) updateData.integrationCodes = updates.integrationCodes;
      if (updates.solutionAreaCodes !== undefined) updateData.solutionAreaCodes = updates.solutionAreaCodes;
      if (updates.categoryIds !== undefined) updateData.categoryIds = updates.categoryIds;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      
      // Поля для publish
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      
      console.log('📝 Individual slide update:', slideId, updateData);
      
      const response = await fetch(`/api/slides/${slideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Individual slide updated successfully:', responseData);
        
        // Обновляем локальное состояние с данными из ответа API
        setDraftSlides(prev => prev.map(slide => 
          slide.id === slideId ? { ...slide, ...responseData } : slide
        ));
        
        // Также обновляем selectedSlide если это тот же слайд
        if (selectedSlide && selectedSlide.id === slideId) {
          setSelectedSlide({ ...selectedSlide, ...responseData });
        }
        
        // Обновляем fullSlideData если он загружен
        if (fullSlideData && fullSlideData.id === slideId) {
          setFullSlideData(responseData);
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to update individual slide:', response.status, errorData);
        alert('Failed to save changes. Please try again.');
      }
    } catch (error) {
      console.error('💥 Error updating slide:', error);
      alert('Error saving changes. Please try again.');
    }
  };

  const tryLoadImage = async (slide: DraftSlide) => {
    try {
      // Получаем Figma File ID из таблицы
      const fileIdResponse = await fetch(`/api/slides/${slide.id}`);
      if (!fileIdResponse.ok) return;
      
      const slideData = await fileIdResponse.json();
      const figmaFileId = slideData.figmaFileId;
      
      if (!figmaFileId) {
        alert('Figma File ID not found for this slide');
        return;
      }
      
      // Пробуем загрузить изображение с минимальным масштабом через прокси
      const proxyResponse = await fetch('/api/figma/image-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: figmaFileId,
          nodeId: slide.figmaNodeId,
          scale: 0.01 // Минимальный масштаб
        })
      });
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        if (data.imageUrl) {
          // Обновляем слайд с новым URL изображения
          const updateResponse = await fetch(`/api/slides/${slide.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: data.imageUrl })
          });
          
          if (updateResponse.ok) {
            setDraftSlides(prev => prev.map(s => 
              s.id === slide.id ? { ...s, imageUrl: data.imageUrl } : s
            ));
            alert('Image loaded successfully!');
          }
        }
      } else {
        alert('Failed to load image. The frame might be too large or complex.');
      }
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Error loading image. Please try again.');
    }
  };

  // Функция для определения текущего качества превью
  const getCurrentQuality = (slide: DraftSlide): number => {
    // Сначала проверяем локальное состояние
    if (slide._qualityScale !== undefined) {
      return slide._qualityScale;
    }
    
    if (!slide.imageUrl) return 2; // По умолчанию 2x
    
    // Пытаемся извлечь scale из URL
    const urlParams = new URLSearchParams(slide.imageUrl.split('?')[1] || '');
    const scaleParam = urlParams.get('scale');
    if (scaleParam) {
      return parseFloat(scaleParam);
    }
    
    // Если scale нет в URL, проверяем сам URL на наличие паттернов качества
    const scaleMatch = slide.imageUrl.match(/scale[=:](\d+\.?\d*)/i);
    if (scaleMatch) {
      return parseFloat(scaleMatch[1]);
    }
    
    // По умолчанию возвращаем 2x (High)
    return 2;
  };

  const regeneratePreview = async (slide: DraftSlide, scale: number = 2) => {
    try {
      setProcessing(slide.id);
      // Получаем полную информацию о слайде, чтобы иметь figmaFileId
      const slideResp = await fetch(`/api/slides/${slide.id}`);
      if (!slideResp.ok) throw new Error('Slide fetch failed');
      const slideData = await slideResp.json();

      console.log(`🔄 Regenerating preview with scale: ${scale} for slide ${slide.id}`);

      const proxyResp = await fetch('/api/figma/image-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: slideData.figmaFileId,
          nodeId: slide.figmaNodeId,
          scale: scale // Используем переданный масштаб
        })
      });

      if (!proxyResp.ok) {
        const err = await proxyResp.json();
        console.error('❌ Failed to get preview:', err);
        alert(`Не удалось получить превью: ${err.error || proxyResp.status}`);
        return;
      }

      const { imageUrl } = await proxyResp.json();
      if (!imageUrl) {
        alert('Figma не вернула URL изображения');
        return;
      }

      console.log(`✅ Got new image URL: ${imageUrl.substring(0, 50)}...`);

      // Сохраняем в базе
      const updateResp = await fetch(`/api/slides/${slide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });

      if (!updateResp.ok) {
        const err = await updateResp.json();
        console.error('❌ Failed to update slide:', err);
        alert('Не удалось сохранить новое превью в базу данных');
        return;
      }

      const updatedSlide = await updateResp.json();
      console.log('✅ Slide updated in database');

      // Обновляем в состоянии с timestamp для принудительного обновления изображения
      const updatedImageUrl = `${imageUrl}?t=${Date.now()}`;
      setDraftSlides(prev => prev.map(s => 
        s.id === slide.id ? { ...s, imageUrl: updatedImageUrl, _qualityScale: scale } : s
      ));
      
      // Также обновляем selectedSlide если он открыт
      if (selectedSlide && selectedSlide.id === slide.id) {
        setSelectedSlide({ ...selectedSlide, imageUrl: updatedImageUrl, _qualityScale: scale });
      }
      
      // Обновляем fullSlideData
      if (fullSlideData && fullSlideData.id === slide.id) {
        setFullSlideData({ ...fullSlideData, imageUrl: updatedImageUrl, _qualityScale: scale });
      }
      
      alert(`Превью обновлено с качеством ${scale}x!`);
    } catch (error) {
      console.error('Error regenerating preview:', error);
      alert('Ошибка при обновлении превью: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setProcessing(null);
    }
  };

  const openInFigma = async (slide: DraftSlide) => {
    try {
      // Получаем полную информацию о слайде
      const response = await fetch(`/api/slides/${slide.id}`);
      if (!response.ok) return;
      
      const slideData = await response.json();
      const figmaFileId = slideData.figmaFileId;
      
      if (!figmaFileId) {
        alert('Figma File ID not found');
        return;
      }
      
      // Конвертируем nodeId в формат URL (заменяем : на -)
      const nodeId = slide.figmaNodeId.replace(/:/g, '-');
      const figmaUrl = `https://www.figma.com/file/${figmaFileId}?node-id=${nodeId}`;
      
      // Открываем в новой вкладке
      window.open(figmaUrl, '_blank');
    } catch (error) {
      console.error('Error opening in Figma:', error);
      alert('Failed to open in Figma');
    }
  };

  // Функции массовых операций
  const toggleSlideSelection = (slideId: string) => {
    const newSelected = new Set(selectedSlides);
    if (newSelected.has(slideId)) {
      newSelected.delete(slideId);
    } else {
      newSelected.add(slideId);
    }
    setSelectedSlides(newSelected);
  };

  const selectAllSlides = () => {
    if (selectedSlides.size === draftSlides.length) {
      setSelectedSlides(new Set());
    } else {
      setSelectedSlides(new Set(draftSlides.map(s => s.id)));
    }
  };

  const bulkExtractText = async () => {
    if (selectedSlides.size === 0) return;
    
    setBulkProcessing(true);
    const selectedArray = Array.from(selectedSlides);
    let processed = 0;
    
    for (const slideId of selectedArray) {
      try {
        const response = await fetch(`/api/slides/${slideId}/extract-text`, {
          method: 'POST',
        });
        if (response.ok) {
          const data = await response.json();
          setDraftSlides(prev => prev.map(slide => 
            slide.id === slideId 
              ? { 
                  ...slide, 
                  extractedText: data.extractedText, 
                  tags: data.tags,
                  title: data.suggestedTitle || slide.title,
                  // Добавляем автозаполненные метаданные
                  status: data.autoFilledMetadata?.updated?.status || slide.status,
                  format: data.autoFilledMetadata?.updated?.format || slide.format,
                  language: data.autoFilledMetadata?.updated?.language || slide.language,
                  region: data.autoFilledMetadata?.updated?.region || slide.region,
                  domain: data.autoFilledMetadata?.updated?.domain || slide.domain,
                  department: data.autoFilledMetadata?.updated?.department || slide.department,
                  authorName: data.autoFilledMetadata?.updated?.authorName || slide.authorName,
                  isCaseStudy: data.autoFilledMetadata?.updated?.isCaseStudy !== undefined 
                    ? data.autoFilledMetadata.updated.isCaseStudy 
                    : slide.isCaseStudy,
                  yearStart: data.autoFilledMetadata?.updated?.yearStart || slide.yearStart,
                  yearFinish: data.autoFilledMetadata?.updated?.yearFinish || slide.yearFinish
                }
              : slide
          ));
          processed++;
        }
      } catch (error) {
        console.error(`Error extracting text for slide ${slideId}:`, error);
      }
    }
    
    setBulkProcessing(false);
    alert(`Processed ${processed} of ${selectedArray.length} slides`);
    setSelectedSlides(new Set());
  };

  const bulkPublish = async () => {
    if (selectedSlides.size === 0) return;
    if (!confirm(`Publish ${selectedSlides.size} slides?`)) return;
    
    setBulkProcessing(true);
    const selectedArray = Array.from(selectedSlides);
    let published = 0;
    
    for (const slideId of selectedArray) {
      try {
        // Используем PATCH вместо отдельного publish endpoint
        const response = await fetch(`/api/slides/${slideId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isActive: true,
            status: 'approved'
          }),
        });
        if (response.ok) {
          published++;
        } else {
          console.error(`Failed to publish slide ${slideId}:`, await response.json());
        }
      } catch (error) {
        console.error(`Error publishing slide ${slideId}:`, error);
      }
    }
    
    // Убираем опубликованные слайды из списка
    setDraftSlides(prev => prev.filter(slide => !selectedSlides.has(slide.id)));
    
    setBulkProcessing(false);
    alert(`Published ${published} of ${selectedArray.length} slides`);
    setSelectedSlides(new Set());
  };

  const bulkDelete = async () => {
    if (selectedSlides.size === 0) return;
    if (!confirm(`Delete ${selectedSlides.size} slides? This action cannot be undone.`)) return;
    
    setBulkProcessing(true);
    const selectedArray = Array.from(selectedSlides);
    let deleted = 0;
    
    for (const slideId of selectedArray) {
      try {
        const response = await fetch(`/api/slides/${slideId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          deleted++;
        }
      } catch (error) {
        console.error(`Error deleting slide ${slideId}:`, error);
      }
    }
    
    // Убираем удаленные слайды из списка
    setDraftSlides(prev => prev.filter(slide => !selectedSlides.has(slide.id)));
    
    setBulkProcessing(false);
    alert(`Deleted ${deleted} of ${selectedArray.length} slides`);
    setSelectedSlides(new Set());
  };

  const bulkRegeneratePreview = async (scale: number) => {
    if (selectedSlides.size === 0) return;
    
    setBulkProcessing(true);
    const selectedArray = Array.from(selectedSlides);
    let processed = 0;
    
    for (const slideId of selectedArray) {
      try {
        const slide = draftSlides.find(s => s.id === slideId);
        if (!slide) continue;
        
        const slideResp = await fetch(`/api/slides/${slideId}`);
        if (!slideResp.ok) continue;
        const slideData = await slideResp.json();

        const proxyResp = await fetch('/api/figma/image-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: slideData.figmaFileId,
            nodeId: slide.figmaNodeId,
            scale: scale
          })
        });

        if (proxyResp.ok) {
          const { imageUrl } = await proxyResp.json();
          if (imageUrl) {
            await fetch(`/api/slides/${slideId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl })
            });

            setDraftSlides(prev => prev.map(s => 
              s.id === slideId ? { ...s, imageUrl } : s
            ));
            processed++;
          }
        }
      } catch (error) {
        console.error(`Error regenerating preview for slide ${slideId}:`, error);
      }
    }
    
    setBulkProcessing(false);
    alert(`Updated preview for ${processed} of ${selectedArray.length} slides`);
    setSelectedSlides(new Set());
  };

  const bulkUpdateMetadata = async (updates: any) => {
    if (selectedSlides.size === 0) return;
    
    console.log('🔄 Bulk updating metadata:', updates);
    setBulkProcessing(true);
    const selectedArray = Array.from(selectedSlides);
    let updated = 0;
    
    for (const slideId of selectedArray) {
      try {
        console.log(`📤 Updating slide ${slideId} with:`, updates);
        const response = await fetch(`/api/slides/${slideId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        
        if (response.ok) {
          const responseData = await response.json();
          console.log(`✅ Successfully updated slide ${slideId}:`, responseData);
          
          setDraftSlides(prev => prev.map(slide => 
            slide.id === slideId ? { ...slide, ...updates } : slide
          ));
          updated++;
        } else {
          const errorData = await response.text();
          console.error(`❌ Failed to update slide ${slideId}:`, response.status, errorData);
        }
      } catch (error) {
        console.error(`💥 Error updating slide ${slideId}:`, error);
      }
    }
    
    setBulkProcessing(false);
    alert(`Updated ${updated} of ${selectedArray.length} slides`);
    setSelectedSlides(new Set());
    setShowBulkEditModal(false);
  };

  // Загружаем полные данные слайда при его выборе
  useEffect(() => {
    if (selectedSlide) {
      loadFullSlideData(selectedSlide.id);
    } else {
      setFullSlideData(null);
    }
  }, [selectedSlide]);

  const loadFullSlideData = async (slideId: string) => {
    try {
      const response = await fetch(`/api/slides/${slideId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Full slide data loaded:', data);
        setFullSlideData(data);
      }
    } catch (error) {
      console.error('Error loading full slide data:', error);
    }
  };

  // Сортировка слайдов
  function getSortedSlides(slides: DraftSlide[]) {
    const sorted = [...slides];
    switch (sortType) {
      case 'category':
        sorted.sort((a, b) => {
          const aCat = a.categories?.[0]?.category?.name || '';
          const bCat = b.categories?.[0]?.category?.name || '';
          return aCat.localeCompare(bCat);
        });
        break;
      case 'status':
        sorted.sort((a, b) => {
          const aStatus = a.status || '';
          const bStatus = b.status || '';
          return aStatus.localeCompare(bStatus);
        });
        break;
      case 'autoextract':
        sorted.sort((a, b) => {
          const aHas = !!a.extractedText;
          const bHas = !!b.extractedText;
          return (aHas === bHas) ? 0 : aHas ? -1 : 1;
        });
        break;
      case 'date':
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    return sorted;
  }

  const loadDuplicates = async () => {
    setDuplicatesLoading(true);
    try {
      const response = await fetch(`/api/slides/duplicates?threshold=${duplicateThreshold}`);
      if (response.ok) {
        const data = await response.json();
        setDuplicateGroups(data.groups);
      }
    } catch (error) {
      console.error('Error loading duplicates:', error);
    } finally {
      setDuplicatesLoading(false);
    }
  };

  // Загружаем дубликаты при переключении на вкладку
  useEffect(() => {
    if (activeTab === 'duplicates') {
      loadDuplicates();
    }
  }, [activeTab, duplicateThreshold]);

  // Показываем загрузку пока проверяем авторизацию
  if (auth.isLoading || !authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Checking authorization...</div>
      </div>
    );
  }

  // Если пользователь не авторизован или не админ, ничего не показываем (будет редирект)
  if (!auth.user || !auth.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading draft slides...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Library
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Moderation Queue</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {draftSlides.length} slides pending review
              </span>
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <div className="flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Admin Mode
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Вкладки */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('drafts')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'drafts' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Draft Slides ({draftSlides.length})
            </button>
            <button
              onClick={() => setActiveTab('duplicates')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'duplicates' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Duplicates
            </button>
          </div>
        </div>

        {/* Контент вкладок */}
        {activeTab === 'drafts' ? (
          // Существующий контент для drafts
          <>
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                Review and prepare imported slides before publishing them to the library
              </p>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-yellow-400 text-gray-800 rounded-lg hover:bg-yellow-500 transition-colors flex items-center font-medium shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Import More Slides
              </button>
            </div>
          </div>

          {draftSlides.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No slides pending moderation</h3>
              <p className="text-gray-500 mb-6">All imported slides have been reviewed and published</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Published Slides
              </button>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Total Drafts</p>
                      <p className="text-lg font-semibold text-gray-900">{draftSlides.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Processed</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {draftSlides.filter(s => s.extractedText).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Pending</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {draftSlides.filter(s => !s.extractedText).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m3 0H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Categories</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Set(draftSlides.flatMap(s => s.categories?.map((catRel: any) => catRel.categoryId) || ['uncategorized'])).size}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {draftSlides.length > 0 && (
            <>
              {/* Toolbar для массовых операций */}
              {selectedSlides.size > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={selectAllSlides}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                      >
                        {selectedSlides.size === draftSlides.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="text-sm text-gray-600">
                      Selected: {selectedSlides.size} of {draftSlides.length}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowBulkEditModal(true)}
                        disabled={bulkProcessing}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors"
                      >
                        {bulkProcessing ? 'Editing...' : `Edit Metadata (${selectedSlides.size})`}
                      </button>
                      
                      <button
                        onClick={bulkExtractText}
                        disabled={bulkProcessing}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        {bulkProcessing ? 'Processing...' : `Extract Text (${selectedSlides.size})`}
                      </button>
                      
                      <button
                        onClick={bulkPublish}
                        disabled={bulkProcessing}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors"
                      >
                        {bulkProcessing ? 'Publishing...' : `Publish (${selectedSlides.size})`}
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={() => setShowQualityMenu(showQualityMenu === 'bulk' ? null : 'bulk')}
                          disabled={bulkProcessing}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
                        >
                          {bulkProcessing ? 'Updating...' : `Update Preview (${selectedSlides.size}) ▼`}
                        </button>
                        
                        {showQualityMenu === 'bulk' && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-[160px]">
                            <button
                              onClick={() => {
                                bulkRegeneratePreview(0.5);
                                setShowQualityMenu(null);
                              }}
                              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Low (0.5x)
                            </button>
                            <button
                              onClick={() => {
                                bulkRegeneratePreview(1);
                                setShowQualityMenu(null);
                              }}
                              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Medium (1x)
                            </button>
                            <button
                              onClick={() => {
                                bulkRegeneratePreview(2);
                                setShowQualityMenu(null);
                              }}
                              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
                            >
                              High (2x) ✓
                            </button>
                            <button
                              onClick={() => {
                                bulkRegeneratePreview(3);
                                setShowQualityMenu(null);
                              }}
                              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Ultra (3x)
                            </button>
                            <button
                              onClick={() => {
                                bulkRegeneratePreview(4);
                                setShowQualityMenu(null);
                              }}
                              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Max (4x)
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={bulkDelete}
                        disabled={bulkProcessing}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                      >
                        {bulkProcessing ? 'Deleting...' : `Delete (${selectedSlides.size})`}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Toolbar для сортировки */}
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortType}
                  onChange={e => setSortType(e.target.value as any)}
                  className="border rounded px-2 py-1 text-sm bg-white text-gray-900 appearance-none"
                >
                  <option value="date">Date (Newest First)</option>
                  <option value="category">Category</option>
                  <option value="status">Status</option>
                  <option value="autoextract">Auto Extract</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Используем sortedSlides вместо draftSlides */}
                {getSortedSlides(draftSlides).map((slide) => (
                <div key={slide.id} className="bg-white rounded-lg shadow-md overflow-hidden relative">
                  {/* Checkbox для массового выбора */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedSlides.has(slide.id)}
                      onChange={() => toggleSlideSelection(slide.id)}
                      className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 shadow-lg"
                    />
                  </div>
                  
                  <div className="relative aspect-video bg-gray-100">
                    <img
                      src={
                        slide.imageUrl && slide.imageUrl !== ''
                          ? slide.imageUrl
                          : slide.figmaFileId && slide.figmaNodeId
                          ? `/api/figma/image-proxy?fileId=${slide.figmaFileId}&nodeId=${slide.figmaNodeId}`
                          : `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=${encodeURIComponent(slide.title)}`
                      }
                      alt={slide.title}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Если основной URL не работает, пробуем API proxy
                        if (slide.figmaFileId && slide.figmaNodeId && !target.src.includes('/api/figma/image-proxy')) {
                          target.src = `/api/figma/image-proxy?fileId=${slide.figmaFileId}&nodeId=${slide.figmaNodeId}`;
                        } else {
                          // Fallback to placeholder
                          target.src = `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=${encodeURIComponent(slide.title)}`;
                        }
                      }}
                    />

                    {/* Кнопки управления превью */}
                    <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => setSelectedSlide(slide)}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all shadow-sm"
                          title="Edit slide"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setPreviewSlide(slide)}
                          className="p-1.5 bg-white bg-opacity-90 text-gray-700 rounded hover:bg-opacity-100 transition-all shadow-sm"
                          title="Enlarge preview"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openInFigma(slide)}
                          className="p-1.5 bg-white bg-opacity-90 text-gray-700 rounded hover:bg-opacity-100 transition-all shadow-sm"
                          title="Open in Figma"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setShowQualityMenu(showQualityMenu === slide.id ? null : slide.id)}
                            disabled={processing === slide.id}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-all shadow-sm flex items-center gap-1"
                          >
                            {processing === slide.id ? 'Updating...' : 'Quality ▼'}
                          </button>
                          
                          {showQualityMenu === slide.id && (
                            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-[120px]">
                              {[
                                { label: 'Low (0.5x)', scale: 0.5 },
                                { label: 'Medium (1x)', scale: 1 },
                                { label: 'High (2x)', scale: 2 },
                                { label: 'Ultra (3x)', scale: 3 },
                                { label: 'Max (4x)', scale: 4 }
                              ].map(({ label, scale: qualityScale }) => {
                                const currentQuality = getCurrentQuality(slide);
                                const isSelected = Math.abs(currentQuality - qualityScale) < 0.1; // Учитываем погрешность для float
                                
                                return (
                                  <button
                                    key={qualityScale}
                                    onClick={() => {
                                      regeneratePreview(slide, qualityScale);
                                      setShowQualityMenu(null);
                                    }}
                                    className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 hover:text-gray-900 flex items-center justify-between ${
                                      isSelected 
                                        ? 'bg-blue-50 text-blue-700 font-medium' 
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    <span>{label}</span>
                                    {isSelected && <span className="text-blue-600">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 truncate text-readable">{slide.title}</h3>
                    <p className="text-sm text-readable-muted mb-2">
                      Category: <span className="font-medium text-readable">
                        {slide.categories && slide.categories.length > 0 
                          ? slide.categories.map((catRel: any) => catRel.category?.name || 'Uncategorized').join(', ')
                          : 'Uncategorized'
                        }
                      </span>
                    </p>
                    <p className="text-xs text-readable-muted mb-3">
                      From: {slide.figmaFileName}
                    </p>

                    {/* Metadata display */}
                    {(slide.status || slide.department || slide.authorName || slide.domain || slide.region || slide.format || slide.language) && (
                      <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                        <div className="grid grid-cols-2 gap-1">
                          {slide.status && (
                            <div>
                              <span className="font-medium text-gray-600">Status:</span>
                              <span className={`ml-1 inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                                slide.status === 'approved' ? 'bg-green-100 text-green-700' :
                                slide.status === 'in_review' ? 'bg-yellow-100 text-yellow-700' :
                                slide.status === 'archived' ? 'bg-gray-100 text-gray-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {slide.status === 'in_review' ? 'In Review' : 
                                 slide.status.charAt(0).toUpperCase() + slide.status.slice(1)}
                              </span>
                            </div>
                          )}
                          {/* Solution Areas */}
                          {(slide as any).solutionAreas && (slide as any).solutionAreas.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-600">Areas:</span>
                              <span className="ml-1 text-gray-700">
                                {(slide as any).solutionAreas.map((sa: any) => sa.solutionArea.name).join(', ')}
                              </span>
                            </div>
                          )}
                          {/* Department */}
                          {slide.department && !(slide as any).solutionAreas?.length && (
                            <div>
                              <span className="font-medium text-gray-600">Dept:</span>
                              <span className="ml-1 text-gray-700">{slide.department}</span>
                            </div>
                          )}
                          {slide.authorName && (
                            <div>
                              <span className="font-medium text-gray-600">Author:</span>
                              <span className="ml-1 text-gray-700">{slide.authorName}</span>
                            </div>
                          )}
                          {slide.domain && (
                            <div>
                              <span className="font-medium text-gray-600">Domain:</span>
                              <span className="ml-1 text-gray-700">{slide.domain}</span>
                            </div>
                          )}
                          {slide.region && (
                            <div>
                              <span className="font-medium text-gray-600">Region:</span>
                              <span className="ml-1 text-gray-700">{slide.region.toUpperCase()}</span>
                            </div>
                          )}
                          {slide.format && (
                            <div>
                              <span className="font-medium text-gray-600">Format:</span>
                              <span className="ml-1 text-gray-700">{slide.format}</span>
                            </div>
                          )}
                          {slide.language && (
                            <div>
                              <span className="font-medium text-gray-600">Lang:</span>
                              <span className="ml-1 text-gray-700">{slide.language.toUpperCase()}</span>
                            </div>
                          )}
                          {slide.isCaseStudy && (
                            <div>
                              <span className="font-medium text-gray-600">Case Study:</span>
                              <span className="ml-1 inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                Yes
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {slide.extractedText && (
                      <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded text-xs">
                        <p className="font-medium mb-1 text-readable-muted">Extracted text:</p>
                        <p className="text-readable text-sm leading-relaxed">{slide.extractedText}</p>
                      </div>
                    )}

                    {slide.tags && slide.tags.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium mb-2 text-readable-muted">Auto-generated tags:</p>
                        <div className="flex flex-wrap gap-1">
                          {slide.tags.map(tag => (
                            <span key={tag.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedSlide(slide)}
                        className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                      >
                        Edit Details
                      </button>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => extractTextForSlide(slide.id)}
                          disabled={processing === slide.id}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm disabled:opacity-50"
                        >
                          {processing === slide.id ? 'Processing...' : 'Auto Extract'}
                        </button>
                        
                        <button
                          onClick={() => publishSlide(slide.id)}
                          className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                        >
                          Publish
                        </button>
                        
                        <button
                          onClick={() => deleteSlide(slide.id)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                          ))}
              </div>
            </>
          )}

          {/* Bulk metadata editing modal */}
          {showBulkEditModal && (
            <BulkEditModal
              isOpen={showBulkEditModal}
              onClose={() => setShowBulkEditModal(false)}
              onSave={bulkUpdateMetadata}
              selectedCount={selectedSlides.size}
              isLoading={bulkProcessing}
              categories={categories}
            />
          )}

          {/* Import Modal */}
          <ImportModal 
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImportComplete={() => {
              setShowImportModal(false);
              loadDraftSlides(); // Перезагружаем список после импорта
            }}
          />
        </>
        ) : (
          // Контент для вкладки duplicates
          <div>
            {/* Настройки порога схожести */}
            <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">
                    Similarity Threshold:
                  </label>
                  <select
                    value={duplicateThreshold}
                    onChange={(e) => setDuplicateThreshold(parseFloat(e.target.value))}
                    className="border rounded px-3 py-1 text-sm bg-white text-gray-900"
                  >
                    <option value="0.5">50%</option>
                    <option value="0.6">60%</option>
                    <option value="0.7">70%</option>
                    <option value="0.8">80%</option>
                    <option value="0.9">90%</option>
                  </select>
                  <button
                    onClick={loadDuplicates}
                    disabled={duplicatesLoading}
                    className="px-4 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm disabled:opacity-50"
                  >
                    {duplicatesLoading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Found {duplicateGroups.length} duplicate groups
                </div>
              </div>
            </div>

            {duplicatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg">Loading duplicates...</div>
              </div>
            ) : duplicateGroups.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No duplicates found</h3>
                <p className="text-gray-500">All slides appear to be unique with the current threshold</p>
              </div>
            ) : (
              <div className="space-y-8">
                {duplicateGroups.map((group, groupIndex) => (
                  <div key={group.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Duplicate Group {groupIndex + 1}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {group.slides.length} similar slides (max similarity: {(group.maxSimilarity * 100).toFixed(1)}%)
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.slides.map((item: any, slideIndex: number) => {
                        const slide = item.slide;
                        const similarity = item.similarity;
                        const isOriginal = slideIndex === 0;
                        
                        return (
                          <div key={slide.id} className={`relative ${isOriginal ? 'ring-2 ring-blue-500' : ''}`}>
                            {/* Бейдж схожести */}
                            <div className={`absolute top-2 left-2 z-20 px-2 py-1 rounded text-xs font-medium ${
                              isOriginal 
                                ? 'bg-blue-500 text-white' 
                                : similarity >= 0.9 
                                  ? 'bg-red-500 text-white'
                                  : similarity >= 0.8
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-yellow-500 text-white'
                            }`}>
                              {isOriginal ? 'Original' : `${(similarity * 100).toFixed(1)}% match`}
                            </div>
                            
                            {/* Бейдж статуса публикации */}
                            <div className={`absolute top-2 right-2 z-20 px-2 py-1 rounded text-xs font-medium ${
                              slide.isActive 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-500 text-white'
                            }`}>
                              {slide.isActive ? 'Published' : 'Draft'}
                            </div>
                            
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                              <div className="relative aspect-video bg-gray-100">
                                {slide.imageUrl ? (
                                  <img
                                    src={slide.imageUrl}
                                    alt={slide.title}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-gray-400">
                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-4">
                                <h4 className="font-medium text-gray-900 mb-1 truncate">{slide.title}</h4>
                                <p className="text-xs text-gray-600 mb-2">
                                  Status: <span className={`font-medium ${slide.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                                    {slide.isActive ? 'Published' : slide.status || 'draft'}
                                  </span> • ID: {slide.id.slice(-6)}
                                </p>
                                
                                {slide.extractedText && (
                                  <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                    <p className="text-gray-700 line-clamp-3">{slide.extractedText}</p>
                                  </div>
                                )}
                                
                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      // Загружаем полные данные слайда перед открытием модального окна
                                      try {
                                        const response = await fetch(`/api/slides/${slide.id}`);
                                        if (response.ok) {
                                          const fullData = await response.json();
                                          // Преобразуем данные в формат DraftSlide
                                          const draftSlide: DraftSlide = {
                                            id: fullData.id,
                                            title: fullData.title,
                                            description: fullData.description,
                                            figmaFileId: fullData.figmaFileId,
                                            figmaNodeId: fullData.figmaNodeId,
                                            figmaFileName: fullData.figmaFileName,
                                            imageUrl: fullData.imageUrl,
                                            extractedText: fullData.extractedText,
                                            status: fullData.status,
                                            format: fullData.format,
                                            language: fullData.language,
                                            region: fullData.region,
                                            domain: fullData.domain,
                                            authorName: fullData.authorName,
                                            department: fullData.department,
                                            isCaseStudy: fullData.isCaseStudy,
                                            yearStart: fullData.yearStart,
                                            yearFinish: fullData.yearFinish,
                                            createdAt: typeof fullData.createdAt === 'string' ? fullData.createdAt : new Date(fullData.createdAt).toISOString(),
                                            categories: (fullData as any).SlideCategory || [],
                                            tags: fullData.tags || [],
                                            products: fullData.products || [],
                                            components: fullData.components || [],
                                            integrations: fullData.integrations || [],
                                            solutionAreas: (fullData as any).solutionAreas || [],
                                            SlideConfidentiality: (fullData as any).SlideConfidentiality || []
                                          };
                                          // ВАЖНО: Устанавливаем и selectedSlide и fullSlideData для правильной работы модального окна
                                          setSelectedSlide(draftSlide);
                                          // Преобразуем createdAt в Date для SlideEditModal (если это строка)
                                          setFullSlideData({
                                            ...fullData,
                                            createdAt: typeof fullData.createdAt === 'string' ? new Date(fullData.createdAt) : fullData.createdAt,
                                            updatedAt: typeof fullData.updatedAt === 'string' ? new Date(fullData.updatedAt) : fullData.updatedAt
                                          });
                                        } else {
                                          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                                          console.error('Failed to load slide details:', errorData);
                                          alert(`Не удалось загрузить детали слайда: ${errorData.error || 'Ошибка подключения к базе данных'}`);
                                        }
                                      } catch (error: any) {
                                        console.error('Error loading slide details:', error);
                                        alert(`Ошибка при загрузке деталей слайда: ${error.message || 'Проверьте подключение к базе данных'}`);
                                      }
                                    }}
                                    className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete slide "${slide.title}"?`)) {
                                        deleteSlide(slide.id);
                                        // Перезагружаем дубликаты после удаления
                                        setTimeout(loadDuplicates, 500);
                                      }
                                    }}
                                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Модальное окно редактирования слайда - доступно в обеих вкладках */}
        {selectedSlide && (
          <SlideEditModal
            slide={fullSlideData || {
              ...selectedSlide,
              figmaFileId: selectedSlide.figmaFileId || '',
              version: '1.0',
              isActive: false,
              viewCount: 0,
              useCount: 0,
              updatedAt: new Date(),
              tags: selectedSlide.tags?.map(tag => ({
                id: tag.id,
                slideId: selectedSlide.id,
                tagId: tag.id,
                tag: {
                  ...tag,
                  isAutomatic: true,
                  usageCount: 0,
                  createdAt: new Date()
                }
              })) || []
            } as any}
            isOpen={true}
            onClose={() => {
              setSelectedSlide(null);
              setFullSlideData(null);
            }}
            onSave={async (updates) => {
              await updateSlide(selectedSlide.id, updates);
              // Перезагружаем данные после сохранения
              await loadDraftSlides();
              // Если открыта вкладка дубликатов, перезагружаем и их
              if (activeTab === 'duplicates') {
                await loadDuplicates();
              }
              setSelectedSlide(null);
              setFullSlideData(null);
            }}
          />
        )}

        {/* Модальное окно для увеличенного превью - доступно в обеих вкладках */}
        {previewSlide && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setPreviewSlide(null)}>
            <div className="relative w-full h-full flex items-center justify-center p-8" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-4 right-4 flex gap-2 z-50">
                <button
                  onClick={() => {
                    setSelectedSlide(previewSlide);
                    setPreviewSlide(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 font-medium"
                  title="Edit slide"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => openInFigma(previewSlide)}
                  className="p-2 bg-white bg-opacity-90 text-gray-700 rounded hover:bg-opacity-100 transition-all shadow-md"
                  title="Open in Figma"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPreviewSlide(null)}
                  className="p-2 bg-white bg-opacity-90 text-gray-700 rounded hover:bg-opacity-100 transition-all shadow-md"
                  title="Close (ESC)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-white rounded-lg overflow-auto max-w-full max-h-full">
                <div className="sticky top-0 bg-white border-b p-4 z-10">
                  <h3 className="text-lg font-semibold">{previewSlide.title}</h3>
                  <p className="text-sm text-gray-600">From: {previewSlide.figmaFileName} • Node: {previewSlide.figmaNodeId}</p>
                  <p className="text-xs text-gray-500 mt-1">Tip: Click on image to view at 100% scale. Use mouse wheel to scroll.</p>
                </div>
                
                <div className="p-4">
                  {previewSlide.imageUrl ? (
                    <img
                      src={previewSlide.imageUrl}
                      alt={previewSlide.title}
                      className="max-w-none cursor-zoom-in"
                      style={{ width: 'auto', height: 'auto' }}
                      onClick={(e) => {
                        const img = e.currentTarget;
                        if (img.style.maxWidth === 'none') {
                          img.style.maxWidth = '100%';
                          img.style.cursor = 'zoom-in';
                        } else {
                          img.style.maxWidth = 'none';
                          img.style.cursor = 'zoom-out';
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-96 bg-gray-100 text-gray-400">
                      No preview available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for bulk metadata editing
interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: any) => void;
  selectedCount: number;
  isLoading: boolean;
  categories: ApiCategory[];
}

function BulkEditModal({ isOpen, onClose, onSave, selectedCount, isLoading, categories }: BulkEditModalProps) {
  const { metadata, loading: metadataLoading } = useMetadata();
  const [formData, setFormData] = useState({
    categoryIds: [] as string[],
    status: '',
    format: '',
    language: '',
    region: '',
    domain: '',
    authorName: '',
    department: '',
    isCaseStudy: '',
    yearStart: '',
    yearFinish: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create updates object only with filled fields
    const updates: any = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'categoryIds') {
        if (Array.isArray(value) && value.length > 0) {
          updates[key] = value;
        }
      } else if (value !== '') {
        if (value === 'none' || (key === 'authorName' && typeof value === 'string' && value.toLowerCase() === 'none')) {
          // "none" means clear the field
          updates[key] = null;
        } else if (key === 'isCaseStudy') {
          updates[key] = value === 'true';
        } else if (key === 'yearStart' || key === 'yearFinish') {
          const numValue = parseInt(value as string);
          if (numValue === 0) {
            updates[key] = null; // 0 means clear the year field
          } else if (numValue > 0) {
            updates[key] = numValue;
          }
        } else {
          updates[key] = value;
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      alert('Please select at least one field to update');
      return;
    }

    onSave(updates);
  };

  const handleReset = () => {
    setFormData({
      categoryIds: [],
      status: '',
      format: '',
      language: '',
      region: '',
      domain: '',
      authorName: '',
      department: '',
      isCaseStudy: '',
      yearStart: '',
      yearFinish: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Bulk Edit Metadata ({selectedCount} slides)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <strong>Instructions:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Fill only the fields you want to update</li>
              <li>• Empty fields = no change</li>
              <li>• "None (clear)" option = remove current value</li>
              <li>• Search available in all dropdown fields</li>
              <li>• For text fields: type "none" to clear, for years: enter 0 to clear</li>
              <li>• Categories: select multiple categories to apply to all slides</li>
            </ul>
          </div>

          {/* Main Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="space-y-2">
                <MultiSelect
                  options={Array.isArray(categories) ? categories.flatMap(category => {
                    const options = [{ value: category.id, label: category.name }];
                    if (category.children && Array.isArray(category.children)) {
                      options.push(...category.children.map(child => ({
                        value: child.id,
                        label: `${category.name} > ${child.name}`
                      })));
                    }
                    return options;
                  }) : []}
                  value={formData.categoryIds}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryIds: value }))}
                  placeholder="Select categories"
                  className="w-full"
                />
                {formData.categoryIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, categoryIds: [] }))}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear categories
                  </button>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Autocomplete
                options={[
                  { value: '', label: 'No change' },
                  { value: 'none', label: 'None (clear)' },
                  ...(metadata?.statuses?.map((status: any) => ({ value: status.code, label: status.name })) || [])
                ]}
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                placeholder="Select status"
                searchPlaceholder="Search status..."
                className="w-full"
              />
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <Autocomplete
                options={[
                  { value: '', label: 'No change' },
                  { value: 'none', label: 'None (clear)' },
                  ...(metadata?.formats?.map((format: any) => ({ value: format.code, label: format.name })) || [])
                ]}
                value={formData.format}
                onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
                placeholder="Select format"
                searchPlaceholder="Search format..."
                className="w-full"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <Autocomplete
                options={[
                  { value: '', label: 'No change' },
                  { value: 'none', label: 'None (clear)' },
                  ...(metadata?.languages?.map((lang: any) => ({ value: lang.code, label: lang.name })) || [])
                ]}
                value={formData.language}
                onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                placeholder="Select language"
                searchPlaceholder="Search language..."
                className="w-full"
              />
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <Autocomplete
                options={[
                  { value: '', label: 'No change' },
                  { value: 'none', label: 'None (clear)' },
                  ...(metadata?.regions?.map((region: any) => ({ value: region.code, label: region.name })) || [])
                ]}
                value={formData.region}
                onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
                placeholder="Select region"
                searchPlaceholder="Search region..."
                className="w-full"
              />
            </div>

            {/* Case Study */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Study
              </label>
              <Autocomplete
                options={[
                  { value: '', label: 'No change' },
                  { value: 'none', label: 'None (clear)' },
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' }
                ]}
                value={formData.isCaseStudy}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isCaseStudy: value }))}
                placeholder="Select case study"
                searchPlaceholder="Search..."
                className="w-full"
              />
            </div>
          </div>

          {/* Text Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Domain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain
              </label>
              <Autocomplete
                options={[
                  { value: '', label: 'No change' },
                  { value: 'none', label: 'None (clear)' },
                  ...(metadata?.domains?.map((domain: any) => ({ value: domain.name, label: domain.name })) || [])
                ]}
                value={formData.domain}
                onValueChange={(value) => setFormData(prev => ({ ...prev, domain: value }))}
                placeholder="Select domain"
                searchPlaceholder="Search domain..."
                className="w-full"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author
                <span className="text-xs text-gray-500 ml-2">(Leave empty = no change, type "none" = clear)</span>
              </label>
              <input
                type="text"
                value={formData.authorName}
                onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                placeholder="Author name, or type 'none' to clear"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            {/* Solution Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solution Areas
              </label>
              <Autocomplete
                options={[
                  { value: '', label: 'No change' },
                  { value: 'none', label: 'None (clear)' },
                  ...(metadata?.solutionAreas?.map((area: any) => ({ value: area.code, label: area.name })) || [])
                ]}
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                placeholder="Select solution areas"
                searchPlaceholder="Search solution areas..."
                className="w-full"
              />
            </div>
          </div>

          {/* Years */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Start Year
                <span className="text-xs text-gray-500 ml-2">(Empty = no change, 0 = clear)</span>
              </label>
              <input
                type="number"
                value={formData.yearStart}
                onChange={(e) => setFormData(prev => ({ ...prev, yearStart: e.target.value }))}
                min="0"
                max="2030"
                placeholder="2023 or 0 to clear"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project End Year
                <span className="text-xs text-gray-500 ml-2">(Empty = no change, 0 = clear)</span>
              </label>
              <input
                type="number"
                value={formData.yearFinish}
                onChange={(e) => setFormData(prev => ({ ...prev, yearFinish: e.target.value }))}
                min="0"
                max="2030"
                placeholder="2024 or 0 to clear"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Reset All
            </button>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Updating...' : `Update ${selectedCount} slides`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 