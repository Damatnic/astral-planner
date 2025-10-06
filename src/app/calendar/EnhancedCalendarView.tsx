'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, addWeeks, subWeeks, startOfDay, addMinutes, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, Target, Plus, Edit3, Trash2, Filter, Search, Zap, Brain, Timer, TrendingUp, CheckCircle, AlertCircle, Star, Focus, BookOpen, ArrowLeft, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  category: 'work' | 'personal' | 'health' | 'social' | 'focus' | 'habit';
  priority: 'low' | 'medium' | 'high';
  date: Date;
  isTimeBlock?: boolean;
  isRecurring?: boolean;
  habitStreak?: number;
  isCompleted?: boolean;
}

interface Habit {
  id: string;
  name: string;
  category: 'health' | 'productivity' | 'personal';
  targetDays: number[];
  streak: number;
  completedToday: boolean;
  timeOfDay?: string;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  deadline: Date;
  category: 'work' | 'personal' | 'health';
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Deep Work: Project Alpha',
    description: 'Focus on coding the new features',
    startTime: '09:00',
    endTime: '11:00',
    category: 'focus',
    priority: 'high',
    date: new Date(),
    isTimeBlock: true
  },
  {
    id: '2',
    title: 'Team Standup',
    startTime: '09:30',
    endTime: '10:00',
    category: 'work',
    priority: 'medium',
    date: new Date()
  },
  {
    id: '3',
    title: 'Gym Workout',
    startTime: '18:00',
    endTime: '19:30',
    category: 'health',
    priority: 'high',
    date: new Date(),
    isRecurring: true
  },
  {
    id: '4',
    title: 'Morning Meditation',
    startTime: '07:00',
    endTime: '07:15',
    category: 'habit',
    priority: 'medium',
    date: new Date(),
    isRecurring: true,
    habitStreak: 12,
    isCompleted: true
  },
  {
    id: '5',
    title: 'Client Presentation',
    startTime: '14:00',
    endTime: '15:30',
    category: 'work',
    priority: 'high',
    date: addDays(new Date(), 1)
  }
];

const mockHabits: Habit[] = [
  {
    id: '1',
    name: 'Morning Meditation',
    category: 'health',
    targetDays: [1, 2, 3, 4, 5, 6, 0],
    streak: 12,
    completedToday: true,
    timeOfDay: '07:00'
  },
  {
    id: '2',
    name: 'Read 30 minutes',
    category: 'personal',
    targetDays: [1, 2, 3, 4, 5],
    streak: 8,
    completedToday: false,
    timeOfDay: '21:00'
  },
  {
    id: '3',
    name: 'Exercise',
    category: 'health',
    targetDays: [1, 3, 5],
    streak: 4,
    completedToday: false,
    timeOfDay: '18:00'
  }
];

const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Complete React Project',
    progress: 75,
    deadline: addDays(new Date(), 14),
    category: 'work'
  },
  {
    id: '2',
    title: 'Run 5K',
    progress: 60,
    deadline: addDays(new Date(), 30),
    category: 'health'
  }
];

const categoryColors = {
  work: 'bg-blue-600 text-white border-blue-700',
  personal: 'bg-green-600 text-white border-green-700',
  health: 'bg-red-600 text-white border-red-700',
  social: 'bg-purple-600 text-white border-purple-700',
  focus: 'bg-orange-600 text-white border-orange-700',
  habit: 'bg-teal-600 text-white border-teal-700'
};

const priorityColors = {
  low: 'border-l-4 border-l-slate-400',
  medium: 'border-l-4 border-l-yellow-500',
  high: 'border-l-4 border-l-red-500'
};

const categoryBgColors = {
  work: 'bg-blue-500/10',
  personal: 'bg-green-500/10',
  health: 'bg-red-500/10',
  social: 'bg-purple-500/10',
  focus: 'bg-orange-500/10',
  habit: 'bg-teal-500/10'
};

