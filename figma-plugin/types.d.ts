// Типы для Figma Plugin API
/// <reference types="@figma/plugin-typings" />

// Глобальные переменные Figma
declare const figma: PluginAPI;
declare const __html__: string;

// Интерфейсы для данных слайдов
interface SlideData {
  id: string;
  title: string;
  figmaFileId: string;
  figmaNodeId: string;
  imageUrl?: string;
  order: number;
}

interface SlideInfo {
  id: string;
  title: string;
  figmaFileId: string;
  figmaNodeId: string;
  webAppUrl: string;
  width?: number;
  height?: number;
}

interface PresentationRequest {
  presentationId: string;
  title: string;
  description?: string;
  slides: SlideInfo[];
  webAppUrl: string;
}

interface PresentationResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  pageId?: string;
  pageName?: string;
  copiedSlides?: number;
  errors?: number;
  slides?: Array<{
    nodeId: string;
    name: string;
    originalSlideId: string;
  }>;
  error?: string;
}

// Типы сообщений между UI и основным кодом
interface PluginMessage {
  type: 'create-presentation' | 'copy-slide' | 'get-current-file-info' | 'cancel' | 
        'status' | 'progress' | 'success' | 'error' | 'current-file-info' | 
        'presentation-data' | 'log';
  data?: any;
  message?: string;
  current?: number;
  total?: number;
} 