import { AppHeader } from '@/components/layout/AppHeader';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function AnalyticsPage() {
  return (
    <>
      <AppHeader />
      <AnalyticsClient />
    </>
  );
}