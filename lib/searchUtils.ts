export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm.trim() || searchTerm.includes(':')) {
    return text;
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-300 text-yellow-900 px-1 rounded font-medium shadow-sm">$1</mark>');
}

export function highlightSearchTermWithContext(text: string, searchTerm: string, contextLength: number = 150): string {
  if (!searchTerm.trim() || searchTerm.includes(':')) {
    return text.substring(0, contextLength * 2) + (text.length > contextLength * 2 ? '...' : '');
  }

  const lowerText = text.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const index = lowerText.indexOf(lowerTerm);
  
  if (index === -1) {
    // Если термин не найден, показываем начало текста
    return text.substring(0, contextLength * 2) + (text.length > contextLength * 2 ? '...' : '');
  }

  // Находим границы контекста
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + searchTerm.length + contextLength);
  
  let context = text.substring(start, end);
  
  // Добавляем многоточия если текст обрезан
  if (start > 0) {
    context = '...' + context;
  }
  if (end < text.length) {
    context = context + '...';
  }
  
  // Подсвечиваем найденный термин в контексте
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return context.replace(regex, '<mark class="bg-yellow-300 text-yellow-900 px-1 rounded font-medium shadow-sm">$1</mark>');
}

export function extractSearchContext(text: string, searchTerm: string, contextLength: number = 100): string {
  if (!searchTerm.trim() || searchTerm.includes(':')) {
    return text.substring(0, contextLength * 2) + (text.length > contextLength * 2 ? '...' : '');
  }

  const lowerText = text.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const index = lowerText.indexOf(lowerTerm);
  
  if (index === -1) {
    return text.substring(0, contextLength * 2) + (text.length > contextLength * 2 ? '...' : '');
  }

  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + searchTerm.length + contextLength);
  
  let context = text.substring(start, end);
  
  if (start > 0) {
    context = '...' + context;
  }
  if (end < text.length) {
    context = context + '...';
  }
  
  return context;
}

export function getSearchResultScore(slide: any, searchTerm: string): number {
  if (!searchTerm.trim() || searchTerm.includes(':')) {
    return 0;
  }

  let score = 0;
  const term = searchTerm.toLowerCase();
  
  // Title match (highest priority)
  if (slide.title?.toLowerCase().includes(term)) {
    score += 10;
  }
  
  // Description match
  if (slide.description?.toLowerCase().includes(term)) {
    score += 5;
  }
  
  // Extracted text match
  if (slide.extractedText?.toLowerCase().includes(term)) {
    score += 3;
  }
  
  // Tag match
  if (slide.tags?.some((tag: any) => tag.tag.name.toLowerCase().includes(term))) {
    score += 7;
  }
  
  // Author match
  if (slide.author?.toLowerCase().includes(term)) {
    score += 2;
  }
  
  return score;
}

export function sortSearchResults(slides: any[], searchTerm: string): any[] {
  if (!searchTerm.trim() || searchTerm.includes(':')) {
    return slides;
  }

  return slides
    .map(slide => ({
      ...slide,
      searchScore: getSearchResultScore(slide, searchTerm)
    }))
    .sort((a, b) => b.searchScore - a.searchScore);
}

export function searchSlides(slides: any[], query: string): any[] {
  if (!query || query.trim() === '') return slides;
  
  const searchTerm = query.toLowerCase();
  
  return slides.filter(slide => {
    // Поиск по основным полям
    const titleMatch = slide.title?.toLowerCase().includes(searchTerm);
    const descriptionMatch = slide.description?.toLowerCase().includes(searchTerm);
    const extractedTextMatch = slide.extractedText?.toLowerCase().includes(searchTerm);
    
    // Поиск по тегам
    const tagMatch = slide.tags?.some((tagRelation: any) => 
      tagRelation.tag?.name?.toLowerCase().includes(searchTerm)
    );
    
    // Поиск по метаданным
    const authorMatch = slide.authorName?.toLowerCase().includes(searchTerm);
    const domainMatch = slide.domain?.toLowerCase().includes(searchTerm);
    
    // Поиск по solution areas
    const solutionAreaMatch = slide.solutionAreas?.some((areaRelation: any) =>
      areaRelation.solutionArea?.name?.toLowerCase().includes(searchTerm) ||
      areaRelation.solutionArea?.code?.toLowerCase().includes(searchTerm)
    );
    
    // Поиск по products
    const productMatch = slide.products?.some((productRelation: any) =>
      productRelation.product?.name?.toLowerCase().includes(searchTerm) ||
      productRelation.product?.code?.toLowerCase().includes(searchTerm)
    );
    
    // Поиск по components
    const componentMatch = slide.components?.some((componentRelation: any) =>
      componentRelation.component?.name?.toLowerCase().includes(searchTerm) ||
      componentRelation.component?.code?.toLowerCase().includes(searchTerm)
    );
    
    // Поиск по integrations
    const integrationMatch = slide.integrations?.some((integrationRelation: any) =>
      integrationRelation.integration?.name?.toLowerCase().includes(searchTerm) ||
      integrationRelation.integration?.code?.toLowerCase().includes(searchTerm)
    );
    
    // Поиск по user types
    const userTypeMatch = slide.userTypes?.some((userTypeRelation: any) =>
      userTypeRelation.userType?.name?.toLowerCase().includes(searchTerm) ||
      userTypeRelation.userType?.code?.toLowerCase().includes(searchTerm)
    );
    
    // Поиск по годам
    const yearMatch = (slide.yearStart && slide.yearStart.toString().includes(searchTerm)) ||
                     (slide.yearFinish && slide.yearFinish.toString().includes(searchTerm));
    
    // Поиск по case study
    const caseStudyMatch = searchTerm.includes('case') && slide.isCaseStudy;
    
    return titleMatch || descriptionMatch || extractedTextMatch || tagMatch ||
           authorMatch || domainMatch || solutionAreaMatch || productMatch ||
           componentMatch || integrationMatch || userTypeMatch || yearMatch ||
           caseStudyMatch;
  });
} 