/**
 * Dynamic Sitemap.xml Generation
 * Generates comprehensive sitemap for optimal crawlability
 */

import { NextRequest, NextResponse } from 'next/server';
import { Logger as logger } from '@/lib/logger/edge';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://astralplanner.app';

// Static pages configuration
const STATIC_PAGES: SitemapUrl[] = [
  {
    url: '/',
    priority: 1.0,
    changefreq: 'daily' as ChangefreqType,
    lastmod: new Date().toISOString(),
  },
  {
    url: '/login',
    priority: 0.8,
    changefreq: 'monthly' as ChangefreqType,
    lastmod: new Date().toISOString(),
  },
  {
    url: '/goals',
    priority: 0.9,
    changefreq: 'weekly' as ChangefreqType,
    lastmod: new Date().toISOString(),
  },
  {
    url: '/habits',
    priority: 0.9,
    changefreq: 'weekly' as ChangefreqType,
    lastmod: new Date().toISOString(),
  },
  {
    url: '/templates',
    priority: 0.8,
    changefreq: 'weekly' as ChangefreqType,
    lastmod: new Date().toISOString(),
  },
  {
    url: '/performance',
    priority: 0.7,
    changefreq: 'weekly' as ChangefreqType,
    lastmod: new Date().toISOString(),
  },
  {
    url: '/calendar',
    priority: 0.7,
    changefreq: 'weekly' as ChangefreqType,
    lastmod: new Date().toISOString(),
  },
  {
    url: '/planner',
    priority: 0.8,
    changefreq: 'weekly' as ChangefreqType,
    lastmod: new Date().toISOString(),
  },
];

// Pages that should not be indexed
const EXCLUDED_PAGES = [
  '/dashboard',
  '/settings',
  '/admin',
  '/onboarding',
  '/analytics',
  '/test',
];

interface SitemapUrl {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

type ChangefreqType = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

/**
 * Generate XML sitemap
 */
function generateSitemapXML(urls: SitemapUrl[]): string {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls
  .map(
    (url) => `  <url>
    <loc>${BASE_URL}${url.url}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return sitemap;
}

/**
 * Get dynamic content URLs (templates, blog posts, etc.)
 */
async function getDynamicUrls(): Promise<SitemapUrl[]> {
  const dynamicUrls: SitemapUrl[] = [];

  try {
    // You can extend this to fetch dynamic content from your database
    // For example: templates, blog posts, user-generated content
    
    // Example: Fetch popular templates
    // const templates = await getPublicTemplates();
    // templates.forEach(template => {
    //   dynamicUrls.push({
    //     url: `/templates/${template.slug}`,
    //     lastmod: template.updatedAt.toISOString(),
    //     changefreq: 'monthly',
    //     priority: 0.6,
    //   });
    // });

  } catch (error) {
    logger.error('Error fetching dynamic URLs for sitemap', error);
  }

  return dynamicUrls;
}

export async function GET(request: NextRequest) {
  try {
    // Get dynamic URLs
    const dynamicUrls = await getDynamicUrls();

    // Combine static and dynamic URLs
    const allUrls = [...STATIC_PAGES, ...dynamicUrls];

    // Filter out excluded pages
    const filteredUrls = allUrls.filter(
      (urlObj) => !EXCLUDED_PAGES.some((excluded) => urlObj.url.startsWith(excluded))
    );

    // Generate XML
    const sitemap = generateSitemapXML(filteredUrls);

    // Return response with proper headers
    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200', // Cache for 24 hours
      },
    });
  } catch (error) {
    logger.error('Error generating sitemap', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}

// For static generation
export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate every 24 hours