/**
 * SEO-Optimized Breadcrumb Navigation
 * Includes structured data for enhanced search visibility
 */

'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { JsonLd } from './JsonLd';
import { generateBreadcrumbJsonLd } from '@/lib/seo/metadata';

export interface BreadcrumbItem {
  name: string;
  url: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  // Always include home as the first item
  const allItems = [
    { name: 'Home', url: '/' },
    ...items.filter(item => item.url !== '/'),
  ];

  // Generate structured data
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(allItems);

  return (
    <>
      {/* Structured Data */}
      <JsonLd data={breadcrumbJsonLd} />
      
      {/* Visual Breadcrumbs */}
      <nav
        aria-label="Breadcrumb navigation"
        className={`flex items-center space-x-2 text-sm text-muted-foreground ${className}`}
      >
        <ol className="flex items-center space-x-2">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            const isHome = item.url === '/';

            return (
              <li key={item.url} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground/60" />
                )}
                
                {isLast ? (
                  <span
                    className="font-medium text-foreground"
                    aria-current="page"
                  >
                    {isHome ? (
                      <Home className="w-4 h-4" aria-label="Home" />
                    ) : (
                      item.name
                    )}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="flex items-center hover:text-foreground transition-colors duration-200"
                    aria-label={isHome ? 'Go to home page' : `Go to ${item.name}`}
                  >
                    {isHome ? (
                      <Home className="w-4 h-4" aria-label="Home" />
                    ) : (
                      item.name
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/**
 * Hook to generate breadcrumbs based on current route
 */
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Route mapping for better display names
  const routeNames: Record<string, string> = {
    dashboard: 'Dashboard',
    goals: 'Goals',
    habits: 'Habits',
    templates: 'Templates',
    performance: 'Performance',
    calendar: 'Calendar',
    planner: 'Planner',
    settings: 'Settings',
    login: 'Sign In',
    onboarding: 'Getting Started',
    analytics: 'Analytics',
    admin: 'Admin',
  };

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const displayName = routeNames[segment] || 
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

    breadcrumbs.push({
      name: displayName,
      url: currentPath,
      current: index === segments.length - 1,
    });
  });

  return breadcrumbs;
}

/**
 * Auto-generating breadcrumbs component
 */
interface AutoBreadcrumbsProps {
  pathname: string;
  className?: string;
  customItems?: BreadcrumbItem[];
}

export function AutoBreadcrumbs({ 
  pathname, 
  className,
  customItems 
}: AutoBreadcrumbsProps) {
  const autoBreadcrumbs = useBreadcrumbs(pathname);
  const items = customItems || autoBreadcrumbs;

  // Don't show breadcrumbs on homepage
  if (pathname === '/' || items.length === 0) {
    return null;
  }

  return <Breadcrumbs items={items} className={className} />;
}

export default Breadcrumbs;