'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target,
  Plus,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Circle,
  BarChart3,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  dueDate: string;
  status: 'active' | 'completed' | 'paused';
  priority: 'low' | 'medium' | 'high';
  completionPercentage: number;
  createdAt: string;
}

export default function GoalsClientFixed() {
  const [activeTab, setActiveTab] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Static data for goals
  const goals: Goal[] = [
    {
      id: '1',
      title: 'Launch SaaS Product',
      description: 'Build and launch my first SaaS application with 100 paying customers',
      category: 'Career',
      targetValue: 100,
      currentValue: 65,
      unit: 'customers',
      dueDate: '2024-12-31',
      status: 'active',
      priority: 'high',
      completionPercentage: 65,
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      title: 'Read 24 Books',
      description: 'Read 2 books per month to expand knowledge and improve skills',
      category: 'Learning',
      targetValue: 24,
      currentValue: 18,
      unit: 'books',
      dueDate: '2024-12-31',
      status: 'active',
      priority: 'medium',
      completionPercentage: 75,
      createdAt: '2024-01-01'
    },
    {
      id: '3',
      title: 'Save $10,000',
      description: 'Build emergency fund for financial security',
      category: 'Finance',
      targetValue: 10000,
      currentValue: 7500,
      unit: 'dollars',
      dueDate: '2024-12-31',
      status: 'active',
      priority: 'high',
      completionPercentage: 75,
      createdAt: '2024-01-01'
    },
    {
      id: '4',
      title: 'Run Marathon',
      description: 'Complete a full 26.2 mile marathon under 4 hours',
      category: 'Health',
      targetValue: 1,
      currentValue: 0,
      unit: 'marathon',
      dueDate: '2024-10-15',
      status: 'active',
      priority: 'medium',
      completionPercentage: 40,
      createdAt: '2024-02-01'
    },
    {
      id: '5',
      title: 'Learn Spanish',
      description: 'Achieve conversational fluency in Spanish',
      category: 'Learning',
      targetValue: 365,
      currentValue: 284,
      unit: 'days practiced',
      dueDate: '2024-12-31',
      status: 'active',
      priority: 'low',
      completionPercentage: 78,
      createdAt: '2024-01-01'
    }
  ];

  const categories = ['all', 'Career', 'Learning', 'Finance', 'Health', 'Personal'];
  const statuses = ['all', 'active', 'completed', 'paused'];

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || goal.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'active': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse [animation-delay:0.5s]"></div>
        </div>

        <main className="container mx-auto px-4 py-8 relative z-10">\n          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
              Goals
            </h1>
            <p className="text-purple-300/70">Track and achieve your life goals</p>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                New Goal
              </Button>
            </div>
          </div>
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-300/70">Total Goals</p>
                  <p className="text-3xl font-bold text-purple-100">{goals.length}</p>
                </div>
                <Target className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-300/70">Active</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {goals.filter(g => g.status === 'active').length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-300/70">Completed</p>
                  <p className="text-3xl font-bold text-green-400">
                    {goals.filter(g => g.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-300/70">Avg Progress</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {Math.round(goals.reduce((acc, g) => acc + g.completionPercentage, 0) / goals.length)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search goals..."
                  className="pl-10 pr-4 py-2 w-full bg-purple-950/50 border border-purple-800/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-200 placeholder:text-purple-400/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-purple-950/50 border border-purple-800/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-200"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-purple-950/50 border border-purple-800/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-200"
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
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGoals.map(goal => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="cursor-pointer hover:shadow-lg hover:shadow-purple-900/50 transition-all backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-purple-200">{goal.title}</CardTitle>
                          <CardDescription className="mt-2 text-slate-300">
                            {goal.description}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={getPriorityColor(goal.priority)}>
                            {goal.priority}
                          </Badge>
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-purple-300/70">Progress</span>
                            <span className="text-sm font-medium text-purple-200">{goal.completionPercentage}%</span>
                          </div>
                          <Progress value={goal.completionPercentage} className="h-2" />
                        </div>

                        {/* Current vs Target */}
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">
                            Current: {goal.currentValue} {goal.unit}
                          </span>
                          <span className="text-slate-300">
                            Target: {goal.targetValue} {goal.unit}
                          </span>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-2 text-sm text-purple-300/70">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                        </div>

                        {/* Category */}
                        <Badge variant="outline" className="w-fit border-purple-700/50 text-purple-300">
                          {goal.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <div className="space-y-4">
              {filteredGoals.map(goal => (
                <Card key={goal.id} className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 hover:shadow-lg hover:shadow-purple-900/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-medium text-purple-200">{goal.title}</h3>
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                          <Badge className={getPriorityColor(goal.priority)}>
                            {goal.priority}
                          </Badge>
                          <Badge variant="outline" className="border-purple-700/50 text-purple-300">
                            {goal.category}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-sm mb-3">{goal.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-purple-300/70">
                          <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                          <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="ml-6">
                        <div className="text-right mb-2">
                          <span className="text-2xl font-bold text-purple-200">
                            {goal.completionPercentage}%
                          </span>
                        </div>
                        <Progress value={goal.completionPercentage} className="w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <div className="space-y-6">
              {filteredGoals
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .map((goal, index) => (
                <div key={goal.id} className="flex gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full shadow-lg ${
                      goal.completionPercentage === 100 ? 'bg-green-500 shadow-green-500/50' : 
                      goal.completionPercentage > 50 ? 'bg-purple-500 shadow-purple-500/50' : 'bg-purple-700 shadow-purple-700/50'
                    }`} />
                    {index < filteredGoals.length - 1 && (
                      <div className="w-0.5 h-16 bg-purple-800/30 mt-2" />
                    )}
                  </div>

                  {/* Goal card */}
                  <Card className="flex-1 backdrop-blur-xl bg-slate-900/80 border-purple-800/30 hover:shadow-lg hover:shadow-purple-900/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-purple-200">{goal.title}</h3>
                        <span className="text-sm text-purple-300/70">
                          {new Date(goal.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-3">{goal.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                          <Badge variant="outline" className="border-purple-700/50 text-purple-300">
                            {goal.category}
                          </Badge>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium text-purple-200">{goal.completionPercentage}%</div>
                          <Progress value={goal.completionPercentage} className="w-20 h-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-slate-900/95 border-purple-800/30 shadow-2xl shadow-purple-900/50">
            <CardHeader>
              <CardTitle className="text-purple-200">Create New Goal</CardTitle>
              <CardDescription className="text-slate-300">
                Set a new goal and track your progress towards achieving it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-purple-200">Goal Title</label>
                <input
                  type="text"
                  placeholder="What do you want to achieve?"
                  className="w-full px-3 py-2 bg-purple-950/50 border border-purple-800/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-200 placeholder:text-purple-400/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-purple-200">Description</label>
                <textarea
                  placeholder="Describe your goal in detail..."
                  rows={3}
                  className="w-full px-3 py-2 bg-purple-950/50 border border-purple-800/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-slate-200 placeholder:text-purple-400/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-200">Category</label>
                  <select className="w-full px-3 py-2 bg-purple-950/50 border border-purple-800/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-200">
                    <option value="Career">Career</option>
                    <option value="Learning">Learning</option>
                    <option value="Finance">Finance</option>
                    <option value="Health">Health</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-200">Priority</label>
                  <select className="w-full px-3 py-2 bg-purple-950/50 border border-purple-800/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-200">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-200">Target Value</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full px-3 py-2 bg-purple-950/50 border border-purple-800/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-200 placeholder:text-purple-400/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-200">Current Value</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-2 bg-purple-950/50 border border-purple-800/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-200 placeholder:text-purple-400/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-200">Unit</label>
                  <input
                    type="text"
                    placeholder="customers"
                    className="w-full px-3 py-2 bg-purple-950/50 border border-purple-800/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-200 placeholder:text-purple-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-purple-200">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-purple-950/50 border border-purple-800/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-200"
                />
              </div>
            </CardContent>
            
            <div className="flex justify-end gap-3 p-6 border-t border-purple-800/30">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-purple-700/50 text-purple-200 hover:bg-purple-950/50">
                Cancel
              </Button>
              <Button onClick={() => setShowCreateModal(false)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Create Goal
              </Button>
            </div>
          </Card>
        </div>
      )}
      </div>
    </>
  );
}