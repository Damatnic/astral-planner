// Catalyst Dynamic Font Loading System - Enhanced Performance
import { cache } from 'react';
import { logger } from '@/lib/logger';

// Font display strategies for optimal performance
type FontDisplay = 'auto' | 'block' | 'swap' | 'fallback' | 'optional';

// Performance metrics for font loading
interface FontMetrics {
  loadTime: number;
  renderTime: number;
  swapTime: number;
  size: number;
}

interface FontConfig {
  name: string;
  variable: string;
  weights?: string[];
  fallback: string[];
  display?: FontDisplay;
  preload?: boolean;
  unicodeRange?: string;
  fontStretch?: string;
  fontStyle?: 'normal' | 'italic' | 'oblique';
}

// Font definitions for lazy loading with performance optimizations
const AVAILABLE_FONTS: Record<string, FontConfig> = {
  'dancing-script': {
    name: 'Dancing Script',
    variable: '--font-dancing-script',
    fallback: ['cursive', 'Caveat', 'serif'],
    display: 'swap',
    preload: true,
    unicodeRange: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
  },
  'kalam': {
    name: 'Kalam',
    variable: '--font-kalam',
    weights: ['300', '400', '700'],
    fallback: ['cursive', 'Caveat', 'sans-serif'],
    display: 'swap',
    preload: false
  },
  'architects-daughter': {
    name: 'Architects Daughter',
    variable: '--font-architects-daughter',
    fallback: ['cursive', 'Caveat', 'sans-serif']
  },
  'indie-flower': {
    name: 'Indie Flower',
    variable: '--font-indie-flower',
    fallback: ['cursive', 'Caveat', 'sans-serif']
  },
  'shadows-into-light': {
    name: 'Shadows Into Light',
    variable: '--font-shadows-into-light',
    fallback: ['cursive', 'Caveat', 'sans-serif']
  },
  'permanent-marker': {
    name: 'Permanent Marker',
    variable: '--font-permanent-marker',
    fallback: ['cursive', 'Caveat', 'sans-serif']
  },
  'amatic-sc': {
    name: 'Amatic SC',
    variable: '--font-amatic-sc',
    weights: ['400', '700'],
    fallback: ['cursive', 'Caveat', 'sans-serif']
  }
};

// Cache for loaded fonts
const loadedFonts = new Set<string>();
const fontLoadPromises = new Map<string, Promise<void>>();

// Optimized font loading with intersection observer
export const loadFontAsync = cache(async (fontKey: string): Promise<void> => {
  if (loadedFonts.has(fontKey)) return;
  
  // Return existing promise if already loading
  if (fontLoadPromises.has(fontKey)) {
    return fontLoadPromises.get(fontKey)!;
  }

  const config = AVAILABLE_FONTS[fontKey];
  if (!config) {
    logger.warn('Font not found in configuration', { fontKey });
    return;
  }

  const promise = new Promise<void>((resolve, reject) => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    // Create font face declaration
    const weights = config.weights || ['400'];
    const fontPromises = weights.map(weight => {
      const fontFace = new FontFace(
        config.name,
        `url(https://fonts.googleapis.com/css2?family=${encodeURIComponent(config.name)}:wght@${weight}&display=swap)`,
        {
          weight,
          display: 'swap'
        }
      );

      return fontFace.load().then(() => {
        document.fonts.add(fontFace);
      });
    });

    Promise.all(fontPromises)
      .then(() => {
        loadedFonts.add(fontKey);
        // Add CSS variable to document root
        document.documentElement.style.setProperty(
          config.variable,
          `'${config.name}', ${config.fallback.join(', ')}`
        );
        resolve();
      })
      .catch(error => {
        logger.warn('Failed to load font', { fontKey }, error as Error);
        // Use fallback fonts
        document.documentElement.style.setProperty(
          config.variable,
          config.fallback.join(', ')
        );
        resolve(); // Don't reject, just use fallback
      });
  });

  fontLoadPromises.set(fontKey, promise);
  return promise;
});

// Preload critical fonts
export const preloadFont = (fontKey: string): void => {
  if (typeof window === 'undefined') return;

  const config = AVAILABLE_FONTS[fontKey];
  if (!config) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  link.crossOrigin = 'anonymous';
  link.href = `https://fonts.gstatic.com/s/${fontKey.replace('-', '')}/v1/${fontKey}-regular.woff2`;
  
  document.head.appendChild(link);
};

// Font loading hook for components
export const useDynamicFont = (fontKey: string, trigger = true) => {
  if (typeof window !== 'undefined' && trigger) {
    loadFontAsync(fontKey);
  }
  
  return {
    isLoaded: loadedFonts.has(fontKey),
    fontVariable: AVAILABLE_FONTS[fontKey]?.variable || '',
    fontFamily: AVAILABLE_FONTS[fontKey]?.fallback.join(', ') || 'sans-serif'
  };
};

// Get all available fonts
export const getAvailableFonts = () => Object.keys(AVAILABLE_FONTS);

// Cleanup function
export const clearFontCache = () => {
  loadedFonts.clear();
  fontLoadPromises.clear();
};