'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import { 
  Repeat,
  Plus,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Circle,
  BarChart3,
  Clock,
  Filter,
  Search,
  Flame,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Habit {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetValue: number;
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  completedThisWeek: number;
  icon: string;
  color: string;
  createdAt: string;
  lastCompleted?: string;
}

export default function HabitsClientFixed() {
  const [activeTab, setActiveTab] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Static data for habits
  const habits: Habit[] = [
    {
      id: '1',
      name: 'Morning Meditation',
      description: 'Start the day with 10 minutes of mindfulness meditation',
      category: 'Wellness',
      frequency: 'daily',
      targetValue: 1,
      currentStreak: 14,
      bestStreak: 21,
      completedToday: true,
      completedThisWeek: 7,
      icon: '🧘',
      color: 'bg-purple-500',
      createdAt: '2024-01-01',
      lastCompleted: '2024-09-25'
    },
    {
      id: '2',
      name: 'Read 30 Minutes',
      description: 'Read for at least 30 minutes daily to expand knowledge',
      category: 'Learning',
      frequency: 'daily',
      targetValue: 30,
      currentStreak: 8,
      bestStreak: 15,
      completedToday: false,
      completedThisWeek: 5,
      icon: '📚',
      color: 'bg-blue-500',
      createdAt: '2024-01-15',
      lastCompleted: '2024-09-24'
    },
    {
      id: '3',
      name: 'Exercise',
      description: 'Get at least 30 minutes of physical activity',
      category: 'Health',
      frequency: 'daily',
      targetValue: 30,
      currentStreak: 5,
      bestStreak: 12,
      completedToday: true,
      completedThisWeek: 4,
      icon: '💪',
      color: 'bg-green-500',
      createdAt: '2024-02-01',
      lastCompleted: '2024-09-25'
    },
    {
      id: '4',
      name: 'Drink Water',
      description: 'Drink at least 8 glasses of water daily',
      category: 'Health',
      frequency: 'daily',
      targetValue: 8,
      currentStreak: 23,
      bestStreak: 30,
      completedToday: false,
      completedThisWeek: 6,
      icon: '💧',
      color: 'bg-cyan-500',
      createdAt: '2024-01-01',
      lastCompleted: '2024-09-24'
    },
    {
      id: '5',
      name: 'Journal',
      description: 'Write down thoughts, gratitude, and daily reflections',
      category: 'Wellness',
      frequency: 'daily',
      targetValue: 1,
      currentStreak: 12,
      bestStreak: 18,
      completedToday: false,
      completedThisWeek: 5,
      icon: '📝',
      color: 'bg-orange-500',
      createdAt: '2024-02-15',
      lastCompleted: '2024-09-24'
    },
    {
      id: '6',
      name: 'Learn Spanish',
      description: 'Practice Spanish for 15 minutes using language apps',
      category: 'Learning',
      frequency: 'daily',
      targetValue: 15,
      currentStreak: 7,
      bestStreak: 25,
      completedToday: true,
      completedThisWeek: 6,
      icon: '🇪🇸',
      color: 'bg-red-500',
      createdAt: '2024-01-10',
      lastCompleted: '2024-09-25'
    }
  ];

  const categories = ['all', 'Health', 'Learning', 'Wellness', 'Productivity', 'Social'];

  const filteredHabits = habits.filter(habit => {
    const matchesSearch = habit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         habit.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || habit.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleHabit = (habitId: string) => {
    // In a real app, this would update the habit completion status
    logger.debug('Toggling habit', { habitId });
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600';
    if (streak >= 14) return 'text-green-600';
    if (streak >= 7) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Repeat className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Habits</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Habit
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Habits</p>
                  <p className="text-3xl font-bold">{habits.length}</p>
                </div>
                <Repeat className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                  <p className="text-3xl font-bold text-green-600">
                    {habits.filter(h => h.completedToday).length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Best Streak</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {Math.max(...habits.map(h => h.bestStreak))}
                  </p>
                </div>
                <Flame className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.round((habits.filter(h => h.completedToday).length / habits.length) * 100)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search habits..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredHabits.map(habit => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full ${habit.color} flex items-center justify-center text-2xl`}>
                            {habit.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{habit.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {habit.description}
                            </CardDescription>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleHabit(habit.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            habit.completedToday 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {habit.completedToday && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Streak */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Flame className={`w-4 h-4 ${getStreakColor(habit.currentStreak)}`} />
                            <span className={`font-medium ${getStreakColor(habit.currentStreak)}`}>
                              {habit.currentStreak} day streak
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            Best: {habit.bestStreak}
                          </span>
                        </div>

                        {/* Weekly Progress */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">This Week</span>
                            <span className="text-sm font-medium">{habit.completedThisWeek}/7</span>
                          </div>
                          <Progress value={(habit.completedThisWeek / 7) * 100} className="h-2" />
                        </div>

                        {/* Category */}
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="w-fit">
                            {habit.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {habit.frequency}
                          </span>
                        </div>

                        {/* Last Completed */}
                        {habit.lastCompleted && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>Last: {new Date(habit.lastCompleted).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <div className="space-y-4">
              {filteredHabits.map(habit => (
                <Card key={habit.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${habit.color} flex items-center justify-center text-2xl`}>
                          {habit.icon}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-lg font-medium">{habit.name}</h3>
                            <Badge variant="outline">
                              {habit.category}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Flame className={`w-4 h-4 ${getStreakColor(habit.currentStreak)}`} />
                              <span className={`text-sm font-medium ${getStreakColor(habit.currentStreak)}`}>
                                {habit.currentStreak}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{habit.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">This Week</div>
                          <div className="font-medium">{habit.completedThisWeek}/7</div>
                        </div>
                        
                        <button
                          onClick={() => toggleHabit(habit.id)}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                            habit.completedToday 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {habit.completedToday && <CheckCircle2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Habit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Habit</CardTitle>
              <CardDescription>
                Build a new habit and track your progress consistently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Habit Name</label>
                <input
                  type="text"
                  placeholder="What habit do you want to build?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  placeholder="Why is this habit important to you?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Health">Health</option>
                    <option value="Learning">Learning</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Social">Social</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Frequency</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target (optional)</label>
                <input
                  type="number"
                  placeholder="e.g., minutes, pages, cups"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Icon</label>
                <div className="grid grid-cols-8 gap-2">
                  {['🧘', '📚', '💪', '💧', '📝', '🏃', '🎯', '💤', '🥗', '☕', '🎵', '🎨', '💻', '📞', '🌱', '❤️'].map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className="w-10 h-10 text-xl border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCreateModal(false)}>
                Create Habit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}