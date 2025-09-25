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
      case 'completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'paused': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Goals</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Goal
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
                  <p className="text-sm font-medium text-muted-foreground">Total Goals</p>
                  <p className="text-3xl font-bold">{goals.length}</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {goals.filter(g => g.status === 'active').length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold text-green-600">
                    {goals.filter(g => g.status === 'completed').length}
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
                  <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {Math.round(goals.reduce((acc, g) => acc + g.completionPercentage, 0) / goals.length)}%
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
                  placeholder="Search goals..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{goal.title}</CardTitle>
                          <CardDescription className="mt-2">
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
                            <span className="text-sm text-gray-600">Progress</span>
                            <span className="text-sm font-medium">{goal.completionPercentage}%</span>
                          </div>
                          <Progress value={goal.completionPercentage} className="h-2" />
                        </div>

                        {/* Current vs Target */}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Current: {goal.currentValue} {goal.unit}
                          </span>
                          <span className="text-gray-600">
                            Target: {goal.targetValue} {goal.unit}
                          </span>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                        </div>

                        {/* Category */}
                        <Badge variant="outline" className="w-fit">
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
                <Card key={goal.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-medium">{goal.title}</h3>
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                          <Badge className={getPriorityColor(goal.priority)}>
                            {goal.priority}
                          </Badge>
                          <Badge variant="outline">
                            {goal.category}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{goal.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                          <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="ml-6">
                        <div className="text-right mb-2">
                          <span className="text-2xl font-bold text-blue-600">
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
                    <div className={`w-4 h-4 rounded-full ${
                      goal.completionPercentage === 100 ? 'bg-green-500' : 
                      goal.completionPercentage > 50 ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    {index < filteredGoals.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-200 mt-2" />
                    )}
                  </div>

                  {/* Goal card */}
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{goal.title}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(goal.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                          <Badge variant="outline">
                            {goal.category}
                          </Badge>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium">{goal.completionPercentage}%</div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Goal</CardTitle>
              <CardDescription>
                Set a new goal and track your progress towards achieving it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Goal Title</label>
                <input
                  type="text"
                  placeholder="What do you want to achieve?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  placeholder="Describe your goal in detail..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Career">Career</option>
                    <option value="Learning">Learning</option>
                    <option value="Finance">Finance</option>
                    <option value="Health">Health</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Value</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Current Value</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Unit</label>
                  <input
                    type="text"
                    placeholder="customers"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCreateModal(false)}>
                Create Goal
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}