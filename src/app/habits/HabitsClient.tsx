'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity,
  Plus,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Flame,
  Star,
  BarChart3,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import Logger from '@/lib/logger';

interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetCount: number;
  unit?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  reminderTime?: string;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  isActive: boolean;
  color?: string;
  icon?: string;
  stats?: {
    completedToday: boolean;
    completedDays: number;
    totalDays: number;
    completionRate: number;
    currentStreak: number;
    bestStreak: number;
  };
  entries?: Array<{
    date: string;
    completed: boolean;
    value: number;
    notes?: string;
  }>;
  weeklyPattern?: Record<string, { total: number; completed: number }>;
  createdAt: string;
  updatedAt: string;
}

interface HabitsData {
  habits: Habit[];
  stats: {
    totalHabits: number;
    activeToday: number;
    totalCompletions: number;
    averageCompletionRate: number;
    longestStreak: number;
  };
  loading: boolean;
  error?: string;
}

const habitCategories = [
  'Health', 'Fitness', 'Learning', 'Productivity', 'Mindfulness', 'Social', 'Creative', 'Finance'
];

const timeOptions = [
  { value: 'morning', label: 'Morning', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { value: 'evening', label: 'Evening', icon: '🌆' },
  { value: 'anytime', label: 'Anytime', icon: '⏰' }
];

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' }
];