export default function EnhancedCalendarView() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');

  // Initialize date on client-side only to prevent hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [habits] = useState<Habit[]>(mockHabits);
  const [goals] = useState<Goal[]>(mockGoals);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAIInsights, setShowAIInsights] = useState(false);

  // AI-powered insights based on user data
  const aiInsights = useMemo(() => [
    {
      type: 'productivity',
      title: '🧠 Peak Focus Time',
      message: 'You\'re most productive between 9-11 AM. Consider scheduling deep work during this window.',
      confidence: 92
    },
    {
      type: 'habits',
      title: '🔥 Streak Opportunity',
      message: 'You\'re 3 days away from a 15-day meditation streak! Keep it up.',
      confidence: 100
    },
    {
      type: 'balance',
      title: '⚖️ Work-Life Balance',
      message: 'You have 65% work events this week. Consider adding more personal time.',
      confidence: 78
    },
    {
      type: 'goals',
      title: '🎯 Goal Progress',
      message: 'You\'re 75% done with React Project - ahead of schedule! Great work.',
      confidence: 95
    }
  ], []);

  // Time blocking suggestions
  const suggestedTimeBlocks = useMemo(() => [
    { time: '09:00-11:00', activity: 'Deep Work', reasoning: 'Peak focus hours' },
    { time: '14:00-15:00', activity: 'Admin Tasks', reasoning: 'Post-lunch energy dip' },
    { time: '16:00-17:00', activity: 'Creative Work', reasoning: 'Afternoon energy boost' }
  ], []);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, categoryFilter]);

  const getEventsForDate = useCallback((date: Date) => {
    return filteredEvents.filter(event => isSameDay(event.date, date));
  }, [filteredEvents]);

  const getHabitsForDate = useCallback((date: Date) => {
    const dayOfWeek = date.getDay();
    return habits.filter(habit => habit.targetDays.includes(dayOfWeek));
  }, [habits]);

  const getTodayStats = useMemo(() => {
    const todayEvents = getEventsForDate(new Date());
    const completedEvents = todayEvents.filter(e => e.isCompleted);
    const focusTime = todayEvents
      .filter(e => e.category === 'focus' || e.isTimeBlock)
      .reduce((acc, e) => {
        if (e.endTime && e.startTime) {
          const start = parseISO(`2000-01-01T${e.startTime}`);
          const end = parseISO(`2000-01-01T${e.endTime}`);
          return acc + (end.getTime() - start.getTime()) / (1000 * 60);
        }
        return acc;
      }, 0);
    
    const todayHabits = getHabitsForDate(new Date());
    const completedHabits = todayHabits.filter(h => h.completedToday);
    
    return {
      totalEvents: todayEvents.length,
      completedEvents: completedEvents.length,
      focusTime: Math.round(focusTime),
      habitsCompleted: completedHabits.length,
      habitsTotal: todayHabits.length,
      productivityScore: Math.round(((completedEvents.length / Math.max(todayEvents.length, 1)) * 0.6 + 
                                   (completedHabits.length / Math.max(todayHabits.length, 1)) * 0.4) * 100)
    };
  }, [getEventsForDate, getHabitsForDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    if (!currentDate) return;
    
    if (currentView === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (currentView === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1));
    }
  };

  const toggleEventCompletion = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, isCompleted: !event.isCompleted } : event
    ));
  };

  // Calculate calendar days outside of render function
  const calendarDays = useMemo(() => {
    if (!currentDate) return [];
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startDate = startOfWeek(start);
    const endDate = addDays(startOfWeek(end), 41);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const renderEnhancedMonthView = () => (
    <div className="space-y-4">
      {/* AI Insights Banner */}
      {showAIInsights && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-700/50 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="font-medium text-purple-100">AI Productivity Insights</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiInsights.slice(0, 2).map((insight, index) => (
              <div key={index} className="backdrop-blur-xl bg-slate-900/80 rounded-md p-3 border border-purple-800/30">
                <div className="text-sm font-medium text-purple-200">{insight.title}</div>
                <div className="text-xs text-slate-300 mt-1">{insight.message}</div>
                <div className="text-xs text-purple-400 mt-2">
                  {insight.confidence}% confidence
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Week Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center font-medium text-purple-300/70 text-sm">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const dayHabits = getHabitsForDate(day);
            const isCurrentMonth = currentDate ? isSameMonth(day, currentDate) : false;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const completedEventsCount = dayEvents.filter(e => e.isCompleted).length;
            const completedHabitsCount = dayHabits.filter(h => h.completedToday).length;
            
            return (
              <motion.div
                key={index}
                className={`min-h-[140px] p-2 border border-purple-800/20 cursor-pointer transition-all hover:bg-purple-950/30 ${
                  !isCurrentMonth ? 'bg-purple-950/20 text-purple-400/50' : 'bg-slate-900/50'
                } ${
isSelected ? 'ring-2 ring-purple-500 bg-purple-900/40' : ''} ${
                  isToday(day) ? 'bg-purple-900/50 border-purple-500/50' : ''
                }`}
                onClick={() => setSelectedDate(day)}
                whileHover={{ scale: 1.02 }}
                layout
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-medium ${
                    isToday(day) ? 'text-purple-300 font-bold' : isCurrentMonth ? 'text-slate-200' : 'text-purple-400/50'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex gap-1">
                    {dayEvents.length > 0 && (
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-1 rounded">
                        {dayEvents.length}
                      </span>
                    )}
                    {dayHabits.length > 0 && (
                      <span className="text-xs bg-green-500/20 text-green-300 px-1 rounded">
                        {completedHabitsCount}/{dayHabits.length}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs px-1 py-0.5 rounded truncate flex items-center gap-1 ${categoryColors[event.category]} ${priorityColors[event.priority]} ${
                        event.isCompleted ? 'opacity-60 line-through' : ''
                      }`}
                      title={`${event.title} ${event.startTime ? `at ${event.startTime}` : ''}`}
                    >
                      {event.isTimeBlock && <Focus className="w-2 h-2" />}
                      {event.isRecurring && <Timer className="w-2 h-2" />}
                      {event.isCompleted && <CheckCircle className="w-2 h-2" />}
                      <span className="truncate">
                        {event.startTime} {event.title}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-purple-300/70 px-1">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                  
                  {/* Habit indicators */}
                  {dayHabits.slice(0, 1).map((habit) => (
                    <div key={habit.id} className="text-xs px-1 py-0.5 bg-teal-100 text-teal-700 rounded flex items-center gap-1">
                      <Star className="w-2 h-2" />
                      <span className="truncate">{habit.name}</span>
                      {habit.completedToday && <CheckCircle className="w-2 h-2" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTimeBlockingView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Schedule */}
      <div className="lg:col-span-3">
        <div className="space-y-1">
          {[...Array(14)].map((_, i) => {
            const hour = i + 7; // Start from 7 AM
            const timeString = `${hour.toString().padStart(2, '0')}:00`;
            const hourEvents = currentDate ? getEventsForDate(currentDate).filter(event => 
              event.startTime && event.startTime.startsWith(hour.toString().padStart(2, '0'))
            ) : [];
            
            return (
              <div key={i} className="flex border-b border-purple-800/20 min-h-[60px]">
                <div className="w-20 text-xs text-purple-300/70 py-2 pr-4 text-right">
                  {format(new Date().setHours(hour, 0), 'h:mm a')}
                </div>
                <div className="flex-1 p-2 hover:bg-purple-950/30 relative">
                  {hourEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      className={`p-2 rounded mb-1 cursor-pointer transition-all ${categoryColors[event.category]} ${priorityColors[event.priority]} ${
                        event.isCompleted ? 'opacity-60' : ''
                      }`}
                      onClick={() => toggleEventCompletion(event.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-2">
                        {event.isTimeBlock && <Focus className="w-4 h-4" />}
                        {event.isCompleted && <CheckCircle className="w-4 h-4" />}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{event.title}</div>
                          <div className="text-xs opacity-90">
                            {event.startTime} - {event.endTime}
                          </div>
                          {event.description && (
                            <div className="text-xs opacity-75 mt-1">{event.description}</div>
                          )}
                        </div>
                        {event.priority === 'high' && <AlertCircle className="w-4 h-4" />}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="space-y-4">
        {/* Today's Stats */}
        <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-purple-200">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-200">Productivity Score</span>
                <span className="font-medium text-purple-100">{getTodayStats.productivityScore}%</span>
              </div>
              <Progress value={getTodayStats.productivityScore} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded p-2">
                <div className="text-lg font-bold text-blue-300">{getTodayStats.focusTime}</div>
                <div className="text-xs text-blue-400">Focus mins</div>
              </div>
              <div className="bg-green-500/20 border border-green-500/30 rounded p-2">
                <div className="text-lg font-bold text-green-300">
                  {getTodayStats.habitsCompleted}/{getTodayStats.habitsTotal}
                </div>
                <div className="text-xs text-green-400">Habits</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Block Suggestions */}
        <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-purple-200">
              <Zap className="w-4 h-4 text-orange-400" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestedTimeBlocks.map((block, index) => (
                <div key={index} className="p-2 bg-orange-500/20 border border-orange-500/30 rounded text-sm">
                  <div className="font-medium text-orange-300">{block.time}</div>
                  <div className="text-orange-200">{block.activity}</div>
                  <div className="text-xs text-orange-400/70">{block.reasoning}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Goals */}
        <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
          <CardHeader>
            <CardTitle className="text-base text-purple-200">Active Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goals.map((goal) => (
                <div key={goal.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-200">{goal.title}</span>
                    <span className="text-purple-300/70">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-1" />
                  <div className="text-xs text-purple-300/70">
                    Due: {format(goal.deadline, 'MMM d')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 relative overflow-hidden p-4">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse [animation-delay:0.5s]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced Header */}
        <div className="backdrop-blur-xl bg-slate-900/80 border border-purple-800/30 rounded-lg shadow-2xl shadow-purple-900/50 p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Top Row: Title and Date Navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="ghost" size="sm">
                      <Home className="w-4 h-4 mr-1" />
                      Home
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-purple-400" />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Smart Calendar</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="text-lg font-semibold min-w-[180px] text-center text-purple-100">
                  {currentView === 'month' && (currentDate ? format(currentDate, 'MMMM yyyy') : 'Loading...')}
                  {currentView === 'week' && (currentDate ? `Week of ${format(startOfWeek(currentDate), 'MMM d')}` : 'Loading...')}
                  {currentView === 'day' && (currentDate ? format(currentDate, 'MMMM d, yyyy') : 'Loading...')}
                  {currentView === 'agenda' && 'Smart Agenda'}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Bottom Row: Search, Filters, and Controls */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full sm:w-40"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="focus">Focus</SelectItem>
                    <SelectItem value="habit">Habits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* View Controls - Scrollable on mobile */}
              <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
                <div className="flex items-center gap-2 min-w-max">
                  <Button
                    variant={showAIInsights ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowAIInsights(!showAIInsights)}
                  >
                    <Brain className="w-4 h-4 mr-1" />
                    AI
                  </Button>
                  
                  <Button
                    variant={currentView === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentView('day')}
                  >
                    Day
                  </Button>
                  <Button
                    variant={currentView === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentView('week')}
                  >
                    Week
                  </Button>
                  <Button
                    variant={currentView === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentView('month')}
                  >
                    Month
                  </Button>
                  <Button
                    variant={currentView === 'agenda' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentView('agenda')}
                  >
                    Agenda
                  </Button>
                  
                  <Link href="/planner">
                    <Button variant="outline" size="sm">
                      <BookOpen className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Physical Planner</span>
                      <span className="sm:hidden">Planner</span>
                    </Button>
                  </Link>
                  
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">New Event</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Calendar Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'month' && renderEnhancedMonthView()}
              {(currentView === 'day' || currentView === 'agenda') && renderTimeBlockingView()}
              {currentView === 'week' && (
                <div className="text-center text-gray-500 py-8">
                  Week view with time blocking coming soon...
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Enhanced Selected Date Details */}
        {selectedDate && currentView === 'month' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-slate-900/80 border border-purple-800/30 rounded-lg shadow-2xl shadow-purple-900/50 p-6 mt-6"
          >
            <Tabs defaultValue="events" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-100">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                <TabsList>
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="habits">Habits</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="events">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-purple-300/70 text-center py-8">No events scheduled for this day.</p>
                ) : (
                  <div className="space-y-3">
                    {getEventsForDate(selectedDate).map((event) => (
                      <motion.div
                        key={event.id}
                        className={`p-4 rounded-lg border-l-4 ${priorityColors[event.priority]} bg-purple-950/30 border border-purple-800/20 cursor-pointer transition-all hover:bg-purple-950/50`}
                        onClick={() => toggleEventCompletion(event.id)}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={categoryColors[event.category]}>
                              {event.category}
                            </Badge>
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2 text-slate-200">
                                {event.isCompleted && <CheckCircle className="w-4 h-4 text-green-400" />}
                                <span className={event.isCompleted ? 'line-through text-purple-400/70' : ''}>
                                  {event.title}
                                </span>
                                {event.isTimeBlock && <Focus className="w-4 h-4 text-orange-400" />}
                                {event.isRecurring && <Timer className="w-4 h-4 text-blue-400" />}
                              </div>
                              {event.startTime && (
                                <div className="text-sm text-purple-300/70 mt-1">
                                  {event.startTime} {event.endTime && `- ${event.endTime}`}
                                </div>
                              )}
                              {event.description && (
                                <div className="text-sm text-slate-300 mt-1">{event.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="habits">
                <div className="space-y-3">
                  {getHabitsForDate(selectedDate).map((habit) => (
                    <div key={habit.id} className="flex items-center justify-between p-4 bg-purple-950/30 border border-purple-800/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-teal-400" />
                        <div>
                          <div className="font-medium text-slate-200">{habit.name}</div>
                          <div className="text-sm text-purple-300/70">
                            {habit.streak} day streak • {habit.timeOfDay || 'Anytime'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {habit.completedToday && <CheckCircle className="w-5 h-5 text-green-400" />}
                        <Badge variant={habit.completedToday ? 'default' : 'outline'}>
                          {habit.completedToday ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="insights">
                <div className="space-y-3">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="p-4 backdrop-blur-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-700/50 rounded-lg">
                      <div className="font-medium text-purple-100 mb-2">{insight.title}</div>
                      <div className="text-sm text-purple-200">{insight.message}</div>
                      <div className="text-xs text-purple-400 mt-2">
                        AI Confidence: {insight.confidence}%
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </div>
  );
}