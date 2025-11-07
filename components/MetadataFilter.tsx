'use client';

import { useState, useEffect } from 'react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useMetadata } from '@/contexts/MetadataContext';

interface MetadataFilterProps {
  onFilterChange: (filters: any) => void;
  currentFilters?: any;
}

export default function MetadataFilter({ onFilterChange, currentFilters = {} }: MetadataFilterProps) {
  const { metadata } = useMetadata();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Filter states
  const [selectedTags, setSelectedTags] = useState<string[]>(currentFilters.tags || []);
  const [selectedDomains, setSelectedDomains] = useState<string[]>(currentFilters.domains || []);
  const [selectedSolutionAreas, setSelectedSolutionAreas] = useState<string[]>(currentFilters.solutionAreas || []);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(currentFilters.products || []);
  const [selectedComponents, setSelectedComponents] = useState<string[]>(currentFilters.components || []);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(currentFilters.integrations || []);
  const [selectedConfidentiality, setSelectedConfidentiality] = useState<string[]>(currentFilters.confidentiality || []);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(currentFilters.statuses || []);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(currentFilters.formats || []);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(currentFilters.languages || []);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(currentFilters.regions || []);
  const [selectedYears, setSelectedYears] = useState<string[]>(currentFilters.years || []);
  const [selectedCaseStudyOnly, setSelectedCaseStudyOnly] = useState(currentFilters.caseStudyOnly || false);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Apply filters
  const applyFilters = () => {
    const filters: any = {};
    
    if (selectedTags.length > 0) filters.tags = selectedTags;
    if (selectedDomains.length > 0) filters.domains = selectedDomains;
    if (selectedSolutionAreas.length > 0) filters.solutionAreas = selectedSolutionAreas;
    if (selectedProducts.length > 0) filters.products = selectedProducts;
    if (selectedComponents.length > 0) filters.components = selectedComponents;
    if (selectedIntegrations.length > 0) filters.integrations = selectedIntegrations;
    if (selectedConfidentiality.length > 0) filters.confidentiality = selectedConfidentiality;
    if (selectedStatuses.length > 0) filters.statuses = selectedStatuses;
    if (selectedFormats.length > 0) filters.formats = selectedFormats;
    if (selectedLanguages.length > 0) filters.languages = selectedLanguages;
    if (selectedRegions.length > 0) filters.regions = selectedRegions;
    if (selectedYears.length > 0) filters.years = selectedYears;
    if (selectedCaseStudyOnly) filters.caseStudyOnly = true;
    
    onFilterChange(filters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedTags([]);
    setSelectedDomains([]);
    setSelectedSolutionAreas([]);
    setSelectedProducts([]);
    setSelectedComponents([]);
    setSelectedIntegrations([]);
    setSelectedConfidentiality([]);
    setSelectedStatuses([]);
    setSelectedFormats([]);
    setSelectedLanguages([]);
    setSelectedRegions([]);
    setSelectedYears([]);
    setSelectedCaseStudyOnly(false);
    onFilterChange({});
  };

  const hasActiveFilters = selectedTags.length > 0 || selectedDomains.length > 0 || 
    selectedSolutionAreas.length > 0 || selectedProducts.length > 0 || 
    selectedComponents.length > 0 || selectedIntegrations.length > 0 ||
    selectedConfidentiality.length > 0 || selectedStatuses.length > 0 ||
    selectedFormats.length > 0 || selectedLanguages.length > 0 || selectedRegions.length > 0 ||
    selectedYears.length > 0 || selectedCaseStudyOnly;

  // Filter section component
  const FilterSection = ({ 
    title, 
    items, 
    selectedItems, 
    onToggle, 
    sectionKey,
    valueKey = 'id',
    nameKey = 'name'
  }: any) => {
    const isExpanded = expandedSections[sectionKey] !== false; // Default expanded
    
    return (
      <div className="border-b border-gray-200 pb-3">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          <span className="font-medium text-gray-700">{title}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {isExpanded && items && items.length > 0 && (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {items.map((item: any) => (
              <label key={item[valueKey]} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item[valueKey])}
                  onChange={() => {
                    const newSelection = selectedItems.includes(item[valueKey])
                      ? selectedItems.filter((id: string) => id !== item[valueKey])
                      : [...selectedItems, item[valueKey]];
                    onToggle(newSelection);
                  }}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="text-sm text-gray-600">{item[nameKey]}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Filter button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          hasActiveFilters 
            ? 'bg-yellow-50 border-yellow-300 text-yellow-700' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="ml-1 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
            {(() => {
              const count = Object.values({
                selectedTags, selectedDomains, selectedSolutionAreas, selectedProducts,
                selectedComponents, selectedIntegrations, selectedConfidentiality, selectedStatuses,
                selectedFormats, selectedLanguages, selectedRegions, selectedYears
              }).reduce((acc, arr) => {
                const arrLength = Array.isArray(arr) ? arr.length : 0;
                return acc + (isNaN(arrLength) ? 0 : arrLength);
              }, 0) + (selectedCaseStudyOnly ? 1 : 0);
              return isNaN(count) ? 0 : count;
            })()}
          </span>
        )}
      </button>

      {/* Filter panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Metadata Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Filter sections */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <FilterSection
                title="Tags"
                items={metadata?.tags || []}
                selectedItems={selectedTags}
                onToggle={setSelectedTags}
                sectionKey="tags"
              />
              
              <FilterSection
                title="Domains"
                items={metadata?.domains || []}
                selectedItems={selectedDomains}
                onToggle={setSelectedDomains}
                sectionKey="domains"
                valueKey="code"
              />
              
              <FilterSection
                title="Solution Areas"
                items={metadata?.solutionAreas || []}
                selectedItems={selectedSolutionAreas}
                onToggle={setSelectedSolutionAreas}
                sectionKey="solutionAreas"
              />
              
              <FilterSection
                title="Products"
                items={metadata?.products || []}
                selectedItems={selectedProducts}
                onToggle={setSelectedProducts}
                sectionKey="products"
              />
              
              <FilterSection
                title="Components"
                items={metadata?.components || []}
                selectedItems={selectedComponents}
                onToggle={setSelectedComponents}
                sectionKey="components"
              />
              
              <FilterSection
                title="Integrations"
                items={metadata?.integrations || []}
                selectedItems={selectedIntegrations}
                onToggle={setSelectedIntegrations}
                sectionKey="integrations"
              />
              
              <FilterSection
                title="Confidentiality"
                items={metadata?.confidentiality || []}
                selectedItems={selectedConfidentiality}
                onToggle={setSelectedConfidentiality}
                sectionKey="confidentiality"
                valueKey="code"
              />
              
              <FilterSection
                title="Statuses"
                items={metadata?.statuses || []}
                selectedItems={selectedStatuses}
                onToggle={setSelectedStatuses}
                sectionKey="statuses"
                valueKey="code"
              />
              
              <FilterSection
                title="Formats"
                items={metadata?.formats || []}
                selectedItems={selectedFormats}
                onToggle={setSelectedFormats}
                sectionKey="formats"
                valueKey="code"
              />
              
              <FilterSection
                title="Languages"
                items={metadata?.languages || []}
                selectedItems={selectedLanguages}
                onToggle={setSelectedLanguages}
                sectionKey="languages"
                valueKey="code"
              />
              
              <FilterSection
                title="Regions"
                items={metadata?.regions || []}
                selectedItems={selectedRegions}
                onToggle={setSelectedRegions}
                sectionKey="regions"
                valueKey="code"
              />

              <FilterSection
                title="Years"
                items={metadata?.years || []}
                selectedItems={selectedYears}
                onToggle={setSelectedYears}
                sectionKey="years"
                valueKey="code"
              />

              <FilterSection
                title="Case Study Only"
                items={[{ id: 'true', name: 'Yes' }]}
                selectedItems={[selectedCaseStudyOnly ? 'true' : 'false']}
                onToggle={(selected: string[]) => setSelectedCaseStudyOnly(selected.includes('true'))}
                sectionKey="caseStudyOnly"
                valueKey="id"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
                disabled={!hasActiveFilters}
              >
                Clear all
              </button>
              <button
                onClick={() => {
                  applyFilters();
                  setIsOpen(false);
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 