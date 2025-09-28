import { generateMetadata } from '@/lib/seo/metadata';
import { SEO_PAGES } from '@/lib/seo/metadata';
import { AppHeader } from '@/components/layout/AppHeader';
import TemplatesClient from './TemplatesClient';

export const metadata = generateMetadata(SEO_PAGES.templates);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function TemplatesPage() {
  return (
    <>
      <AppHeader />
      <TemplatesClient />
    </>
  );
}