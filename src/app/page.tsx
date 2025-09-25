import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Calendar,
  Target,
  Clock,
  Brain,
  Users,
  Zap,
  Shield,
  Sparkles,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Planning',
    description: 'Natural language input and smart suggestions powered by GPT-4'
  },
  {
    icon: Clock,
    title: 'Time Blocking',
    description: 'Visual time blocking with conflict detection and auto-scheduling'
  },
  {
    icon: Target,
    title: 'Goal Hierarchy',
    description: 'Break down lifetime goals into actionable daily tasks'
  },
  {
    icon: Calendar,
    title: 'Smart Calendar',
    description: 'Sync with Google, Outlook, and Apple calendars in real-time'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share workspaces and collaborate in real-time'
  },
  {
    icon: Zap,
    title: 'Habit Tracking',
    description: 'Build better habits with streaks and behavioral insights'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption and SOC 2 compliance'
  },
  {
    icon: Sparkles,
    title: 'Template Marketplace',
    description: 'Start with proven productivity systems and templates'
  }
];

const benefits = [
  'Unlimited tasks and projects',
  'AI-powered natural language processing',
  'Real-time collaboration',
  'Advanced analytics and insights',
  'Priority support',
  'Custom integrations',
  'Offline mode with sync',
  'End-to-end encryption'
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Ultimate Digital Planner</span>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/goals">Goals</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/habits">Habits</Link>
            </Button>
            <Button asChild>
              <Link href="/templates">Templates</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Plan Your Life with{' '}
            <span className="gradient-text">AI-Powered Intelligence</span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            The world's most advanced digital planner that combines time blocking, 
            goal tracking, and habit formation with cutting-edge AI to help you 
            achieve more with less effort.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="gap-2">
              <Link href="/dashboard">
                Go to Dashboard
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/goals">View Goals</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need to Succeed</h2>
          <p className="text-xl text-muted-foreground">
            Powerful features designed to make planning effortless and effective
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Why Choose Ultimate Digital Planner?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of professionals who have transformed their productivity 
                with our comprehensive planning system.
              </p>
              <ul className="space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="p-8 bg-primary/5 border-primary/20">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">98%</div>
                <p className="text-xl mb-6">User Satisfaction Rate</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">50K+</div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">2M+</div>
                    <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">4.9★</div>
                    <p className="text-sm text-muted-foreground">App Rating</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Card className="p-12 bg-gradient-to-r from-primary/10 to-primary/5">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start planning your success today with our powerful digital planner.
          </p>
          <Button size="lg" asChild className="gap-2">
            <Link href="/dashboard">
              Go to Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
                <li><Link href="/goals" className="hover:text-foreground">Goals</Link></li>
                <li><Link href="/habits" className="hover:text-foreground">Habits</Link></li>
                <li><Link href="/templates" className="hover:text-foreground">Templates</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/analytics" className="hover:text-foreground">Analytics</Link></li>
                <li><Link href="/performance" className="hover:text-foreground">Performance</Link></li>
                <li><Link href="/settings" className="hover:text-foreground">Settings</Link></li>
                <li><Link href="/admin" className="hover:text-foreground">Admin</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/api/health" className="hover:text-foreground">API Health</Link></li>
                <li><Link href="/api/health/db" className="hover:text-foreground">Database Status</Link></li>
                <li><Link href="/onboarding" className="hover:text-foreground">Onboarding</Link></li>
                <li><Link href="/test" className="hover:text-foreground">Test Page</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground">Security</a></li>
                <li><a href="#" className="hover:text-foreground">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 Ultimate Digital Planner. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}