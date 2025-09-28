/**
 * Astral Planner SEO Metadata Management
 * Comprehensive SEO optimization for maximum search visibility
 */

import type { Metadata } from 'next';

// Base SEO configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://astralplanner.app';
const SITE_NAME = 'Astral Planner';
const TWITTER_HANDLE = '@astralplanner';

// Core brand keywords and descriptions
const BRAND_KEYWORDS = [
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
];

export interface SEOPageConfig {
  title: string;
  description: string;
  keywords?: string[] | readonly string[];
  canonical?: string;
  noIndex?: boolean;
  openGraph?: {
    title?: string;
    description?: string;
    type?: 'website' | 'article' | 'profile';
    images?: string[];
  };
  twitter?: {
    title?: string;
    description?: string;
    images?: string[];
  };
  jsonLd?: object[];
}

/**
 * Generate comprehensive metadata for a page
 */
export function generateMetadata(config: SEOPageConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    noIndex = false,
    openGraph = {},
    twitter = {},
    jsonLd = []
  } = config;

  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const allKeywords = [...BRAND_KEYWORDS, ...keywords].join(', ');
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: allKeywords,
    authors: [{ name: 'Astral Planner Team' }],
    creator: 'Astral Planner',
    publisher: 'Astral Planner',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    
    // Canonical URL
    ...(canonicalUrl && { 
      alternates: { 
        canonical: canonicalUrl 
      } 
    }),

    // Robots configuration
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Open Graph
    openGraph: {
      title: openGraph.title || fullTitle,
      description: openGraph.description || description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'en_US',
      type: openGraph.type || 'website',
      images: openGraph.images || [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - AI-Powered Digital Planning`,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: twitter.title || fullTitle,
      description: twitter.description || description,
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      images: twitter.images || [`${BASE_URL}/twitter-image.png`],
    },

    // App-specific metadata
    applicationName: SITE_NAME,
    referrer: 'origin-when-cross-origin',
    category: 'productivity',
    classification: 'Business',
    
    // Mobile app links
    appLinks: {
      web: {
        url: BASE_URL,
        should_fallback: true,
      },
    },

    // Verification tags (to be set via environment variables)
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
      other: {
        'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '',
      },
    },
  };

  return metadata;
}

/**
 * Generate JSON-LD structured data for software application
 */
export function generateAppJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    description: 'AI-powered digital planning solution with real-time collaboration, task management, and goal tracking.',
    url: BASE_URL,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web Browser, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Organization',
      name: 'Astral Planner Team',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Astral Planner',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
        width: 512,
        height: 512,
      },
    },
    softwareVersion: '2.0',
    releaseNotes: 'Enhanced AI features, improved collaboration tools, and better performance.',
    screenshot: [
      `${BASE_URL}/screenshots/dashboard.png`,
      `${BASE_URL}/screenshots/tasks.png`,
      `${BASE_URL}/screenshots/goals.png`,
    ],
    featureList: [
      'AI-powered task management',
      'Goal tracking and analytics',
      'Habit formation tools',
      'Real-time collaboration',
      'Calendar integration',
      'Performance insights',
      'Template library',
      'Cross-platform sync',
    ],
    requirements: 'Modern web browser with JavaScript enabled',
    permissions: 'calendar access, notifications',
    downloadUrl: BASE_URL,
    supportUrl: `${BASE_URL}/support`,
    maintainer: {
      '@type': 'Organization',
      name: 'Astral Planner Team',
    },
  };
}

/**
 * Generate organization JSON-LD
 */
export function generateOrganizationJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Astral Planner',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Leading provider of AI-powered digital planning and productivity solutions.',
    foundingDate: '2024',
    founders: [
      {
        '@type': 'Person',
        name: 'Astral Planner Team',
      },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${BASE_URL}/contact`,
      availableLanguage: ['English'],
    },
    sameAs: [
      'https://twitter.com/astralplanner',
      'https://linkedin.com/company/astralplanner',
      'https://github.com/astralplanner',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
  };
}

