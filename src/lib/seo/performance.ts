/**
 * SEO Performance Monitoring and Analytics
 * Track and optimize SEO metrics for maximum search visibility
 */
import { Logger as logger } from '@/lib/logger/edge';

// Core Web Vitals tracking
export interface WebVitalsMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export interface SEOMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  webVitals: WebVitalsMetrics;
  seoScore: number;
  accessibilityScore: number;
  performanceScore: number;
  structuredDataValid: boolean;
  metaTagsComplete: boolean;
  imageOptimization: number;
  mobileOptimization: number;
}

/**
 * Track Core Web Vitals for SEO performance
 */
export function trackWebVitals(): Promise<WebVitalsMetrics> {
  return new Promise((resolve) => {
    const metrics: Partial<WebVitalsMetrics> = {};
    let metricsCollected = 0;
    const totalMetrics = 5;

    const checkComplete = () => {
      metricsCollected++;
      if (metricsCollected >= totalMetrics) {
        resolve(metrics as WebVitalsMetrics);
      }
    };

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
        fcpObserver.disconnect();
        checkComplete();
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        metrics.lcp = lastEntry.startTime;
        checkComplete();
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.processingStart) {
          metrics.fid = entry.processingStart - entry.startTime;
          fidObserver.disconnect();
          checkComplete();
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      metrics.cls = clsValue;
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Time to First Byte
    if ('navigation' in performance) {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      metrics.ttfb = navTiming.responseStart - navTiming.requestStart;
      checkComplete();
    }

    // Fallback after 5 seconds
    setTimeout(() => {
      metrics.cls = clsValue;
      resolve(metrics as WebVitalsMetrics);
    }, 5000);
  });
}

/**
 * Analyze SEO-related performance metrics
 */
export async function analyzeSEOPerformance(): Promise<SEOMetrics> {
  const startTime = performance.now();
  
  // Get web vitals
  const webVitals = await trackWebVitals();
  
  // Calculate performance scores
  const seoScore = calculateSEOScore();
  const accessibilityScore = await calculateAccessibilityScore();
  const performanceScore = calculatePerformanceScore(webVitals);
  
  // Check technical SEO elements
  const structuredDataValid = validateStructuredData();
  const metaTagsComplete = validateMetaTags();
  const imageOptimization = calculateImageOptimization();
  const mobileOptimization = calculateMobileOptimization();
  
  return {
    pageLoadTime: performance.now() - startTime,
    domContentLoaded: getDOMContentLoadedTime(),
    webVitals,
    seoScore,
    accessibilityScore,
    performanceScore,
    structuredDataValid,
    metaTagsComplete,
    imageOptimization,
    mobileOptimization,
  };
}

/**
 * Calculate overall SEO score based on various factors
 */
function calculateSEOScore(): number {
  let score = 0;
  let totalChecks = 0;

  // Title tag check
  const titleTag = document.querySelector('title');
  if (titleTag && titleTag.textContent && titleTag.textContent.length >= 30 && titleTag.textContent.length <= 60) {
    score += 15;
  }
  totalChecks += 15;

  // Meta description check
  const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  if (metaDescription && metaDescription.content.length >= 120 && metaDescription.content.length <= 160) {
    score += 15;
  }
  totalChecks += 15;

  // H1 tag check
  const h1Tags = document.querySelectorAll('h1');
  if (h1Tags.length === 1) {
    score += 10;
  }
  totalChecks += 10;

  // Image alt tags
  const images = document.querySelectorAll('img');
  const imagesWithAlt = document.querySelectorAll('img[alt]');
  if (images.length > 0 && imagesWithAlt.length === images.length) {
    score += 10;
  }
  totalChecks += 10;

  // Internal links
  const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="#"]');
  if (internalLinks.length >= 3) {
    score += 10;
  }
  totalChecks += 10;

  // Open Graph tags
  const ogTags = document.querySelectorAll('meta[property^="og:"]');
  if (ogTags.length >= 4) {
    score += 10;
  }
  totalChecks += 10;

  // Twitter Card tags
  const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
  if (twitterTags.length >= 3) {
    score += 10;
  }
  totalChecks += 10;

  // Canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    score += 5;
  }
  totalChecks += 5;

  // Robots meta
  const robots = document.querySelector('meta[name="robots"]');
  if (robots) {
    score += 5;
  }
  totalChecks += 5;

  // Structured data
  const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
  if (jsonLd.length > 0) {
    score += 10;
  }
  totalChecks += 10;

  return Math.round((score / totalChecks) * 100);
}

