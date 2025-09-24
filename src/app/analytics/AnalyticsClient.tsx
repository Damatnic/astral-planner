'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Activity,
  Calendar,
  PieChart,
  Users,
  Zap,
  Award,
  Brain,
  ChevronRight,
  Download,
  Filter
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Mock data - would come from API
const productivityData = [
  { day: 'Mon', score: 75, tasks: 12, focus: 3.5 },
  { day: 'Tue', score: 82, tasks: 15, focus: 4.2 },
  { day: 'Wed', score: 78, tasks: 10, focus: 3.8 },
  { day: 'Thu', score: 91, tasks: 18, focus: 5.1 },
  { day: 'Fri', score: 85, tasks: 14, focus: 4.5 },
  { day: 'Sat', score: 65, tasks: 8, focus: 2.5 },
  { day: 'Sun', score: 70, tasks: 9, focus: 3.0 }
];

const timeDistribution = [
  { category: 'Deep Work', value: 35, color: '#3b82f6' },
  { category: 'Meetings', value: 25, color: '#10b981' },
  { category: 'Communication', value: 20, color: '#f59e0b' },
  { category: 'Planning', value: 10, color: '#8b5cf6' },
  { category: 'Breaks', value: 10, color: '#ec4899' }
];

const goalProgress = [
  { goal: 'Project Launch', current: 75, target: 100 },
  { goal: 'Learn React', current: 60, target: 100 },
  { goal: 'Fitness Goals', current: 85, target: 100 },
  { goal: 'Reading Challenge', current: 40, target: 100 },
  { goal: 'Side Business', current: 30, target: 100 }
];

const habitStreaks = [
  { habit: 'Morning Routine', streak: 21, best: 45, consistency: 90 },
  { habit: 'Exercise', streak: 14, best: 30, consistency: 75 },
  { habit: 'Reading', streak: 7, best: 21, consistency: 65 },
  { habit: 'Meditation', streak: 35, best: 35, consistency: 95 },
  { habit: 'Journaling', streak: 10, best: 28, consistency: 70 }
];

const focusPatterns = [
  { hour: '6AM', productivity: 20 },
  { hour: '7AM', productivity: 40 },
  { hour: '8AM', productivity: 65 },
  { hour: '9AM', productivity: 85 },
  { hour: '10AM', productivity: 95 },
  { hour: '11AM', productivity: 90 },
  { hour: '12PM', productivity: 60 },
  { hour: '1PM', productivity: 45 },
  { hour: '2PM', productivity: 70 },
  { hour: '3PM', productivity: 80 },
  { hour: '4PM', productivity: 75 },
  { hour: '5PM', productivity: 55 },
  { hour: '6PM', productivity: 30 },
  { hour: '7PM', productivity: 25 }
];

const weeklyStats = {
  tasksCompleted: 89,
  totalTasks: 105,
  focusTime: 28.5,
  targetFocus: 35,
  productivityScore: 82,
  previousScore: 78,
  streakDays: 21,
  longestStreak: 45
};

const skillsRadar = [
  { skill: 'Focus', A: 85, fullMark: 100 },
  { skill: 'Consistency', A: 75, fullMark: 100 },
  { skill: 'Planning', A: 90, fullMark: 100 },
  { skill: 'Execution', A: 80, fullMark: 100 },
  { skill: 'Balance', A: 70, fullMark: 100 },
  { skill: 'Growth', A: 85, fullMark: 100 }
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('week');
  const [view, setView] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Track your productivity and progress
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Productivity Score
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyStats.productivityScore}%</div>
              <div className="flex items-center text-xs text-green-600 mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{weeklyStats.productivityScore - weeklyStats.previousScore}% from last week
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Task Completion
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weeklyStats.tasksCompleted}/{weeklyStats.totalTasks}
              </div>
              <Progress 
                value={(weeklyStats.tasksCompleted / weeklyStats.totalTasks) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Focus Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyStats.focusTime}h</div>
              <div className="text-xs text-muted-foreground mt-2">
                Target: {weeklyStats.targetFocus}h
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Streak
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">🔥 {weeklyStats.streakDays} days</div>
              <div className="text-xs text-muted-foreground mt-2">
                Best: {weeklyStats.longestStreak} days
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs for different views */}
        <Tabs value={view} onValueChange={setView} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Productivity Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Productivity Trend</CardTitle>
                  <CardDescription>Your productivity score over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={productivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="tasks" 
                        stroke="#10b981" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Time Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Time Distribution</CardTitle>
                  <CardDescription>How you spend your time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={timeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.category}: ${entry.value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {timeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Focus Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Focus Patterns</CardTitle>
                <CardDescription>Your productivity throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={focusPatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="productivity" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="productivity" className="space-y-6">
            {/* Skills Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Productivity Skills</CardTitle>
                <CardDescription>Your strengths and areas for improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={skillsRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar 
                      name="Current" 
                      dataKey="A" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6} 
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Goal Progress</CardTitle>
                <CardDescription>Track your progress towards your goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goalProgress.map((goal) => (
                    <div key={goal.goal}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{goal.goal}</span>
                        <span className="text-sm text-muted-foreground">
                          {goal.current}%
                        </span>
                      </div>
                      <Progress value={goal.current} className="h-3" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="habits" className="space-y-6">
            <div className="grid gap-4">
              {habitStreaks.map((habit) => (
                <Card key={habit.habit}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{habit.habit}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {habit.consistency}% consistency
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {habit.streak === habit.best ? '🏆' : '🔥'} {habit.streak}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Best: {habit.best}
                        </p>
                      </div>
                    </div>
                    <Progress value={habit.consistency} className="mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-medium mb-2">🎯 Peak Performance Time</h4>
                  <p className="text-sm text-muted-foreground">
                    You're most productive between 9-11 AM. Consider scheduling your most 
                    important tasks during this window for optimal results.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <h4 className="font-medium mb-2">📈 Positive Trend</h4>
                  <p className="text-sm text-muted-foreground">
                    Your productivity has increased by 5% this week. The main contributor 
                    is your improved focus time management.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <h4 className="font-medium mb-2">💡 Suggestion</h4>
                  <p className="text-sm text-muted-foreground">
                    You tend to have lower energy after lunch. Try a 15-minute walk or 
                    light exercise at 1 PM to boost afternoon productivity.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <h4 className="font-medium mb-2">🎉 Achievement Unlocked</h4>
                  <p className="text-sm text-muted-foreground">
                    You've maintained a 21-day streak! You're now in the top 10% of users 
                    for consistency.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}