/**
 * Generate breadcrumb JSON-LD
 */
export function generateBreadcrumbJsonLd(items: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

/**
 * Generate FAQ JSON-LD
 */
export function generateFAQJsonLd(faqs: Array<{ question: string; answer: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate article JSON-LD (for blog posts, guides, etc.)
 */
export function generateArticleJsonLd({
  title,
  description,
  author,
  datePublished,
  dateModified,
  url,
  imageUrl,
}: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  imageUrl?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    datePublished,
    dateModified: dateModified || datePublished,
    url: `${BASE_URL}${url}`,
    image: imageUrl ? `${BASE_URL}${imageUrl}` : `${BASE_URL}/og-image.png`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}${url}`,
    },
  };
}

/**
 * SEO page configurations for common pages
 */
export const SEO_PAGES = {
  home: {
    title: 'Astral Planner - AI-Powered Digital Planning & Productivity',
    description: 'Transform your productivity with Astral Planner\'s AI-powered digital planning solution. Manage tasks, track goals, build habits, and collaborate in real-time. Free to start.',
    keywords: [
      'AI task management',
      'digital planner app',
      'productivity software',
      'goal tracking system',
      'habit tracker',
      'project management',
      'calendar integration',
      'team collaboration',
    ],
    canonical: '/',
  },

  dashboard: {
    title: 'Dashboard - Your Productivity Command Center',
    description: 'Access your personalized productivity dashboard with AI insights, task management, goal tracking, and performance analytics all in one place.',
    keywords: [
      'productivity dashboard',
      'task overview',
      'goal progress',
      'performance metrics',
      'AI insights',
    ],
    canonical: '/dashboard',
    noIndex: true, // Private page
  },

  login: {
    title: 'Sign In - Access Your Digital Planner',
    description: 'Sign in to Astral Planner to access your personalized productivity dashboard, tasks, goals, and collaboration tools.',
    keywords: [
      'sign in',
      'login',
      'account access',
      'user authentication',
    ],
    canonical: '/login',
    noIndex: true, // No need to index auth pages
  },

  goals: {
    title: 'Goal Tracking - Achieve Your Dreams with AI',
    description: 'Set, track, and achieve your goals with AI-powered insights and progress analytics. Break down big dreams into actionable steps.',
    keywords: [
      'goal setting',
      'goal tracking',
      'achievement tracking',
      'progress analytics',
      'personal development',
    ],
    canonical: '/goals',
  },

  habits: {
    title: 'Habit Tracker - Build Better Habits Daily',
    description: 'Build lasting habits with our intelligent habit tracking system. Get insights, streaks, and AI-powered suggestions for habit formation.',
    keywords: [
      'habit tracker',
      'habit formation',
      'daily habits',
      'habit analytics',
      'behavior change',
    ],
    canonical: '/habits',
  },

  templates: {
    title: 'Productivity Templates - Ready-to-Use Planning Solutions',
    description: 'Discover professionally designed productivity templates for project management, goal setting, habit tracking, and more. Start planning instantly.',
    keywords: [
      'productivity templates',
      'planning templates',
      'project templates',
      'goal templates',
      'habit templates',
    ],
    canonical: '/templates',
  },

  performance: {
    title: 'Performance Analytics - Data-Driven Productivity Insights',
    description: 'Analyze your productivity patterns with comprehensive performance analytics. Identify trends, optimize workflows, and boost efficiency.',
    keywords: [
      'productivity analytics',
      'performance metrics',
      'productivity insights',
      'workflow optimization',
      'efficiency tracking',
    ],
    canonical: '/performance',
  },

  settings: {
    title: 'Settings - Customize Your Planning Experience',
    description: 'Personalize Astral Planner with custom settings, integrations, preferences, and account management options.',
    keywords: [
      'settings',
      'preferences',
      'account management',
      'integrations',
      'customization',
    ],
    canonical: '/settings',
    noIndex: true, // Private page
  },
} as const;