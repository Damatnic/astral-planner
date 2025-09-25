'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Sun,
  Cloud,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuickCapture } from '@/components/quick-capture/QuickCapture';
import Link from 'next/link';
import { format } from 'date-fns';

interface DashboardData {
  stats: {
    tasksToday: number;
    tasksCompleted: number;
    focusTime: number;
    streakDays: number;
    weeklyProgress: number;
    productivityScore: number;
  };
  upcomingTasks: Array<{
    id: string;
    title: string;
    time: string;
    priority: string;
    dueDate?: string;
  }>;
  habits: Array<{
    id: string;
    name: string;
    completed: boolean;
    streak: number;
    category?: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    progress: number;
    dueDate?: string;
    current?: number;
    target?: number;
    completionPercentage: number;
  }>;
  loading: boolean;
  error?: string;
}

export default function DashboardClientFixed() {
  // Mock user for development without authentication
  const user = { id: 'test-user', firstName: 'Test', lastName: 'User' };
  const [view, setView] = useState('overview');
  
  // Use static data instead of fetching from APIs to avoid errors
  const [data, setData] = useState<DashboardData>({
    stats: {
      tasksToday: 5,
      tasksCompleted: 2,
      focusTime: 120,
      streakDays: 7,
      weeklyProgress: 40,
      productivityScore: 75
    },
    upcomingTasks: [
      { id: '1', title: 'Complete project proposal', time: '9:00 AM', priority: 'high', dueDate: new Date().toISOString() },
      { id: '2', title: 'Team meeting', time: '2:00 PM', priority: 'medium', dueDate: new Date().toISOString() },
      { id: '3', title: 'Review pull requests', time: '4:00 PM', priority: 'low', dueDate: new Date().toISOString() }
    ],
    habits: [
      { id: '1', name: 'Morning meditation', completed: true, streak: 7, category: 'wellness' },
      { id: '2', name: 'Read for 30 minutes', completed: false, streak: 3, category: 'learning' },
      { id: '3', name: 'Exercise', completed: true, streak: 14, category: 'health' },
      { id: '4', name: 'Journal', completed: false, streak: 2, category: 'mindfulness' }
    ],
    goals: [
      { id: '1', title: 'Launch new product', progress: 65, dueDate: 'Dec 31', current: 65, target: 100, completionPercentage: 65 },
      { id: '2', title: 'Learn TypeScript', progress: 80, dueDate: 'Nov 30', current: 8, target: 10, completionPercentage: 80 },
      { id: '3', title: 'Fitness goal', progress: 45, dueDate: 'Dec 15', current: 45, target: 100, completionPercentage: 45 }
    ],
    loading: false,
    error: undefined
  });
  
  const greeting = getGreeting();
  const currentDate = format(new Date(), 'EEEE, MMMM d');

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function getEmoji() {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 18) return '⛅';
    return '🌙';
  }

  async function handleQuickAdd(input: string) {
    console.log('Quick add:', input);
    // Placeholder for quick add functionality
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Ultimate Planner</span>
            </Link>
          </div>
          
          <nav className="flex items-center gap-4">
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

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold">
                {greeting}, {user?.firstName || 'there'}! {getEmoji()}
              </h1>
              <p className="text-muted-foreground mt-1">{currentDate}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Productivity Score</p>
                <p className="text-2xl font-bold text-primary">
                  {data.stats.productivityScore}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">
                  🔥 {data.stats.streakDays}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Capture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <QuickCapture onSubmit={handleQuickAdd} />
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.tasksCompleted}/{data.stats.tasksToday}
              </div>
              <Progress 
                value={(data.stats.tasksCompleted / data.stats.tasksToday) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(data.stats.focusTime / 60)}h {data.stats.focusTime % 60}m</div>
              <p className="text-xs text-muted-foreground mt-2">Today\'s focus</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.weeklyProgress}%</div>
              <Progress value={data.stats.weeklyProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.goals.length}</div>
              <p className="text-xs text-muted-foreground mt-2">In progress</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs value={view} onValueChange={setView} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Upcoming Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <CardDescription>Your tasks for today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.upcomingTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Circle className="h-4 w-4" />
                          <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.time}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4" asChild>
                    <Link href="/tasks">
                      View all tasks
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Daily Habits */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Habits</CardTitle>
                  <CardDescription>Track your daily routines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.habits.map(habit => (
                      <div key={habit.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {habit.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{habit.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {habit.streak} day streak
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant={habit.completed ? "secondary" : "outline"}>
                          {habit.completed ? "Done" : "Mark"}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4" asChild>
                    <Link href="/habits">
                      Manage habits
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Goal Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Goal Progress</CardTitle>
                  <CardDescription>Your active goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.goals.map(goal => (
                      <div key={goal.id}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{goal.title}</p>
                          <p className="text-sm text-muted-foreground">{goal.progress}%</p>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                        {goal.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1">Due {goal.dueDate}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4" asChild>
                    <Link href="/goals">
                      View all goals
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Insights
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on your patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-medium mb-2">Best Focus Time</h4>
                    <p className="text-sm text-muted-foreground">
                      You\'re most productive between 9-11 AM. Schedule important tasks during this window.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <h4 className="font-medium mb-2">Habit Suggestion</h4>
                    <p className="text-sm text-muted-foreground">
                      Consider adding a 5-minute break every hour to maintain energy levels.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Task Management</CardTitle>
                <CardDescription>All your tasks in one place</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Task management view coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Your calendar and timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Schedule view coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>Deep dive into your productivity</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Insights view coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getEmoji() {
  const hour = new Date().getHours();
  if (hour < 12) return '☀️';
  if (hour < 18) return '⛅';
  return '🌙';
}