/**
 * Calculate accessibility score for SEO
 */
async function calculateAccessibilityScore(): Promise<number> {
  let score = 0;
  let totalChecks = 0;

  // Skip navigation links
  const skipLinks = document.querySelectorAll('a[href="#main-content"], a[href="#main"]');
  if (skipLinks.length > 0) {
    score += 10;
  }
  totalChecks += 10;

  // ARIA labels on interactive elements
  const interactiveElements = document.querySelectorAll('button, input, select, textarea');
  let elementsWithLabels = 0;
  interactiveElements.forEach(element => {
    if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || 
        ((element as HTMLInputElement).labels?.length || 0) > 0) {
      elementsWithLabels++;
    }
  });
  if (interactiveElements.length > 0) {
    score += Math.round((elementsWithLabels / interactiveElements.length) * 20);
  }
  totalChecks += 20;

  // Heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let properHierarchy = true;
  let lastLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.substring(1));
    if (level > lastLevel + 1) {
      properHierarchy = false;
    }
    lastLevel = level;
  });
  if (properHierarchy && headings.length > 0) {
    score += 15;
  }
  totalChecks += 15;

  // Color contrast (basic check)
  const body = document.body;
  const computedStyle = getComputedStyle(body);
  const backgroundColor = computedStyle.backgroundColor;
  const color = computedStyle.color;
  if (backgroundColor !== 'rgba(0, 0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
    score += 10;
  }
  totalChecks += 10;

  // Form labels
  const formInputs = document.querySelectorAll('input, select, textarea');
  let inputsWithLabels = 0;
  formInputs.forEach(input => {
    const labels = (input as HTMLInputElement).labels;
    if (labels && labels.length > 0) {
      inputsWithLabels++;
    }
  });
  if (formInputs.length > 0) {
    score += Math.round((inputsWithLabels / formInputs.length) * 15);
  }
  totalChecks += 15;

  // Language attribute
  const htmlLang = document.documentElement.getAttribute('lang');
  if (htmlLang) {
    score += 10;
  }
  totalChecks += 10;

  // Focus management
  const focusableElements = document.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusableElements.length > 0) {
    score += 10;
  }
  totalChecks += 10;

  // Landmark roles
  const landmarks = document.querySelectorAll('main, nav, header, footer, aside, section[aria-label]');
  if (landmarks.length >= 3) {
    score += 10;
  }
  totalChecks += 10;

  return Math.round((score / totalChecks) * 100);
}

/**
 * Calculate performance score based on web vitals
 */
function calculatePerformanceScore(webVitals: WebVitalsMetrics): number {
  let score = 0;

  // First Contentful Paint (good: <1.8s, needs improvement: 1.8s-3s, poor: >3s)
  if (webVitals.fcp < 1800) score += 20;
  else if (webVitals.fcp < 3000) score += 10;

  // Largest Contentful Paint (good: <2.5s, needs improvement: 2.5s-4s, poor: >4s)
  if (webVitals.lcp < 2500) score += 25;
  else if (webVitals.lcp < 4000) score += 15;

  // First Input Delay (good: <100ms, needs improvement: 100ms-300ms, poor: >300ms)
  if (webVitals.fid < 100) score += 20;
  else if (webVitals.fid < 300) score += 10;

  // Cumulative Layout Shift (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
  if (webVitals.cls < 0.1) score += 20;
  else if (webVitals.cls < 0.25) score += 10;

  // Time to First Byte (good: <600ms, needs improvement: 600ms-1.5s, poor: >1.5s)
  if (webVitals.ttfb < 600) score += 15;
  else if (webVitals.ttfb < 1500) score += 8;

  return score;
}

/**
 * Validate structured data on the page
 */
function validateStructuredData(): boolean {
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  
  if (jsonLdScripts.length === 0) return false;

  try {
    jsonLdScripts.forEach(script => {
      const data = JSON.parse(script.textContent || '');
      // Basic validation - ensure @context and @type exist
      if (!data['@context'] || !data['@type']) {
        throw new Error('Invalid structured data');
      }
    });
    return true;
  } catch (error) {
    logger.error('Invalid structured data', error as Error);
    return false;
  }
}

