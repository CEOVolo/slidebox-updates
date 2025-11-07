'use client';

import { useState, useEffect } from 'react';
import { X, Save, Tag, Folder, Trash2, FileText, Info, Globe, Calendar, Settings } from 'lucide-react';
import { Slide, CATEGORIES, findCategoryById, METADATA_OPTIONS } from '@/lib/types';
import { Autocomplete, MultiSelect } from '@/components/ui/autocomplete';
import CategoryDropdown from '@/components/CategoryDropdown';
import { useMetadata } from '@/contexts/MetadataContext';

interface SlideEditModalProps {
  slide: Slide | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (slideData: Partial<Slide>) => Promise<void>;
  onDelete?: (slideId: string) => Promise<void>;
}

// Helper to flatten all categories and subcategories for MultiSelect
function flattenCategories(categories: any[]): Array<{ value: string, label: string }> {
  const result: Array<{ value: string, label: string }> = [];
  function traverse(nodes: any[], prefix = '') {
    nodes.forEach(node => {
      result.push({
        value: node.id,
        label: `${prefix}${node.name}`
      });
      if (node.children && node.children.length > 0) {
        traverse(node.children, `${prefix}  `);
      }
    });
  }
  traverse(categories);
  return result;
}

export default function SlideEditModal({
  slide,
  isOpen,
  onClose,
  onSave,
  onDelete
}: SlideEditModalProps) {
  const { metadata, loading: metadataLoading } = useMetadata();
  
  const [formData, setFormData] = useState<Partial<Slide> & {
    productCodes?: string[];
    confidentialityCodes?: string[];
    componentCodes?: string[];
    integrationCodes?: string[];
    solutionAreaCodes?: string[];
    categoryIds?: string[];
  }>({
    title: '',
    description: '',
    tags: [],
    // New metadata fields
    status: 'draft',
    format: undefined,
    language: 'en',
    region: 'global',
    domain: undefined,
    authorName: '',
    department: '',
    isCaseStudy: false,
    yearStart: undefined,
    yearFinish: undefined,
    productCodes: [],
    confidentialityCodes: [],
    componentCodes: [],
    integrationCodes: [],
    solutionAreaCodes: [],
    categoryIds: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Сбрасываем статус сохранения при изменении формы (но не при первой загрузке)
  useEffect(() => {
    if (!isInitialLoad) {
      setIsSaved(false);
    }
  }, [formData]);

  useEffect(() => {
    if (slide) {
      const newFormData = {
        title: slide.title,
        description: slide.description || '',
        tags: slide.tags || [],
        // Copy all metadata
        status: slide.status || 'draft',
        format: slide.format,
        language: slide.language || 'en',
        region: slide.region || 'global',
        domain: slide.domain,
        authorName: slide.authorName || '',
        department: slide.department || '',
        isCaseStudy: slide.isCaseStudy || false,
        yearStart: slide.yearStart,
        yearFinish: slide.yearFinish,
        productCodes: slide.products?.map(p => p.product.code) || [],
                  confidentialityCodes: (slide as any).SlideConfidentiality?.map((c: any) => c.Confidentiality.code) || [],
        componentCodes: slide.components?.map(c => c.component.code) || [],
        integrationCodes: slide.integrations?.map(i => i.integration.code) || [],
        solutionAreaCodes: (slide as any).solutionAreas?.map((s: any) => s.solutionArea.code) || [],
                  categoryIds: (slide as any).SlideCategory?.map((c: any) => c.categoryId) || []
      };
      
      setFormData(newFormData);
      
      // После загрузки данных отмечаем, что это больше не первоначальная загрузка
      setTimeout(() => setIsInitialLoad(false), 100);
    }
  }, [slide]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slide) return;
    if (isLoading) return; // prevent double submit

    setIsLoading(true);
    setIsSaved(false);
    try {
      console.log('Saving formData:', formData);
      await onSave(formData);
      // Показываем успешное сохранение
      setIsSaved(true);
      // Через 3 секунды убираем индикацию
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving slide:', error);
      alert('Ошибка при сохранении слайда');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!slide || !onDelete) return;
    
    if (confirm('Are you sure you want to delete this slide? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await onDelete(slide.id);
        onClose();
      } catch (error) {
        console.error('Error deleting slide:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.some(t => t.tag.name === newTag.trim())) {
      const tagId = `temp-${Date.now()}`;
      setFormData(prev => ({
        ...prev,
        tags: [
          ...(prev.tags || []),
          {
            id: tagId,
            slideId: slide?.id || '',
            tagId: tagId,
            tag: {
              id: tagId,
              name: newTag.trim(),
              isAutomatic: false,
              usageCount: 0,
              createdAt: new Date()
            }
          }
        ]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t.id !== tagId) || []
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  const generateTags = async () => {
    if (!slide) return;
    
    setIsGeneratingTags(true);
    try {
      const response = await fetch(`/api/slides/${slide.id}/generate-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          metadata: formData,
          extractedText: slide.extractedText 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Replace existing tags with generated ones
        setFormData(prev => ({
          ...prev,
          tags: data.tags
        }));
      }
    } catch (error) {
      console.error('Error generating tags:', error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const openInFigma = () => {
    if (!slide) return;
    
    if (slide.figmaUrl) {
      window.open(slide.figmaUrl, '_blank');
    } else if (slide.figmaFileId && slide.figmaNodeId) {
      const figmaUrl = `https://www.figma.com/file/${slide.figmaFileId}?node-id=${slide.figmaNodeId}`;
      window.open(figmaUrl, '_blank');
    }
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2010 + 1 }, (_, i) => ({
    value: String(2010 + i),
    label: String(2010 + i)
  })).reverse();

  // Исправленный поиск категории по id
  function findCategoryById(id: string): any | null {
    if (!metadata?.categories) return null;
    function search(nodes: any[]): any | null {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    return search(metadata.categories);
  }

  if (!isOpen || !slide) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Edit Slide</h2>
            {slide.figmaUrl || (slide.figmaFileId && slide.figmaNodeId) ? (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                <FileText className="w-3 h-3 mr-1" />
                Figma
              </span>
            ) : null}
          </div>
          <button
            onClick={() => {
              setIsInitialLoad(true);
              setIsSaved(false);
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex">
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 p-6">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'basic'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Info className="w-4 h-4 inline-block mr-2" />
                  Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('metadata')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'metadata'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Settings className="w-4 h-4 inline-block mr-2" />
                  Metadata
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'content'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Tag className="w-4 h-4 inline-block mr-2" />
                  Content & Tags
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'basic' && (
                <>
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Enter slide title"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Enter slide description"
                      rows={3}
                    />
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categories *
                    </label>
                    <MultiSelect
                      options={flattenCategories(metadata?.categories || [])}
                      value={formData.categoryIds || ((slide as any)?.SlideCategory ? (slide as any).SlideCategory.map((c: any) => c.categoryId) : [])}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, categoryIds: values }))}
                      placeholder="Select categories"
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <Autocomplete
                        options={[
                          { value: 'none', label: 'None (очистить)' },
                          ...(metadata?.statuses?.map((status: any) => ({ value: status.code, label: status.name })) || [])
                        ]}
                        value={formData.status || ''}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          status: value === 'none' ? undefined : value as 'draft' | 'in_review' | 'approved' | 'archived'
                        }))}
                        placeholder="Select status"
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
                          { value: 'none', label: 'None (очистить)' },
                          ...(metadata?.formats?.map((format: any) => ({ value: format.code, label: format.name })) || [])
                        ]}
                        value={formData.format || ''}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          format: value === 'none' ? undefined : value as 'vertical' | 'horizontal'
                        }))}
                        placeholder="Select format"
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'metadata' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Language */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <Autocomplete
                        options={[
                          { value: 'none', label: 'None (очистить)' },
                          ...(metadata?.languages?.map((lang: any) => ({ value: lang.code, label: lang.name })) || [])
                        ]}
                        value={formData.language || ''}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          language: value === 'none' ? undefined : value as 'en' | 'fr' | 'de' | 'multilang'
                        }))}
                        placeholder="Select language"
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
                          { value: 'none', label: 'None (очистить)' },
                          ...(metadata?.regions?.map((region: any) => ({ value: region.code, label: region.name })) || [])
                        ]}
                        value={formData.region || ''}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          region: value === 'none' ? undefined : value as 'emea' | 'na' | 'global' | 'apac' | 'latam'
                        }))}
                        placeholder="Select region"
                        className="w-full"
                      />
                    </div>

                    {/* Domain */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Domain
                      </label>
                      <Autocomplete
                        options={[
                          { value: 'none', label: 'None (очистить)' },
                          ...(metadata?.domains?.map(d => ({ value: d.name, label: d.name })) || [])
                        ]}
                        value={formData.domain || ''}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          domain: value === 'none' ? undefined : value 
                        }))}
                        placeholder="Select domain"
                        className="w-full"
                      />
                    </div>

                    {/* Solution Areas */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Solution Areas
                      </label>
                      <MultiSelect
                        options={metadata?.solutionAreas?.map(sa => ({ value: sa.code, label: sa.name })) || []}
                        value={(formData as any).solutionAreaCodes || []}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, solutionAreaCodes: value as any }))}
                        placeholder="Select solution areas"
                        className="w-full"
                      />
                    </div>

                    {/* Author */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Author
                      </label>
                      <input
                        type="text"
                        value={formData.authorName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        placeholder="Author name"
                      />
                    </div>

                  </div>

                  {/* Case Study */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isCaseStudy"
                      checked={formData.isCaseStudy || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, isCaseStudy: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isCaseStudy" className="ml-2 block text-sm text-gray-900">
                      This is a case study
                    </label>
                  </div>

                  {/* Year range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year of Start
                      </label>
                      <Autocomplete
                        options={[
                          { value: 'none', label: 'None (очистить)' },
                          ...yearOptions
                        ]}
                        value={formData.yearStart?.toString() || ''}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          yearStart: value === 'none' || value === '' ? undefined : parseInt(value) 
                        }))}
                        placeholder="Select year"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year of Finish
                      </label>
                      <Autocomplete
                        options={[
                          { value: 'none', label: 'None (очистить)' },
                          ...yearOptions
                        ]}
                        value={formData.yearFinish?.toString() || ''}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          yearFinish: value === 'none' || value === '' ? undefined : parseInt(value) 
                        }))}
                        placeholder="Select year"
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'content' && (
                <>
                  {/* Products */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Products
                    </label>
                    <MultiSelect
                      options={metadata?.products?.map(p => ({ value: p.code, label: p.name })) || []}
                      value={(formData as any).productCodes || []}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, productCodes: value as any }))}
                      placeholder="Select products"
                      className="w-full"
                    />
                  </div>

                  {/* User Types */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confidentiality
                    </label>
                                          <MultiSelect
                        options={metadata?.confidentiality?.map(c => ({ value: c.code, label: c.name })) || []}
                        value={(formData as any).confidentialityCodes || []}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, confidentialityCodes: value as any }))}
                        placeholder="Select confidentiality"
                        className="w-full"
                      />
                  </div>

                  {/* Components */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Components
                    </label>
                    <MultiSelect
                      options={metadata?.components?.map(c => ({ value: c.code, label: c.name })) || []}
                      value={(formData as any).componentCodes || []}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, componentCodes: value as any }))}
                      placeholder="Select components"
                      className="w-full"
                    />
                  </div>

                  {/* Integrations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Integrations
                    </label>
                    <MultiSelect
                      options={metadata?.integrations?.map(i => ({ value: i.code, label: i.name })) || []}
                      value={(formData as any).integrationCodes || []}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, integrationCodes: value as any }))}
                      placeholder="Select integrations"
                      className="w-full"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Tags
                      </label>
                      <button
                        type="button"
                        onClick={() => generateTags()}
                        disabled={isGeneratingTags}
                        className="px-3 py-1 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600 disabled:opacity-50 transition-colors flex items-center"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {isGeneratingTags ? 'Generating...' : 'Generate Tags'}
                      </button>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        placeholder="Add new tag"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((slideTag) => (
                          <span
                            key={slideTag.id}
                            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {slideTag.tag.name}
                            <button
                              type="button"
                              onClick={() => removeTag(slideTag.id)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
              <div className="flex items-center space-x-3">
                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Slide'}
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsInitialLoad(true);
                    setIsSaved(false);
                    onClose();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.title || !formData.categoryIds || formData.categoryIds.length === 0}
                  className={`px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center ${
                    isSaved ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : isSaved ? '✓ Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>

          {/* Preview Panel */}
          <div className="w-96 border-l border-gray-200 p-6 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preview
            </label>
            
            <div className="space-y-4">
              {/* Slide Preview */}
              <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm relative" style={{ height: '280px' }}>
                <img
                  src={slide.figmaFileId && slide.figmaNodeId ? 
                    `/api/figma/image-proxy?fileId=${slide.figmaFileId}&nodeId=${slide.figmaNodeId}` : 
                    slide.imageUrl || `https://via.placeholder.com/400x300/6366f1/ffffff?text=${encodeURIComponent(formData.title || 'Slide Title')}`
                  }
                  alt={formData.title || 'Slide'}
                  className="w-full h-full object-cover object-top"
                  style={{ objectPosition: 'center top' }}
                />
                
                {/* Status badge */}
                {formData.status && (
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded shadow-sm ${
                      formData.status === 'approved' ? 'bg-green-500 text-white' :
                      formData.status === 'in_review' ? 'bg-yellow-500 text-white' :
                      formData.status === 'archived' ? 'bg-gray-500 text-white' :
                      'bg-gray-300 text-gray-800'
                    }`}>
                      {METADATA_OPTIONS.status.find(s => s.value === formData.status)?.label}
                    </span>
                  </div>
                )}
                
                {/* Figma indicator */}
                {(slide.figmaUrl || (slide.figmaFileId && slide.figmaNodeId)) && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2 py-1 bg-purple-500 text-white text-xs font-medium rounded shadow-sm">
                      <FileText className="w-3 h-3 mr-1" />
                      Figma
                    </span>
                  </div>
                )}
              </div>

              {/* Slide Info */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 line-clamp-2 text-base">
                  {formData.title || 'Slide Title'}
                </h3>
                
                {formData.description && (
                  <p className="text-sm text-gray-600 line-clamp-4">
                    {formData.description}
                  </p>
                )}
                
                {formData.categoryIds && formData.categoryIds.length > 0 && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Folder className="w-4 h-4 mr-1" />
                    {formData.categoryIds
                      .map(id => findCategoryById(id)?.name || id)
                      .join(', ')
                    }
                  </div>
                )}

                {/* Metadata preview */}
                <div className="space-y-2 text-xs text-gray-500">
                  {formData.format && (
                    <div>Format: {METADATA_OPTIONS.format.find(f => f.value === formData.format)?.label}</div>
                  )}
                  {formData.language && (
                    <div>Language: {METADATA_OPTIONS.language.find(l => l.value === formData.language)?.label}</div>
                  )}
                  {formData.domain && (
                    <div>Domain: {METADATA_OPTIONS.domain.find(d => d.value === formData.domain)?.label}</div>
                  )}
                  {(formData as any).productCodes?.length > 0 && (
                    <div>Products: { (formData as any).productCodes.map((code: string) => metadata?.products?.find(p => p.code === code)?.name || code).join(', ') }</div>
                  )}
                  {(formData as any).confidentialityCodes?.length > 0 && (
                    <div>Confidentiality: { (formData as any).confidentialityCodes.map((code: string) => metadata?.confidentiality?.find(c => c.code === code)?.name || code).join(', ') }</div>
                  )}
                  {(formData as any).solutionAreaCodes?.length > 0 && (
                    <div>Solution Areas: { (formData as any).solutionAreaCodes.map((code: string) => metadata?.solutionAreas?.find(sa => sa.code === code)?.name || code).join(', ') }</div>
                  )}
                  {(formData as any).componentCodes?.length > 0 && (
                    <div>Components: { (formData as any).componentCodes.map((code: string) => metadata?.components?.find(c => c.code === code)?.name || code).join(', ') }</div>
                  )}
                  {(formData as any).integrationCodes?.length > 0 && (
                    <div>Integrations: { (formData as any).integrationCodes.map((code: string) => metadata?.integrations?.find(i => i.code === code)?.name || code).join(', ') }</div>
                  )}
                  {formData.isCaseStudy && (
                    <div className="text-blue-600">📋 Case Study</div>
                  )}
                </div>

                {/* Slide dimensions */}
                {slide.width && slide.height && (
                  <div className="text-xs text-gray-500">
                    {slide.width} × {slide.height} px
                  </div>
                )}
                
                {/* Figma Button */}
                {(slide.figmaUrl || (slide.figmaFileId && slide.figmaNodeId)) && (
                  <button
                    onClick={openInFigma}
                    className="w-full mt-3 px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center justify-center text-sm font-medium"
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