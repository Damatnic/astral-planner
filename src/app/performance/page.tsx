import { generateMetadata } from '@/lib/seo/metadata';
import { SEO_PAGES } from '@/lib/seo/metadata';
import { AppHeader } from '@/components/layout/AppHeader';
import PerformanceClient from './PerformanceClient';

export const metadata = generateMetadata(SEO_PAGES.performance);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function PerformancePage() {
  return (
    <>
      <AppHeader />
      <PerformanceClient />
    </>
  );
}