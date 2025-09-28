import { generateMetadata } from '@/lib/seo/metadata';
import { SEO_PAGES } from '@/lib/seo/metadata';
import HomeClient from './HomeClient';

export const metadata = generateMetadata(SEO_PAGES.home);

export default function HomePage() {
  return <HomeClient />;
}