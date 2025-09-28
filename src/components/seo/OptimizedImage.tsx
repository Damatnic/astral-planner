/**
 * Prism SEO-Optimized Image Component
 * Advanced image optimization for Core Web Vitals and SEO performance
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

interface ImageFormats {
  avif?: string;
  webp?: string;
  original: string;
}

/**
 * SEO-Optimized Image with modern formats and lazy loading
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 85,
  sizes,
  fill = false,
  placeholder = 'blur',
  blurDataURL,
  loading = 'lazy',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate different format URLs
  const generateImageFormats = (originalSrc: string): ImageFormats => {
    // Check if it's an external URL or relative path
    const isExternal = originalSrc.startsWith('http');
    
    if (isExternal) {
      return { original: originalSrc };
    }

    // For internal images, generate optimized formats
    const basePath = originalSrc.replace(/\.[^/.]+$/, '');
    const extension = originalSrc.split('.').pop();

    return {
      avif: `${basePath}.avif`,
      webp: `${basePath}.webp`,
      original: originalSrc,
    };
  };

  const formats = generateImageFormats(src);

  // Generate low-quality placeholder if not provided
  const generateBlurDataURL = (width: number = 10, height: number = 10): string => {
    if (blurDataURL) return blurDataURL;
    
    // Generate a simple blur placeholder
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect width="80%" height="60%" x="10%" y="20%" fill="#e5e7eb" rx="4"/>
      </svg>`
    ).toString('base64')}`;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setImageError(true);
    if (onError) onError();
  };

  // Intersection Observer for lazy loading analytics
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Track image view for SEO analytics
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'image_view', {
                event_category: 'SEO',
                event_label: alt,
                custom_parameter: src,
              });
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [alt, src]);

  // Error fallback component
  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={fill ? undefined : { width, height }}
        role="img"
        aria-label={alt}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  // Modern browsers with picture element support
  if (formats.avif || formats.webp) {
    return (
      <picture className={className}>
        {formats.avif && (
          <source srcSet={formats.avif} type="image/avif" sizes={sizes} />
        )}
        {formats.webp && (
          <source srcSet={formats.webp} type="image/webp" sizes={sizes} />
        )}
        <Image
          ref={imgRef}
          src={formats.original}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          quality={quality}
          sizes={sizes}
          placeholder={placeholder}
          blurDataURL={generateBlurDataURL(width, height)}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          // SEO attributes
          itemProp="image"
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      </picture>
    );
  }

  // Fallback for Next.js Image component
  return (
    <Image
      ref={imgRef}
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      priority={priority}
      quality={quality}
      sizes={sizes}
      placeholder={placeholder}
      blurDataURL={generateBlurDataURL(width, height)}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      // SEO attributes
      itemProp="image"
      style={{
        maxWidth: '100%',
        height: 'auto',
      }}
    />
  );
}

/**
 * Hero Image Component for landing pages
 */
interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  overlay?: boolean;
  overlayColor?: string;
  children?: React.ReactNode;
}

export function HeroImage({
  src,
  alt,
  className = '',
  overlay = false,
  overlayColor = 'rgba(0, 0, 0, 0.4)',
  children,
}: HeroImageProps) {
  return (
    <div className={`relative ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover"
      />
      {overlay && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: overlayColor }}
        />
      )}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Gallery Image Component with structured data
 */
interface GalleryImageProps {
  src: string;
  alt: string;
  caption?: string;
  photographer?: string;
  license?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function GalleryImage({
  src,
  alt,
  caption,
  photographer,
  license,
  width = 400,
  height = 300,
  className = '',
}: GalleryImageProps) {
  // Generate structured data for the image
  const imageStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: src,
    description: caption || alt,
    name: alt,
    ...(photographer && {
      creator: {
        '@type': 'Person',
        name: photographer,
      },
    }),
    ...(license && { license }),
    width,
    height,
  };

  return (
    <figure className={`${className}`} itemScope itemType="https://schema.org/ImageObject">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(imageStructuredData),
        }}
      />
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-auto rounded-lg"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      {(caption || photographer) && (
        <figcaption className="mt-2 text-sm text-gray-600">
          {caption && <span itemProp="description">{caption}</span>}
          {photographer && (
            <span className="block mt-1" itemProp="creator">
              Photo by {photographer}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Avatar Image Component with proper fallbacks
 */
interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
  fallback?: string;
}

export function AvatarImage({
  src,
  alt,
  size = 40,
  className = '',
  fallback,
}: AvatarImageProps) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    const initials = fallback || alt.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium rounded-full ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        role="img"
        aria-label={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      quality={90}
      priority={false}
      onError={() => setImageError(true)}
    />
  );
}

export default OptimizedImage;