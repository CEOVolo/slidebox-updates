// Text extraction and automatic tagging utilities

// Extended keywords for automatic tag assignment
const TAG_KEYWORDS: Record<string, string[]> = {
  // IT services
  'web-development': ['web', 'website', 'frontend', 'backend', 'react', 'vue', 'angular', 'webapp', 'web app'],
  'mobile-development': ['mobile', 'app', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
  'design': ['design', 'ui', 'ux', 'interface', 'mockup', 'figma', 'sketch', 'prototype', 'wireframe'],
  'consulting': ['consulting', 'consultation', 'audit', 'analysis', 'strategy', 'advisory'],
  'support': ['support', 'maintenance', 'monitoring', 'devops', 'sla', 'uptime'],
  
  // Technologies
  'react': ['react', 'jsx', 'component', 'hooks', 'redux'],
  'typescript': ['typescript', 'ts', 'types', 'typed'],
  'nodejs': ['node', 'nodejs', 'server', 'express', 'nest'],
  'python': ['python', 'django', 'flask', 'fastapi'],
  'java': ['java', 'spring', 'kotlin', 'jvm'],
  'docker': ['docker', 'container', 'kubernetes', 'k8s'],
  'aws': ['aws', 'amazon', 'cloud', 'ec2', 's3', 'lambda'],
  'azure': ['azure', 'microsoft cloud'],
  'database': ['database', 'sql', 'postgres', 'mysql', 'mongodb', 'redis'],
  'api': ['api', 'rest', 'graphql', 'microservice', 'webhook'],
  'blockchain': ['blockchain', 'crypto', 'smart contract', 'web3', 'defi'],
  'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural', 'gpt', 'llm'],
  
  // Project types
  'ecommerce': ['shop', 'ecommerce', 'e-commerce', 'sales', 'products', 'marketplace', 'store', 'retail'],
  'fintech': ['fintech', 'finance', 'banking', 'payment', 'wallet', 'trading', 'investment'],
  'healthcare': ['healthcare', 'medical', 'health', 'clinic', 'doctor', 'patient', 'telemedicine'],
  'education': ['education', 'learning', 'course', 'training', 'school', 'university', 'edtech'],
  'saas': ['saas', 'subscription', 'b2b', 'enterprise', 'platform'],
  'social': ['social', 'network', 'community', 'chat', 'messaging', 'forum'],
  'gaming': ['game', 'gaming', 'play', 'multiplayer', 'unity', 'unreal'],
  'iot': ['iot', 'sensor', 'device', 'embedded', 'arduino', 'raspberry'],
  
  // Content types
  'cover': ['cover', 'title', 'header', 'intro', 'welcome'],
  'agenda': ['agenda', 'contents', 'overview', 'topics', 'outline'],
  'case': ['case', 'project', 'example', 'result', 'portfolio', 'showcase'],
  'presentation': ['presentation', 'slide', 'demo', 'pitch'],
  'analytics': ['analytics', 'data', 'metrics', 'statistics', 'kpi', 'dashboard'],
  'security': ['security', 'protection', 'encryption', 'auth', 'oauth', 'jwt', 'ssl'],
  'team': ['team', 'about', 'our', 'company', 'who we are', 'staff'],
  'contact': ['contact', 'get in touch', 'email', 'phone', 'address', 'reach us'],
  'pricing': ['price', 'pricing', 'cost', 'plan', 'package', 'subscription'],
  'timeline': ['timeline', 'roadmap', 'milestone', 'schedule', 'phase'],
  'process': ['process', 'workflow', 'how it works', 'steps', 'methodology'],
  'benefits': ['benefit', 'advantage', 'why', 'feature', 'value'],
  'testimonial': ['testimonial', 'review', 'feedback', 'client', 'customer'],
  'comparison': ['comparison', 'compare', 'vs', 'versus', 'difference'],
  'faq': ['faq', 'question', 'answer', 'q&a', 'help'],
};

