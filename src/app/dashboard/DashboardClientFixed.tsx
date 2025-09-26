'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  ChevronLeft,
  Sparkles,
  Sun,
  Cloud,
  Activity,
  X,
  Save,
  Palette
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuickCapture } from '@/components/quick-capture/QuickCapture';
import PhysicalPlannerView from '../planner/PhysicalPlannerView';
import { PresenceIndicator } from '@/components/realtime/PresenceIndicator';
import { ActivityFeed } from '@/components/realtime/ActivityFeed';
import Link from 'next/link';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  color: string;
  description?: string;
}

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

// Mock user for development without authentication (moved outside component to prevent recreating on every render)
const MOCK_USER = { id: 'test-user', firstName: 'Test', lastName: 'User' };

export default function DashboardClientFixed() {
  const router = useRouter();
  const { isCompleted, onboardingData, isClient } = useOnboarding();
  
  // Check if onboarding is completed, redirect if not
  useEffect(() => {
    if (isClient && isCompleted === false) {
      router.push('/onboarding');
    }
  }, [isCompleted, router, isClient]);
  
  // Mock user for development without authentication
  const user = MOCK_USER;
  const [view, setView] = useState('overview');
  
  // Show loading while checking onboarding status or during hydration
  if (!isClient || isCompleted === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Calendar state management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  
  // Modal state management
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '9:00 AM',
    color: 'blue',
    description: ''
  });
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Team Meeting',
      date: new Date(2024, 11, 5),
      time: '9:00 AM',
      color: 'blue',
      description: 'Weekly team sync'
    },
    {
      id: '2',
      title: 'Project Review',
      date: new Date(2024, 11, 12),
      time: '2:00 PM',
      color: 'green',
      description: 'Review project progress'
    },
    {
      id: '3',
      title: 'Client Call',
      date: new Date(2024, 11, 18),
      time: '10:00 AM',
      color: 'purple',
      description: 'Call with client'
    },
    {
      id: '4',
      title: 'Lunch Meeting',
      date: new Date(2024, 11, 25),
      time: '12:00 PM',
      color: 'orange',
      description: 'Business lunch'
    }
  ]);
  
  // Calendar helper functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const addEvent = (title: string, date: Date, time: string, color: string) => {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title,
      date,
      time,
      color,
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const removeEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events
      .filter(event => event.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4);
  };

  // Modal handling functions
  const openAddEventModal = (date?: Date) => {
    const defaultDate = date || selectedDate || new Date();
    setEventForm({
      title: '',
      date: format(defaultDate, 'yyyy-MM-dd'),
      time: '9:00 AM',
      color: 'blue',
      description: ''
    });
    setShowAddEventModal(true);
  };

  const closeAddEventModal = () => {
    setShowAddEventModal(false);
    setEventForm({
      title: '',
      date: '',
      time: '9:00 AM',
      color: 'blue',
      description: ''
    });
  };

  const handleEventSubmit = () => {
    if (eventForm.title && eventForm.date && eventForm.time) {
      const eventDate = new Date(eventForm.date);
      addEvent(eventForm.title, eventDate, eventForm.time, eventForm.color);
      closeAddEventModal();
    }
  };
  
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
  const todayFormatted = format(new Date(), 'EEEE, MMMM d');

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
              <span className="text-lg font-bold">Astral Chronos</span>
            </Link>
          </div>
          
          <nav className="flex items-center gap-4">
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
              <Link href="/planner">📝 Physical Planner</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/analytics">Analytics</Link>
            </Button>
            <PresenceIndicator className="ml-4" />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          {/* Breadcrumb */}
          <div className="mb-4">
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <span className="text-foreground font-medium">Dashboard</span>
              {view !== 'overview' && (
                <>
                  <span>/</span>
                  <span className="text-foreground font-medium capitalize">{view}</span>
                </>
              )}
            </nav>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold">
                {greeting}, {user?.firstName || 'there'}! {getEmoji()}
              </h1>
              <p className="text-muted-foreground mt-1">{todayFormatted}</p>
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
          <div className="sticky top-16 z-30 bg-background/95 backdrop-blur py-2 -mx-4 px-4 border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="planner">Physical Planner</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

              {/* Activity Feed */}
              <ActivityFeed 
                workspaceId="default-workspace"
                limit={10}
                compact={true}
                showHeader={true}
                className="h-fit"
              />

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
                <div className="space-y-4">
                  {/* Quick Add Task */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a new task..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          // Add to static data
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Add Task
                    </button>
                  </div>

                  {/* Task List */}
                  <div className="space-y-2">
                    {[
                      { id: '1', text: 'Complete project proposal', done: true },
                      { id: '2', text: 'Review team feedback', done: false },
                      { id: '3', text: 'Update website content', done: false },
                      { id: '4', text: 'Plan next quarter goals', done: false }
                    ].map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className={`flex-1 ${task.done ? 'line-through text-gray-400' : ''}`}>
                          {task.text}
                        </span>
                        <button className="text-red-500 hover:text-red-700">
                          <span className="text-sm">Delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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
                <div className="space-y-6">
                  {/* Time Slots */}
                  <div className="space-y-3">
                    {[
                      { time: '9:00 AM', event: 'Team meeting - Project review', color: 'bg-blue-100 border-blue-300' },
                      { time: '11:00 AM', event: '', color: 'bg-gray-50 border-gray-200' },
                      { time: '1:00 PM', event: 'Lunch with Sarah', color: 'bg-green-100 border-green-300' },
                      { time: '3:00 PM', event: '', color: 'bg-gray-50 border-gray-200' },
                      { time: '5:00 PM', event: '', color: 'bg-gray-50 border-gray-200' }
                    ].map((slot, index) => (
                      <div key={index} className={`flex items-center gap-4 p-3 border-2 rounded-lg ${slot.color}`}>
                        <span className="text-sm font-medium text-gray-600 w-20">{slot.time}</span>
                        <div className="flex-1">
                          {slot.event ? (
                            <span className="text-sm font-medium">{slot.event}</span>
                          ) : (
                            <input
                              type="text"
                              placeholder="Add event..."
                              className="w-full bg-transparent border-none outline-none placeholder:text-gray-400"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                      Add Meeting
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                      Block Time
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                      Set Reminder
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Calendar */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          Calendar View
                        </CardTitle>
                        <CardDescription>Full calendar with events and scheduling</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium min-w-[120px] text-center">
                          {format(currentDate, 'MMMM yyyy')}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Calendar Header */}
                      <div className="grid grid-cols-7 gap-1">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                          <div key={day} className="p-3 text-center font-semibold text-sm text-muted-foreground border-b">
                            {day.slice(0, 3)}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {getCalendarDays().map((date, i) => {
                          const dayEvents = getEventsForDate(date);
                          const isCurrentMonthDay = isSameMonth(date, currentDate);
                          const isTodayDate = isToday(date);
                          const isSelectedDate = selectedDate && isSameDay(date, selectedDate);
                          
                          return (
                            <div
                              key={i}
                              onClick={() => setSelectedDate(date)}
                              onDoubleClick={() => openAddEventModal(date)}
                              className={`min-h-[80px] p-2 border border-gray-200 cursor-pointer transition-colors hover:bg-gray-50 ${
                                !isCurrentMonthDay ? 'bg-gray-50 text-gray-400' : 'bg-white text-gray-800'
                              } ${isTodayDate ? 'bg-blue-100 border-blue-300 font-bold text-blue-600' : ''} ${
                                isSelectedDate ? 'ring-2 ring-primary' : ''
                              }`}
                            >
                              <div className="text-sm font-medium">
                                {format(date, 'd')}
                              </div>
                              {dayEvents.length > 0 && (
                                <div className="mt-1 space-y-1">
                                  {dayEvents.slice(0, 2).map((event) => (
                                    <div
                                      key={event.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete "${event.title}"?`)) {
                                          removeEvent(event.id);
                                        }
                                      }}
                                      className={`text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 ${
                                        event.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                        event.color === 'green' ? 'bg-green-100 text-green-700' :
                                        event.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                                        event.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                        event.color === 'red' ? 'bg-red-100 text-red-700' :
                                        event.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      {event.title}
                                    </div>
                                  ))}
                                  {dayEvents.length > 2 && (
                                    <div className="text-xs text-gray-500">
                                      +{dayEvents.length - 2} more
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Mini Calendar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Navigation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                          <div key={day} className="p-1 text-center font-medium text-muted-foreground">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {getCalendarDays().slice(0, 35).map((date, i) => {
                          const isCurrentMonthDay = isSameMonth(date, currentDate);
                          const isTodayDate = isToday(date);
                          const isSelectedDate = selectedDate && isSameDay(date, selectedDate);
                          
                          return (
                            <div
                              key={i}
                              onClick={() => setSelectedDate(date)}
                              className={`h-6 flex items-center justify-center text-xs cursor-pointer rounded hover:bg-gray-100 ${
                                !isCurrentMonthDay ? 'text-gray-400' : 'text-gray-800'
                              } ${isTodayDate ? 'bg-blue-600 text-white hover:bg-blue-700' : ''} ${
                                isSelectedDate ? 'ring-1 ring-primary' : ''
                              }`}
                            >
                              {format(date, 'd')}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getUpcomingEvents().map((event, i) => (
                        <div key={i} className={`border-l-4 ${
                          event.color === 'blue' ? 'border-l-blue-500' :
                          event.color === 'green' ? 'border-l-green-500' :
                          event.color === 'purple' ? 'border-l-purple-500' :
                          event.color === 'orange' ? 'border-l-orange-500' :
                          event.color === 'red' ? 'border-l-red-500' :
                          event.color === 'yellow' ? 'border-l-yellow-500' :
                          'border-l-gray-500'
                        } pl-3 py-2`}>
                          <div className="text-sm font-medium">{event.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(event.date, 'MMM d')} at {event.time}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full mt-4" 
                      size="sm"
                      onClick={() => openAddEventModal()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </CardContent>
                </Card>

                {/* Calendar Views */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">View Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button 
                        variant={calendarView === 'month' ? 'outline' : 'ghost'} 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => setCalendarView('month')}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Month View
                      </Button>
                      <Button 
                        variant={calendarView === 'week' ? 'outline' : 'ghost'} 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => setCalendarView('week')}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Week View
                      </Button>
                      <Button 
                        variant={calendarView === 'day' ? 'outline' : 'ghost'} 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => setCalendarView('day')}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Day View
                      </Button>
                      <Button 
                        variant={calendarView === 'agenda' ? 'outline' : 'ghost'} 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => setCalendarView('agenda')}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Agenda View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="planner" className="p-0 mt-4">
            {/* Planner Controls */}
            <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-t-lg border border-b-0 shadow-sm">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Physical Planner</h2>
                <div className="text-sm text-gray-500">
                  Click and drag to interact • Use toolbar for customization
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('overview')}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  ← Back to Overview
                </button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/planner">
                    Open Full Screen
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="h-[75vh] max-h-[900px] min-h-[600px] rounded-b-lg overflow-hidden border border-t-0 shadow-lg bg-white">
              <PhysicalPlannerView />
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>Deep dive into your productivity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Productivity Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">87%</div>
                      <div className="text-sm text-gray-600">Task Completion Rate</div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">6.2h</div>
                      <div className="text-sm text-gray-600">Daily Focus Time</div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">23</div>
                      <div className="text-sm text-gray-600">Days Streak</div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">4.8</div>
                      <div className="text-sm text-gray-600">Productivity Score</div>
                    </div>
                  </div>

                  {/* Weekly Progress Chart */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium mb-3">Weekly Progress</h4>
                    <div className="flex items-end gap-2 h-32">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                        const heights = [60, 80, 45, 90, 70, 40, 55];
                        return (
                          <div key={day} className="flex-1 flex flex-col items-center gap-2">
                            <div 
                              className="w-full bg-blue-500 rounded-t"
                              style={{ height: `${heights[i]}%` }}
                            ></div>
                            <span className="text-xs text-gray-600">{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Achievements */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Achievements</h4>
                    <div className="space-y-2">
                      {[
                        { icon: '🏆', text: 'Completed 10 tasks in a day', date: '2 days ago' },
                        { icon: '🔥', text: '7-day productivity streak', date: '1 week ago' },
                        { icon: '⭐', text: 'Finished major project ahead of schedule', date: '2 weeks ago' }
                      ].map((achievement, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-2xl">{achievement.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{achievement.text}</div>
                            <div className="text-xs text-gray-500">{achievement.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Beautiful Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeAddEventModal}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Create Event</h3>
                    <p className="text-blue-100 text-sm">Add a new event to your calendar</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeAddEventModal}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Enter event title..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 transition-all"
                />
              </div>

              {/* Date and Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time *
                  </label>
                  <select
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  >
                    <option value="8:00 AM">8:00 AM</option>
                    <option value="9:00 AM">9:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="1:00 PM">1:00 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="3:00 PM">3:00 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                    <option value="5:00 PM">5:00 PM</option>
                    <option value="6:00 PM">6:00 PM</option>
                    <option value="7:00 PM">7:00 PM</option>
                    <option value="8:00 PM">8:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Event Color
                </label>
                <div className="flex gap-3">
                  {[
                    { name: 'blue', color: 'bg-blue-500', ring: 'ring-blue-500' },
                    { name: 'green', color: 'bg-green-500', ring: 'ring-green-500' },
                    { name: 'purple', color: 'bg-purple-500', ring: 'ring-purple-500' },
                    { name: 'orange', color: 'bg-orange-500', ring: 'ring-orange-500' },
                    { name: 'red', color: 'bg-red-500', ring: 'ring-red-500' },
                    { name: 'yellow', color: 'bg-yellow-500', ring: 'ring-yellow-500' }
                  ].map((colorOption) => (
                    <button
                      key={colorOption.name}
                      type="button"
                      onClick={() => setEventForm({ ...eventForm, color: colorOption.name })}
                      className={`w-8 h-8 rounded-full ${colorOption.color} transition-all hover:scale-110 ${
                        eventForm.color === colorOption.name
                          ? `ring-4 ${colorOption.ring} ring-offset-2`
                          : 'hover:ring-2 hover:ring-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Add event description..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 resize-none transition-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={closeAddEventModal}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEventSubmit}
                disabled={!eventForm.title || !eventForm.date}
                className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                <Save className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          </motion.div>
        </div>
      )}
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