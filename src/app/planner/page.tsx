import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import PhysicalPlannerView from './PhysicalPlannerView';

export default function PhysicalPlannerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Ultimate Digital Planner</span>
            </Link>
          </div>
          
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">🏠 Home</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar">Calendar</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/goals">Goals</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/habits">Habits</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/analytics">Analytics</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Full-screen Planner */}
      <div className="h-[calc(100vh-4rem)]">
        <PhysicalPlannerView />
      </div>
    </div>
  );
}