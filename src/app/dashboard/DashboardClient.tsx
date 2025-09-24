'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { 
  Calendar,
  CheckCircle2,
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
import { TaskManager } from '@/features/tasks/TaskManager';
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

export default function DashboardPage() {
  const { user } = useUser();
  const [view, setView] = useState('overview');
  const [data, setData] = useState<DashboardData>({
    stats: {
      tasksToday: 0,
      tasksCompleted: 0,
      focusTime: 0,
      streakDays: 0,
      weeklyProgress: 0,
      productivityScore: 0
    },
    upcomingTasks: [],
    habits: [],
    goals: [],
    loading: true
  });
  
  const greeting = getGreeting();
  const currentDate = format(new Date(), 'EEEE, MMMM d');

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        setData(prev => ({ ...prev, loading: true }));

        // Fetch tasks for today
        const tasksResponse = await fetch('/api/tasks?status=todo&limit=10');
        const tasksData = await tasksResponse.json();
        
        // Fetch completed tasks for today
        const completedTasksResponse = await fetch('/api/tasks?status=completed&limit=50');
        const completedTasksData = await completedTasksResponse.json();
        
        // Fetch habits
        const habitsResponse = await fetch('/api/habits');
        const habitsData = await habitsResponse.json();
        
        // Fetch goals
        const goalsResponse = await fetch('/api/goals');
        const goalsData = await goalsResponse.json();

        // Process upcoming tasks
        const upcomingTasks = tasksData.tasks?.slice(0, 5).map((task: any) => ({
          id: task.id,
          title: task.title,
          time: task.dueDate ? format(new Date(task.dueDate), 'h:mm aa') : 'No time set',
          priority: task.priority || 'medium',
          dueDate: task.dueDate
        })) || [];

        // Process habits for today
        const todayHabits = habitsData.habits?.slice(0, 4).map((habit: any) => ({
          id: habit.id,
          name: habit.name,
          completed: habit.stats?.completedToday || false,
          streak: habit.currentStreak || 0,
          category: habit.category
        })) || [];

        // Process goals
        const activeGoals = goalsData.goals?.slice(0, 3).map((goal: any) => ({
          id: goal.id,
          title: goal.title,
          progress: Math.round(goal.completionPercentage || 0),
          dueDate: goal.targetDate ? format(new Date(goal.targetDate), 'MMM dd') : undefined,
          current: goal.currentValue,
          target: goal.targetValue,
          completionPercentage: goal.completionPercentage || 0
        })) || [];

        // Calculate stats
        const tasksToday = tasksData.tasks?.length || 0;
        const tasksCompletedToday = completedTasksData.tasks?.filter((task: any) => {
          const completedDate = new Date(task.completedAt || task.updatedAt);
          const today = new Date();
          return completedDate.toDateString() === today.toDateString();
        }).length || 0;

        const longestStreak = habitsData.stats?.longestStreak || 
          Math.max(...(habitsData.habits?.map((h: any) => h.bestStreak) || [0]));

        const avgCompletionRate = goalsData.stats?.averageCompletionRate || 0;

        setData({
          stats: {
            tasksToday,
            tasksCompleted: tasksCompletedToday,
            focusTime: 0, // Would come from time tracking
            streakDays: longestStreak,
            weeklyProgress: avgCompletionRate,
            productivityScore: Math.round((avgCompletionRate + (tasksCompletedToday / Math.max(tasksToday, 1)) * 100) / 2)
          },
          upcomingTasks,
          habits: todayHabits,
          goals: activeGoals,
          loading: false
        });

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data'
        }));
      }
    }

    fetchDashboardData();
  }, [user]);

  async function handleQuickAdd(input: string, type: string) {
    try {
      if (type === 'task') {
        // Get user's first workspace or create one
        const workspacesResponse = await fetch('/api/workspaces');
        const workspacesData = await workspacesResponse.json();
        const workspaceId = workspacesData.workspaces?.[0]?.id;
        
        if (!workspaceId) {
          console.error('No workspace found');
          return;
        }

        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: input,
            workspaceId,
            type: 'task',
            status: 'todo'
          })
        });
        
        if (response.ok) {
          // Refresh dashboard data
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Failed to create quick task:', error);
    }
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
                  {data.loading ? '...' : `${data.stats.productivityScore}%`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">
                  🔥 {data.loading ? '...' : data.stats.streakDays}
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
                {data.loading ? '...' : `${data.stats.tasksCompleted}/${data.stats.tasksToday}`}
              </div>
              <Progress 
                value={data.stats.tasksToday > 0 ? (data.stats.tasksCompleted / data.stats.tasksToday) * 100 : 0} 
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
              <div className="text-2xl font-bold">
                {data.loading ? '...' : `${data.stats.focusTime}h`}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Time tracking coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.loading ? '...' : `${Math.round(data.stats.weeklyProgress)}%`}
              </div>
              <Progress value={data.stats.weeklyProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.loading ? '...' : data.goals.length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {data.goals.filter(g => g.dueDate).length} due this month
              </p>
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
                  {data.loading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {data.upcomingTasks.length > 0 ? data.upcomingTasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-2 w-2 rounded-full ${
                                task.priority === 'high' ? 'bg-red-500' : 
                                task.priority === 'urgent' ? 'bg-red-600' :
                                task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                              }`} />
                              <div>
                                <p className="text-sm font-medium">{task.title}</p>
                                <p className="text-xs text-muted-foreground">{task.time}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/tasks/${task.id}`}>
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        )) : (
                          <p className="text-sm text-muted-foreground">No tasks for today. Great job! 🎉</p>
                        )}
                      </div>
                      <Button className="w-full mt-4" variant="outline" size="sm" asChild>
                        <Link href="/tasks">View All Tasks</Link>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Habits Tracker */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Habits</CardTitle>
                  <CardDescription>Track your daily routines</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.loading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {data.habits.length > 0 ? data.habits.map(habit => (
                          <div key={habit.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={habit.completed}
                                className="h-4 w-4 rounded"
                                readOnly
                              />
                              <div>
                                <p className="text-sm font-medium">{habit.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {habit.streak} day streak
                                </p>
                              </div>
                            </div>
                            {habit.streak > 5 && <span>🔥</span>}
                          </div>
                        )) : (
                          <p className="text-sm text-muted-foreground">No habits yet. Start building great routines! 💪</p>
                        )}
                      </div>
                      <Button className="w-full mt-4" variant="outline" size="sm" asChild>
                        <Link href="/habits">Manage Habits</Link>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Goals Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Goal Progress</CardTitle>
                  <CardDescription>Your active goals</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i}>
                          <div className="h-4 bg-muted rounded mb-2" />
                          <div className="h-2 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {data.goals.length > 0 ? data.goals.map(goal => (
                          <div key={goal.id}>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium">{goal.title}</p>
                              <span className="text-xs text-muted-foreground">
                                {goal.progress}%
                              </span>
                            </div>
                            <Progress value={goal.progress} className="h-2" />
                            {goal.dueDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Due: {goal.dueDate}
                              </p>
                            )}
                          </div>
                        )) : (
                          <p className="text-sm text-muted-foreground">No active goals. Set some ambitious targets! 🎯</p>
                        )}
                      </div>
                      <Button className="w-full mt-4" variant="outline" size="sm" asChild>
                        <Link href="/goals">View All Goals</Link>
                      </Button>
                    </>
                  )}
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
                      You're most productive between 9-11 AM. Schedule important tasks during this window.
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
            <TaskManager />
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Calendar view coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
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
  if (hour < 6) return '🌙';
  if (hour < 12) return '☀️';
  if (hour < 18) return '🌤️';
  if (hour < 21) return '🌅';
  return '🌙';
}