'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/hooks/use-onboarding';
import { 
  Calendar,
  CheckCircle2,
  Circle,
  Target,
  TrendingUp,
  Clock,
  BarChart3,
  Plus,
  ChevronRight,
  Sparkles,
  Activity,
  Zap,
  Trophy,
  Star,
  Filter,
  Search,
  Bell,
  Settings,
  MoreHorizontal
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { QuickCapture } from '@/components/quick-capture/QuickCapture';
import { EnhancedLayout, PageHeader, Section, Container, QuickAction } from '@/components/layout/enhanced-layout';
import { Loading, StateLoading } from '@/components/ui/enhanced-loading';
import { SkeletonCard, SkeletonList } from '@/components/ui/enhanced-skeleton';
import { toast } from '@/components/ui/enhanced-toast';
import Link from 'next/link';

interface DashboardData {
  stats: {
    tasksToday: number;
    tasksCompleted: number;
    focusTime: number;
    streakDays: number;
    weeklyProgress: number;
    productivityScore: number;
    goalProgress: number;
    habitStreak: number;
  };
  upcomingTasks: Array<{
    id: string;
    title: string;
    time: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
    category: string;
    completed: boolean;
  }>;
  habits: Array<{
    id: string;
    name: string;
    completed: boolean;
    streak: number;
    category?: string;
    target: number;
    current: number;
  }>;
  goals: Array<{
    id: string;
    title: string;
    progress: number;
    dueDate?: string;
    category: string;
    milestone: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'task_completed' | 'habit_tracked' | 'goal_updated' | 'milestone_reached';
    message: string;
    timestamp: string;
    icon: string;
  }>;
  insights: Array<{
    id: string;
    type: 'tip' | 'achievement' | 'suggestion';
    title: string;
    description: string;
    action?: string;
  }>;
}

const MOCK_USER = { id: 'test-user', firstName: 'Alex', lastName: 'Chen' };

export default function DashboardEnhanced() {
  const router = useRouter();
  const { isCompleted, onboardingData, isClient } = useOnboarding();
  const [view, setView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const user = MOCK_USER;
  
  // Check if onboarding is completed
  useEffect(() => {
    if (isClient && isCompleted === false) {
      router.push('/onboarding');
    }
    
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [isCompleted, router, isClient]);
  
  const [data] = useState<DashboardData>({
    stats: {
      tasksToday: 8,
      tasksCompleted: 5,
      focusTime: 180,
      streakDays: 12,
      weeklyProgress: 68,
      productivityScore: 85,
      goalProgress: 72,
      habitStreak: 15
    },
    upcomingTasks: [
      { 
        id: '1', 
        title: 'Complete quarterly review presentation', 
        time: '9:00 AM', 
        priority: 'high', 
        category: 'Work',
        completed: false
      },
      { 
        id: '2', 
        title: 'Team standup meeting', 
        time: '2:00 PM', 
        priority: 'medium', 
        category: 'Meetings',
        completed: false
      },
      { 
        id: '3', 
        title: 'Review pull requests', 
        time: '4:00 PM', 
        priority: 'low', 
        category: 'Development',
        completed: true
      },
      { 
        id: '4', 
        title: 'Plan weekend trip', 
        time: '6:00 PM', 
        priority: 'low', 
        category: 'Personal',
        completed: false
      }
    ],
    habits: [
      { id: '1', name: 'Morning meditation', completed: true, streak: 12, category: 'wellness', target: 1, current: 1 },
      { id: '2', name: 'Read for 30 minutes', completed: false, streak: 8, category: 'learning', target: 30, current: 0 },
      { id: '3', name: 'Exercise', completed: true, streak: 15, category: 'health', target: 60, current: 45 },
      { id: '4', name: 'Journal writing', completed: false, streak: 5, category: 'mindfulness', target: 1, current: 0 },
      { id: '5', name: 'Drink 8 glasses of water', completed: true, streak: 20, category: 'health', target: 8, current: 6 }
    ],
    goals: [
      { id: '1', title: 'Launch new product', progress: 75, dueDate: 'Dec 31', category: 'Work', milestone: 'Beta testing complete' },
      { id: '2', title: 'Learn TypeScript', progress: 60, dueDate: 'Nov 30', category: 'Learning', milestone: 'Build first project' },
      { id: '3', title: 'Run a marathon', progress: 40, dueDate: 'Mar 15', category: 'Health', milestone: 'Complete 15km run' },
      { id: '4', title: 'Write a book', progress: 25, dueDate: 'Jun 30', category: 'Personal', milestone: 'Finish outline' }
    ],
    recentActivity: [
      { id: '1', type: 'task_completed', message: 'Completed "Review pull requests"', timestamp: '2 hours ago', icon: '✅' },
      { id: '2', type: 'habit_tracked', message: 'Logged morning meditation', timestamp: '4 hours ago', icon: '🧘' },
      { id: '3', type: 'milestone_reached', message: 'Reached 75% on product launch goal', timestamp: '1 day ago', icon: '🎯' },
      { id: '4', type: 'goal_updated', message: 'Updated TypeScript learning progress', timestamp: '2 days ago', icon: '📚' }
    ],
    insights: [
      {
        id: '1',
        type: 'tip',
        title: 'Peak Performance Window',
        description: 'You\'re most productive between 9-11 AM. Schedule important tasks during this time.',
        action: 'Optimize Schedule'
      },
      {
        id: '2',
        type: 'achievement',
        title: 'Consistency Champion',
        description: 'You\'ve maintained a 12-day streak! Your habits are becoming second nature.',
        action: 'View Streaks'
      },
      {
        id: '3',
        type: 'suggestion',
        title: 'Break Reminder',
        description: 'Consider adding 5-minute breaks every hour to maintain energy levels.',
        action: 'Set Reminders'
      }
    ]
  });
  
  const greeting = getGreeting();
  const todayFormatted = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  const handleQuickAdd = async (input: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Task added successfully!', `"${input}" has been added to your tasks.`);
    } catch (error) {
      toast.error('Failed to add task', 'Please try again.');
    }
  };

  const quickActions = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: "Add Task",
      onClick: () => toast.info('Quick add', 'Task creation dialog would open here')
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "New Event",
      onClick: () => toast.info('Calendar', 'Event creation dialog would open here')
    },
    {
      icon: <Target className="h-5 w-5" />,
      label: "Create Goal",
      onClick: () => router.push('/goals')
    }
  ];

  if (!isClient || isCompleted === null) {
    return (
      <EnhancedLayout>
        <Loading fullScreen message="Loading your dashboard..." />
      </EnhancedLayout>
    );
  }

  return (
    <EnhancedLayout
      variant="default"
      containerSize="full"
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold gradient-text">Astral Chronos</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-2">
            <EnhancedButton variant="ghost" size="sm" asChild>
              <Link href="/calendar">Calendar</Link>
            </EnhancedButton>
            <EnhancedButton variant="ghost" size="sm" asChild>
              <Link href="/goals">Goals</Link>
            </EnhancedButton>
            <EnhancedButton variant="ghost" size="sm" asChild>
              <Link href="/habits">Habits</Link>
            </EnhancedButton>
            <EnhancedButton variant="ghost" size="sm" asChild>
              <Link href="/analytics">Analytics</Link>
            </EnhancedButton>
          </nav>
          
          <div className="flex items-center gap-2">
            <EnhancedButton variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </EnhancedButton>
            <EnhancedButton variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </EnhancedButton>
            <EnhancedButton variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </EnhancedButton>
          </div>
        </div>
      }
    >
      <Container className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PageHeader
            title={`${greeting}, ${user?.firstName || 'there'}! 👋`}
            description={todayFormatted}
            size="lg"
            action={
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Productivity Score</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold gradient-text">
                      {data.stats.productivityScore}%
                    </p>
                    <Badge variant="secondary">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +5%
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    🔥 {data.stats.streakDays}
                  </p>
                </div>
              </div>
            }
          />
        </motion.div>

        {/* Quick Capture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <QuickCapture onSubmit={handleQuickAdd} />
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card variant="elevated" interactive className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground group-hover:text-success transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.stats.tasksCompleted}/{data.stats.tasksToday}
                </div>
                <Progress 
                  value={(data.stats.tasksCompleted / data.stats.tasksToday) * 100} 
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {data.stats.tasksToday - data.stats.tasksCompleted} remaining
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" interactive className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.floor(data.stats.focusTime / 60)}h {data.stats.focusTime % 60}m
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={75} className="flex-1" />
                  <Badge variant="outline" className="text-xs">
                    Goal: 4h
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {240 - data.stats.focusTime} min to goal
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" interactive className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-info transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.weeklyProgress}%</div>
                <Progress value={data.stats.weeklyProgress} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Ahead of last week by 12%
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" interactive className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground group-hover:text-warning transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.goals.length}</div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="text-sm text-muted-foreground">
                    Avg. progress: {Math.round(data.goals.reduce((acc, goal) => acc + goal.progress, 0) / data.goals.length)}%
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  2 due this month
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs value={view} onValueChange={setView} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-auto grid-cols-4 lg:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="habits">Habits</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="analytics" className="hidden lg:flex">Analytics</TabsTrigger>
              <TabsTrigger value="insights" className="hidden lg:flex">Insights</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <EnhancedButton variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </EnhancedButton>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <TabsContent value="overview" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 lg:grid-cols-3"
              >
                {/* Upcoming Tasks */}
                <Card variant="elevated">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Upcoming Tasks</CardTitle>
                        <CardDescription>Your tasks for today</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {data.upcomingTasks.filter(t => !t.completed).length} pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <SkeletonList items={3} showAvatar={false} />
                    ) : (
                      <div className="space-y-3">
                        {data.upcomingTasks.slice(0, 4).map(task => (
                          <motion.div 
                            key={task.id} 
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {task.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-muted-foreground">{task.time}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {task.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                              {task.priority}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    <EnhancedButton variant="ghost" className="w-full mt-4" asChild>
                      <Link href="/tasks">
                        View all tasks
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </EnhancedButton>
                  </CardContent>
                </Card>

                {/* Daily Habits */}
                <Card variant="elevated">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Daily Habits</CardTitle>
                        <CardDescription>Track your daily routines</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {data.habits.filter(h => h.completed).length}/{data.habits.length} done
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <SkeletonList items={4} showAvatar={false} />
                    ) : (
                      <div className="space-y-3">
                        {data.habits.map(habit => (
                          <motion.div 
                            key={habit.id} 
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {habit.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{habit.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    🔥 {habit.streak} day streak
                                  </p>
                                  {habit.current > 0 && habit.target > 1 && (
                                    <Badge variant="outline" className="text-xs">
                                      {habit.current}/{habit.target}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <EnhancedButton 
                              size="sm" 
                              variant={habit.completed ? "secondary" : "outline"}
                              onClick={() => {
                                const action = habit.completed ? 'unmarked' : 'marked';
                                toast.success(`Habit ${action}!`, `${habit.name} has been ${action} as ${habit.completed ? 'incomplete' : 'complete'}.`);
                              }}
                            >
                              {habit.completed ? "Done" : "Mark"}
                            </EnhancedButton>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    <EnhancedButton variant="ghost" className="w-full mt-4" asChild>
                      <Link href="/habits">
                        Manage habits
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </EnhancedButton>
                  </CardContent>
                </Card>

                {/* Goal Progress & Activity */}
                <div className="space-y-6">
                  {/* Goal Progress */}
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle>Goal Progress</CardTitle>
                      <CardDescription>Your active goals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <SkeletonList items={3} showAvatar={false} />
                      ) : (
                        <div className="space-y-4">
                          {data.goals.slice(0, 3).map(goal => (
                            <div key={goal.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{goal.title}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-muted-foreground">{goal.progress}%</p>
                                  {goal.progress >= 75 && (
                                    <Star className="h-3 w-3 text-yellow-500" />
                                  )}
                                </div>
                              </div>
                              <Progress value={goal.progress} className="h-2" />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{goal.milestone}</span>
                                {goal.dueDate && <span>Due {goal.dueDate}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <EnhancedButton variant="ghost" className="w-full mt-4" asChild>
                        <Link href="/goals">
                          View all goals
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </EnhancedButton>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Your latest accomplishments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.recentActivity.slice(0, 4).map(activity => (
                          <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                              {activity.icon}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{activity.message}</p>
                              <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>

              {/* AI Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card variant="gradient">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI Insights & Recommendations
                    </CardTitle>
                    <CardDescription>
                      Personalized recommendations based on your patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {data.insights.map(insight => (
                        <motion.div
                          key={insight.id}
                          className={`p-4 rounded-lg border ${
                            insight.type === 'tip' ? 'border-primary/20 bg-primary/5' :
                            insight.type === 'achievement' ? 'border-success/20 bg-success/5' :
                            'border-info/20 bg-info/5'
                          }`}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{insight.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {insight.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {insight.description}
                          </p>
                          {insight.action && (
                            <EnhancedButton 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => toast.info('Action clicked', `${insight.action} feature would be triggered.`)}
                            >
                              {insight.action}
                            </EnhancedButton>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Other tab contents would go here */}
            <TabsContent value="tasks">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Task Management</CardTitle>
                  <CardDescription>All your tasks in one place</CardDescription>
                </CardHeader>
                <CardContent>
                  <StateLoading 
                    state="loading" 
                    loadingMessage="Building your task view..." 
                    size="lg"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="habits">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Habit Tracking</CardTitle>
                  <CardDescription>Build better habits with smart tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <StateLoading 
                    state="loading" 
                    loadingMessage="Loading your habits..." 
                    size="lg"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Goals & Milestones</CardTitle>
                  <CardDescription>Track progress towards your long-term objectives</CardDescription>
                </CardHeader>
                <CardContent>
                  <StateLoading 
                    state="loading" 
                    loadingMessage="Loading your goals..." 
                    size="lg"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </Container>
      
      {/* Quick Action FAB */}
      <QuickAction actions={quickActions} position="bottom-right" />
    </EnhancedLayout>
  );
}