// Interface for text with metadata
interface TextNode {
  text: string;
  fontSize?: number;
  fontWeight?: number;
  isBold?: boolean;
  isHeading?: boolean;
  order: number;
}

// Function to extract text from Figma node with priorities
export function extractTextFromFigmaNode(node: any): string {
  const textNodes: TextNode[] = [];
  let order = 0;
  
  function traverse(node: any) {
    // Только для нодов типа TEXT извлекаем текст
    if (node.type === 'TEXT' && node.characters) {
      const textContent = node.characters.trim();
      
      // Фильтруем служебные названия и короткий текст
      if (textContent && 
          !textContent.match(/^Frame\s*\d*$/i) && 
          !textContent.match(/^Rectangle\s*\d*$/i) &&
          !textContent.match(/^Group\s*\d*$/i) &&
          !textContent.match(/^Vector\s*\d*$/i) &&
          !textContent.match(/^\d+$/i) && // Только цифры
          textContent.length > 1) {
        
        // Извлекаем стили текста
        const style = node.style || {};
        const fontSize = style.fontSize || 12;
        const fontWeight = style.fontWeight || 400;
        
        textNodes.push({
          text: textContent,
          fontSize: fontSize,
          fontWeight: fontWeight,
          isBold: fontWeight >= 700,
          isHeading: fontSize > 20 || fontWeight >= 700,
          order: order++
        });
      }
    }
    
    // Рекурсивно обходим дочерние элементы
    if (node.children) {
      node.children.forEach(traverse);
    }
  }
  
  traverse(node);
  
  // Сортируем тексты по приоритету (больший размер = выше приоритет)
  const sortedTexts = textNodes.sort((a, b) => {
    // Сначала заголовки
    if (a.isHeading && !b.isHeading) return -1;
    if (!a.isHeading && b.isHeading) return 1;
    
    // Затем по размеру шрифта
    if (a.fontSize !== b.fontSize) {
      return (b.fontSize || 0) - (a.fontSize || 0);
    }
    
    // Затем по весу шрифта
    if (a.fontWeight !== b.fontWeight) {
      return (b.fontWeight || 0) - (a.fontWeight || 0);
    }
    
    // Наконец по порядку появления
    return a.order - b.order;
  });
  
  // Объединяем тексты, начиная с самых важных
  const allText = sortedTexts.map(t => t.text).join(' ');
  
  // Очищаем и нормализуем текст
  return allText
    .trim()
    .replace(/\s+/g, ' ') // Заменяем множественные пробелы на одинарные
    .replace(/[^\p{L}\p{N}\s\-.,!?&]/gu, ' ') // Оставляем только буквы, цифры и основные знаки
    .trim();
}

// Generate tags from slide metadata
export function generateTagsFromMetadata(slideData: any): string[] {
  const tags: Set<string> = new Set();
  
  // Domain tags
  if (slideData.domain) {
    tags.add(`domain-${slideData.domain}`);
  }
  
  // Department tags  
  if (slideData.department) {
    tags.add(`dept-${slideData.department}`);
  }
  
  // Solution Areas tags
  if (slideData.solutionAreas && Array.isArray(slideData.solutionAreas)) {
    slideData.solutionAreas.forEach((area: string) => {
      tags.add(`solution-${area}`);
    });
  }
  
  // Format tags
  if (slideData.format) {
    tags.add(`format-${slideData.format}`);
  }
  
  // Language tags
  if (slideData.language) {
    tags.add(`lang-${slideData.language}`);
  }
  
  // Region tags
  if (slideData.region) {
    tags.add(`region-${slideData.region}`);
  }
  
  // Status tags
  if (slideData.status) {
    tags.add(`status-${slideData.status}`);
  }
  
  // Case study tag
  if (slideData.isCaseStudy === true) {
    tags.add('case-study');
  }
  
  // Year tags
  if (slideData.yearStart) {
    tags.add(`year-${slideData.yearStart}`);
  }
  
  // Author tag (simplified)
  if (slideData.authorName) {
    const authorTag = slideData.authorName.toLowerCase().replace(/\s+/g, '-');
    tags.add(`author-${authorTag}`);
  }
  
  return Array.from(tags);
}