export default function HabitsPage() {
  // Mock user for development without authentication
  const user = { id: 'test-user', firstName: 'Test', lastName: 'User' };
  const [data, setData] = useState<HabitsData>({
    habits: [],
    stats: { totalHabits: 0, activeToday: 0, totalCompletions: 0, averageCompletionRate: 0, longestStreak: 0 },
    loading: true
  });
  const [view, setView] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form state for creating/editing habits
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    frequency: 'daily' as Habit['frequency'],
    targetCount: 1,
    unit: 'times',
    timeOfDay: 'anytime' as Habit['timeOfDay'],
    reminderTime: '',
    color: '#3b82f6',
    icon: '⭐'
  });

  // Week view state
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [sortBy, setSortBy] = useState('name');

  // Fetch habits data
  useEffect(() => {
    async function fetchHabits() {
      if (!user) return;

      try {
        setData(prev => ({ ...prev, loading: true }));

        const response = await fetch('/api/habits');
        const result = await response.json();

        if (response.ok) {
          setData({
            habits: result.habits || [],
            stats: result.stats || { totalHabits: 0, activeToday: 0, totalCompletions: 0, averageCompletionRate: 0, longestStreak: 0 },
            loading: false
          });
        } else {
          throw new Error(result.error || 'Failed to fetch habits');
        }
      } catch (error) {
        Logger.error('Failed to fetch habits:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load habits'
        }));
      }
    }

    fetchHabits();
  }, [user]);

  // Create or update habit
  async function handleSaveHabit() {
    try {
      const url = editingHabit ? `/api/habits/${editingHabit.id}` : '/api/habits';
      const method = editingHabit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          targetCount: Number(formData.targetCount)
        })
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setEditingHabit(null);
        setFormData({
          name: '',
          description: '',
          category: '',
          frequency: 'daily',
          targetCount: 1,
          unit: 'times',
          timeOfDay: 'anytime',
          reminderTime: '',
          color: '#3b82f6',
          icon: '⭐'
        });
        // Refresh data
        window.location.reload();
      } else {
        const error = await response.json();
        Logger.error('Failed to save habit:', error);
      }
    } catch (error) {
      Logger.error('Failed to save habit:', error);
    }
  }

  // Toggle habit completion
  async function handleToggleHabit(habitId: string, completed: boolean) {
    try {
      const response = await fetch('/api/habits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId,
          completed: !completed,
          date: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Update local state
        setData(prev => ({
          ...prev,
          habits: prev.habits.map(habit => 
            habit.id === habitId 
              ? { 
                  ...habit, 
                  stats: habit.stats ? { ...habit.stats, completedToday: !completed } : undefined 
                }
              : habit
          )
        }));
      }
    } catch (error) {
      Logger.error('Failed to toggle habit:', error);
    }
  }

  // Delete habit
  async function handleDeleteHabit(habitId: string) {
    if (!confirm('Are you sure you want to delete this habit?')) return;

    try {
      const response = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      Logger.error('Failed to delete habit:', error);
    }
  }

  // Filter habits
  const filteredHabits = data.habits.filter(habit => {
    if (filter === 'completed' && !habit.stats?.completedToday) return false;
    if (filter === 'pending' && habit.stats?.completedToday) return false;
    if (filter === 'inactive' && habit.isActive) return false;
    if (selectedCategory !== 'all' && habit.category !== selectedCategory) return false;
    if (searchTerm && !habit.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Get streak emoji
  function getStreakEmoji(streak: number) {
    if (streak >= 100) return '🏆';
    if (streak >= 50) return '💎';
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '🌟';
    if (streak >= 3) return '✨';
    return '🎯';
  }

  // Get completion rate color
  function getCompletionRateColor(rate: number) {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-blue-600';
    if (rate >= 60) return 'text-yellow-600';
    if (rate >= 40) return 'text-orange-600';
    return 'text-red-600';
  }

  // Render habit card
  function renderHabitCard(habit: Habit) {
    const completedToday = habit.stats?.completedToday || false;
    const completionRate = habit.stats?.completionRate || 0;

    return (
      <Card key={habit.id} className={`transition-all hover:shadow-md ${completedToday ? 'ring-2 ring-green-200 bg-green-50/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: habit.color + '20', color: habit.color }}
              >
                {habit.icon || '⭐'}
              </div>
              <div>
                <h3 className="font-medium">{habit.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{habit.category}</Badge>
                  <Badge variant="secondary">{habit.frequency}</Badge>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  setEditingHabit(habit);
                  setFormData({
                    name: habit.name,
                    description: habit.description || '',
                    category: habit.category,
                    frequency: habit.frequency,
                    targetCount: habit.targetCount,
                    unit: habit.unit || 'times',
                    timeOfDay: habit.timeOfDay || 'anytime',
                    reminderTime: habit.reminderTime || '',
                    color: habit.color || '#3b82f6',
                    icon: habit.icon || '⭐'
                  });
                  setShowCreateDialog(true);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/habits/${habit.id}`}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDeleteHabit(habit.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {habit.description && (
            <p className="text-sm text-muted-foreground mb-3">{habit.description}</p>
          )}

          {/* Today's Progress */}
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm">Today's Progress</Label>
            <button
              onClick={() => handleToggleHabit(habit.id, completedToday)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                completedToday 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 ${completedToday ? 'text-green-600' : 'text-gray-400'}`} />
              {completedToday ? 'Completed' : 'Mark Complete'}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-lg font-bold">{habit.currentStreak}</span>
                {habit.currentStreak > 0 && (
                  <span className="text-sm">{getStreakEmoji(habit.currentStreak)}</span>
                )}
              </div>
              <Label className="text-xs text-muted-foreground">Current Streak</Label>
            </div>
            
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-lg font-bold">{habit.bestStreak}</span>
              </div>
              <Label className="text-xs text-muted-foreground">Best Streak</Label>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <Label className="text-sm">Completion Rate</Label>
              <span className={`text-sm font-medium ${getCompletionRateColor(completionRate)}`}>
                {Math.round(completionRate)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Target and Time */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Target: {habit.targetCount} {habit.unit}</span>
            {habit.timeOfDay && habit.timeOfDay !== 'anytime' && (
              <span>{timeOptions.find(t => t.value === habit.timeOfDay)?.label}</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render week view
  function renderWeekView() {
    const weekStart = startOfWeek(currentWeek);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="space-y-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentWeek(prev => addDays(prev, -7))}
          >
            Previous Week
          </Button>
          <h3 className="text-lg font-medium">
            {format(weekStart, 'MMM dd')} - {format(addDays(weekStart, 6), 'MMM dd, yyyy')}
          </h3>
          <Button 
            variant="outline" 
            onClick={() => setCurrentWeek(prev => addDays(prev, 7))}
          >
            Next Week
          </Button>
        </div>

        {/* Week Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 font-medium">Habit</th>
                {days.map(day => (
                  <th key={day.toISOString()} className="text-center p-2 min-w-[80px]">
                    <div className={`${isSameDay(day, new Date()) ? 'text-primary font-bold' : ''}`}>
                      <div className="text-xs">{format(day, 'EEE')}</div>
                      <div>{format(day, 'dd')}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredHabits.map(habit => (
                <tr key={habit.id} className="border-t">
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: habit.color + '20', color: habit.color }}
                      >
                        {habit.icon}
                      </div>
                      <span className="font-medium">{habit.name}</span>
                    </div>
                  </td>
                  {days.map(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const entry = habit.entries?.find(e => format(parseISO(e.date), 'yyyy-MM-dd') === dayKey);
                    const completed = entry?.completed || false;
                    const isToday = isSameDay(day, new Date());

                    return (
                      <td key={day.toISOString()} className="text-center p-2">
                        <button
                          onClick={() => isToday && handleToggleHabit(habit.id, completed)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            completed 
                              ? 'bg-green-500 text-white' 
                              : isToday 
                                ? 'bg-gray-200 hover:bg-gray-300 border-2 border-dashed border-gray-400'
                                : 'bg-gray-100'
                          } ${isToday && !completed ? 'cursor-pointer' : ''}`}
                          disabled={!isToday}
                        >
                          {completed && <CheckCircle2 className="h-5 w-5" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Habits</span>
            </Link>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Habit
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Habits</span>
              </div>
              <div className="text-2xl font-bold">{data.loading ? '...' : data.stats.totalHabits}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Active Today</span>
              </div>
              <div className="text-2xl font-bold">{data.loading ? '...' : data.stats.activeToday}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Completions</span>
              </div>
              <div className="text-2xl font-bold">{data.loading ? '...' : data.stats.totalCompletions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Avg Rate</span>
              </div>
              <div className="text-2xl font-bold">
                {data.loading ? '...' : `${Math.round(data.stats.averageCompletionRate)}%`}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Best Streak</span>
              </div>
              <div className="text-2xl font-bold">
                {data.loading ? '...' : data.stats.longestStreak}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search habits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter habits" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Habits</SelectItem>
              <SelectItem value="completed">Completed Today</SelectItem>
              <SelectItem value="pending">Pending Today</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {habitCategories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Habits Content */}
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="week">Week View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            {data.loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : data.error ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">{data.error}</p>
                </CardContent>
              </Card>
            ) : filteredHabits.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredHabits.map(habit => renderHabitCard(habit))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No habits yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building better habits today. What would you like to improve?
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Habit
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            {data.loading ? (
              <div className="h-64 bg-muted rounded animate-pulse" />
            ) : (
              renderWeekView()
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Habits</CardTitle>
                    <CardDescription>Detailed view of all your habits with progress and statistics</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="streak">Current Streak</SelectItem>
                        <SelectItem value="completionRate">Completion Rate</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredHabits.map((habit) => {
                    const completionRate = habit.stats?.completionRate || 0;
                    const todaysEntry = habit.entries?.find(entry => 
                      isSameDay(parseISO(entry.date), new Date())
                    );
                    const completedToday = todaysEntry?.completed || false;
                    
                    return (
                      <div key={habit.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {habit.icon && (
                                    <span className="text-lg">{habit.icon}</span>
                                  )}
                                  <h4 className="text-lg font-medium">{habit.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {habit.category}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant={completedToday ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleToggleHabit(habit.id, !completedToday)}
                                  className={completedToday ? 
                                    'bg-green-600 hover:bg-green-700' : 
                                    'hover:bg-green-50 hover:border-green-300'
                                  }
                                >
                                  {completedToday ? (
                                    <><CheckCircle2 className="h-4 w-4 mr-1" />Complete</>
                                  ) : (
                                    <><Circle className="h-4 w-4 mr-1" />Mark Done</>
                                  )}
                                </Button>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingHabit(habit)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Habit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteHabit(habit.id)} className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Habit
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            {habit.description && (
                              <p className="text-sm text-muted-foreground mb-3">{habit.description}</p>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{habit.currentStreak}</div>
                                <div className="text-xs text-muted-foreground">Current Streak</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{habit.bestStreak}</div>
                                <div className="text-xs text-muted-foreground">Best Streak</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{Math.round(completionRate)}%</div>
                                <div className="text-xs text-muted-foreground">Success Rate</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{habit.totalCompletions}</div>
                                <div className="text-xs text-muted-foreground">Total Completions</div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Overall Progress</span>
                                <span className="font-medium">{Math.round(completionRate)}%</span>
                              </div>
                              <Progress value={completionRate} className="h-2" />
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                              <div className="flex items-center gap-4">
                                <span>Frequency: {habit.frequency}</span>
                                {habit.timeOfDay && (
                                  <span>Time: {habit.timeOfDay}</span>
                                )}
                                {habit.unit && (
                                  <span>Target: {habit.targetCount} {habit.unit}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {habit.isActive ? (
                                  <Badge variant="outline" className="text-green-600 border-green-300">Active</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-gray-600 border-gray-300">Inactive</Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Week Progress Indicators */}
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">This Week</span>
                                <div className="flex items-center gap-1">
                                  {[...Array(7)].map((_, index) => {
                                    const date = addDays(startOfWeek(new Date()), index);
                                    const dayEntry = habit.entries?.find(entry => 
                                      isSameDay(parseISO(entry.date), date)
                                    );
                                    const isCompleted = dayEntry?.completed || false;
                                    const isToday = isSameDay(date, new Date());
                                    
                                    return (
                                      <div 
                                        key={index} 
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                                          isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                          isToday ? 'border-blue-500 text-blue-500' :
                                          'border-gray-300 text-gray-400'
                                        }`}
                                      >
                                        {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                                        {!isCompleted && isToday && <Circle className="w-3 h-3" />}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredHabits.length === 0 && (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No habits found matching your filters.</p>
                      <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Habit
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Habit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingHabit ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
              <DialogDescription>
                {editingHabit ? 'Update your habit details' : 'Build a new positive habit'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Habit Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="What habit do you want to build?"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Why is this habit important to you?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {habitCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value as Habit['frequency'] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map(freq => (
                        <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetCount">Target Count</Label>
                  <Input
                    id="targetCount"
                    type="number"
                    value={formData.targetCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetCount: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="e.g., minutes, pages, cups"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeOfDay">Time of Day</Label>
                  <Select value={formData.timeOfDay} onValueChange={(value) => setFormData(prev => ({ ...prev, timeOfDay: value as Habit['timeOfDay'] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(time => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.icon} {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="reminderTime">Reminder Time</Label>
                  <Input
                    id="reminderTime"
                    type="time"
                    value={formData.reminderTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminderTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="Choose an emoji"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveHabit} disabled={!formData.name || !formData.category}>
                {editingHabit ? 'Update Habit' : 'Create Habit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}