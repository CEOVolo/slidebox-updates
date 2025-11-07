// New category system with subcategories
export interface CategoryNode {
  id: string;
  name: string;
  label: string;
  parentId?: string;
  children?: CategoryNode[];
  icon?: string;
  color?: string;
}

export const CATEGORIES: CategoryNode[] = [
  {
    id: 'company-overview',
    name: 'company-overview',
    label: 'Company Overview',
    icon: '🏢',
    children: [
      { id: 'company-mission', name: 'company-mission', label: 'Mission, Vision, Values, Location', parentId: 'company-overview', icon: '🎯' },
      { id: 'company-experience', name: 'company-experience', label: 'Company Experience (Industry Focused)', parentId: 'company-overview', icon: '💼' },
      { id: 'company-capabilities', name: 'company-capabilities', label: 'Company Capabilities and Key Facts', parentId: 'company-overview', icon: '⭐' },
      { id: 'company-structure', name: 'company-structure', label: 'Organizational Structure', parentId: 'company-overview', icon: '🏗️' }
    ]
  },
  {
    id: 'business-processes',
    name: 'business-processes',
    label: 'Core Business Processes',
    icon: '⚙️',
    children: [
      { id: 'recruitment', name: 'recruitment', label: 'Recruitment Processes', parentId: 'business-processes', icon: '👥' },
      { id: 'hr-processes', name: 'hr-processes', label: 'HR Processes', parentId: 'business-processes', icon: '🧑‍💼' },
      { id: 'delivery', name: 'delivery', label: 'Delivery Processes', parentId: 'business-processes', icon: '🚚' },
      { id: 'training', name: 'training', label: 'Internal Training and Process Slides', parentId: 'business-processes', icon: '📚' },
      { id: 'client-docs', name: 'client-docs', label: 'Client-Facing: Document Templates and Forms', parentId: 'business-processes', icon: '📋' }
    ]
  },
  {
    id: 'project-management',
    name: 'project-management',
    label: 'Project Management',
    icon: '📊',
    children: [
      { id: 'methodologies', name: 'methodologies', label: 'Methodologies', parentId: 'project-management', icon: '📋' },
      { id: 'roadmaps', name: 'roadmaps', label: 'Roadmaps and Communication Plans', parentId: 'project-management', icon: '🗺️' },
      { id: 'reporting', name: 'reporting', label: 'Reporting and Documentation Standards', parentId: 'project-management', icon: '📄' },
      { id: 'feedback', name: 'feedback', label: 'Feedback Handling and Objection Management', parentId: 'project-management', icon: '💬' },
      { id: 'governance', name: 'governance', label: 'Governance and Escalation Paths', parentId: 'project-management', icon: '🏛️' },
      { id: 'knowledge-transfer', name: 'knowledge-transfer', label: 'Knowledge Transfer', parentId: 'project-management', icon: '🔄' },
      { id: 'engagement', name: 'engagement', label: 'Engagement Models', parentId: 'project-management', icon: '🤝' }
    ]
  },
  {
    id: 'industry-solutions',
    name: 'industry-solutions',
    label: 'Industry Specific Solutions',
    icon: '🏭',
    children: [
      { id: 'industry-offerings', name: 'industry-offerings', label: 'Industry Offerings (Capabilities, Logos, Certifications)', parentId: 'industry-solutions', icon: '🏆' },
      { id: 'compliance', name: 'compliance', label: 'Regulatory Requirements and Compliance Standards', parentId: 'industry-solutions', icon: '⚖️' },
      { id: 'best-practices', name: 'best-practices', label: 'Best Practices by Industry', parentId: 'industry-solutions', icon: '✅' },
      { id: 'battlecards', name: 'battlecards', label: 'Sales Battlecards', parentId: 'industry-solutions', icon: '🃏' },
      { id: 'case-studies', name: 'case-studies', label: 'Industry-Specific Case Studies', parentId: 'industry-solutions', icon: '📖' }
    ]
  },
  {
    id: 'expertise',
    name: 'expertise',
    label: 'Cross-Functional Expertise',
    icon: '🛠️',
    children: [
      { id: 'app-development', name: 'app-development', label: 'Customer Application Development', parentId: 'expertise', icon: '💻' },
      { id: 'qa', name: 'qa', label: 'QA', parentId: 'expertise', icon: '🧪' },
      { id: 'devops', name: 'devops', label: 'DevOps and SRE', parentId: 'expertise', icon: '🔧' },
      { id: 'cloud', name: 'cloud', label: 'Cloud Engineering', parentId: 'expertise', icon: '☁️' },
      { id: 'security', name: 'security', label: 'Security', parentId: 'expertise', icon: '🔒' },
      { id: 'design', name: 'design', label: 'Design (UX/UI)', parentId: 'expertise', icon: '🎨' },
      { id: 'data-ai', name: 'data-ai', label: 'Data and Analytics AI', parentId: 'expertise', icon: '🤖' },
      { id: 'support', name: 'support', label: 'Support and IT Operations', parentId: 'expertise', icon: '🛠️' },
      { id: 'architecture', name: 'architecture', label: 'Architecture', parentId: 'expertise', icon: '🏗️' },
      { id: 'modernization', name: 'modernization', label: 'Legacy Modernization', parentId: 'expertise', icon: '🔄' }
    ]
  },
  {
    id: 'success-stories',
    name: 'success-stories',
    label: 'Success Stories and References',
    icon: '🏆',
    children: [
      { id: 'project-highlights', name: 'project-highlights', label: 'Project Highlights and Technologies Used', parentId: 'success-stories', icon: '⭐' },
      { id: 'testimonials', name: 'testimonials', label: 'Client Testimonials and Use Cases', parentId: 'success-stories', icon: '💬' },
      { id: 'client-stories', name: 'client-stories', label: 'Client Success Stories', parentId: 'success-stories', icon: '📚' },
      { id: 'portfolio', name: 'portfolio', label: 'Company Portfolio', parentId: 'success-stories', icon: '📂' }
    ]
  },
  {
    id: 'proposal-library',
    name: 'proposal-library',
    label: 'Proposal Library',
    icon: '📚',
    children: [
      { id: 'templates', name: 'templates', label: 'Proposal Templates and Presentation Decks', parentId: 'proposal-library', icon: '📄' },
      { id: 'transitions', name: 'transitions', label: 'Transition Slide Templates', parentId: 'proposal-library', icon: '🔗' },
      { id: 'faqs', name: 'faqs', label: 'Customer FAQs and Response Library', parentId: 'proposal-library', icon: '❓' },
      { id: 'competitive', name: 'competitive', label: 'Competitive Comparison', parentId: 'proposal-library', icon: '⚔️' },
      { id: 'lessons', name: 'lessons', label: 'Lessons Learned', parentId: 'proposal-library', icon: '💡' }
    ]
  }
];

