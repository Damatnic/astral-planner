'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/use-onboarding';
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
  CheckCircle2,
  Star,
  Moon,
  Rocket,
  TrendingUp,
  BarChart3
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

export default function HomeClient() {
  const router = useRouter();
  const { isCompleted, onboardingData, isHydrated } = useOnboarding();
  
  const handleGetStarted = () => {
    router.push('/login');
  };

  const getStartedText = 'Get Started';

  // Show loading state only during hydration to prevent mismatch
  // After hydration, show the full content consistently
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Moon className="h-8 w-8 text-purple-400 animate-pulse" />
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Astral Chronos
              </div>
            </div>
            <div className="text-purple-300/60">Loading your cosmic planner...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-purple-800/30 bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Moon className="h-8 w-8 text-purple-400" />
              <Star className="h-3 w-3 text-pink-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Astral Chronos
            </span>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <Button 
              asChild 
              variant="ghost" 
              className="text-purple-200 hover:text-purple-100 hover:bg-purple-900/30"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button 
              asChild
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30"
            >
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 md:px-8 py-20 md:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-purple-900/30 border border-purple-700/30 text-purple-300 text-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Digital Planning</span>
          </div>
          
          <h1 className="mb-8 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent">
              Plan Your Life
            </span>
            <br />
            <span className="text-white">Among the Stars</span>
          </h1>
          
          <p className="mb-12 text-xl md:text-2xl text-purple-200/80 max-w-3xl mx-auto leading-relaxed">
            The most advanced cosmic planner that combines time blocking, 
            goal tracking, and AI intelligence to help you reach for the stars 
            and achieve stellar productivity.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl shadow-purple-500/40 px-8 py-6 text-lg"
            >
              <Rocket className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
              Launch Your Journey
              <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild
              className="border-purple-600/50 text-purple-300 hover:bg-purple-900/30 hover:text-purple-200 px-8 py-6 text-lg"
            >
              <Link href="/login">
                <Star className="h-5 w-5 mr-2" />
                Try Demo
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-purple-800/30">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-300 mb-1">50K+</div>
              <div className="text-sm text-purple-400/60">Cosmic Planners</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-pink-300 mb-1">2M+</div>
              <div className="text-sm text-pink-400/60">Goals Achieved</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-indigo-300 mb-1">4.9★</div>
              <div className="text-sm text-indigo-400/60">Star Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative container mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Stellar Features
          </h2>
          <p className="text-xl text-purple-300/70">
            Everything you need to reach cosmic productivity
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="group p-6 bg-slate-900/50 border-purple-800/30 hover:border-purple-600/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-900/50 to-pink-900/50 group-hover:from-purple-800/50 group-hover:to-pink-800/50 transition-colors">
                <feature.icon className="h-8 w-8 text-purple-300 group-hover:text-purple-200 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-purple-200 transition-colors">
                {feature.title}
              </h3>
              <p className="text-purple-300/60 group-hover:text-purple-300/80 transition-colors">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 bg-slate-900/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Why Choose <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Astral</span>?
              </h2>
              <p className="text-xl text-purple-200/70 mb-8 leading-relaxed">
                Join thousands of cosmic achievers who have transformed their productivity 
                with our stellar planning system.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 group">
                    <div className="mt-1 p-1 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-colors">
                      <CheckCircle2 className="h-5 w-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                    </div>
                    <span className="text-purple-100/90 group-hover:text-white transition-colors">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="p-10 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-700/30 backdrop-blur-sm">
              <div className="text-center">
                <div className="mb-8">
                  <div className="text-6xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
                    98%
                  </div>
                  <p className="text-xl text-purple-200">Cosmic Satisfaction</p>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/20">
                    <TrendingUp className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">200%</div>
                    <p className="text-xs text-purple-300/60 mt-1">Productivity</p>
                  </div>
                  <div className="p-4 rounded-xl bg-pink-950/40 border border-pink-800/20">
                    <Target className="h-6 w-6 text-pink-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">5x</div>
                    <p className="text-xs text-pink-300/60 mt-1">Goals Hit</p>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/20">
                    <BarChart3 className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">10hrs</div>
                    <p className="text-xs text-indigo-300/60 mt-1">Saved/Week</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative container mx-auto px-4 md:px-8 py-20 text-center">
        <Card className="relative overflow-hidden p-12 md:p-16 bg-gradient-to-br from-purple-900/60 to-pink-900/60 border-purple-700/30 backdrop-blur-sm">
          <div className="absolute inset-0 bg-grid-white/5"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Reach for the Stars?
            </h2>
            <p className="text-xl text-purple-100/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Start your cosmic journey today and transform the way you plan, 
              achieve, and succeed.
            </p>
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl shadow-purple-500/40 px-10 py-7 text-lg"
            >
              <Rocket className="h-6 w-6 mr-2 group-hover:translate-x-1 transition-transform" />
              Launch Now
              <ChevronRight className="h-6 w-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-purple-800/30 py-16 bg-slate-900/50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Moon className="h-6 w-6 text-purple-400" />
                <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Astral Chronos
                </span>
              </div>
              <p className="text-sm text-purple-300/60 leading-relaxed">
                Your cosmic companion for stellar productivity and life planning.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-purple-200">Product</h3>
              <ul className="space-y-2 text-sm text-purple-300/60">
                <li><Link href="/dashboard" className="hover:text-purple-300 transition-colors">Dashboard</Link></li>
                <li><Link href="/goals" className="hover:text-purple-300 transition-colors">Goals</Link></li>
                <li><Link href="/habits" className="hover:text-purple-300 transition-colors">Habits</Link></li>
                <li><Link href="/templates" className="hover:text-purple-300 transition-colors">Templates</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-purple-200">Features</h3>
              <ul className="space-y-2 text-sm text-purple-300/60">
                <li><Link href="/analytics" className="hover:text-purple-300 transition-colors">Analytics</Link></li>
                <li><Link href="/performance" className="hover:text-purple-300 transition-colors">Performance</Link></li>
                <li><Link href="/settings" className="hover:text-purple-300 transition-colors">Settings</Link></li>
                <li><Link href="/planner" className="hover:text-purple-300 transition-colors">Planner</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-purple-200">Company</h3>
              <ul className="space-y-2 text-sm text-purple-300/60">
                <li><a href="#" className="hover:text-purple-300 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-purple-300 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-purple-300 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-purple-300 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-purple-800/30 text-center">
            <p className="text-sm text-purple-300/50">
              © 2025 Astral Chronos. Reaching for the stars, one plan at a time. ✨
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}