/**
 * Validate essential meta tags
 */
function validateMetaTags(): boolean {
  const requiredTags = [
    'title',
    'meta[name="description"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[name="twitter:card"]',
    'meta[name="viewport"]',
  ];

  return requiredTags.every(selector => {
    const element = document.querySelector(selector);
    return element && (element.textContent || (element as HTMLMetaElement).content);
  });
}

/**
 * Calculate image optimization score
 */
function calculateImageOptimization(): number {
  const images = document.querySelectorAll('img');
  if (images.length === 0) return 100;

  let optimizedImages = 0;

  images.forEach(img => {
    const hasAlt = img.getAttribute('alt') !== null;
    const hasLazyLoading = img.getAttribute('loading') === 'lazy';
    const hasOptimizedFormat = /\.(webp|avif)$/i.test(img.src);
    const hasResponsive = img.getAttribute('srcset') !== null;

    let imageScore = 0;
    if (hasAlt) imageScore += 25;
    if (hasLazyLoading) imageScore += 25;
    if (hasOptimizedFormat) imageScore += 25;
    if (hasResponsive) imageScore += 25;

    if (imageScore >= 50) optimizedImages++;
  });

  return Math.round((optimizedImages / images.length) * 100);
}

/**
 * Calculate mobile optimization score
 */
function calculateMobileOptimization(): number {
  let score = 0;

  // Viewport meta tag
  const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
  if (viewport && viewport.content.includes('width=device-width')) {
    score += 30;
  }

  // Touch-friendly target sizes (at least 44px)
  const interactiveElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
  let touchFriendlyElements = 0;
  
  interactiveElements.forEach(element => {
    const rect = element.getBoundingClientRect();
    if (rect.width >= 44 && rect.height >= 44) {
      touchFriendlyElements++;
    }
  });

  if (interactiveElements.length > 0) {
    score += Math.round((touchFriendlyElements / interactiveElements.length) * 40);
  }

  // No horizontal scrolling
  if (document.documentElement.scrollWidth <= window.innerWidth) {
    score += 30;
  }

  return score;
}

/**
 * Get DOM Content Loaded time
 */
function getDOMContentLoadedTime(): number {
  if ('navigation' in performance) {
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navTiming.domContentLoadedEventStart - navTiming.startTime;
  }
  return 0;
}

/**
 * Generate SEO performance report
 */
export async function generateSEOReport(): Promise<{
  metrics: SEOMetrics;
  recommendations: string[];
  criticalIssues: string[];
}> {
  const metrics = await analyzeSEOPerformance();
  const recommendations: string[] = [];
  const criticalIssues: string[] = [];

  // Performance recommendations
  if (metrics.webVitals.lcp > 2500) {
    criticalIssues.push('Largest Contentful Paint is too slow. Optimize images and critical resources.');
  }
  if (metrics.webVitals.fcp > 1800) {
    recommendations.push('Improve First Contentful Paint by optimizing critical CSS and fonts.');
  }
  if (metrics.webVitals.cls > 0.1) {
    criticalIssues.push('Cumulative Layout Shift is high. Ensure proper image dimensions and avoid layout shifts.');
  }

  // SEO recommendations
  if (metrics.seoScore < 80) {
    recommendations.push('Improve SEO score by optimizing meta tags, headings, and structured data.');
  }
  if (!metrics.structuredDataValid) {
    criticalIssues.push('Structured data is invalid or missing. Add proper JSON-LD markup.');
  }
  if (!metrics.metaTagsComplete) {
    criticalIssues.push('Essential meta tags are missing. Add title, description, and Open Graph tags.');
  }

  // Accessibility recommendations
  if (metrics.accessibilityScore < 80) {
    recommendations.push('Improve accessibility with proper ARIA labels, heading hierarchy, and keyboard navigation.');
  }

  // Image optimization
  if (metrics.imageOptimization < 70) {
    recommendations.push('Optimize images with modern formats (WebP/AVIF), lazy loading, and responsive sizing.');
  }

  // Mobile optimization
  if (metrics.mobileOptimization < 80) {
    recommendations.push('Improve mobile experience with touch-friendly targets and responsive design.');
  }

  return {
    metrics,
    recommendations,
    criticalIssues,
  };
}

export default {
  trackWebVitals,
  analyzeSEOPerformance,
  generateSEOReport,
};