'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target,
  Plus,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { format, parseISO, isAfter, isBefore } from 'date-fns';

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'lifetime' | 'yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily';
  category: string;
  targetValue: number;
  currentValue: number;
  targetDate?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  parentGoalId?: string;
  childGoals?: Goal[];
  completionPercentage: number;
  isOverdue: boolean;
  daysRemaining?: number;
  createdAt: string;
  updatedAt: string;
}

interface GoalsData {
  goals: Goal[];
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    overdue: number;
  };
  loading: boolean;
  error?: string;
}

const goalTypes = [
  { value: 'lifetime', label: 'Lifetime', color: 'purple' },
  { value: 'yearly', label: 'Yearly', color: 'blue' },
  { value: 'quarterly', label: 'Quarterly', color: 'green' },
  { value: 'monthly', label: 'Monthly', color: 'orange' },
  { value: 'weekly', label: 'Weekly', color: 'pink' },
  { value: 'daily', label: 'Daily', color: 'gray' }
];

const goalCategories = [
  'Career', 'Health', 'Finance', 'Education', 'Personal', 'Relationships', 'Travel', 'Hobbies'
];

export default function GoalsPage() {
  // Mock user for development without authentication
  const user = { id: 'test-user', firstName: 'Test', lastName: 'User' };
  const [data, setData] = useState<GoalsData>({
    goals: [],
    stats: { total: 0, completed: 0, inProgress: 0, notStarted: 0, overdue: 0 },
    loading: true
  });
  const [view, setView] = useState('hierarchy');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form state for creating/editing goals
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'monthly' as Goal['type'],
    category: '',
    targetValue: 100,
    targetDate: '',
    parentGoalId: '',
    priority: 'medium' as Goal['priority']
  });

  // Fetch goals data
  useEffect(() => {
    async function fetchGoals() {
      if (!user) return;

      try {
        setData(prev => ({ ...prev, loading: true }));

        const response = await fetch('/api/goals');
        const result = await response.json();

        if (response.ok) {
          setData({
            goals: result.goals || [],
            stats: result.stats || { total: 0, completed: 0, inProgress: 0, notStarted: 0, overdue: 0 },
            loading: false
          });
        } else {
          throw new Error(result.error || 'Failed to fetch goals');
        }
      } catch (error) {
        console.error('Failed to fetch goals:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load goals'
        }));
      }
    }

    fetchGoals();
  }, [user]);

  // Create or update goal
  async function handleSaveGoal() {
    try {
      const url = editingGoal ? `/api/goals/${editingGoal.id}` : '/api/goals';
      const method = editingGoal ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          targetValue: Number(formData.targetValue),
          targetDate: formData.targetDate ? new Date(formData.targetDate).toISOString() : undefined
        })
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setEditingGoal(null);
        setFormData({
          title: '',
          description: '',
          type: 'monthly',
          category: '',
          targetValue: 100,
          targetDate: '',
          parentGoalId: '',
          priority: 'medium'
        });
        // Refresh data
        window.location.reload();
      } else {
        const error = await response.json();
        console.error('Failed to save goal:', error);
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  }

  // Delete goal
  async function handleDeleteGoal(goalId: string) {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const response = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  }

  // Toggle goal expansion
  function toggleExpanded(goalId: string) {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  }

  // Filter goals
  const filteredGoals = data.goals.filter(goal => {
    if (filter !== 'all' && goal.status !== filter) return false;
    if (selectedCategory !== 'all' && goal.category !== selectedCategory) return false;
    if (searchTerm && !goal.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Organize goals by hierarchy
  const rootGoals = filteredGoals.filter(goal => !goal.parentGoalId);
  const childGoalsByParent = filteredGoals.reduce((acc, goal) => {
    if (goal.parentGoalId) {
      if (!acc[goal.parentGoalId]) acc[goal.parentGoalId] = [];
      acc[goal.parentGoalId].push(goal);
    }
    return acc;
  }, {} as Record<string, Goal[]>);

  // Render goal card
  function renderGoalCard(goal: Goal, level = 0) {
    const hasChildren = childGoalsByParent[goal.id]?.length > 0;
    const isExpanded = expandedGoals.has(goal.id);
    const typeConfig = goalTypes.find(t => t.value === goal.type);

    return (
      <div key={goal.id} className={`${level > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
        <Card className={`mb-3 ${goal.isOverdue ? 'border-red-200 bg-red-50/50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {hasChildren && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleExpanded(goal.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  <h3 className="font-medium text-lg">{goal.title}</h3>
                  
                  <Badge variant="outline" className={`text-${typeConfig?.color}-600 border-${typeConfig?.color}-200`}>
                    {typeConfig?.label}
                  </Badge>
                  
                  {goal.priority === 'high' && (
                    <Badge variant="destructive">High Priority</Badge>
                  )}
                  
                  {goal.isOverdue && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Overdue
                    </Badge>
                  )}
                </div>

                {goal.description && (
                  <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Progress</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={goal.completionPercentage} className="flex-1" />
                      <span className="text-sm font-medium">{Math.round(goal.completionPercentage)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {goal.currentValue} / {goal.targetValue}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <p className="text-sm mt-1">{goal.category}</p>
                  </div>

                  {goal.targetDate && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Target Date</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {format(parseISO(goal.targetDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      {goal.daysRemaining !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {goal.daysRemaining > 0 ? `${goal.daysRemaining} days left` : 'Past due'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {hasChildren && (
                  <div className="text-xs text-muted-foreground">
                    {childGoalsByParent[goal.id].length} sub-goal{childGoalsByParent[goal.id].length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => {
                    setEditingGoal(goal);
                    setFormData({
                      title: goal.title,
                      description: goal.description || '',
                      type: goal.type,
                      category: goal.category,
                      targetValue: goal.targetValue,
                      targetDate: goal.targetDate ? format(parseISO(goal.targetDate), 'yyyy-MM-dd') : '',
                      parentGoalId: goal.parentGoalId || '',
                      priority: goal.priority
                    });
                    setShowCreateDialog(true);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteGoal(goal.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Render child goals */}
        {hasChildren && isExpanded && childGoalsByParent[goal.id] && (
          <div className="mb-4">
            {childGoalsByParent[goal.id].map(childGoal => 
              renderGoalCard(childGoal, level + 1)
            )}
          </div>
        )}
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
              <Target className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Goals</span>
            </Link>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Goal
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
                <span className="text-sm font-medium">Total Goals</span>
              </div>
              <div className="text-2xl font-bold">{data.loading ? '...' : data.stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <div className="text-2xl font-bold">{data.loading ? '...' : data.stats.completed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">In Progress</span>
              </div>
              <div className="text-2xl font-bold">{data.loading ? '...' : data.stats.inProgress}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Not Started</span>
              </div>
              <div className="text-2xl font-bold">{data.loading ? '...' : data.stats.notStarted}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Overdue</span>
              </div>
              <div className="text-2xl font-bold">{data.loading ? '...' : data.stats.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {goalCategories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Goals Content */}
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          </TabsList>

          <TabsContent value="hierarchy" className="space-y-4">
            {data.loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : data.error ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">{data.error}</p>
                </CardContent>
              </Card>
            ) : rootGoals.length > 0 ? (
              <div className="space-y-4">
                {rootGoals.map(goal => renderGoalCard(goal))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No goals yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your journey by creating your first goal. What would you like to achieve?
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Timeline View</h3>
                <p className="text-muted-foreground">Timeline visualization coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kanban" className="space-y-4">
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Kanban Board</h3>
                <p className="text-muted-foreground">Kanban board view coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Goal Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
              <DialogDescription>
                {editingGoal ? 'Update your goal details' : 'Set a new goal to achieve'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What do you want to achieve?"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal in detail..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as Goal['type'] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {goalTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {goalCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetValue">Target Value</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetValue: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as Goal['priority'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!editingGoal && (
                <div>
                  <Label htmlFor="parentGoal">Parent Goal (Optional)</Label>
                  <Select value={formData.parentGoalId} onValueChange={(value) => setFormData(prev => ({ ...prev, parentGoalId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No parent goal</SelectItem>
                      {data.goals.map(goal => (
                        <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveGoal} disabled={!formData.title || !formData.category}>
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}