// Function to get all categories (including subcategories)
export function getAllCategories(): string[] {
  const categories: string[] = [];
  
  function extractCategories(nodes: CategoryNode[]) {
    nodes.forEach(node => {
      categories.push(node.id);
      if (node.children) {
        extractCategories(node.children);
      }
    });
  }
  
  extractCategories(CATEGORIES);
  return categories;
}

// Function to find category by ID
export function findCategoryById(id: string): CategoryNode | null {
  function search(nodes: CategoryNode[]): CategoryNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = search(node.children);
        if (found) return found;
      }
    }
    return null;
  }
  
  return search(CATEGORIES);
}

// Core types
export interface Slide {
  id: string;
  title: string;
  description?: string;
  categories: Category[];
  subcategory?: string;
  imageUrl?: string;
  thumbUrl?: string;
  
  // Figma related fields
  figmaFileId: string;
  figmaNodeId: string;
  figmaFileName?: string;
  figmaUrl?: string;
  
  // Slide dimensions
  width?: number;
  height?: number;
  
  // Extracted text for search
  extractedText?: string;
  
  // Metadata
  version: string;
  isActive: boolean;
  
  // Statistics
  viewCount: number;
  useCount: number;
  
  // New metadata fields
  status?: 'draft' | 'in_review' | 'approved' | 'archived';
  format?: 'vertical' | 'horizontal';
  language?: 'en' | 'fr' | 'de' | 'multilang';
  region?: 'emea' | 'na' | 'global' | 'apac' | 'latam';
  domain?: string;
  authorName?: string;
  department?: string; // Deprecated - use solutionAreas
  solutionAreas?: SlideSolutionArea[];
  isCaseStudy?: boolean;
  yearStart?: number;
  yearFinish?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  tags?: SlideTag[];
  presentations?: PresentationSlide[];
  products?: SlideProduct[];
  SlideConfidentiality?: SlideConfidentiality[];
  components?: SlideComponent[];
  integrations?: SlideIntegration[];
  
