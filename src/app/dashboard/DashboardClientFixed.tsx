'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CheckCircle, Clock, TrendingUp, Target, Activity, Plus, BarChart3 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { MinimalErrorBoundary } from '@/components/ui/error-boundary';
import { AppHeader } from '@/components/layout/AppHeader';

// Interfaces
interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  color: string;
  description?: string;
}

interface Task {
  id: string;
  title: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  completed?: boolean;
}

interface Stats {
  tasksCompleted: number;
  goalsAchieved: number;
  habitsTracked: number;
  focusTime: number;
}

interface DashboardData {
  stats: Stats;
  upcomingTasks: Task[];
  recentAchievements: any[];
  weeklyProgress: any[];
}

export default function DashboardClientFixed() {
  const { user, loading } = useAuth();
  
  // State
  const [showLoadingState, setShowLoadingState] = useState(true);
  const [view, setView] = useState<'overview' | 'tasks' | 'calendar' | 'analytics'>('overview');
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    color: 'blue',
    description: ''
  });

  // Mock data
  const data: DashboardData = {
    stats: {
      tasksCompleted: 24,
      goalsAchieved: 3,
      habitsTracked: 15,
      focusTime: 180
    },
    upcomingTasks: [
      { id: '1', title: 'Complete project proposal', time: '9:00 AM', priority: 'high', dueDate: new Date().toISOString() },
      { id: '2', title: 'Review team feedback', time: '11:30 AM', priority: 'medium', dueDate: new Date().toISOString() },
      { id: '3', title: 'Client meeting prep', time: '2:00 PM', priority: 'high', dueDate: new Date().toISOString() }
    ],
    recentAchievements: [
      { id: 1, title: 'Completed 30-day fitness challenge', type: 'goal', date: '2 days ago' },
      { id: 2, title: 'Maintained reading habit for 2 weeks', type: 'habit', date: '5 days ago' }
    ],
    weeklyProgress: []
  };

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => setShowLoadingState(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Calendar functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      if (!prev) return new Date();
      return direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1);
    });
  };

  const calendarDays = useMemo(() => {
    if (!currentDate) return [];
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    return (events || []).filter(event => event?.date && isSameDay(event.date, date));
  };

  // Modal functions
  const openAddEventModal = (date?: Date) => {
    if (date) {
      setEventForm(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
    }
    setShowAddEventModal(true);
  };

  const closeAddEventModal = () => {
    setShowAddEventModal(false);
    setEventForm({
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      color: 'blue',
      description: ''
    });
  };

  const handleCreateEvent = () => {
    if (eventForm.title.trim()) {
      const newEvent: Event = {
        id: Date.now().toString(),
        title: eventForm.title,
        date: new Date(eventForm.date),
        time: eventForm.time,
        color: eventForm.color,
        description: eventForm.description
      };
      setEvents(prev => [...prev, newEvent]);
      closeAddEventModal();
    }
  };

  // Helper functions
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

  return (
    <MinimalErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Something went wrong. Please refresh the page.</p>
          </div>
        </div>
      }
    >
      <AppHeader />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {showLoadingState ? (
          <div className="container mx-auto px-4 py-8">
            {/* Loading skeleton */}
            <div className="mb-8">
              <div className="h-4 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-96 animate-pulse"></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : (
          <main className="container mx-auto px-4 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <div className="mb-4">
                <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                  <span>/</span>
                  <span className="text-foreground font-medium">Dashboard</span>
                </nav>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {getGreeting()}, {user?.firstName || 'there'}! {getEmoji()}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Here's what's happening with your goals today
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.stats?.tasksCompleted || 0}</div>
                  <p className="text-xs text-muted-foreground">+20% from last week</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Goals Achieved</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.stats?.goalsAchieved || 0}</div>
                  <p className="text-xs text-muted-foreground">+1 from last month</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Habits Tracked</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.stats?.habitsTracked || 0}</div>
                  <p className="text-xs text-muted-foreground">Active habits</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {`${Math.floor((data.stats?.focusTime || 0) / 60)}h ${(data.stats?.focusTime || 0) % 60}m`}
                  </div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={view} onValueChange={(value: any) => setView(value)} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Upcoming Tasks */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Upcoming Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.upcomingTasks?.map(task => (
                          <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className={`w-2 h-2 rounded-full ${
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} />
                            <div className="flex-1">
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-muted-foreground">{task.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Achievements */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Recent Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.recentAchievements?.map(achievement => (
                          <div key={achievement.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Target className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{achievement.title}</p>
                              <div className="text-xs text-gray-500">{achievement.date}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="tasks">
                <Card>
                  <CardHeader>
                    <CardTitle>Task Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Task management functionality coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar">
                <Card>
                  <CardHeader>
                    <CardTitle>Calendar View</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Calendar functionality coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Analytics functionality coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        )}

        {/* Add Event Modal */}
        {showAddEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeAddEventModal}
            />
            
            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
              <h3 className="text-xl font-bold mb-6">Add New Event</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Event Title</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="Enter event title..."
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Time</label>
                    <input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={closeAddEventModal}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent}>
                  Create Event
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MinimalErrorBoundary>
  );
}