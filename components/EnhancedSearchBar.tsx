'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, Star, Folder, User, Tag } from 'lucide-react';

interface SearchSuggestion {
  type: 'filter' | 'recent' | 'category' | 'tag';
  value: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface EnhancedSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultsCount?: number;
  totalCount?: number;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export default function EnhancedSearchBar({
  value,
  onChange,
  resultsCount,
  totalCount,
  placeholder = "Search slides, text, categories...",
  inputRef: externalInputRef
}: EnhancedSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('slidedeck-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Save search to recent searches
  const saveSearch = (query: string) => {
    if (query.trim() && !query.startsWith('favorite:') && !query.startsWith('recent:')) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('slidedeck-recent-searches', JSON.stringify(updated));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.value);
    saveSearch(suggestion.value);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      saveSearch(value);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    onChange('');
    inputRef.current?.focus();
  };

  // Smart filter suggestions
  const getFilterSuggestions = (): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [
      {
        type: 'filter',
        value: 'favorite:true',
        label: 'Favorite slides',
        icon: <Star className="w-4 h-4" />,
        description: 'Show only favorite slides'
      },
      {
        type: 'filter',
        value: 'recent:7d',
        label: 'Last 7 days',
        icon: <Clock className="w-4 h-4" />,
        description: 'Slides added recently'
      },
      {
        type: 'filter',
        value: 'recent:30d',
        label: 'Last month',
        icon: <Clock className="w-4 h-4" />,
        description: 'Slides from the last 30 days'
      },
      {
        type: 'filter',
        value: 'category:support',
        label: 'Category: Support',
        icon: <Folder className="w-4 h-4" />,
        description: 'Slides from the support category'
      },
      {
        type: 'filter',
        value: 'author:figma',
        label: 'Imported from Figma',
        icon: <User className="w-4 h-4" />,
        description: 'Slides imported from Figma'
      }
    ];

    // Filter suggestions based on current input
    if (value.trim()) {
      const query = value.toLowerCase();
      return suggestions.filter(s => 
        s.label.toLowerCase().includes(query) ||
        s.value.toLowerCase().includes(query)
      );
    }

    return suggestions;
  };

  const getRecentSuggestions = (): SearchSuggestion[] => {
    return recentSearches.map(search => ({
      type: 'recent',
      value: search,
      label: search,
      icon: <Clock className="w-4 h-4" />,
      description: 'Recent search'
    }));
  };

  const allSuggestions = [
    ...getFilterSuggestions(),
    ...getRecentSuggestions()
  ].slice(0, 8); // Limit to 8 suggestions

  return (
    <div className="relative flex-1 max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className={`h-5 w-5 transition-colors ${
              isFocused ? 'text-blue-500' : 'text-gray-400'
            }`} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className={`block w-full pl-10 pr-12 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all text-gray-900 ${
              isFocused 
                ? 'border-blue-300 shadow-lg' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          />
          {value && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg"
            >
              <span className="text-gray-400 hover:text-gray-600 text-xl">×</span>
            </button>
          )}
        </div>
      </form>
      
      {/* Search Stats */}
      {value && resultsCount !== undefined && totalCount !== undefined && (
        <div className="absolute top-full left-0 right-0 bg-white border-l border-r border-gray-200 px-3 py-2 text-xs text-gray-600 shadow-sm z-40">
          <div className="flex items-center justify-between">
            <span>Found {resultsCount} of {totalCount} slides</span>
            {value.includes(':') && (
              <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                Smart filter
              </span>
            )}
          </div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (isFocused || value.length > 0) && allSuggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className={`absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-50 max-h-80 overflow-y-auto ${
            value && resultsCount !== undefined ? 'border-t-0' : 'mt-1'
          }`}
        >
          <div className="py-2">
            {!value && recentSearches.length > 0 && (
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Recent searches
              </div>
            )}
            {!value && getFilterSuggestions().length > 0 && (
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-t border-gray-100">
                Quick filters
              </div>
            )}
            
            {allSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 group"
              >
                <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600">
                  {suggestion.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.label}
                  </div>
                  {suggestion.description && (
                    <div className="text-xs text-gray-500 truncate">
                      {suggestion.description}
                    </div>
                  )}
                </div>
                {suggestion.type === 'filter' && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      filter
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 