  // Computed fields (added dynamically)
  isFavorite?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  isAutomatic: boolean;
  usageCount: number;
  createdAt: Date;
}

export interface SlideTag {
  id: string;
  slideId: string;
  tagId: string;
  tag: Tag;
}

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  pdfUrl?: string;
  author?: string;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  figmaUrl?: string;
  slides?: PresentationSlide[];
}

export interface PresentationSlide {
  id: string;
  presentationId: string;
  slideId: string;
  order: number;
  slide: Slide;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  isFavorite?: boolean;
  sortBy?: 'relevance' | 'date' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  slides: Slide[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  hasNext: boolean;
  hasPrev: boolean;
}

// Пользователи и роли
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name?: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// Legacy types for backward compatibility
export type Category = 
  | 'COVERS'
  | 'SERVICES' 
  | 'CASES'
  | 'TECHNOLOGIES'
  | 'PRICES'
  | 'CONTACTS'
  | 'OTHER';

export const CATEGORY_LABELS: Record<Category, string> = {
  COVERS: 'Covers',
  SERVICES: 'Services',
  CASES: 'Case Studies',
  TECHNOLOGIES: 'Technologies',
  PRICES: 'Pricing',
  CONTACTS: 'Contacts',
  OTHER: 'Other',
};

// Figma API types
export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  effects?: FigmaEffect[];
  characters?: string;
  characterStyleOverrides?: any[];
  style?: FigmaTextStyle;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  relativeTransform?: number[][];
  size?: { x: number; y: number };
}

export interface FigmaFill {
  type: string;
  color?: FigmaColor;
  imageRef?: string;
}

export interface FigmaStroke {
  type: string;
  color: FigmaColor;
}

export interface FigmaEffect {
  type: string;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaTextStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontWeight: number;
  fontSize: number;
  letterSpacing?: number;
  lineHeightPx?: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
}

export interface FigmaImageResponse {
  images: Record<string, string>;
}

// Import from Figma
export interface FigmaImportRequest {
  figmaUrl: string;
  selectedNodeIds?: string[];
  autoExtractTags?: boolean;
  defaultCategory?: Category;
}

export interface FigmaImportResult {
  success: boolean;
  importedSlides: number;
  skippedSlides: number;
  errors: string[];
  slides: Slide[];
}

// Export
export interface ExportOptions {
  format: 'pdf' | 'png' | 'figma';
  quality?: 'low' | 'medium' | 'high';
  includeMetadata?: boolean;
}

export interface ExportResult {
  success: boolean;
  url?: string;
  figmaFileId?: string;
  error?: string;
}

// Metadata types
export interface Product {
  id: string;
  code: string;
  name: string;
}

export interface SlideProduct {
  id: string;
  slideId: string;
  productId: string;
  product: Product;
}

