import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function DashboardPage() {
  return <DashboardClient />;
}