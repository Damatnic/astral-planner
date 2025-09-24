'use client';

import { useState } from 'react';
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

// Mock data - would come from API
const stats = {
  tasksToday: 8,
  tasksCompleted: 5,
  focusTime: 3.5,
  streakDays: 12,
  weeklyProgress: 68,
  productivityScore: 85
};

const upcomingTasks = [
  { id: '1', title: 'Team meeting', time: '10:00 AM', priority: 'high' },
  { id: '2', title: 'Review project proposal', time: '2:00 PM', priority: 'medium' },
  { id: '3', title: 'Call with client', time: '4:00 PM', priority: 'high' }
];

const habits = [
  { id: '1', name: 'Morning meditation', completed: true, streak: 12 },
  { id: '2', name: 'Read for 30 mins', completed: false, streak: 5 },
  { id: '3', name: 'Exercise', completed: true, streak: 8 },
  { id: '4', name: 'Journaling', completed: false, streak: 3 }
];

const goals = [
  { id: '1', title: 'Complete React course', progress: 75, dueDate: 'Dec 31' },
  { id: '2', title: 'Launch side project', progress: 45, dueDate: 'Jan 15' },
  { id: '3', title: 'Read 12 books', progress: 58, current: 7, target: 12 }
];

export default function DashboardPage() {
  const { user } = useUser();
  const [view, setView] = useState('overview');
  
  const greeting = getGreeting();
  const currentDate = format(new Date(), 'EEEE, MMMM d');

  async function handleQuickAdd(input: string, type: string) {
    // Handle quick task creation
    console.log('Quick add:', { input, type });
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
                <p className="text-2xl font-bold text-primary">{stats.productivityScore}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">🔥 {stats.streakDays}</p>
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
              <div className="text-2xl font-bold">{stats.tasksCompleted}/{stats.tasksToday}</div>
              <Progress value={(stats.tasksCompleted / stats.tasksToday) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.focusTime}h</div>
              <p className="text-xs text-muted-foreground mt-2">+20% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weeklyProgress}%</div>
              <Progress value={stats.weeklyProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goals.length}</div>
              <p className="text-xs text-muted-foreground mt-2">2 due this month</p>
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
                    {upcomingTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${
                            task.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.time}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline" size="sm">
                    View All Tasks
                  </Button>
                </CardContent>
              </Card>

              {/* Habits Tracker */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Habits</CardTitle>
                  <CardDescription>Track your daily routines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {habits.map(habit => (
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
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline" size="sm">
                    Manage Habits
                  </Button>
                </CardContent>
              </Card>

              {/* Goals Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Goal Progress</CardTitle>
                  <CardDescription>Your active goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {goals.map(goal => (
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
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline" size="sm">
                    View All Goals
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