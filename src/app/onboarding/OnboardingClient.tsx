'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  User,
  Target,
  Calendar,
  Sparkles,
  CheckCircle,
  Briefcase,
  GraduationCap,
  Heart,
  Code,
  Palette,
  Trophy,
  Clock,
  BarChart3,
  Users,
  Zap,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Your Digital Planner',
    description: 'Let\'s set up your planning system in just a few steps'
  },
  {
    id: 'profile',
    title: 'Tell us about yourself',
    description: 'Help us personalize your experience'
  },
  {
    id: 'goals',
    title: 'What are your main goals?',
    description: 'We\'ll help you track and achieve them'
  },
  {
    id: 'planning-style',
    title: 'Choose your planning style',
    description: 'Select the approach that works best for you'
  },
  {
    id: 'features',
    title: 'Enable key features',
    description: 'Choose which features you want to use'
  },
  {
    id: 'complete',
    title: 'You\'re all set!',
    description: 'Your personalized planner is ready'
  }
];

const planningStyles = [
  {
    id: 'gtd',
    name: 'Getting Things Done (GTD)',
    description: 'Context-based task management with inbox processing',
    icon: CheckCircle
  },
  {
    id: 'time-blocking',
    name: 'Time Blocking',
    description: 'Schedule specific time slots for tasks and activities',
    icon: Clock
  },
  {
    id: 'kanban',
    name: 'Kanban Board',
    description: 'Visual workflow with columns for different stages',
    icon: BarChart3
  },
  {
    id: 'hybrid',
    name: 'Hybrid Approach',
    description: 'Combine multiple methods for maximum flexibility',
    icon: Sparkles
  }
];

const categories = [
  { id: 'work', name: 'Work & Career', icon: Briefcase },
  { id: 'education', name: 'Education', icon: GraduationCap },
  { id: 'personal', name: 'Personal Growth', icon: Heart },
  { id: 'health', name: 'Health & Fitness', icon: Trophy },
  { id: 'creative', name: 'Creative Projects', icon: Palette },
  { id: 'tech', name: 'Technology', icon: Code }
];

const features = [
  {
    id: 'ai-assistant',
    name: 'AI Planning Assistant',
    description: 'Natural language input and smart suggestions',
    icon: Brain,
    isPro: false
  },
  {
    id: 'calendar-sync',
    name: 'Calendar Sync',
    description: 'Sync with Google Calendar and Outlook',
    icon: Calendar,
    isPro: false
  },
  {
    id: 'collaboration',
    name: 'Team Collaboration',
    description: 'Share workspaces and work together',
    icon: Users,
    isPro: true
  },
  {
    id: 'analytics',
    name: 'Advanced Analytics',
    description: 'Detailed insights and productivity metrics',
    icon: BarChart3,
    isPro: true
  },
  {
    id: 'voice-input',
    name: 'Voice Commands',
    description: 'Add tasks and notes with voice input',
    icon: Zap,
    isPro: false
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    goals: [] as string[],
    categories: [] as string[],
    planningStyle: '',
    enabledFeatures: [] as string[]
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Save onboarding data
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="relative mx-auto h-32 w-32">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-purple-600 blur-xl opacity-50" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-purple-600">
                <Sparkles className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <div>
              <h1 className="text-4xl font-bold mb-4">Welcome to Your Digital Planner!</h1>
              <p className="text-xl text-muted-foreground max-w-md mx-auto">
                The most powerful planning system to organize your life and achieve your goals
              </p>
            </div>

            <div className="grid gap-4 max-w-md mx-auto text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">AI-Powered Planning</p>
                  <p className="text-sm text-muted-foreground">Natural language input and smart suggestions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Complete Task Management</p>
                  <p className="text-sm text-muted-foreground">Projects, goals, habits, and time blocking</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Real-time Collaboration</p>
                  <p className="text-sm text-muted-foreground">Work together with your team</p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'profile':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>What best describes you?</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <div className="grid gap-3">
                  {[
                    { value: 'professional', label: 'Working Professional' },
                    { value: 'student', label: 'Student' },
                    { value: 'entrepreneur', label: 'Entrepreneur' },
                    { value: 'freelancer', label: 'Freelancer' },
                    { value: 'other', label: 'Other' }
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="font-normal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </motion.div>
        );

      case 'goals':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Select the areas you want to focus on
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = formData.categories.includes(category.id);
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        const newCategories = isSelected
                          ? formData.categories.filter(c => c !== category.id)
                          : [...formData.categories, category.id];
                        setFormData({ ...formData, categories: newCategories });
                      }}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">What are your top 3 goals for this year?</Label>
              <textarea
                id="goals"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="1. Launch my startup&#10;2. Complete online course&#10;3. Run a marathon"
                onChange={(e) => setFormData({ ...formData, goals: e.target.value.split('\n').filter(g => g) })}
              />
            </div>
          </motion.div>
        );

      case 'planning-style':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {planningStyles.map((style) => {
              const Icon = style.icon;
              const isSelected = formData.planningStyle === style.id;
              
              return (
                <button
                  key={style.id}
                  onClick={() => setFormData({ ...formData, planningStyle: style.id })}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{style.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {style.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              );
            })}
          </motion.div>
        );

      case 'features':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              const isEnabled = formData.enabledFeatures.includes(feature.id);
              
              return (
                <div
                  key={feature.id}
                  className="flex items-start gap-3 p-4 rounded-lg border"
                >
                  <Checkbox
                    id={feature.id}
                    checked={isEnabled}
                    onCheckedChange={(checked) => {
                      const newFeatures = checked
                        ? [...formData.enabledFeatures, feature.id]
                        : formData.enabledFeatures.filter(f => f !== feature.id);
                      setFormData({ ...formData, enabledFeatures: newFeatures });
                    }}
                  />
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <label htmlFor={feature.id} className="font-medium cursor-pointer">
                      {feature.name}
                      {feature.isPro && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          PRO
                        </span>
                      )}
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="relative mx-auto h-32 w-32">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-purple-600 blur-xl opacity-50"
              />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-purple-600">
                <Trophy className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold mb-4">You're All Set!</h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Your personalized digital planner is ready. Let's start organizing and achieving your goals!
              </p>
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              <Button className="w-full" size="lg" onClick={handleComplete}>
                Go to Dashboard
              </Button>
              <Button variant="outline" className="w-full" size="lg">
                Take a Quick Tour
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}