'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Settings, Tag, FolderTree, Database, ChevronLeft, Plus, Edit2, Trash2, Save, X, Package, Users, Puzzle, Globe } from 'lucide-react';
import { useMetadata } from '@/contexts/MetadataContext';
import React from 'react';

// Popular category icons
const CATEGORY_ICONS = [
  '📁', '📂', '📄', '📊', '📈', '📉', '📋', '📝',
  '🏢', '🏭', '🏪', '🏬', '🏫', '🏦', '🏨', '🏩',
  '💼', '👥', '🔧', '⚙️', '🛠️', '📱', '💻', '🖥️',
  '📞', '📧', '📊', '📈', '📉', '📋', '📝', '📄',
  '🎯', '🎨', '🔍', '🔎', '📢', '📣', '📺', '📻',
  '🌍', '🌎', '🌏', '🗺️', '📍', '📌', '🎪', '🎭'
];

type TabType = 'entities' | 'tags' | 'categories' | 'static' | 'system';

export default function SettingsPage() {
  const auth = useAuth();
  const router = useRouter();
  const { metadata, refreshMetadata } = useMetadata();
  const [activeTab, setActiveTab] = useState<TabType>('entities');
  const [activeEntity, setActiveEntity] = useState<'solutionAreas' | 'domains' | 'products' | 'confidentiality' | 'components' | 'integrations'>('solutionAreas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.user || !auth.isAdmin) {
        router.push('/');
      } else {
        setLoading(false);
      }
    }
  }, [auth.user, auth.isAdmin, auth.isLoading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/moderation')}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back to moderation
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                System Settings
              </h1>
            </div>
            
            <div className="flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Admin Mode
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('entities')}
              className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'entities'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database className="w-4 h-4 mr-2" />
              Dynamic Entities
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'tags'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Tag className="w-4 h-4 mr-2" />
              Tags
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FolderTree className="w-4 h-4 mr-2" />
              Categories
            </button>
            <button
              onClick={() => setActiveTab('static')}
              className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'static'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Static Values
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'system'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'entities' && <EntitiesManager />}
          {activeTab === 'tags' && <TagsManager />}
          {activeTab === 'categories' && <CategoriesManager />}
          {activeTab === 'static' && <StaticValuesManager />}
          {activeTab === 'system' && <SystemManager />}
        </div>
      </div>
    </div>
  );
}

// Component for managing dynamic entities
function EntitiesManager() {
  const [activeEntity, setActiveEntity] = useState<'solutionAreas' | 'domains' | 'products' | 'confidentiality' | 'components' | 'integrations'>('solutionAreas');

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Dynamic Entities Management</h2>
      <p className="text-gray-600 mb-6">
        Manage dynamic entities that can be assigned to slides
      </p>

      {/* Entity type selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveEntity('solutionAreas')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeEntity === 'solutionAreas'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Solution Areas
        </button>
        <button
          onClick={() => setActiveEntity('domains')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeEntity === 'domains'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Domains / Industries
        </button>
        <button
          onClick={() => setActiveEntity('products')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeEntity === 'products'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveEntity('confidentiality')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeEntity === 'confidentiality'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Confidentiality
        </button>
        <button
          onClick={() => setActiveEntity('components')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeEntity === 'components'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Components
        </button>
        <button
          onClick={() => setActiveEntity('integrations')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeEntity === 'integrations'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Integrations
        </button>
      </div>

      {/* Entity specific managers */}
      {activeEntity === 'solutionAreas' && <SolutionAreasManager />}
      {activeEntity === 'domains' && <DomainsManager />}
      {activeEntity === 'products' && <ProductsManager />}
      {activeEntity === 'confidentiality' && <ConfidentialityManager />}
      {activeEntity === 'components' && <ComponentsManager />}
      {activeEntity === 'integrations' && <IntegrationsManager />}
    </div>
  );
}

