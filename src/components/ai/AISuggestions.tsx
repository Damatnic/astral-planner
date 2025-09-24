'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/lib/hooks/use-toast'
import { 
  Brain, Lightbulb, Target, Clock, TrendingUp, 
  Plus, Loader2, CheckCircle, Calendar,
  Sparkles, BarChart3
} from 'lucide-react'

interface TaskSuggestion {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  estimatedHours: number
  category: string
  tags: string[]
}

interface ProductivityInsight {
  insights: string[]
  recommendations: string[]
  score: number
}

export function AISuggestions() {
  const [loading, setLoading] = useState(false)
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([])
  const [insights, setInsights] = useState<ProductivityInsight | null>(null)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalBreakdown, setGoalBreakdown] = useState<any>(null)
  const { toast } = useToast()

  const generateTaskSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tasks',
          context: {
            workContext: 'General productivity',
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate suggestions')
      }

      const data = await response.json()
      setTaskSuggestions(data.data)
      
      toast({
        title: 'AI Suggestions Generated',
        description: `Generated ${data.data.length} task suggestions`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate task suggestions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const generateGoalBreakdown = async () => {
    if (!goalTitle || !goalDescription) {
      toast({
        title: 'Error',
        description: 'Please provide both goal title and description',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'goal-breakdown',
          context: {
            goalTitle,
            goalDescription,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to breakdown goal')
      }

      const data = await response.json()
      setGoalBreakdown(data.data)
      
      toast({
        title: 'Goal Breakdown Generated',
        description: 'AI has created milestones and tasks for your goal',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate goal breakdown',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'insights',
          context: {},
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate insights')
      }

      const data = await response.json()
      setInsights(data.data)
      
      toast({
        title: 'Insights Generated',
        description: 'AI has analyzed your productivity patterns',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate productivity insights',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (suggestion: TaskSuggestion) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: suggestion.title,
          description: suggestion.description,
          priority: suggestion.priority,
          estimatedHours: suggestion.estimatedHours,
          tags: suggestion.tags,
          type: 'task',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create task')
      }

      toast({
        title: 'Task Created',
        description: `"${suggestion.title}" has been added to your tasks`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">AI Assistant</h2>
        <Sparkles className="h-5 w-5 text-yellow-500" />
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">Task Suggestions</TabsTrigger>
          <TabsTrigger value="goals">Goal Breakdown</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Smart Task Suggestions
              </CardTitle>
              <CardDescription>
                Get AI-powered task recommendations based on your goals and habits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={generateTaskSuggestions}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate Suggestions
                </Button>

                {taskSuggestions.length > 0 && (
                  <div className="space-y-3">
                    {taskSuggestions.map((suggestion, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold mb-2">{suggestion.title}</h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                {suggestion.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant={getPriorityColor(suggestion.priority)}>
                                  {suggestion.priority}
                                </Badge>
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {suggestion.estimatedHours}h
                                </Badge>
                                <Badge variant="outline">{suggestion.category}</Badge>
                                {suggestion.tags.map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="secondary">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addTask(suggestion)}
                              className="flex-shrink-0"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goal Breakdown
              </CardTitle>
              <CardDescription>
                Break down complex goals into actionable milestones and tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="goal-title">Goal Title</Label>
                    <Input
                      id="goal-title"
                      placeholder="e.g., Launch my online business"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="goal-description">Goal Description</Label>
                    <Textarea
                      id="goal-description"
                      placeholder="Provide details about your goal..."
                      value={goalDescription}
                      onChange={(e) => setGoalDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <Button 
                  onClick={generateGoalBreakdown}
                  disabled={loading || !goalTitle || !goalDescription}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Break Down Goal
                </Button>

                {goalBreakdown && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Milestones
                      </h4>
                      <div className="space-y-2">
                        {goalBreakdown.milestones.map((milestone: any, index: number) => (
                          <Card key={index} className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium">{milestone.title}</h5>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {milestone.description}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge variant={getPriorityColor(milestone.priority)}>
                                    {milestone.priority}
                                  </Badge>
                                  {milestone.deadline && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Due: {new Date(milestone.deadline).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Suggested Tasks
                      </h4>
                      <div className="space-y-2">
                        {goalBreakdown.suggestedTasks.map((task: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="pt-3">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <h5 className="font-medium">{task.title}</h5>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {task.description}
                                  </p>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant={getPriorityColor(task.priority)}>
                                      {task.priority}
                                    </Badge>
                                    <Badge variant="outline">
                                      {task.estimatedHours}h
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => addTask(task)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Productivity Insights
              </CardTitle>
              <CardDescription>
                AI analysis of your productivity patterns and personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={generateInsights}
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Analyze My Productivity
                </Button>

                {insights && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {insights.score}/100
                      </div>
                      <p className="text-muted-foreground">Productivity Score</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Key Insights
                      </h4>
                      <div className="space-y-2">
                        {insights.insights.map((insight, index) => (
                          <Card key={index} className="border-l-4 border-l-green-500">
                            <CardContent className="pt-3">
                              <p className="text-sm">{insight}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Recommendations
                      </h4>
                      <div className="space-y-2">
                        {insights.recommendations.map((rec, index) => (
                          <Card key={index} className="border-l-4 border-l-yellow-500">
                            <CardContent className="pt-3">
                              <p className="text-sm">{rec}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}