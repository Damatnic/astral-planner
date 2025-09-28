import { AppHeader } from '@/components/layout/AppHeader';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function SettingsPage() {
  return (
    <>
      <AppHeader />
      <SettingsClient />
    </>
  );
}