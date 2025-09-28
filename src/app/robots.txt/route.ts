/**
 * Dynamic Robots.txt Generation
 * Configures search engine crawling directives
 */

import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://astralplanner.app';

export async function GET(request: NextRequest) {
  const robotsTxt = `# Astral Planner - Robots.txt
# Optimized for search engine discovery and crawling

User-agent: *
Allow: /

# Allow all public pages
Allow: /goals
Allow: /habits
Allow: /templates
Allow: /performance
Allow: /calendar
Allow: /planner
Allow: /login

# Disallow private/admin areas
Disallow: /dashboard
Disallow: /settings
Disallow: /admin
Disallow: /onboarding
Disallow: /analytics
Disallow: /test
Disallow: /api/

# Disallow dynamic API routes
Disallow: /api/*
Disallow: /_next/
Disallow: /_vercel/

# Allow specific API endpoints for crawling
Allow: /api/health
Allow: /api/sitemap

# Crawl-delay (optional - uncomment if needed)
# Crawl-delay: 1

# Sitemap location
Sitemap: ${BASE_URL}/sitemap.xml

# Additional sitemaps (if you have specific ones)
# Sitemap: ${BASE_URL}/sitemap-templates.xml
# Sitemap: ${BASE_URL}/sitemap-blog.xml

# Common bot configurations
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 1

User-agent: DuckDuckBot
Allow: /
Crawl-delay: 1

User-agent: Baiduspider
Allow: /
Crawl-delay: 2

User-agent: YandexBot
Allow: /
Crawl-delay: 1

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

# Block aggressive crawlers (uncomment if needed)
# User-agent: AhrefsBot
# Disallow: /

# User-agent: MJ12bot
# Disallow: /

# User-agent: SemrushBot
# Disallow: /
`;

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200', // Cache for 24 hours
    },
  });
}

// For static generation
export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate every 24 hours