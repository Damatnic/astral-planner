import { generateMetadata } from '@/lib/seo/metadata';
import { SEO_PAGES } from '@/lib/seo/metadata';
import DashboardClientFixed from './DashboardClientFixed';

export const metadata = generateMetadata(SEO_PAGES.dashboard);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function DashboardPage() {
  return <DashboardClientFixed />;
}