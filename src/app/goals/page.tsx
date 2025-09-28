import { generateMetadata } from '@/lib/seo/metadata';
import { SEO_PAGES } from '@/lib/seo/metadata';
import GoalsClientFixed from './GoalsClientFixed';

export const metadata = generateMetadata(SEO_PAGES.goals);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function GoalsPage() {
  return <GoalsClientFixed />;
}