export interface Confidentiality {
  id: string;
  code: string;
  name: string;
}

export interface SlideConfidentiality {
  id: string;
  slideId: string;
  confidentialityId: string;
  confidentiality: Confidentiality;
}

export interface Component {
  id: string;
  code: string;
  name: string;
}

export interface SlideComponent {
  id: string;
  slideId: string;
  componentId: string;
  component: Component;
}

export interface Integration {
  id: string;
  code: string;
  name: string;
}

export interface SlideIntegration {
  id: string;
  slideId: string;
  integrationId: string;
  integration: Integration;
}

export interface SolutionArea {
  id: string;
  code: string;
  name: string;
}

export interface SlideSolutionArea {
  id: string;
  slideId: string;
  solutionAreaId: string;
  solutionArea: SolutionArea;
}

// Unified metadata options - single source of truth
export const METADATA_OPTIONS = {
  // Basic slide categories (for both editing and bulk operations)
  categories: [
    { value: 'company-overview', label: 'Company Overview' },
    { value: 'business-processes', label: 'Business Processes' },
    { value: 'project-management', label: 'Project Management' },
    { value: 'industry-solutions', label: 'Industry Solutions' },
    { value: 'expertise', label: 'Cross-Functional Expertise' },
    { value: 'success-stories', label: 'Success Stories' },
    { value: 'proposal-library', label: 'Proposal Library' }
  ],
  status: [
    { value: 'draft', label: 'Draft' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'archived', label: 'Archived' }
  ],
  format: [
    { value: '', label: 'None' },
    { value: 'horizontal', label: 'Horizontal' },
    { value: 'vertical', label: 'Vertical' }
  ],
  language: [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'multilang', label: 'Multilingual' }
  ],
  region: [
    { value: 'global', label: 'Global' },
    { value: 'emea', label: 'EMEA' },
    { value: 'na', label: 'North America' },
    { value: 'apac', label: 'APAC' },
    { value: 'latam', label: 'LATAM' }
  ],
  domain: [
    { value: '', label: 'None' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'fintech', label: 'FinTech' },
    { value: 'retail', label: 'Retail' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'public-sector', label: 'Public Sector' },
    { value: 'government', label: 'Government' },
    { value: 'defense', label: 'Defense' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'telecom', label: 'Telecom' }
  ],
  solutionAreas: [
    { value: 'marketing', label: 'Marketing' },
    { value: 'sales', label: 'Sales' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'design', label: 'Design' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'management', label: 'Management' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' }
  ],
  products: [
    { code: 'it-services', name: 'IT Services' },
    { code: 'application-support', name: 'Application Support' },
    { code: 'it-management', name: 'IT Management' },
    { code: 'security', name: 'Security' },
    { code: 'tco-optimisation', name: 'TCO Optimisation' }
  ],
  confidentiality: [
    { code: 'internal', name: 'Internal' },
    { code: 'external', name: 'External' }
  ],
  components: [
    { code: 'table', name: 'Table' },
    { code: 'chart', name: 'Chart' },
    { code: 'logo', name: 'Logo' },
    { code: 'shift', name: 'Shift' },
    { code: 'roadmap', name: 'Roadmap' },
    { code: 'team-content', name: 'Team Content' },
    { code: 'benefits-content', name: 'Benefits Content' },
    { code: 'services-content', name: 'Services Content' },
    { code: 'plan', name: 'Plan' },
    { code: 'schedule', name: 'Schedule' },
    { code: 'certifications', name: 'Certifications' },
    { code: 'company-metrics', name: 'Company Metrics' },
    { code: 'delivery-process', name: 'Delivery Process' }
  ],
  integrations: [
    { code: 'jira', name: 'Jira' },
    { code: 'slack', name: 'Slack' },
    { code: 'crm', name: 'CRM' },
    { code: 'google', name: 'Google' }
  ]
} as const;

 