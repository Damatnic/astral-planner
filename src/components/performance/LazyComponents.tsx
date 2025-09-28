'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// CATALYST CRITICAL: Lazy loading fallback components
const ComponentSkeleton = ({ height = 200 }: { height?: number }) => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className="w-full" style={{ height }} />
    </CardContent>
  </Card>
);

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <ComponentSkeleton height={300} />
      <ComponentSkeleton height={300} />
    </div>
  </div>
);

// CATALYST CRITICAL: Lazy-loaded heavy components
export const LazyAnalyticsClient = dynamic(
  () => import('@/app/analytics/AnalyticsClient'),
  {
    loading: () => <AnalyticsSkeleton />,
    ssr: false, // Client-side only for better performance
  }
);

export const LazyTemplatesClient = dynamic(
  () => import('@/app/templates/TemplatesClient'),
  {
    loading: () => <ComponentSkeleton height={400} />,
    ssr: false,
  }
);

export const LazyGoalsClient = dynamic(
  () => import('@/app/goals/GoalsClient'),
  {
    loading: () => <ComponentSkeleton height={350} />,
    ssr: false,
  }
);

export const LazyHabitsClient = dynamic(
  () => import('@/app/habits/HabitsClient'),
  {
    loading: () => <ComponentSkeleton height={350} />,
    ssr: false,
  }
);

export const LazyPerformanceClient = dynamic(
  () => import('@/app/performance/PerformanceClient'),
  {
    loading: () => <ComponentSkeleton height={400} />,
    ssr: false,
  }
);

export const LazySettingsClient = dynamic(
  () => import('@/app/settings/SettingsClient'),
  {
    loading: () => <ComponentSkeleton height={500} />,
    ssr: false,
  }
);

// CATALYST CRITICAL: Heavy UI components
export const LazyFramerMotion = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion })),
  {
    loading: () => <div className="opacity-0" />,
    ssr: false,
  }
);

export const LazyReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then(mod => ({ 
    default: mod.ReactQueryDevtools 
  })),
  {
    loading: () => null,
    ssr: false,
  }
);

// CATALYST CRITICAL: Form components
export const LazyReactHookForm = dynamic(
  () => import('react-hook-form'),
  {
    loading: () => <Skeleton className="h-10 w-full" />,
    ssr: false,
  }
);

// CATALYST CRITICAL: Command palette
export const LazyCmdk = dynamic(
  () => import('cmdk'),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

// CATALYST CRITICAL: Lazy loading helper
export const withLazyLoading = <T,>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType,
  options?: {
    ssr?: boolean;
    loading?: React.ComponentType;
  }
) => {
  return dynamic(() => Promise.resolve(Component), {
    loading: options?.loading || fallback || (() => <Skeleton className="h-32 w-full" />),
    ssr: options?.ssr ?? false,
  });
};

// CATALYST CRITICAL: Intersection Observer for lazy loading
export const LazyOnView = ({ 
  children, 
  fallback,
  threshold = 0.1 
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <Skeleton className="h-32 w-full" />)}
    </div>
  );
};