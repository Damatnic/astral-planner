'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Target,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  BarChart3,
  Activity,
  Star,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  targetValue: number;
  currentValue: number;
  targetDate?: string;
  status: string;
  priority: string;
  parentGoal?: {
    id: string;
    title: string;
  };
  childGoals?: Array<{
    id: string;
    title: string;
    completionPercentage: number;
    status: string;
  }>;
  completionPercentage: number;
  isOverdue: boolean;
  daysRemaining?: number;
  progress?: Array<{
    date: string;
    value: number;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function GoalDetailPage() {
  // Mock user for development without authentication
  const user = { id: 'test-user', firstName: 'Test', lastName: 'User' };
  const params = useParams();
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressValue, setProgressValue] = useState('');
  const [progressNotes, setProgressNotes] = useState('');

  useEffect(() => {
    async function fetchGoal() {
      if (!user || !params.id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/goals/${params.id}`);
        const result = await response.json();

        if (response.ok) {
          setGoal(result);
        } else {
          throw new Error(result.error || 'Failed to fetch goal');
        }
      } catch (error) {
        console.error('Failed to fetch goal:', error);
        setError('Failed to load goal details');
      } finally {
        setLoading(false);
      }
    }

    fetchGoal();
  }, [user, params.id]);

  async function handleUpdateProgress() {
    if (!goal || !progressValue) return;

    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentValue: parseInt(progressValue),
          progress: parseInt(progressValue)
        })
      });

      if (response.ok) {
        setShowProgressDialog(false);
        setProgressValue('');
        setProgressNotes('');
        window.location.reload();
      } else {
        const error = await response.json();
        console.error('Failed to update progress:', error);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }

  async function handleDeleteGoal() {
    if (!goal || !confirm('Are you sure you want to delete this goal?')) return;

    try {
      const response = await fetch(`/api/goals/${goal.id}`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/goals');
      } else {
        const error = await response.json();
        console.error('Failed to delete goal:', error);
      }
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Goal not found</h3>
              <p className="text-muted-foreground mb-4">{error || 'The goal you are looking for does not exist.'}</p>
              <Button asChild>
                <Link href="/goals">Back to Goals</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    const colors = {
      lifetime: 'purple',
      yearly: 'blue',
      quarterly: 'green',
      monthly: 'orange',
      weekly: 'pink',
      daily: 'gray'
    };
    return colors[type as keyof typeof colors] || 'gray';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'blue',
      completed: 'green',
      paused: 'yellow',
      cancelled: 'red'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/goals">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Goals
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Goal Details</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/goals/${goal.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowProgressDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Update Progress
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteGoal}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Goal Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{goal.title}</h1>
                <Badge variant="outline" className={`text-${getTypeColor(goal.type)}-600`}>
                  {goal.type}
                </Badge>
                <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                  {goal.status}
                </Badge>
                {goal.isOverdue && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Overdue
                  </Badge>
                )}
              </div>
              
              {goal.description && (
                <p className="text-lg text-muted-foreground mb-4">{goal.description}</p>
              )}

              {goal.parentGoal && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Part of:</span>
                  <Link 
                    href={`/goals/${goal.parentGoal.id}`}
                    className="text-primary hover:underline"
                  >
                    {goal.parentGoal.title}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Progress Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Progress</Label>
                    <span className="text-2xl font-bold">{Math.round(goal.completionPercentage)}%</span>
                  </div>
                  <Progress value={goal.completionPercentage} className="h-3 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {goal.currentValue} of {goal.targetValue} completed
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-lg">{goal.category}</p>
                </div>

                {goal.targetDate && (
                  <div>
                    <Label className="text-sm font-medium">Target Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-lg">
                        {format(parseISO(goal.targetDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {goal.daysRemaining !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        {goal.daysRemaining > 0 ? `${goal.daysRemaining} days remaining` : 'Past due'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress History</TabsTrigger>
            <TabsTrigger value="subgoals">Sub-goals</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Goal Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Priority:</span>
                    <Badge variant={goal.priority === 'high' ? 'destructive' : 'secondary'}>
                      {goal.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{format(parseISO(goal.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{format(parseISO(goal.updatedAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Progress Rate:</span>
                    <span>{Math.round(goal.completionPercentage / Math.max(1, 
                      Math.ceil((new Date().getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    ) * 100) / 100}% per day</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={() => setShowProgressDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Update Progress
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/goals/${goal.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Goal
                    </Link>
                  </Button>
                  {goal.childGoals && goal.childGoals.length === 0 && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/goals/new?parent=${goal.id}`}>
                        <Target className="h-4 w-4 mr-2" />
                        Add Sub-goal
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress History</CardTitle>
                <CardDescription>Track your journey towards this goal</CardDescription>
              </CardHeader>
              <CardContent>
                {goal.progress && goal.progress.length > 0 ? (
                  <div className="space-y-4">
                    {goal.progress.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            <span className="font-medium">Progress Update</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Updated to {entry.value} on {format(parseISO(entry.date), 'MMM dd, yyyy')}
                          </p>
                          {entry.notes && (
                            <p className="text-sm mt-1">{entry.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{entry.value}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((entry.value / goal.targetValue) * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No progress updates yet</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setShowProgressDialog(true)}
                    >
                      Add First Update
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subgoals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sub-goals</CardTitle>
                <CardDescription>Break down this goal into smaller, manageable pieces</CardDescription>
              </CardHeader>
              <CardContent>
                {goal.childGoals && goal.childGoals.length > 0 ? (
                  <div className="space-y-4">
                    {goal.childGoals.map(subgoal => (
                      <div key={subgoal.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <Link 
                            href={`/goals/${subgoal.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {subgoal.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={subgoal.completionPercentage} className="flex-1 h-2" />
                            <span className="text-sm text-muted-foreground">
                              {Math.round(subgoal.completionPercentage)}%
                            </span>
                          </div>
                        </div>
                        <Badge variant={subgoal.status === 'completed' ? 'default' : 'secondary'}>
                          {subgoal.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No sub-goals yet</p>
                    <Button asChild>
                      <Link href={`/goals/new?parent=${goal.id}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Sub-goal
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground">Detailed analytics and insights coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Update Progress Dialog */}
        <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Progress</DialogTitle>
              <DialogDescription>
                Update your current progress for "{goal.title}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="progress">Current Progress</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max={goal.targetValue}
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                  placeholder={`Current: ${goal.currentValue} / Target: ${goal.targetValue}`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a value between 0 and {goal.targetValue}
                </p>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  placeholder="What did you accomplish?"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateProgress}
                disabled={!progressValue || parseInt(progressValue) < 0 || parseInt(progressValue) > goal.targetValue}
              >
                Update Progress
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}