import { AppHeader } from '@/components/layout/AppHeader';
import PhysicalPlannerView from './PhysicalPlannerView';

export default function PhysicalPlannerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <AppHeader />
      
      {/* Full-screen Planner */}
      <div className="h-[calc(100vh-4rem)]">
        <PhysicalPlannerView />
      </div>
    </div>
  );
}