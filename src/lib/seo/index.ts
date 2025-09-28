/**
 * SEO Library - Comprehensive Search Engine Optimization
 * Complete SEO toolkit for Astral Planner
 */

// Core metadata and structured data
export {
  generateMetadata,
  generateAppJsonLd,
  generateOrganizationJsonLd,
  generateBreadcrumbJsonLd,
  generateFAQJsonLd,
  generateArticleJsonLd,
  SEO_PAGES,
} from './metadata';

export type { SEOPageConfig } from './metadata';

// Performance monitoring and analytics
export {
  trackWebVitals,
  analyzeSEOPerformance,
  generateSEOReport,
  type WebVitalsMetrics,
  type SEOMetrics,
} from './performance';

// Components
export { JsonLd, JsonLdScript } from '@/components/seo/JsonLd';
export { 
  Breadcrumbs, 
  AutoBreadcrumbs, 
  useBreadcrumbs,
  type BreadcrumbItem 
} from '@/components/seo/Breadcrumbs';
export { SEODashboard } from '@/components/seo/SEODashboard';
export {
  SkipNavigation,
  MainContent,
  Section,
  Article,
  Navigation,
  AccessibleButton,
  FormField,
  AccessibleLink,
  LandmarkRegions,
} from '@/components/seo/SemanticMarkup';

// SEO constants and configurations
export const SEO_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://astralplanner.app',
  SITE_NAME: 'Astral Planner',
  TWITTER_HANDLE: '@astralplanner',
  BRAND_KEYWORDS: [
    'digital planner',
    'AI task management',
    'productivity app',
    'goal tracking',
    'habit tracker',
    'time management',
    'calendar integration',
    'collaboration tools',
    'project management',
    'personal organizer'
  ],
  
  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    GOOD_FCP: 1800,
    GOOD_LCP: 2500,
    GOOD_FID: 100,
    GOOD_CLS: 0.1,
    GOOD_TTFB: 600,
  },
  
  // SEO score thresholds
  SCORE_THRESHOLDS: {
    EXCELLENT: 90,
    GOOD: 70,
    POOR: 50,
  },
} as const;

/**
 * Initialize SEO for a page
 * @param pathname - Current page pathname
 * @param customConfig - Custom SEO configuration
 */
import type { SEOPageConfig } from './metadata';
import { SEO_PAGES, generateMetadata } from './metadata';

export function initializeSEO(
  pathname: string,
  customConfig?: Partial<SEOPageConfig>
) {
  // Determine page configuration
  const pageKey = pathname.split('/')[1] || 'home';
  const defaultConfig = SEO_PAGES[pageKey as keyof typeof SEO_PAGES] || SEO_PAGES.home;
  
  // Merge configurations
  const config = {
    ...defaultConfig,
    ...customConfig,
  };

  return generateMetadata(config);
}

/**
 * SEO utilities for common tasks
 */
export const SEOUtils = {
  /**
   * Generate canonical URL
   */
  getCanonicalUrl: (path: string) => {
    return `${SEO_CONFIG.BASE_URL}${path}`;
  },

  /**
   * Generate Open Graph image URL
   */
  getOGImageUrl: (title?: string, subtitle?: string) => {
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (subtitle) params.set('subtitle', subtitle);
    return `${SEO_CONFIG.BASE_URL}/api/og?${params.toString()}`;
  },

  /**
   * Optimize image for SEO
   */
  optimizeImageProps: (src: string, alt: string, options?: {
    lazy?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => {
    const { lazy = true, priority = false, sizes } = options || {};
    
    return {
      src,
      alt,
      loading: priority ? 'eager' : (lazy ? 'lazy' : 'eager'),
      decoding: 'async',
      ...(sizes && { sizes }),
    };
  },

  /**
   * Generate meta description from content
   */
  generateMetaDescription: (content: string, maxLength = 160) => {
    const cleaned = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (cleaned.length <= maxLength) return cleaned;
    
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 
      ? `${truncated.substring(0, lastSpace)}...`
      : `${truncated}...`;
  },

  /**
   * Extract keywords from content
   */
  extractKeywords: (content: string, count = 10) => {
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([word]) => word);
  },

  /**
   * Calculate reading time
   */
  calculateReadingTime: (content: string, wordsPerMinute = 200) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  },

  /**
   * Validate URL structure for SEO
   */
  validateURL: (url: string) => {
    const issues: string[] = [];
    
    if (url.length > 100) {
      issues.push('URL is too long (>100 characters)');
    }
    
    if (url.includes('_')) {
      issues.push('URL contains underscores (use hyphens instead)');
    }
    
    if (!/^[a-z0-9\-\/]+$/.test(url.toLowerCase())) {
      issues.push('URL contains special characters');
    }
    
    if (url.split('/').length > 5) {
      issues.push('URL is too deep (>4 levels)');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  },
};

export default {
  config: SEO_CONFIG,
  utils: SEOUtils,
  initialize: initializeSEO,
};