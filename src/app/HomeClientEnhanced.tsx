'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/use-onboarding';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  ArrowRight,
  Play,
  Star,
  TrendingUp,
  Globe,
  Smartphone,
  Lock,
  Heart
} from 'lucide-react';

import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedLayout, PageHeader, Section, Container } from '@/components/layout/enhanced-layout';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Planning',
    description: 'Natural language input and smart suggestions powered by GPT-4',
    color: 'from-purple-500 to-pink-500',
    delay: 0.1
  },
  {
    icon: Clock,
    title: 'Time Blocking',
    description: 'Visual time blocking with conflict detection and auto-scheduling',
    color: 'from-blue-500 to-cyan-500',
    delay: 0.2
  },
  {
    icon: Target,
    title: 'Goal Hierarchy',
    description: 'Break down lifetime goals into actionable daily tasks',
    color: 'from-green-500 to-emerald-500',
    delay: 0.3
  },
  {
    icon: Calendar,
    title: 'Smart Calendar',
    description: 'Sync with Google, Outlook, and Apple calendars in real-time',
    color: 'from-orange-500 to-red-500',
    delay: 0.4
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share workspaces and collaborate in real-time',
    color: 'from-indigo-500 to-purple-500',
    delay: 0.5
  },
  {
    icon: Zap,
    title: 'Habit Tracking',
    description: 'Build better habits with streaks and behavioral insights',
    color: 'from-yellow-500 to-orange-500',
    delay: 0.6
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption and SOC 2 compliance',
    color: 'from-gray-500 to-blue-500',
    delay: 0.7
  },
  {
    icon: Sparkles,
    title: 'Template Marketplace',
    description: 'Start with proven productivity systems and templates',
    color: 'from-pink-500 to-purple-500',
    delay: 0.8
  }
];

const benefits = [
  { icon: CheckCircle2, text: 'Unlimited tasks and projects' },
  { icon: Brain, text: 'AI-powered natural language processing' },
  { icon: Users, text: 'Real-time collaboration' },
  { icon: TrendingUp, text: 'Advanced analytics and insights' },
  { icon: Heart, text: 'Priority support' },
  { icon: Globe, text: 'Custom integrations' },
  { icon: Smartphone, text: 'Offline mode with sync' },
  { icon: Lock, text: 'End-to-end encryption' }
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager at TechCorp",
    content: "Astral Chronos transformed how our team plans and executes projects. The AI suggestions are incredibly accurate.",
    avatar: "SC",
    rating: 5
  },
  {
    name: "Michael Rodriguez",
    role: "Freelance Designer",
    content: "Finally, a planner that understands my creative workflow. The time blocking feature is a game-changer.",
    avatar: "MR",
    rating: 5
  },
  {
    name: "Emily Johnson",
    role: "Startup Founder",
    content: "The goal hierarchy feature helped me break down our ambitious roadmap into manageable daily tasks.",
    avatar: "EJ",
    rating: 5
  }
];

const stats = [
  { value: "50K+", label: "Active Users" },
  { value: "2M+", label: "Tasks Completed" },
  { value: "98%", label: "User Satisfaction" },
  { value: "4.9★", label: "App Rating" }
];

export default function HomeClientEnhanced() {
  const router = useRouter();
  const { isCompleted, onboardingData, isClient } = useOnboarding();
  
  const handleGetStarted = () => {
    router.push('/login');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <EnhancedLayout
      variant="default"
      spacing="none"
      containerSize="full"
      showBackground={true}
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold gradient-text">Astral Chronos</span>
          </div>
          
          <div className="flex items-center gap-4">
            <EnhancedButton variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </EnhancedButton>
            <EnhancedButton variant="gradient" asChild>
              <Link href="/login">Get Started</Link>
            </EnhancedButton>
          </div>
        </div>
      }
    >
      {/* Hero Section */}
      <Section spacing="lg" className="py-24 text-center">
        <Container size="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mx-auto max-w-4xl space-y-8"
          >
            <div className="space-y-4">
              <Badge variant="outline" className="mx-auto mb-4">
                <Sparkles className="h-3 w-3 mr-1" />
                New: AI-Powered Scheduling
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="gradient-text">Plan Your Life</span>
                <br />with AI Precision
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                The world's most advanced digital planner that combines time blocking, 
                goal tracking, and habit formation with cutting-edge AI to help you 
                achieve more with less effort.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <EnhancedButton 
                size="xl" 
                variant="gradient" 
                onClick={handleGetStarted}
                rightIcon={<ArrowRight className="h-5 w-5" />}
                className="min-w-[200px]"
              >
                Start Planning Today
              </EnhancedButton>
              
              <EnhancedButton 
                size="xl" 
                variant="outline" 
                leftIcon={<Play className="h-5 w-5" />}
                asChild
              >
                <Link href="/login">Watch Demo</Link>
              </EnhancedButton>
            </div>
            
            {/* Trust indicators */}
            <div className="pt-8">
              <p className="text-sm text-muted-foreground mb-6">Trusted by 50,000+ professionals worldwide</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* Features Grid */}
      <Section title="Everything You Need to Succeed" description="Powerful features designed to make planning effortless and effective" spacing="lg" className="py-24">
        <Container>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card 
                  variant="elevated" 
                  interactive
                  className="h-full group hover:shadow-enhanced-xl transition-all duration-300 cursor-pointer"
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle size="lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* Benefits Section */}
      <Section className="py-24 bg-muted/50">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <Badge variant="outline">
                    Why Choose Astral Chronos?
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Transform Your <span className="gradient-text">Productivity</span>
                  </h2>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Join thousands of professionals who have revolutionized their 
                    productivity with our comprehensive planning system.
                  </p>
                </div>
                
                <div className="grid gap-4">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-background/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="h-4 w-4 text-success" />
                      </div>
                      <span className="font-medium">{benefit.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Card variant="gradient" className="p-8 text-center">
                <div className="space-y-6">
                  <div className="text-6xl font-bold gradient-text">98%</div>
                  <div>
                    <p className="text-2xl font-semibold mb-2">User Satisfaction Rate</p>
                    <p className="text-muted-foreground">Based on 10,000+ user reviews</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                    {stats.slice(0, 3).map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Testimonials */}
      <Section title="Loved by Professionals Worldwide" spacing="lg" className="py-24">
        <Container>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card variant="elevated" className="h-full p-6">
                  <CardContent noPadding className="space-y-4">
                    <div className="flex items-center gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    <blockquote className="text-muted-foreground italic leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section className="py-24">
        <Container size="sm">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card variant="gradient" className="p-12 text-center">
              <CardContent noPadding className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl font-bold">
                    Ready to Transform Your Productivity?
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Join thousands of professionals who have revolutionized their planning with Astral Chronos.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <EnhancedButton 
                    size="xl" 
                    variant="default" 
                    onClick={handleGetStarted}
                    rightIcon={<ArrowRight className="h-5 w-5" />}
                    className="min-w-[200px] bg-white text-primary hover:bg-white/90"
                  >
                    Start Free Trial
                  </EnhancedButton>
                  
                  <EnhancedButton 
                    size="xl" 
                    variant="outline" 
                    asChild
                    className="border-white/50 text-foreground hover:bg-white/10"
                  >
                    <Link href="/login">View Pricing</Link>
                  </EnhancedButton>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  No credit card required • 14-day free trial • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </Section>
    </EnhancedLayout>
  );
}