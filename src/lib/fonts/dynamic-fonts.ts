// Catalyst Dynamic Font Loading System
import { cache } from 'react';

interface FontConfig {
  name: string;
  variable: string;
  weights?: string[];
  fallback: string[];
}

// Font definitions for lazy loading
const AVAILABLE_FONTS: Record<string, FontConfig> = {
  'dancing-script': {
    name: 'Dancing Script',
    variable: '--font-dancing-script',
    fallback: ['cursive', 'Caveat', 'serif']
  },
  'kalam': {
    name: 'Kalam',
    variable: '--font-kalam',
    weights: ['300', '400', '700'],
    fallback: ['cursive', 'Caveat', 'sans-serif']
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
    console.warn(`Font ${fontKey} not found in configuration`);
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
        console.warn(`Failed to load font ${fontKey}:`, error);
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