// Enhanced function for automatic tag assignment
export function generateTagsFromText(text: string): string[] {
  const tags: Set<string> = new Set();
  const lowerText = text.toLowerCase();
  
  // Проходим по всем ключевым словам
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    for (const keyword of keywords) {
      // Используем word boundaries для точного совпадения
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
      if (regex.test(lowerText)) {
        tags.add(tag);
        break;
      }
    }
  }
  
  // Дополнительная логика для специальных случаев
  if (tags.has('web-development') || tags.has('mobile-development')) {
    tags.add('development');
  }
  
  if (tags.has('react') || tags.has('angular') || tags.has('vue')) {
    tags.add('frontend');
  }
  
  if (tags.has('nodejs') || tags.has('python') || tags.has('java')) {
    tags.add('backend');
  }
  
  if (tags.has('aws') || tags.has('azure') || tags.has('docker')) {
    tags.add('cloud');
  }
  
  // Ограничиваем количество тегов
  return Array.from(tags).slice(0, 10);
}

// Enhanced function to determine category based on text and tags
export function determineCategoryFromText(text: string, tags: string[]): string {
  const lowerText = text.toLowerCase();
  
  // Проверяем специфичные паттерны для более точной категоризации
  
  // Covers
  if (lowerText.includes('cover') || lowerText.includes('title page') || 
      (lowerText.includes('welcome') && text.split(' ').length < 10)) {
    if (lowerText.includes('thank') || lowerText.includes('thanks')) return 'covers-thank';
    if (lowerText.includes('section') || lowerText.includes('chapter')) return 'covers-section';
    return 'covers-main';
  }
  
  // About/Company
  if (lowerText.includes('about us') || lowerText.includes('our company') || 
      lowerText.includes('who we are') || tags.includes('team')) {
    if (lowerText.includes('mission') || lowerText.includes('vision')) return 'company-mission';
    if (lowerText.includes('team') || lowerText.includes('staff')) return 'company-team';
    if (lowerText.includes('history') || lowerText.includes('founded')) return 'company-history';
    if (lowerText.includes('structure') || lowerText.includes('organization')) return 'company-structure';
    return 'company-overview';
  }
  
  // Services
  if (lowerText.includes('service') || lowerText.includes('what we do') || 
      tags.some(tag => ['web-development', 'mobile-development', 'design', 'consulting', 'support'].includes(tag))) {
    if (tags.includes('web-development')) return 'services-web';
    if (tags.includes('mobile-development')) return 'services-mobile';
    if (tags.includes('design')) return 'services-design';
    if (tags.includes('consulting')) return 'services-consulting';
    if (tags.includes('support')) return 'services-support';
    return 'services-other';
  }
  
  // Cases/Portfolio
  if (lowerText.includes('case study') || lowerText.includes('portfolio') || 
      lowerText.includes('our work') || tags.includes('case')) {
    if (tags.includes('ecommerce')) return 'cases-ecommerce';
    if (tags.includes('fintech')) return 'cases-fintech';
    if (tags.includes('healthcare')) return 'cases-healthcare';
    if (tags.includes('education')) return 'cases-education';
    if (tags.includes('saas')) return 'cases-saas';
    return 'cases-other';
  }
  
  // Technology
  if (lowerText.includes('tech stack') || lowerText.includes('technologies') || 
      tags.some(tag => ['react', 'nodejs', 'python', 'docker', 'aws'].includes(tag))) {
    if (tags.includes('frontend') || tags.includes('react')) return 'tech-frontend';
    if (tags.includes('backend') || tags.includes('nodejs')) return 'tech-backend';
    if (tags.includes('mobile-development')) return 'tech-mobile';
    if (tags.includes('cloud') || tags.includes('docker')) return 'tech-devops';
    if (tags.includes('database')) return 'tech-database';
    return 'tech-other';
  }
  
  // Business
  if (lowerText.includes('business') || lowerText.includes('strategy') || 
      lowerText.includes('market') || tags.includes('analytics')) {
    if (lowerText.includes('strategy')) return 'business-strategy';
    if (tags.includes('analytics')) return 'business-analytics';
    if (lowerText.includes('marketing')) return 'business-marketing';
    if (lowerText.includes('sales')) return 'business-sales';
    return 'business-strategy';
  }
  
  // Process/Methodology
  if (lowerText.includes('process') || lowerText.includes('methodology') || 
      lowerText.includes('how we work') || tags.includes('process')) {
    return 'process-methodology';
  }
  
  // Pricing
  if (tags.includes('pricing') || lowerText.includes('pricing') || 
      lowerText.includes('plans')) {
    return 'pricing-plans';
  }
  
  // Contact
  if (tags.includes('contact') || lowerText.includes('contact') || 
      lowerText.includes('get in touch')) {
    return 'contact-info';
  }
  
  // Default - try to guess by content
  if (tags.length > 0) {
    if (tags.includes('cover')) return 'covers-main';
    if (tags.includes('team')) return 'company-team';
    if (tags.some(t => t.includes('development'))) return 'services-web';
  }
  
  return 'other';
}

