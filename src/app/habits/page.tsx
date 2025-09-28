import { generateMetadata } from '@/lib/seo/metadata';
import { SEO_PAGES } from '@/lib/seo/metadata';
import HabitsClient from './HabitsClient';

export const metadata = generateMetadata(SEO_PAGES.habits);

export default function HabitsPage() {
  return <HabitsClient />;
}