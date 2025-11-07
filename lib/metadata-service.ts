// Centralized Metadata Service
// This service manages all metadata with caching and real-time updates

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CacheEntry {
  data: any;
  timestamp: number;
}

class MetadataService {
  private cache = new Map<string, CacheEntry>();
  private ttl = 60000; // 1 minute cache TTL
  private subscribers = new Set<(key: string) => void>();

  // Subscribe to metadata changes
  subscribe(callback: (key: string) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers of changes
  private notifySubscribers(key: string) {
    this.subscribers.forEach(callback => callback(key));
  }

  // Generic cache getter
  private async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.ttl) {
      return cached.data as T;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: now });
      return data;
    } catch (error) {
      // If fetch fails and we have stale cache, return it
      if (cached) {
        return cached.data as T;
      }
      throw error;
    }
  }

  // Invalidate cache
  invalidate(key?: string) {
    if (key) {
      this.cache.delete(key);
      this.notifySubscribers(key);
    } else {
      this.cache.clear();
      this.notifySubscribers('*');
    }
  }

  // Get all solution areas
  async getSolutionAreas() {
    return this.getCached('solutionAreas', async () => {
      // @ts-ignore - Prisma types
      const areas = await prisma.solutionArea.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { slides: true }
          }
        }
      });
      return areas;
    });
  }

  // Get all domains
  async getDomains() {
    return this.getCached('domains', async () => {
      // @ts-ignore - Prisma types
      const domains = await prisma.domain.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { slides: true }
          }
        }
      });
      return domains;
    });
  }

  // Get all tags
  async getTags() {
    return this.getCached('tags', async () => {
      const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { slides: true }
          }
        }
      });
      return tags;
    });
  }

  // Get all categories with hierarchy
  async getCategories() {
    return this.getCached('categories', async () => {
      // @ts-ignore - Prisma types
      const categories = await prisma.category.findMany({
        where: { parentId: null },
        include: {
          children: {
            include: {
              children: true
            },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      });
      return categories;
    });
  }

  // Get flat list of all categories
  async getCategoriesFlat() {
    return this.getCached('categoriesFlat', async () => {
      // @ts-ignore - Prisma types
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
      });
      return categories;
    });
  }

  // Get all products
  async getProducts() {
    return this.getCached('products', async () => {
      // @ts-ignore - Prisma types
      const products = await prisma.product.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { slides: true }
          }
        }
      });
      return products;
    });
  }

  // Get all confidentiality levels
  async getConfidentiality() {
    return this.getCached('confidentiality', async () => {
      // @ts-ignore - Prisma types
      const confidentiality = await prisma.confidentiality.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { SlideConfidentiality: true }
          }
        }
      });
      return confidentiality;
    });
  }

  // Get all components
  async getComponents() {
    return this.getCached('components', async () => {
      // @ts-ignore - Prisma types
      const components = await prisma.component.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { slides: true }
          }
        }
      });
      return components;
    });
  }

  // Get all integrations
  async getIntegrations() {
    return this.getCached('integrations', async () => {
      // @ts-ignore - Prisma types
      const integrations = await prisma.integration.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { slides: true }
          }
        }
      });
      return integrations;
    });
  }

  // Get all statuses
  async getStatuses() {
    return this.getCached('statuses', async () => {
      // @ts-ignore - Prisma types
      const statuses = await prisma.status.findMany({
        orderBy: { order: 'asc' }
      });
      return statuses;
    });
  }

  // Get all formats
  async getFormats() {
    return this.getCached('formats', async () => {
      // @ts-ignore - Prisma types
      const formats = await prisma.format.findMany({
        orderBy: { order: 'asc' }
      });
      return formats;
    });
  }

  // Get all languages
  async getLanguages() {
    return this.getCached('languages', async () => {
      // @ts-ignore - Prisma types
      const languages = await prisma.language.findMany({
        orderBy: { order: 'asc' }
      });
      return languages;
    });
  }

  // Get all regions
  async getRegions() {
    return this.getCached('regions', async () => {
      // @ts-ignore - Prisma types
      const regions = await prisma.region.findMany({
        orderBy: { order: 'asc' }
      });
      return regions;
    });
  }

  // Get static metadata (languages, regions, statuses, formats)
  async getStaticMetadata() {
    return this.getCached('staticMetadata', async () => {
      const [statuses, formats, languages, regions] = await Promise.all([
        this.getStatuses(),
        this.getFormats(),
        this.getLanguages(),
        this.getRegions()
      ]);

      return {
        statuses,
        formats,
        languages,
        regions
      };
    });
  }

  // Get all metadata at once
  async getAllMetadata() {
    const [solutionAreas, domains, tags, categories, products, confidentiality, components, integrations, staticMetadata] = await Promise.all([
      this.getSolutionAreas(),
      this.getDomains(),
      this.getTags(),
      this.getCategories(),
      this.getProducts(),
      this.getConfidentiality(),
      this.getComponents(),
      this.getIntegrations(),
      this.getStaticMetadata()
    ]);

    return {
      solutionAreas,
      domains,
      tags,
      categories,
      products,
      confidentiality,
      components,
      integrations,
      ...staticMetadata
    };
  }
}

// Export the singleton instance
export const metadataService = new MetadataService(); 