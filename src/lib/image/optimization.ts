// Catalyst Image Optimization System
import React, { useState, useEffect } from 'react';

interface ImageOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
  priority?: boolean;
  lazy?: boolean;
  srcSizes?: string;
}

interface OptimizedImage {
  src: string;
  srcSet: string;
  placeholder?: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

class CatalystImageOptimizer {
  private baseUrl: string;
  private defaultQuality: number;
  private supportedFormats: string[];

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_IMAGE_DOMAIN || '';
    this.defaultQuality = 85;
    this.supportedFormats = this.detectSupportedFormats();
  }

  // Detect browser support for modern image formats
  private detectSupportedFormats(): string[] {
    if (typeof window === 'undefined') {
      return ['webp', 'avif']; // Assume modern support on server
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    
    const formats: string[] = [];
    
    // Check WebP support
    if (canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
      formats.push('webp');
    }
    
    // Check AVIF support
    try {
      if (canvas.toDataURL('image/avif').startsWith('data:image/avif')) {
        formats.push('avif');
      }
    } catch (e) {
      // AVIF not supported
    }
    
    return formats;
  }

  // Generate optimized image URL
  generateUrl(src: string, options: ImageOptions = {}): string {
    if (!src) return '';
    
    // If it's already an optimized URL, return as-is
    if (src.includes('/_next/image') || src.includes('w_') || src.includes('q_')) {
      return src;
    }

    const {
      quality = this.defaultQuality,
      format = 'auto',
      width,
      height,
      fit = 'cover',
      blur,
      sharpen,
      grayscale
    } = options;

    // Build optimization parameters
    const params = new URLSearchParams();
    
    params.set('url', encodeURIComponent(src));
    params.set('q', quality.toString());
    
    if (format === 'auto') {
      // Choose the best supported format
      if (this.supportedFormats.includes('avif')) {
        params.set('fm', 'avif');
      } else if (this.supportedFormats.includes('webp')) {
        params.set('fm', 'webp');
      } else {
        params.set('fm', 'jpeg');
      }
    } else {
      params.set('fm', format);
    }
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (fit !== 'cover') params.set('fit', fit);
    if (blur) params.set('blur', blur.toString());
    if (sharpen) params.set('sharpen', 'true');
    if (grayscale) params.set('grayscale', 'true');

    return `/_next/image?${params.toString()}`;
  }

  // Generate responsive srcSet
  generateSrcSet(src: string, options: ImageOptions = {}): string {
    const breakpoints = [320, 640, 768, 1024, 1280, 1536, 1920];
    const srcSetEntries: string[] = [];

    breakpoints.forEach(width => {
      const optimizedUrl = this.generateUrl(src, {
        ...options,
        width
      });
      srcSetEntries.push(`${optimizedUrl} ${width}w`);
    });

    return srcSetEntries.join(', ');
  }

  // Generate placeholder (low quality image placeholder)
  generatePlaceholder(src: string, options: ImageOptions = {}): string {
    return this.generateUrl(src, {
      ...options,
      width: 10,
      height: 10,
      quality: 10,
      blur: 5
    });
  }

  // Optimize image with multiple formats and sizes
  async optimizeImage(src: string, options: ImageOptions = {}): Promise<OptimizedImage> {
    const {
      width = 1920,
      height = 1080,
      quality = this.defaultQuality,
      format = 'auto'
    } = options;

    // Generate main optimized image
    const optimizedSrc = this.generateUrl(src, options);
    
    // Generate responsive srcSet
    const srcSet = this.generateSrcSet(src, options);
    
    // Generate placeholder
    const placeholder = this.generatePlaceholder(src, options);

    // Estimate file size (rough calculation)
    const estimatedSize = this.estimateFileSize(width, height, format, quality);

    return {
      src: optimizedSrc,
      srcSet,
      placeholder,
      width,
      height,
      format: format === 'auto' ? this.supportedFormats[0] || 'webp' : format,
      size: estimatedSize
    };
  }

  // Estimate file size in bytes
  private estimateFileSize(width: number, height: number, format: string, quality: number): number {
    const pixels = width * height;
    const baseSize = pixels * 3; // RGB bytes
    
    let compressionRatio: number;
    
    switch (format) {
      case 'avif':
        compressionRatio = quality > 80 ? 0.1 : quality > 60 ? 0.08 : 0.06;
        break;
      case 'webp':
        compressionRatio = quality > 80 ? 0.15 : quality > 60 ? 0.12 : 0.1;
        break;
      case 'jpeg':
        compressionRatio = quality > 80 ? 0.25 : quality > 60 ? 0.2 : 0.15;
        break;
      default:
        compressionRatio = 0.2;
    }
    
    return Math.round(baseSize * compressionRatio);
  }

  // Preload critical images
  preloadImage(src: string, options: ImageOptions = {}): void {
    if (typeof window === 'undefined' || !options.priority) return;

    const optimizedSrc = this.generateUrl(src, options);
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizedSrc;
    
    // Add responsive preload for high-DPI displays
    if (options.width) {
      link.imageSizes = `${options.width}px`;
    }
    
    document.head.appendChild(link);
  }

  // Lazy load images with intersection observer
  lazyLoadImage(element: HTMLImageElement, src: string, options: ImageOptions = {}): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      element.src = this.generateUrl(src, options);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const optimizedSrc = this.generateUrl(src, options);
            
            // Create a new image to preload
            const newImg = new Image();
            newImg.onload = () => {
              img.src = optimizedSrc;
              img.classList.remove('loading');
              img.classList.add('loaded');
            };
            newImg.src = optimizedSrc;
            
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px', // Load images 50px before they enter viewport
        threshold: 0.01
      }
    );

    observer.observe(element);
  }

  // Generate art direction with different images for different screen sizes
  generateArtDirection(images: Array<{ src: string; media: string; options?: ImageOptions }>): string {
    const sources = images.map(({ src, media, options = {} }) => {
      const optimizedSrc = this.generateUrl(src, options);
      const srcSet = this.generateSrcSet(src, options);
      return `<source media="${media}" srcset="${srcSet}" />`;
    }).join('');

    return sources;
  }

  // Performance monitoring for images
  monitorImagePerformance(): void {
    if (typeof window === 'undefined') return;

    // Monitor image loading performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        if (resourceEntry.initiatorType === 'img') {
          const loadTime = resourceEntry.responseEnd - resourceEntry.startTime;
          const size = resourceEntry.transferSize || 0;
          
          console.log(`Image loaded: ${resourceEntry.name}`);
          console.log(`Load time: ${loadTime.toFixed(2)}ms`);
          console.log(`Size: ${(size / 1024).toFixed(2)}KB`);
          
          // Track slow-loading images
          if (loadTime > 1000) {
            console.warn(`Slow image detected: ${entry.name} (${loadTime.toFixed(2)}ms)`);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  // Image compression utilities for client-side optimization
  async compressImage(file: File, options: ImageOptions = {}): Promise<Blob> {
    const {
      quality = 0.8,
      width,
      height,
      format = 'webp'
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate dimensions
        const aspectRatio = img.width / img.height;
        let newWidth = width || img.width;
        let newHeight = height || img.height;

        if (width && !height) {
          newHeight = width / aspectRatio;
        } else if (height && !width) {
          newWidth = height * aspectRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

// Singleton instance
export const imageOptimizer = new CatalystImageOptimizer();

// Convenience functions
export const optimizeImage = (src: string, options?: ImageOptions) =>
  imageOptimizer.optimizeImage(src, options);

export const generateImageUrl = (src: string, options?: ImageOptions) =>
  imageOptimizer.generateUrl(src, options);

export const generateSrcSet = (src: string, options?: ImageOptions) =>
  imageOptimizer.generateSrcSet(src, options);

export const preloadImage = (src: string, options?: ImageOptions) =>
  imageOptimizer.preloadImage(src, options);

export const lazyLoadImage = (element: HTMLImageElement, src: string, options?: ImageOptions) =>
  imageOptimizer.lazyLoadImage(element, src, options);

// React hook for optimized images
export const useOptimizedImage = (src: string, options: ImageOptions = {}) => {
  const [optimizedImage, setOptimizedImage] = useState<OptimizedImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setError(null);

    imageOptimizer.optimizeImage(src, options)
      .then(setOptimizedImage)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [src, JSON.stringify(options)]);

  return { optimizedImage, isLoading, error };
};

// Export types
export type { ImageOptions, OptimizedImage };