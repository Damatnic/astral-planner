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
            <p className="text-purple-300/70">Something went wrong. Please refresh the page.</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse [animation-delay:0.5s]"></div>
        </div>

        <AppHeader />
        {showLoadingState ? (
          <div className="container mx-auto px-4 py-8 relative z-10">
            {/* Loading skeleton */}
            <div className="mb-8">
              <div className="h-4 bg-purple-800/30 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-8 bg-purple-800/30 rounded w-96 animate-pulse"></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-purple-800/30 rounded-lg animate-pulse"></div>
              ))}
            </div>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-purple-300/70">Loading your cosmic dashboard...</p>
            </div>
          </div>
        ) : (
          <main className="container mx-auto px-4 py-8 relative z-10">
            {/* Welcome Section */}
            <div className="mb-8">
              <div className="mb-4">
                <nav className="flex items-center space-x-2 text-sm text-purple-300/70">
                  <Link href="/" className="hover:text-purple-200 transition-colors">Home</Link>
                  <span>/</span>
                  <span className="text-purple-100 font-medium">Dashboard</span>
                </nav>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                    {getGreeting()}, {user?.firstName || 'there'}! {getEmoji()}
                  </h1>
                  <p className="text-purple-300/70">
                    Here's what's happening with your goals today
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">Tasks Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-100">{data.stats?.tasksCompleted || 0}</div>
                  <p className="text-xs text-purple-300/70">+20% from last week</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">Goals Achieved</CardTitle>
                  <Target className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-100">{data.stats?.goalsAchieved || 0}</div>
                  <p className="text-xs text-purple-300/70">+1 from last month</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">Habits Tracked</CardTitle>
                  <Activity className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-100">{data.stats?.habitsTracked || 0}</div>
                  <p className="text-xs text-purple-300/70">Active habits</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">Focus Time</CardTitle>
                  <Clock className="h-4 w-4 text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-100">
                    {`${Math.floor((data.stats?.focusTime || 0) / 60)}h ${(data.stats?.focusTime || 0) % 60}m`}
                  </div>
                  <p className="text-xs text-purple-300/70">This week</p>
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
                  <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-purple-100">
                        <CheckCircle className="h-5 w-5 text-purple-400" />
                        Upcoming Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.upcomingTasks?.map(task => (
                          <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-purple-950/50 border border-purple-800/20">
                            <div className={`w-2 h-2 rounded-full ${
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} />
                            <div className="flex-1">
                              <p className="font-medium text-slate-200">{task.title}</p>
                              <p className="text-sm text-purple-300/70">{task.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Achievements */}
                  <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-purple-100">
                        <TrendingUp className="h-5 w-5 text-purple-400" />
                        Recent Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.recentAchievements?.map(achievement => (
                          <div key={achievement.id} className="flex items-start gap-3 p-3 rounded-lg bg-purple-950/50 border border-purple-800/20">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <Target className="h-4 w-4 text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-200">{achievement.title}</p>
                              <div className="text-xs text-purple-300/70">{achievement.date}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="tasks">
                <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                  <CardHeader>
                    <CardTitle className="text-purple-100">Task Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-purple-300/70">Task management functionality coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar">
                <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                  <CardHeader>
                    <CardTitle className="text-purple-100">Calendar View</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-purple-300/70">Calendar functionality coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                  <CardHeader>
                    <CardTitle className="text-purple-100">Analytics Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-purple-300/70">Analytics functionality coming soon...</p>
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
            <div className="relative backdrop-blur-xl bg-slate-900/95 border border-purple-800/30 rounded-2xl shadow-2xl shadow-purple-900/50 max-w-md w-full mx-4 p-6">
              <h3 className="text-xl font-bold mb-6 text-purple-100">Add New Event</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-200">Event Title</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="Enter event title..."
                    className="w-full px-4 py-3 bg-purple-950/50 border border-purple-800/30 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-200 placeholder:text-purple-400/50"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-purple-200">Date</label>
                    <input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      className="w-full px-4 py-3 bg-purple-950/50 border border-purple-800/30 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-purple-200">Time</label>
                    <input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                      className="w-full px-4 py-3 bg-purple-950/50 border border-purple-800/30 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={closeAddEventModal} className="border-purple-800/50 text-purple-200 hover:bg-purple-950/50">
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30">
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
