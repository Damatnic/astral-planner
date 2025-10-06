import { AppHeader } from '@/components/layout/AppHeader';
import PhysicalPlannerView from './PhysicalPlannerView';

export default function PhysicalPlannerPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950">
      {/* Animated cosmic orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <AppHeader />
      
      {/* Full-screen Planner */}
      <div className="h-[calc(100vh-4rem)] relative z-10">
        <PhysicalPlannerView />
      </div>
    </div>
  );
}