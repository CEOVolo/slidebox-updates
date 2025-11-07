'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Metadata {
  categories: any[];
  statuses: any[];
  products: any[];
  confidentiality: any[];
  components: any[];
  integrations: any[];
  solutionAreas: any[];
  domains: any[];
  formats: any[];
  languages: any[];
  regions: any[];
  authors: any[];
  tags: any[];
  years: any[];
}

interface MetadataContextType {
  metadata: Metadata | null;
  loading: boolean;
  error: string | null;
  refreshMetadata: () => Promise<void>;
}

const MetadataContext = createContext<MetadataContextType | undefined>(undefined);

export function MetadataProvider({ children }: { children: ReactNode }) {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/metadata');
      if (!response.ok) throw new Error('Failed to fetch metadata');
      
      const data = await response.json();
      
      // Transform data to ensure arrays
      setMetadata({
        categories: data.categories || [],
        statuses: data.statuses || [],
        products: data.products || [],
        confidentiality: data.confidentiality || [],
        components: data.components || [],
        integrations: data.integrations || [],
        solutionAreas: data.solutionAreas || [],
        domains: data.domains || [],
        formats: data.formats || [],
        languages: data.languages || [],
        regions: data.regions || [],
        authors: data.authors || [],
        tags: data.tags || [],
        years: data.years || []
      });
    } catch (err) {
      console.error('Error fetching metadata:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  return (
    <MetadataContext.Provider value={{ metadata, loading, error, refreshMetadata: fetchMetadata }}>
      {children}
    </MetadataContext.Provider>
  );
}

export function useMetadata() {
  const context = useContext(MetadataContext);
  if (context === undefined) {
    throw new Error('useMetadata must be used within a MetadataProvider');
  }
  return context;
}

// Helper to get metadata with type safety
export function getMetadataValue(
  metadata: Metadata | null,
  type: keyof Metadata,
  code: string
): string {
  if (!metadata || !metadata[type]) return code;
  
  const item = metadata[type].find((i: any) => i.code === code);
  return item?.name || code;
}

// Helper to get all metadata options for a type
export function getMetadataOptions(
  metadata: Metadata | null,
  type: keyof Metadata
): Array<{ value: string; label: string }> {
  if (!metadata || !metadata[type]) return [];
  
  return metadata[type].map((item: any) => ({
    value: item.code || item.id,
    label: item.name
  }));
}

// Helper to safely access arrays with fallback
export function safeMetadataArray(metadata: Metadata | null, key: keyof Metadata): any[] {
  return [...(metadata?.[key] || [])];
} 