// Enhanced function to generate smart title from text
export function generateSmartTitleFromText(node: any): string {
  const textNodes: TextNode[] = [];
  let order = 0;
  
  function traverse(node: any) {
    if (node.type === 'TEXT' && node.characters) {
      const textContent = node.characters.trim();
      
      if (textContent && textContent.length > 1 && 
          !textContent.match(/^(Frame|Rectangle|Group|Vector)\s*\d*$/i)) {
        
        const style = node.style || {};
        const fontSize = style.fontSize || 12;
        const fontWeight = style.fontWeight || 400;
        
        textNodes.push({
          text: textContent,
          fontSize: fontSize,
          fontWeight: fontWeight,
          isBold: fontWeight >= 700,
          isHeading: fontSize > 20 || fontWeight >= 700,
          order: order++
        });
      }
    }
    
    if (node.children) {
      node.children.forEach(traverse);
    }
  }
  
  traverse(node);
  
  console.log('Smart title generation:', {
    totalTextNodes: textNodes.length,
    textNodes: textNodes.map(t => ({ text: t.text, fontSize: t.fontSize, isHeading: t.isHeading }))
  });
  
  // Находим самый вероятный заголовок
  const headingCandidates = textNodes
    .filter(t => t.isHeading || (t.fontSize && t.fontSize > 18))
    .sort((a, b) => {
      // Приоритет: размер шрифта, затем порядок
      if (a.fontSize !== b.fontSize) {
        return (b.fontSize || 0) - (a.fontSize || 0);
      }
      return a.order - b.order;
    });
  
  if (headingCandidates.length > 0) {
    // Берем первый (самый крупный) заголовок
    const title = headingCandidates[0].text;
    
    // Очищаем и ограничиваем длину
    const cleanTitle = title
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);
    
    console.log('Found heading title:', { original: title, cleaned: cleanTitle });
    return cleanTitle;
  }
  
  // Если заголовков нет, берем первый значимый текст
  if (textNodes.length > 0) {
    const firstTexts = textNodes
      .sort((a, b) => a.order - b.order)
      .slice(0, 3)
      .map(t => t.text);
    
    // Объединяем первые несколько текстов
    const combinedText = firstTexts.join(' - ');
    
    // Убираем повторы и служебные слова
    const words = combinedText.split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !['with', 'from', 'that', 'this', 'have', 'been', 'will', 'your', 'what'].includes(word.toLowerCase())
      );
    
    // Берем до 6 слов
    return words.slice(0, 6).join(' ').slice(0, 60);
  }
  
  return 'Untitled Slide';
}