// Solution Areas Manager
function SolutionAreasManager() {
  const { metadata, loading, refreshMetadata: refresh } = useMetadata();
  const [processing, setProcessing] = useState(false);
  const [newAreaCode, setNewAreaCode] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const solutionAreas = metadata?.solutionAreas || [];

  const handleAddArea = async () => {
    if (!newAreaCode.trim() || !newAreaName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/solution-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newAreaCode.trim(), name: newAreaName.trim() })
      });

      if (response.ok) {
        setNewAreaCode('');
        setNewAreaName('');
        alert('Solution Area added successfully!');
        
        // Add small delay before refresh to ensure database transaction is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Refresh metadata context immediately
        await refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding solution area');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditArea = async (code: string, newName: string) => {
    if (!newName.trim()) return;
    
    const area = solutionAreas.find(a => a.code === code);
    if (!area || newName.trim() === area.name) {
      setEditingArea(null);
      setEditName('');
      return;
    }
    
    setProcessing(true);
    try {
      const response = await fetch('/api/solution-areas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name: newName.trim() })
      });

      if (response.ok) {
        alert('Solution Area updated successfully!');
        
        // Add small delay before refresh to ensure database transaction is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Refresh metadata context immediately
        await refresh();
      } else {
        alert('Error updating solution area');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setEditingArea(null);
      setEditName('');
      setProcessing(false);
    }
  };

  const handleDeleteArea = async (area: { code: string; name: string; _count?: { slides: number } }) => {
    const slidesCount = area._count?.slides || 0;
    const message = slidesCount > 0 
      ? `Delete "${area.name}"? It is used in ${slidesCount} slides.`
      : `Delete "${area.name}"?`;
    
    if (!confirm(message)) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/solution-areas?code=${area.code}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Solution Area deleted successfully!');
        
        // Add small delay before refresh to ensure database transaction is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Refresh metadata context immediately
        await refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error deleting solution area');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading solution areas...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Solution Areas (Multiple choice)</h3>
      
      {/* Add new area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newAreaCode}
          onChange={(e) => setNewAreaCode(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          placeholder="Code (e.g., analytics)"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <input
          type="text"
          value={newAreaName}
          onChange={(e) => setNewAreaName(e.target.value)}
          placeholder="Name (e.g., Analytics)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <button
          onClick={handleAddArea}
          disabled={processing || !newAreaCode.trim() || !newAreaName.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {solutionAreas.filter(area => area && area.code).map(area => (
          <div key={area.code} className="flex items-center justify-between p-2 bg-gray-50 rounded-md group">
            {editingArea === area.code ? (
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-gray-500">{area.code}:</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditArea(area.code, editName)}
                  className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => handleEditArea(area.code, editName)}
                  className="p-0.5 text-green-600 hover:text-green-700"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setEditingArea(null);
                    setEditName('');
                  }}
                  className="p-0.5 text-gray-600 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm text-gray-700">{area.name}</span>
                  <span className="text-xs text-gray-500 ml-1">({area.code})</span>
                  {area._count && area._count.slides > 0 && (
                    <span className="text-xs text-gray-400 ml-1">[{area._count.slides}]</span>
                  )}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingArea(area.code);
                      setEditName(area.name);
                    }}
                    className="p-0.5 text-gray-500 hover:text-blue-600"
                    disabled={processing}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteArea(area)}
                    className="p-0.5 text-gray-500 hover:text-red-600"
                    disabled={processing}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Domains Manager
function DomainsManager() {
  const { metadata, loading, refreshMetadata: refresh } = useMetadata();
  const [processing, setProcessing] = useState(false);
  const [newDomainCode, setNewDomainCode] = useState('');
  const [newDomainName, setNewDomainName] = useState('');
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const domains = metadata?.domains || [];

  const handleAddDomain = async () => {
    if (!newDomainCode.trim() || !newDomainName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newDomainCode.trim(), name: newDomainName.trim() })
      });

      if (response.ok) {
        setNewDomainCode('');
        setNewDomainName('');
        alert('Domain added successfully!');
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding domain');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditDomain = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/domains', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newName.trim() })
      });

      if (response.ok) {
        alert('Domain updated successfully!');
        refresh();
      } else {
        alert('Error updating domain');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setEditingDomain(null);
      setEditName('');
      setProcessing(false);
    }
  };

  const handleDeleteDomain = async (domain: { id: string; name: string; _count?: { slides: number } }) => {
    const slidesCount = domain._count?.slides || 0;
    const message = slidesCount > 0 
      ? `Delete "${domain.name}"? It is used in ${slidesCount} slides.`
      : `Delete "${domain.name}"?`;
    
    if (!confirm(message)) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/domains?id=${domain.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Domain deleted successfully!');
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error deleting domain');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading domains...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Domains / Industries (Single choice)</h3>
      
      {/* Add new domain */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newDomainCode}
          onChange={(e) => setNewDomainCode(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          placeholder="Code (e.g., fintech)"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <input
          type="text"
          value={newDomainName}
          onChange={(e) => setNewDomainName(e.target.value)}
          placeholder="Name (e.g., Financial Technology)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <button
          onClick={handleAddDomain}
          disabled={processing || !newDomainCode.trim() || !newDomainName.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {domains.filter(domain => domain && domain.id).map(domain => (
          <div key={domain.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md group">
            {editingDomain === domain.id ? (
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-gray-500">{domain.code}:</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditDomain(domain.id, editName)}
                  className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => handleEditDomain(domain.id, editName)}
                  className="p-0.5 text-green-600 hover:text-green-700"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setEditingDomain(null);
                    setEditName('');
                  }}
                  className="p-0.5 text-gray-600 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm text-gray-700">{domain.name}</span>
                  <span className="text-xs text-gray-500 ml-1">({domain.code})</span>
                  {domain._count && domain._count.slides > 0 && (
                    <span className="text-xs text-gray-400 ml-1">[{domain._count.slides}]</span>
                  )}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingDomain(domain.id);
                      setEditName(domain.name);
                    }}
                    className="p-0.5 text-gray-500 hover:text-blue-600"
                    disabled={processing}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteDomain(domain)}
                    className="p-0.5 text-gray-500 hover:text-red-600"
                    disabled={processing}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Products Manager
function ProductsManager() {
  const { metadata, loading, refreshMetadata: refresh } = useMetadata();
  const [processing, setProcessing] = useState(false);
  const [newProductCode, setNewProductCode] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const products = metadata?.products || [];

  const handleAddProduct = async () => {
    if (!newProductCode.trim() || !newProductName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newProductCode.trim(), name: newProductName.trim() })
      });

      if (response.ok) {
        setNewProductCode('');
        setNewProductName('');
        alert('Product added successfully!');
        
        // Refresh metadata context immediately
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding product');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditProduct = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newName.trim() })
      });

      if (response.ok) {
        alert('Product updated successfully!');
        
        // Refresh metadata context immediately
        refresh();
      } else {
        alert('Error updating product');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setEditingProduct(null);
      setEditName('');
      setProcessing(false);
    }
  };

  const handleDeleteProduct = async (product: { id: string; name: string; _count?: { slides: number } }) => {
    const slidesCount = product._count?.slides || 0;
    const message = slidesCount > 0 
      ? `Delete "${product.name}"? It is used in ${slidesCount} slides.`
      : `Delete "${product.name}"?`;
    
    if (!confirm(message)) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/products?id=${product.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Product deleted successfully!');
        
        // Refresh metadata context immediately
        refresh();
      }
    } catch (error) {
      alert('Error deleting product');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading products...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Products (Multiple choice)</h3>
      
      {/* Add new product */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newProductCode}
          onChange={(e) => setNewProductCode(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          placeholder="Code (e.g., analytics-platform)"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <input
          type="text"
          value={newProductName}
          onChange={(e) => setNewProductName(e.target.value)}
          placeholder="Name (e.g., Analytics Platform)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <button
          onClick={handleAddProduct}
          disabled={processing || !newProductCode.trim() || !newProductName.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {products.filter(product => product && product.id).map(product => (
          <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md group">
            {editingProduct === product.id ? (
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-gray-500">{product.code}:</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditProduct(product.id, editName)}
                  className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => handleEditProduct(product.id, editName)}
                  className="p-0.5 text-green-600 hover:text-green-700"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setEditName('');
                  }}
                  className="p-0.5 text-gray-600 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm text-gray-700">{product.name}</span>
                  <span className="text-xs text-gray-500 ml-1">({product.code})</span>
                  {product._count && product._count.slides > 0 && (
                    <span className="text-xs text-gray-400 ml-1">[{product._count.slides}]</span>
                  )}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingProduct(product.id);
                      setEditName(product.name);
                    }}
                    className="p-0.5 text-gray-500 hover:text-blue-600"
                    disabled={processing}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product)}
                    className="p-0.5 text-gray-500 hover:text-red-600"
                    disabled={processing}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Confidentiality Manager
function ConfidentialityManager() {
  const { metadata, loading, refreshMetadata: refresh } = useMetadata();
  const [processing, setProcessing] = useState(false);
  const [newConfidentialityCode, setNewConfidentialityCode] = useState('');
  const [newConfidentialityName, setNewConfidentialityName] = useState('');
  const [editingConfidentiality, setEditingConfidentiality] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const confidentiality = metadata?.confidentiality || [];

  const handleAddConfidentiality = async () => {
    if (!newConfidentialityCode.trim() || !newConfidentialityName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/confidentiality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newConfidentialityCode.trim(), name: newConfidentialityName.trim() })
      });

      if (response.ok) {
        setNewConfidentialityCode('');
        setNewConfidentialityName('');
        alert('Confidentiality added successfully!');
        
        // Refresh metadata context immediately
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding confidentiality');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditConfidentiality = async (code: string, newName: string) => {
    if (!newName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/confidentiality', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name: newName.trim() })
      });

      if (response.ok) {
        alert('Confidentiality updated successfully!');
        
        // Refresh metadata context immediately
        refresh();
      } else {
        alert('Error updating confidentiality');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setEditingConfidentiality(null);
      setEditName('');
      setProcessing(false);
    }
  };

  const handleDeleteConfidentiality = async (confidentiality: { code: string; name: string }) => {
    if (!confirm(`Delete "${confidentiality.name}"?`)) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/confidentiality?code=${confidentiality.code}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Confidentiality deleted successfully!');
        
        // Refresh metadata context immediately
        refresh();
      }
    } catch (error) {
      alert('Error deleting confidentiality');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading confidentiality...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Confidentiality (Single choice)</h3>
      
      {/* Add new confidentiality */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newConfidentialityCode}
          onChange={(e) => setNewConfidentialityCode(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
          placeholder="Code (e.g., confidential)"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <input
          type="text"
          value={newConfidentialityName}
          onChange={(e) => setNewConfidentialityName(e.target.value)}
          placeholder="Name (e.g., Confidential)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <button
          onClick={handleAddConfidentiality}
          disabled={processing || !newConfidentialityCode.trim() || !newConfidentialityName.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {confidentiality.filter(confidentiality => confidentiality && confidentiality.code).map(confidentiality => (
          <div key={confidentiality.code} className="flex items-center justify-between p-2 bg-gray-50 rounded-md group">
            {editingConfidentiality === confidentiality.code ? (
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-gray-500">{confidentiality.code}:</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditConfidentiality(confidentiality.code, editName)}
                  className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => handleEditConfidentiality(confidentiality.code, editName)}
                  className="p-0.5 text-green-600 hover:text-green-700"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setEditingConfidentiality(null);
                    setEditName('');
                  }}
                  className="p-0.5 text-gray-600 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm text-gray-700">{confidentiality.name}</span>
                  <span className="text-xs text-gray-500 ml-1">({confidentiality.code})</span>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingConfidentiality(confidentiality.code);
                      setEditName(confidentiality.name);
                    }}
                    className="p-0.5 text-gray-500 hover:text-blue-600"
                    disabled={processing}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteConfidentiality(confidentiality)}
                    className="p-0.5 text-gray-500 hover:text-red-600"
                    disabled={processing}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Components Manager
function ComponentsManager() {
  const { metadata, loading, refreshMetadata: refresh } = useMetadata();
  const [processing, setProcessing] = useState(false);
  const [newComponentCode, setNewComponentCode] = useState('');
  const [newComponentName, setNewComponentName] = useState('');
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const components = metadata?.components || [];

  const handleAddComponent = async () => {
    if (!newComponentCode.trim() || !newComponentName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newComponentCode.trim(), name: newComponentName.trim() })
      });

      if (response.ok) {
        setNewComponentCode('');
        setNewComponentName('');
        alert('Component added successfully!');
        
        // Refresh metadata context immediately
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding component');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditComponent = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/components', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newName.trim() })
      });

      if (response.ok) {
        alert('Component updated successfully!');
        
        // Refresh metadata context immediately
        refresh();
      } else {
        alert('Error updating component');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setEditingComponent(null);
      setEditName('');
      setProcessing(false);
    }
  };

  const handleDeleteComponent = async (component: { id: string; name: string; _count?: { slides: number } }) => {
    const slidesCount = component._count?.slides || 0;
    const message = slidesCount > 0 
      ? `Delete "${component.name}"? It is used in ${slidesCount} slides.`
      : `Delete "${component.name}"?`;
    
    if (!confirm(message)) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/components?id=${component.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Component deleted successfully!');
        
        // Refresh metadata context immediately
        refresh();
      }
    } catch (error) {
      alert('Error deleting component');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading components...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Components (Multiple choice)</h3>
      
      {/* Add new component */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newComponentCode}
          onChange={(e) => setNewComponentCode(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          placeholder="Code (e.g., dashboard)"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <input
          type="text"
          value={newComponentName}
          onChange={(e) => setNewComponentName(e.target.value)}
          placeholder="Name (e.g., Dashboard)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <button
          onClick={handleAddComponent}
          disabled={processing || !newComponentCode.trim() || !newComponentName.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {components.filter(component => component && component.id).map(component => (
          <div key={component.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md group">
            {editingComponent === component.id ? (
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-gray-500">{component.code}:</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditComponent(component.id, editName)}
                  className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => handleEditComponent(component.id, editName)}
                  className="p-0.5 text-green-600 hover:text-green-700"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setEditingComponent(null);
                    setEditName('');
                  }}
                  className="p-0.5 text-gray-600 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm text-gray-700">{component.name}</span>
                  <span className="text-xs text-gray-500 ml-1">({component.code})</span>
                  {component._count && component._count.slides > 0 && (
                    <span className="text-xs text-gray-400 ml-1">[{component._count.slides}]</span>
                  )}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingComponent(component.id);
                      setEditName(component.name);
                    }}
                    className="p-0.5 text-gray-500 hover:text-blue-600"
                    disabled={processing}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteComponent(component)}
                    className="p-0.5 text-gray-500 hover:text-red-600"
                    disabled={processing}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Integrations Manager
function IntegrationsManager() {
  const { metadata, loading, refreshMetadata: refresh } = useMetadata();
  const [processing, setProcessing] = useState(false);
  const [newIntegrationCode, setNewIntegrationCode] = useState('');
  const [newIntegrationName, setNewIntegrationName] = useState('');
  const [editingIntegration, setEditingIntegration] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const integrations = metadata?.integrations || [];

  const handleAddIntegration = async () => {
    if (!newIntegrationCode.trim() || !newIntegrationName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newIntegrationCode.trim(), name: newIntegrationName.trim() })
      });

      if (response.ok) {
        setNewIntegrationCode('');
        setNewIntegrationName('');
        alert('Integration added successfully!');
        
        // Refresh metadata context immediately
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding integration');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditIntegration = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newName.trim() })
      });

      if (response.ok) {
        alert('Integration updated successfully!');
        
        // Refresh metadata context immediately
        refresh();
      } else {
        alert('Error updating integration');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setEditingIntegration(null);
      setEditName('');
      setProcessing(false);
    }
  };

  const handleDeleteIntegration = async (integration: { id: string; name: string; _count?: { slides: number } }) => {
    const slidesCount = integration._count?.slides || 0;
    const message = slidesCount > 0 
      ? `Delete "${integration.name}"? It is used in ${slidesCount} slides.`
      : `Delete "${integration.name}"?`;
    
    if (!confirm(message)) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/integrations?id=${integration.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Integration deleted successfully!');
        
        // Refresh metadata context immediately
        refresh();
      }
    } catch (error) {
      alert('Error deleting integration');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading integrations...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Integrations (Multiple choice)</h3>
      
      {/* Add new integration */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newIntegrationCode}
          onChange={(e) => setNewIntegrationCode(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          placeholder="Code (e.g., salesforce)"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <input
          type="text"
          value={newIntegrationName}
          onChange={(e) => setNewIntegrationName(e.target.value)}
          placeholder="Name (e.g., Salesforce)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <button
          onClick={handleAddIntegration}
          disabled={processing || !newIntegrationCode.trim() || !newIntegrationName.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {integrations.filter(integration => integration && integration.id).map(integration => (
          <div key={integration.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md group">
            {editingIntegration === integration.id ? (
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-gray-500">{integration.code}:</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditIntegration(integration.id, editName)}
                  className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => handleEditIntegration(integration.id, editName)}
                  className="p-0.5 text-green-600 hover:text-green-700"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setEditingIntegration(null);
                    setEditName('');
                  }}
                  className="p-0.5 text-gray-600 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm text-gray-700">{integration.name}</span>
                  <span className="text-xs text-gray-500 ml-1">({integration.code})</span>
                  {integration._count && integration._count.slides > 0 && (
                    <span className="text-xs text-gray-400 ml-1">[{integration._count.slides}]</span>
                  )}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingIntegration(integration.id);
                      setEditName(integration.name);
                    }}
                    className="p-0.5 text-gray-500 hover:text-blue-600"
                    disabled={processing}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteIntegration(integration)}
                    className="p-0.5 text-gray-500 hover:text-red-600"
                    disabled={processing}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Tags Manager
function TagsManager() {
  const { metadata, loading, refreshMetadata: refresh } = useMetadata();
  const [processing, setProcessing] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const tags = metadata?.tags || [];

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() })
      });

      if (response.ok) {
        setNewTagName('');
        alert('Tag added successfully!');
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding tag');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteTag = async (tag: { id: string; name: string; _count?: { slides: number } }) => {
    const slidesCount = tag._count?.slides || 0;
    const message = slidesCount > 0 
      ? `Delete "${tag.name}"? It is used in ${slidesCount} slides.`
      : `Delete "${tag.name}"?`;
    
    if (!confirm(message)) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/tags?id=${tag.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Tag deleted successfully!');
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error deleting tag');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditTag = async (tagId: string, newName: string) => {
    if (!newName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tagId, name: newName.trim() })
      });

      if (response.ok) {
        alert('Tag updated successfully!');
        refresh();
      } else {
        alert('Error updating tag');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setEditingTag(null);
      setEditName('');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tags...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Tags Management</h2>
      <p className="text-gray-600 mb-6">
        Manage available tags for slides. Total tags: {tags.length}
      </p>
      
      {/* Add new tag */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !processing && handleAddTag()}
          placeholder="New tag..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          disabled={processing}
        />
        <button
          onClick={handleAddTag}
          disabled={processing || !newTagName.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-1" />
          {processing ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Tags list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tags.filter(tag => tag && tag.id).map(tag => (
          <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
            {editingTag === tag.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditTag(tag.id, editName)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  autoFocus
                  disabled={processing}
                />
                <button
                  onClick={() => handleEditTag(tag.id, editName)}
                  className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                  disabled={processing}
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingTag(null);
                    setEditName('');
                  }}
                  className="p-1 text-gray-600 hover:text-gray-700"
                  disabled={processing}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    {tag._count && (
                      <span>Used: {tag._count.slides}</span>
                    )}
                    {tag.isAutomatic && (
                      <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Auto</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingTag(tag.id);
                      setEditName(tag.name);
                    }}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                    disabled={processing}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag)}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                    disabled={processing}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-medium text-blue-800 mb-2">Note</p>
        <p>Tag changes will not affect existing slides. Use "Auto Extract" in moderation to update tags on slides.</p>
      </div>
    </div>
  );
}

// Categories Manager Component
function CategoriesManager() {
  const { metadata, loading, refreshMetadata: refresh } = useMetadata();
  const [processing, setProcessing] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', code: '', icon: '', parentId: null as string | null });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ name: '', icon: '', parentId: null as string | null });
  const [showIconPicker, setShowIconPicker] = useState(false);

  const categories = metadata?.categories || [];
  
  // Use categories.length to ensure re-render
  useEffect(() => {
    console.log('Categories updated, total categories:', categories.length);
  }, [categories.length]);

  // Get available parent categories (excluding self and descendants)
  const getAvailableParents = (currentCategoryId: string) => {
    const isDescendant = (category: any, targetId: string): boolean => {
      if (category.id === targetId) return true;
      if (category.children) {
        return category.children.some((child: any) => isDescendant(child, targetId));
      }
      return false;
    };

    return categories.filter(cat => 
      cat && cat.id && 
      cat.id !== currentCategoryId && 
      !isDescendant(cat, currentCategoryId)
    );
  };

  // Close icon picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showIconPicker) {
        const target = event.target as HTMLElement;
        if (!target.closest('.icon-picker-container')) {
          setShowIconPicker(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showIconPicker]);

  const handleAddCategory = async (parentId: string | null = null) => {
    if (!newCategory.code.trim() || !newCategory.name.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: newCategory.code.trim(), 
          name: newCategory.name.trim(),
          icon: newCategory.icon || '📁',
          parentId: parentId || newCategory.parentId
        })
      });

      if (response.ok) {
        setNewCategory({ name: '', code: '', icon: '', parentId: null });
        alert('Category added successfully!');
        
        // Refresh metadata context immediately
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding category');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditCategory = async (id: string, updates: any) => {
    setProcessing(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });

      if (response.ok) {
        setEditingCategory(null);
        setEditValue({ name: '', icon: '', parentId: null });
        alert('Category updated successfully!');
        
        // Add small delay before refresh to ensure database transaction is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Refresh metadata context immediately
        await refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error updating category');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? This action cannot be undone.')) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Category deleted successfully!');
        
        // Add small delay before refresh to ensure database transaction is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Refresh metadata context immediately
        await refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error deleting category');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  // Handle parent change
  const handleChangeParent = async (categoryId: string, newParentId: string | null) => {
    setProcessing(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: categoryId, parentId: newParentId })
      });

      if (response.ok) {
        alert('Category hierarchy updated successfully!');
        
        // Add small delay before refresh to ensure database transaction is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error updating category hierarchy');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const renderCategory = (category: any, level: number = 0) => {
    const isEditing = editingCategory === category.id;
    const isParent = category.children && category.children.length > 0;
    const isChild = level > 0;
    
    return (
      <div key={`${category.id || category.code}-${level}`} className={`${level > 0 ? 'ml-8' : ''}`}>
        <div 
          className={`
            flex items-center justify-between p-2 hover:bg-gray-50 rounded group border-l-4
            ${isParent ? 'border-l-blue-500 bg-blue-50' : isChild ? 'border-l-green-400 bg-green-50' : 'border-l-gray-300'}
          `}
        >
          {isEditing ? (
            <div className="flex flex-col gap-3 flex-1">
              {/* First row: Icon and Name */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editValue.icon}
                  onChange={(e) => setEditValue({ ...editValue, icon: e.target.value })}
                  placeholder="Icon"
                  className="w-12 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                />
                <input
                  type="text"
                  value={editValue.name}
                  onChange={(e) => setEditValue({ ...editValue, name: e.target.value })}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                  autoFocus
                />
              </div>
              
              {/* Second row: Parent selection and buttons */}
              <div className="flex items-center gap-2">
                <select
                  value={editValue.parentId || ''}
                  onChange={(e) => setEditValue({ ...editValue, parentId: e.target.value || null })}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                >
                  <option value="">Make Root Category</option>
                  {getAvailableParents(category.id).map(parentCategory => (
                    <option key={parentCategory.id} value={parentCategory.id}>
                      Move under "{parentCategory.name}"
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => handleEditCategory(category.id, editValue)}
                  className="p-1 text-green-600 hover:text-green-700"
                  disabled={processing}
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setEditValue({ name: '', icon: '', parentId: null });
                  }}
                  className="p-1 text-gray-600 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Helpful text */}
              <div className="text-xs text-gray-500">
                Change hierarchy: Select "Make Root Category" to make this a parent, or choose another category to move under
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-lg">{category.icon || '📁'}</span>
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
                <span className="text-xs text-gray-500">({category.code})</span>
                {isParent && (
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-medium">
                    Parent Category
                  </span>
                )}
                {isChild && (
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">
                    Child Category
                  </span>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingCategory(category.id);
                    setEditValue({ name: category.name, icon: category.icon || '', parentId: category.parentId });
                  }}
                  className="p-1 text-gray-500 hover:text-blue-600"
                  disabled={processing}
                  title="Edit name and icon"
                >
                  <Edit2 className="w-3 h-3" />
                </button>

                {(!category.children || category.children.length === 0) && (
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                    disabled={processing}
                    title="Delete category"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        {category.children && category.children.filter((child: any) => child && child.id).map((child: any) => renderCategory(child, level + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    );
  }

  return (
          <div key={`categories-${categories.length}`}>
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Categories Management</h2>
      <p className="text-gray-600 mb-6">
        Manage the category hierarchy for slides and library
      </p>

      {/* Add new root category */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-3">Add New Category</h3>
        <div className="flex gap-2 mb-3">
          {/* Icon selector with popular emojis */}
          <div className="relative icon-picker-container">
            <button
              type="button"
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white hover:bg-gray-50 flex items-center justify-center"
              disabled={processing}
            >
              {newCategory.icon || '📁'}
            </button>
            {showIconPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 w-64 p-3">
                <div className="text-xs text-gray-500 mb-2">Popular Category Icons:</div>
                <div className="grid grid-cols-8 gap-1">
                  {CATEGORY_ICONS.map((icon: string) => (
                    <button
                      key={icon}
                      onClick={() => {
                        setNewCategory({ ...newCategory, icon });
                        setShowIconPicker(false);
                      }}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <input
                    type="text"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    placeholder="Or type custom emoji"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
          
          <input
            type="text"
            value={newCategory.code}
            onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value })}
            placeholder="Code (e.g., marketing)"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
            disabled={processing}
          />
          <input
            type="text"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            placeholder="Name (e.g., Marketing)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
            disabled={processing}
          />
          
          {/* Parent category selector */}
          <select
            value={newCategory.parentId || ''}
            onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value || null })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
            disabled={processing}
          >
            <option value="">Root Category</option>
            {categories.filter(cat => cat && cat.id).map(category => (
              <option key={category.id} value={category.id}>
                {category.name} (as child)
              </option>
            ))}
          </select>
          
          <button
            onClick={() => handleAddCategory(newCategory.parentId)}
            disabled={processing || !newCategory.code.trim() || !newCategory.name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          Choose "Root Category" to create a parent category, or select existing category to create a child category
        </div>
      </div>

      {/* Categories tree */}
      <div className="space-y-2 border border-gray-200 rounded-lg p-4">
        {categories.filter(category => category && category.id && !category.parentId).map((category, index) => (
          <React.Fragment key={`${category.id}-${index}`}>
            {renderCategory(category)}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-medium text-blue-800 mb-2">Category Hierarchy Management</p>
        <div className="space-y-1">
          <p>• <span className="text-blue-800 font-medium">Parent Categories</span> - Blue background with "Parent Category" label</p>
          <p>• <span className="text-green-800 font-medium">Child Categories</span> - Green background with "Child Category" label, indented</p>
          <p>• Only child categories can contain slides directly</p>
          <p>• Parent categories show total count from all children</p>
          <p>• <strong>Edit to change hierarchy:</strong> Click edit button to change parent/child relationships</p>
          <p>• You can only delete categories that have no children</p>
        </div>
      </div>
    </div>
  );
}

// Static Values Manager Component
function StaticValuesManager() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-2 text-gray-900">Static System Values</h2>
        <p className="text-gray-600 mb-6">
          Manage system-level values used across the application
        </p>
      </div>
      
      <StatusesManager />
      <FormatsManager />
      <LanguagesManager />
      <RegionsManager />
    </div>
  );
}

// Statuses Manager
function StatusesManager() {
  const { metadata, loading, refreshMetadata: refresh } = useMetadata();
  const [processing, setProcessing] = useState(false);
  const [newStatusCode, setNewStatusCode] = useState('');
  const [newStatusName, setNewStatusName] = useState('');
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const statuses = metadata?.statuses || [];

  const handleAddStatus = async () => {
    if (!newStatusCode.trim() || !newStatusName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newStatusCode.trim(), name: newStatusName.trim() })
      });

      if (response.ok) {
        setNewStatusCode('');
        setNewStatusName('');
        alert('Status added successfully!');
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding status');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditStatus = async (code: string, newName: string) => {
    if (!newName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/statuses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name: newName.trim() })
      });

      if (response.ok) {
        alert('Status updated successfully!');
        refresh();
      } else {
        alert('Error updating status');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setEditingStatus(null);
      setEditName('');
      setProcessing(false);
    }
  };

  const handleDeleteStatus = async (status: { code: string; name: string }) => {
    if (!confirm(`Delete "${status.name}"?`)) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/statuses?code=${status.code}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Status deleted successfully!');
        refresh();
      }
    } catch (error) {
      alert('Error deleting status');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading statuses...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Slide Status (Single choice)</h3>
      
      {/* Add new status */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newStatusCode}
          onChange={(e) => setNewStatusCode(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
          placeholder="Code (e.g., in_review)"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <input
          type="text"
          value={newStatusName}
          onChange={(e) => setNewStatusName(e.target.value)}
          placeholder="Name (e.g., In Review)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <button
          onClick={handleAddStatus}
          disabled={processing || !newStatusCode.trim() || !newStatusName.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {statuses.filter(status => status && status.code).map(status => (
          <div key={status.code} className="flex items-center justify-between p-2 bg-gray-50 rounded-md group">
            {editingStatus === status.code ? (
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-gray-500">{status.code}:</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditStatus(status.code, editName)}
                  className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => handleEditStatus(status.code, editName)}
                  className="p-0.5 text-green-600 hover:text-green-700"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setEditingStatus(null);
                    setEditName('');
                  }}
                  className="p-0.5 text-gray-600 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm text-gray-700">{status.name}</span>
                  <span className="text-xs text-gray-500 ml-1">({status.code})</span>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingStatus(status.code);
                      setEditName(status.name);
                    }}
                    className="p-0.5 text-gray-500 hover:text-blue-600"
                    disabled={processing}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteStatus(status)}
                    className="p-0.5 text-gray-500 hover:text-red-600"
                    disabled={processing}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Formats Manager  
function FormatsManager() {
  const { metadata, loading, refreshMetadata: refresh } = useMetadata();
  const [processing, setProcessing] = useState(false);
  const [newFormatCode, setNewFormatCode] = useState('');
  const [newFormatName, setNewFormatName] = useState('');
  const [editingFormat, setEditingFormat] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const formats = metadata?.formats || [];

  const handleAddFormat = async () => {
    if (!newFormatCode.trim() || !newFormatName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/formats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newFormatCode.trim(), name: newFormatName.trim() })
      });

      if (response.ok) {
        setNewFormatCode('');
        setNewFormatName('');
        alert('Format added successfully!');
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding format');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditFormat = async (code: string, newName: string) => {
    if (!newName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/formats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name: newName.trim() })
      });

      if (response.ok) {
        alert('Format updated successfully!');
        refresh();
      } else {
        alert('Error updating format');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setEditingFormat(null);
      setEditName('');
      setProcessing(false);
    }
  };

  const handleDeleteFormat = async (format: { code: string; name: string }) => {
    if (!confirm(`Delete "${format.name}"?`)) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/formats?code=${format.code}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Format deleted successfully!');
        refresh();
      }
    } catch (error) {
      alert('Error deleting format');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading formats...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Slide Format (Single choice)</h3>
      
      {/* Add new format */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newFormatCode}
          onChange={(e) => setNewFormatCode(e.target.value.toLowerCase())}
          placeholder="Code (e.g., vertical)"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <input
          type="text"
          value={newFormatName}
          onChange={(e) => setNewFormatName(e.target.value)}
          placeholder="Name (e.g., Vertical)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <button
          onClick={handleAddFormat}
          disabled={processing || !newFormatCode.trim() || !newFormatName.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {formats.filter(format => format && format.code).map(format => (
          <div key={format.code} className="flex items-center justify-between p-2 bg-gray-50 rounded-md group">
            {editingFormat === format.code ? (
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-gray-500">{format.code}:</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditFormat(format.code, editName)}
                  className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => handleEditFormat(format.code, editName)}
                  className="p-0.5 text-green-600 hover:text-green-700"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setEditingFormat(null);
                    setEditName('');
                  }}
                  className="p-0.5 text-gray-600 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm text-gray-700">{format.name}</span>
                  <span className="text-xs text-gray-500 ml-1">({format.code})</span>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingFormat(format.code);
                      setEditName(format.name);
                    }}
                    className="p-0.5 text-gray-500 hover:text-blue-600"
                    disabled={processing}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteFormat(format)}
                    className="p-0.5 text-gray-500 hover:text-red-600"
                    disabled={processing}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Languages Manager
function LanguagesManager() {
  const { metadata, loading, refreshMetadata: refresh } = useMetadata();
  const [processing, setProcessing] = useState(false);
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [newLanguageName, setNewLanguageName] = useState('');
  const [editingLanguage, setEditingLanguage] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const languages = metadata?.languages || [];

  const handleAddLanguage = async () => {
    if (!newLanguageCode.trim() || !newLanguageName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newLanguageCode.trim(), name: newLanguageName.trim() })
      });

      if (response.ok) {
        setNewLanguageCode('');
        setNewLanguageName('');
        alert('Language added successfully!');
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding language');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditLanguage = async (code: string, newName: string) => {
    if (!newName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/languages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name: newName.trim() })
      });

      if (response.ok) {
        alert('Language updated successfully!');
        refresh();
      } else {
        alert('Error updating language');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setEditingLanguage(null);
      setEditName('');
      setProcessing(false);
    }
  };

  const handleDeleteLanguage = async (language: { code: string; name: string }) => {
    if (!confirm(`Delete "${language.name}"?`)) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/languages?code=${language.code}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Language deleted successfully!');
        refresh();
      }
    } catch (error) {
      alert('Error deleting language');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading languages...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Content Language (Single choice)</h3>
      
      {/* Add new language */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newLanguageCode}
          onChange={(e) => setNewLanguageCode(e.target.value.toLowerCase())}
          placeholder="Code (e.g., es)"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <input
          type="text"
          value={newLanguageName}
          onChange={(e) => setNewLanguageName(e.target.value)}
          placeholder="Name (e.g., Spanish)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <button
          onClick={handleAddLanguage}
          disabled={processing || !newLanguageCode.trim() || !newLanguageName.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {languages.filter(language => language && language.code).map(language => (
          <div key={language.code} className="flex items-center justify-between p-2 bg-gray-50 rounded-md group">
            {editingLanguage === language.code ? (
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-gray-500">{language.code}:</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditLanguage(language.code, editName)}
                  className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => handleEditLanguage(language.code, editName)}
                  className="p-0.5 text-green-600 hover:text-green-700"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setEditingLanguage(null);
                    setEditName('');
                  }}
                  className="p-0.5 text-gray-600 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm text-gray-700">{language.name}</span>
                  <span className="text-xs text-gray-500 ml-1">({language.code})</span>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingLanguage(language.code);
                      setEditName(language.name);
                    }}
                    className="p-0.5 text-gray-500 hover:text-blue-600"
                    disabled={processing}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteLanguage(language)}
                    className="p-0.5 text-gray-500 hover:text-red-600"
                    disabled={processing}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Regions Manager
function RegionsManager() {
  const { metadata, loading, refreshMetadata: refresh } = useMetadata();
  const [processing, setProcessing] = useState(false);
  const [newRegionCode, setNewRegionCode] = useState('');
  const [newRegionName, setNewRegionName] = useState('');
  const [editingRegion, setEditingRegion] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const regions = metadata?.regions || [];

  const handleAddRegion = async () => {
    if (!newRegionCode.trim() || !newRegionName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newRegionCode.trim(), name: newRegionName.trim() })
      });

      if (response.ok) {
        setNewRegionCode('');
        setNewRegionName('');
        alert('Region added successfully!');
        refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding region');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditRegion = async (code: string, newName: string) => {
    if (!newName.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/regions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name: newName.trim() })
      });

      if (response.ok) {
        alert('Region updated successfully!');
        refresh();
      } else {
        alert('Error updating region');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setEditingRegion(null);
      setEditName('');
      setProcessing(false);
    }
  };

  const handleDeleteRegion = async (region: { code: string; name: string }) => {
    if (!confirm(`Delete "${region.name}"?`)) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/regions?code=${region.code}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Region deleted successfully!');
        refresh();
      }
    } catch (error) {
      alert('Error deleting region');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading regions...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Region (Single choice)</h3>
      
      {/* Add new region */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newRegionCode}
          onChange={(e) => setNewRegionCode(e.target.value.toLowerCase())}
          placeholder="Code (e.g., mena)"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <input
          type="text"
          value={newRegionName}
          onChange={(e) => setNewRegionName(e.target.value)}
          placeholder="Name (e.g., Middle East & North Africa)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          disabled={processing}
        />
        <button
          onClick={handleAddRegion}
          disabled={processing || !newRegionCode.trim() || !newRegionName.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {regions.filter(region => region && region.code).map(region => (
          <div key={region.code} className="flex items-center justify-between p-2 bg-gray-50 rounded-md group">
            {editingRegion === region.code ? (
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-gray-500">{region.code}:</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditRegion(region.code, editName)}
                  className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => handleEditRegion(region.code, editName)}
                  className="p-0.5 text-green-600 hover:text-green-700"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setEditingRegion(null);
                    setEditName('');
                  }}
                  className="p-0.5 text-gray-600 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm text-gray-700">{region.name}</span>
                  <span className="text-xs text-gray-500 ml-1">({region.code})</span>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingRegion(region.code);
                      setEditName(region.name);
                    }}
                    className="p-0.5 text-gray-500 hover:text-blue-600"
                    disabled={processing}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteRegion(region)}
                    className="p-0.5 text-gray-500 hover:text-red-600"
                    disabled={processing}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 

// System Manager - для управления системными настройками
function SystemManager() {
  const [figmaToken, setFigmaToken] = useState('');
  const [maskedToken, setMaskedToken] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Загружаем текущий токен при монтировании компонента
  useEffect(() => {
    loadFigmaToken();
  }, []);

  const loadFigmaToken = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/system/settings?key=FIGMA_ACCESS_TOKEN');
      const data = await response.json();
      
      if (data.value) {
        setMaskedToken(data.maskedValue || '');
        setFigmaToken(data.value);
      }
    } catch (error) {
      console.error('Error loading Figma token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!figmaToken.trim()) {
      alert('Please enter a token');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'FIGMA_ACCESS_TOKEN',
          value: figmaToken.trim()
        })
      });

      if (response.ok) {
        alert('Figma token successfully updated!');
        setIsEditing(false);
        await loadFigmaToken();
      } else {
        alert('Error saving token');
      }
    } catch (error) {
      alert('Network error while saving token');
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!figmaToken.trim()) {
      alert('Please enter a token to validate');
      return;
    }

    setIsValidating(true);
    setTokenValid(null);
    
    try {
      // Check token via Figma API
      const response = await fetch('https://api.figma.com/v1/me', {
        headers: {
          'X-Figma-Token': figmaToken.trim()
        }
      });

      setTokenValid(response.ok);
      
      if (response.ok) {
        const userData = await response.json();
        alert(`Token is valid! User: ${userData.email}`);
      } else {
        alert('Token is invalid or expired');
      }
    } catch (error) {
      setTokenValid(false);
      alert('Error validating token');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-900">System Settings</h2>
        <p className="text-gray-600 mb-6">
          Manage global system settings
        </p>
      </div>

      {/* Figma Access Token */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Figma Access Token</h3>
            <p className="text-sm text-gray-600">
              Token for accessing Figma API. Used for importing slides and fetching images.
            </p>
            <a 
              href="https://www.figma.com/developers/api#access-tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 underline mt-1 inline-block"
            >
              How to get a token?
            </a>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={isLoading}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter new token:
              </label>
              <input
                type="text"
                value={figmaToken}
                onChange={(e) => setFigmaToken(e.target.value)}
                placeholder="figd_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                disabled={isSaving || isValidating}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleValidate}
                disabled={isSaving || isValidating || !figmaToken.trim()}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  tokenValid === true 
                    ? 'bg-green-600 text-white' 
                    : tokenValid === false 
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                } disabled:opacity-50`}
              >
                {isValidating ? 'Validating...' : 'Validate Token'}
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving || isValidating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFigmaToken('');
                  setTokenValid(null);
                }}
                disabled={isSaving || isValidating}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 font-mono">
              {maskedToken || 'Not set'}
            </span>
            {maskedToken && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                Active
              </span>
            )}
          </div>
        )}
      </div>

      {/* Other system settings can be added here */}
    </div>
  );
}