// Auto-fill metadata based on slide content
export function autoFillMetadata(
  text: string, 
  slideTitle: string, 
  figmaNode?: any, 
  existingMetadata?: any
): any {
  const lowerText = (text + ' ' + slideTitle).toLowerCase();
  const metadata: any = { ...existingMetadata };
  
  console.log('🚀 Auto-fill metadata started:', {
    slideTitle,
    textLength: text.length,
    lowerText: lowerText.substring(0, 300),
    existingMetadata
  });
  
  // 1. DOMAIN - определяем по ключевым словам (ВСЕГДА перезаписываем)
  const domainPatterns = {
    'automotive': ['car', 'auto', 'vehicle', 'transport', 'automotive', 'driving', 'mobility', 'авто'],
    'fintech': ['bank', 'banking', 'ebanking', 'finance', 'payment', 'wallet', 'trading', 'investment', 'crypto', 'fintech', 'финтех', 'банк'],
    'retail': ['shop', 'store', 'marketplace', 'retail', 'shopping', 'commerce', 'магазин'],
    'healthcare': ['health', 'medical', 'doctor', 'patient', 'clinic', 'hospital', 'medicine', 'pharma', 'медицин'],
    'education': ['education', 'school', 'university', 'course', 'learning', 'student', 'teach', 'training', 'образован'],
    'ecommerce': ['ecommerce', 'e-commerce', 'online shop', 'online store', 'webshop', 'интернет-магазин'],
    'manufacturing': ['manufacture', 'factory', 'production', 'assembly', 'industrial', 'производ'],
    'consulting': ['consulting', 'advisory', 'strategy', 'consultant', 'консалт'],
    'public-sector': ['public', 'government', 'municipal', 'city', 'state', 'federal', 'госсектор'],
    'government': ['government', 'ministry', 'administration', 'правительств'],
    'defense': ['defense', 'military', 'army', 'national security', 'оборон', 'военн'],
    'logistics': ['logistics', 'supply chain', 'delivery', 'shipping', 'transport', 'логистик'],
    'telecom': ['telecom', 'network', 'mobile', 'communication', 'operator', 'телеком', 'связь']
  };
  
  // Ищем наиболее подходящий домен (перезаписываем существующий)
  const domainScores: Record<string, number> = {};
  
  // Подсчитываем количество совпадений для каждого домена
  for (const [domain, keywords] of Object.entries(domainPatterns)) {
    let score = 0;
    const matches: string[] = [];
    
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        score++;
        matches.push(keyword);
      }
    }
    
    if (score > 0) {
      domainScores[domain] = score;
      console.log(`🎯 Domain candidate: ${domain}, score: ${score}, matches: [${matches.join(', ')}]`);
    }
  }
  
  // Специальные правила для приоритизации
  // Если есть прямое упоминание FinTech/Banking в контексте банковского проекта, увеличиваем счет
  if ((lowerText.includes('fintech') || lowerText.includes('banking') || lowerText.includes('ebanking') || lowerText.includes('neobank')) && domainScores['fintech']) {
    domainScores['fintech'] += 3; // Сильный приоритет для финтех
    console.log('🎯 FinTech priority boost applied');
  }
  
  // Если это чисто технологический/облачный проект без конкретной индустрии
  const isCloudProject = lowerText.includes('aws') || lowerText.includes('cloud') || lowerText.includes('azure') || lowerText.includes('gcp');
  const isSecurityProject = lowerText.includes('security') && (lowerText.includes('aws') || lowerText.includes('cloud') || lowerText.includes('compliance'));
  
  if ((isCloudProject || isSecurityProject) && !lowerText.includes('for a') && !lowerText.includes('project for')) {
    // Это общий cloud/security проект, а не для конкретной индустрии
    // Приоритизируем consulting как наиболее подходящий домен
    if (domainScores['consulting']) {
      domainScores['consulting'] += 2;
      console.log('🎯 Consulting priority boost for cloud/security services');
    }
    
    // Понижаем приоритет defense, если это явно cloud security
    if (domainScores['defense'] && isSecurityProject) {
      domainScores['defense'] -= 2;
      console.log('🎯 Defense priority lowered - this is cloud security, not defense');
    }
  }
  
  // Выбираем домен с наибольшим счетом
  if (Object.keys(domainScores).length > 0) {
    const bestDomain = Object.entries(domainScores)
      .sort(([, a], [, b]) => b - a)[0][0];
    
    metadata.domain = bestDomain;
    console.log(`🎯 Domain selected: ${bestDomain} (score: ${domainScores[bestDomain]}), previous: ${existingMetadata?.domain}`);
  }
  
  // Если домен не определен и это веб-проект, пытаемся определить по контексту клиента
  if (!metadata.domain && (lowerText.includes('website') || lowerText.includes('web site') || lowerText.includes('web') || lowerText.includes('corporate'))) {
    // Ищем упоминания о клиенте или индустрии в тексте
    if (lowerText.includes('product line') || lowerText.includes('product') || lowerText.includes('demonstrat')) {
      // Если есть упоминание продуктов, но не e-commerce, возможно это retail
      if (!lowerText.includes('online') && !lowerText.includes('e-commerce')) {
        metadata.domain = 'retail';
        console.log('🎯 Domain detected by context: retail (product demonstration)');
      }
    }
  }
  
  // 2. FORMAT - определяем по размерам слайда
  if (!metadata.format && figmaNode?.absoluteBoundingBox) {
    const { width, height } = figmaNode.absoluteBoundingBox;
    metadata.format = width > height ? 'horizontal' : 'vertical';
  }
  
  // 3. LANGUAGE - детекция языка
  if (!metadata.language) {
    const russianChars = (text.match(/[а-яё]/gi) || []).length;
    const englishChars = (text.match(/[a-z]/gi) || []).length;
    const frenchChars = (text.match(/[àâäçéèêëïîôöùûüÿ]/gi) || []).length;
    const germanChars = (text.match(/[äöüß]/gi) || []).length;
    
    if (russianChars > englishChars) {
      metadata.language = 'ru'; // Русский не в списке, но можно добавить
    } else if (frenchChars > 0 || lowerText.includes('français')) {
      metadata.language = 'fr';
    } else if (germanChars > 0 || lowerText.includes('deutsch')) {
      metadata.language = 'de';
    } else {
      metadata.language = 'en'; // По умолчанию английский
    }
  }
  
  // 4. CASE STUDY - определяем по контексту и заголовкам (ВСЕГДА перезаписываем)
  const casePatterns = [
    'case study', 'casestudy', 'success story',
    'client story', 'customer story', 'use case',
    'кейс', 'история успеха', 'история клиента'
  ];
  
  // Паттерны, которые указывают что это НЕ case study
  const notCasePatterns = [
    'statistics', 'year statistics', 'launched projects', 'total projects',
    'статистика', 'всего проектов', 'запущено проектов'
  ];
  
  // Проверяем заголовок
  const titleLower = slideTitle.toLowerCase();
  
  // Сначала проверяем, что это НЕ case study
  const isNotCaseStudy = notCasePatterns.some(pattern => lowerText.includes(pattern));
  
  if (isNotCaseStudy) {
    metadata.isCaseStudy = false;
    console.log('🔍 NOT a case study - found exclusion pattern');
  } else {
    // Проверяем заголовок отдельно с высоким приоритетом
    if (titleLower.includes('case study') || titleLower.includes('casestudy') || titleLower.includes('кейс')) {
      metadata.isCaseStudy = true;
    } else {
      // Обычная проверка по всему тексту, но требуем более явное упоминание
      metadata.isCaseStudy = casePatterns.some(pattern => lowerText.includes(pattern));
      
      // Дополнительная проверка: если есть challenge + solution, это может быть case study
      if (!metadata.isCaseStudy && lowerText.includes('challenge') && lowerText.includes('solution')) {
        metadata.isCaseStudy = true;
        console.log('🔍 Case study detected by challenge+solution pattern');
      }
    }
  }
  
  console.log('🔍 Case study detection:', {
    slideTitle,
    titleLower,
    lowerText: lowerText.substring(0, 200),
    patterns: casePatterns.filter(p => lowerText.includes(p)),
    result: metadata.isCaseStudy,
    previousValue: existingMetadata?.isCaseStudy
  });
  
  // 5. DEPARTMENT - определяем по контексту (ВСЕГДА перезаписываем)
  const deptPatterns = {
    'design': ['designer', 'design', 'ui', 'ux', 'ui/ux', 'ui ux', 'visual', 'creative', 'interface', 'graphic', 'дизайн'],
    'marketing': ['marketing', 'brand', 'campaign', 'advertising', 'promotion', 'маркетинг'],
    'engineering': ['developer', 'development', 'engineer', 'technical', 'code', 'programming', 'software', 'system', 'qa', 'разработка'],
    'sales': ['sales', 'sell', 'revenue', 'customer', 'client', 'продажи'],
    'consulting': ['consulting', 'consultant', 'advisory', 'консалтинг'],
    'management': ['management', 'strategy', 'leadership', 'planning', 'pm', 'project manager', 'менеджмент'],
    'hr': ['hr', 'human resources', 'team', 'people', 'recruitment', 'кадры'],
    'finance': ['finance', 'budget', 'cost', 'financial', 'accounting', 'финансы']
  };
  
  // Ищем наиболее подходящий департамент (перезаписываем существующий)
  const deptScores: Record<string, number> = {};
  
  // Подсчитываем количество совпадений для каждого департамента
  for (const [dept, keywords] of Object.entries(deptPatterns)) {
    let score = 0;
    const matches: string[] = [];
    
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        score++;
        matches.push(keyword);
      }
    }
    
    if (score > 0) {
      deptScores[dept] = score;
      console.log(`🏢 Department candidate: ${dept}, score: ${score}, matches: [${matches.join(', ')}]`);
    }
  }
  
  // Специальные правила для приоритизации департаментов
  // Если упоминается количество разработчиков, приоритет engineering
  if (lowerText.match(/\d+\s*(developer|engineer|programmer)/i) && deptScores['engineering']) {
    deptScores['engineering'] += 2;
    console.log('🏢 Engineering priority boost applied (developers mentioned)');
  }
  
  // Если упоминаются технические термины (AWS, cloud, security, compliance), приоритет engineering
  const techTerms = ['aws', 'cloud', 'azure', 'gcp', 'security', 'compliance', 'terraform', 'iac', 'devops'];
  const hasTechTerms = techTerms.some(term => lowerText.includes(term));
  
  if (hasTechTerms && deptScores['engineering']) {
    deptScores['engineering'] += 2;
    console.log('🏢 Engineering priority boost for technical content');
  }
  
  // Понижаем приоритет design для технических проектов
  if (hasTechTerms && deptScores['design'] && !lowerText.includes('ui') && !lowerText.includes('ux')) {
    deptScores['design'] -= 2;
    console.log('🏢 Design priority lowered - technical project without UI/UX');
  }
  
  // Выбираем департамент с наибольшим счетом
  if (Object.keys(deptScores).length > 0) {
    const bestDept = Object.entries(deptScores)
      .sort(([, a], [, b]) => b - a)[0][0];
    
    metadata.department = bestDept;
    console.log(`🏢 Department selected: ${bestDept} (score: ${deptScores[bestDept]}), previous: ${existingMetadata?.department}`);
  }
  
  // 5.1 SOLUTION AREAS - определяем по контексту (может быть несколько)
  const solutionAreaPatterns = {
    'marketing': ['marketing', 'brand', 'campaign', 'advertising', 'promotion', 'маркетинг'],
    'sales': ['sales', 'sell', 'revenue', 'customer acquisition', 'client', 'продажи'],
    'engineering': ['developer', 'development', 'engineer', 'technical', 'code', 'programming', 'software', 'system', 'qa', 'разработка'],
    'design': ['designer', 'design', 'ui', 'ux', 'ui/ux', 'ui ux', 'visual', 'creative', 'interface', 'graphic', 'дизайн'],
    'consulting': ['consulting', 'consultant', 'advisory', 'strategy', 'консалтинг'],
    'management': ['management', 'leadership', 'planning', 'pm', 'project manager', 'менеджмент'],
    'hr': ['hr', 'human resources', 'team', 'people', 'recruitment', 'hiring', 'кадры'],
    'finance': ['finance', 'budget', 'cost', 'financial', 'accounting', 'финансы']
  };
  
  // Определяем solution areas (может быть несколько)
  const detectedSolutionAreas: string[] = [];
  
  for (const [area, keywords] of Object.entries(solutionAreaPatterns)) {
    const hasMatch = keywords.some(keyword => lowerText.includes(keyword));
    if (hasMatch) {
      detectedSolutionAreas.push(area);
      console.log(`🌟 Solution area detected: ${area}`);
    }
  }
  
  // Специальные правила для solution areas
  // Если упоминаются технические термины, добавляем engineering если его ещё нет
  if (hasTechTerms && !detectedSolutionAreas.includes('engineering')) {
    detectedSolutionAreas.push('engineering');
    console.log('🌟 Engineering solution area added for technical content');
  }
  
  if (detectedSolutionAreas.length > 0) {
    metadata.solutionAreaCodes = detectedSolutionAreas;
    console.log(`🌟 Solution areas selected: [${detectedSolutionAreas.join(', ')}]`);
  }
  
  // 6. STATUS - по умолчанию draft для новых слайдов
  if (!metadata.status) {
    metadata.status = 'draft';
  }
  
  // 7. YEARS - извлекаем годы из текста
  if (!metadata.yearStart) {
    const yearMatches = text.match(/\b(20[12][0-9])\b/g);
    if (yearMatches) {
      const years = yearMatches.map(y => parseInt(y)).sort();
      metadata.yearStart = years[0];
      if (years.length > 1) {
        metadata.yearFinish = years[years.length - 1];
      }
    }
  }
  
  // 8. REGION - определяем по языку и контексту
  if (!metadata.region) {
    if (metadata.language === 'en') {
      if (lowerText.includes('america') || lowerText.includes('usa') || lowerText.includes('canada')) {
        metadata.region = 'na';
      } else if (lowerText.includes('asia') || lowerText.includes('japan') || lowerText.includes('china')) {
        metadata.region = 'apac';
      } else if (lowerText.includes('latin') || lowerText.includes('brazil') || lowerText.includes('mexico')) {
        metadata.region = 'latam';
      } else if (lowerText.includes('europe') || lowerText.includes('european')) {
        metadata.region = 'emea';
      } else {
        metadata.region = 'global';
      }
    } else if (metadata.language === 'fr' || metadata.language === 'de') {
      metadata.region = 'emea';
    } else {
      metadata.region = 'global';
    }
  }
  
  console.log('✅ Auto-fill metadata completed:', {
    changes: Object.keys(metadata).filter(key => metadata[key] !== existingMetadata?.[key]),
    metadata
  });
  
  return metadata;
}

// Combined function to generate tags from both text and metadata
export function generateCombinedTags(text: string, slideMetadata?: any): string[] {
  const textTags = generateTagsFromText(text);
  const metadataTags = slideMetadata ? generateTagsFromMetadata(slideMetadata) : [];
  
  // Combine and deduplicate tags
  const allTags = [...textTags, ...metadataTags];
  const uniqueTags = [...new Set(allTags)];
  
  // Limit to 15 tags maximum (increased from 10 to accommodate metadata)
  return uniqueTags.slice(0, 15);
}

// Function for complete slide processing
export function processSlideContent(figmaNode: any, slideMetadata?: any) {
  const extractedText = extractTextFromFigmaNode(figmaNode);
  const autoTags = generateCombinedTags(extractedText, slideMetadata);
  const category = determineCategoryFromText(extractedText, autoTags);
  const smartTitle = generateSmartTitleFromText(figmaNode);
  
  return {
    extractedText,
    autoTags,
    category,
    smartTitle
  };
} 