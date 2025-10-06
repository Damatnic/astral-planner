'use client';

import { useState, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic imports for better performance
const DynamicCharts = {
  ResponsiveContainer: null as any,
  LineChart: null as any,
  Line: null as any,
  AreaChart: null as any,
  Area: null as any,
  BarChart: null as any,
  Bar: null as any,
  PieChart: null as any,
  Pie: null as any,
  Cell: null as any,
  XAxis: null as any,
  YAxis: null as any,
  CartesianGrid: null as any,
  Tooltip: null as any,
  Legend: null as any,
  RadarChart: null as any,
  PolarGrid: null as any,
  PolarAngleAxis: null as any,
  PolarRadiusAxis: null as any,
  Radar: null as any,
};

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
  { hour: '5PM', productivity: 50 },
  { hour: '6PM', productivity: 35 },
  { hour: '7PM', productivity: 25 }
];

const skillsRadar = [
  { skill: 'Time Management', A: 80, B: 90, fullMark: 100 },
  { skill: 'Focus', A: 90, B: 85, fullMark: 100 },
  { skill: 'Productivity', A: 75, B: 80, fullMark: 100 },
  { skill: 'Planning', A: 85, B: 70, fullMark: 100 },
  { skill: 'Execution', A: 70, B: 85, fullMark: 100 },
  { skill: 'Balance', A: 60, B: 75, fullMark: 100 }
];

// Chart skeleton component
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full space-y-3" style={{ height }}>
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="h-full w-full rounded-lg" />
  </div>
);

// Smart chart component that loads charts only when needed
const SmartChart = ({ type, data, config, height = 300 }: {
  type: 'area' | 'pie' | 'bar' | 'radar';
  data: any;
  config: any;
  height?: number;
}) => {
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chartsLoaded && !loading) {
      setLoading(true);
      import('recharts').then((recharts) => {
        DynamicCharts.ResponsiveContainer = recharts.ResponsiveContainer;
        DynamicCharts.LineChart = recharts.LineChart;
        DynamicCharts.Line = recharts.Line;
        DynamicCharts.AreaChart = recharts.AreaChart;
        DynamicCharts.Area = recharts.Area;
        DynamicCharts.BarChart = recharts.BarChart;
        DynamicCharts.Bar = recharts.Bar;
        DynamicCharts.PieChart = recharts.PieChart;
        DynamicCharts.Pie = recharts.Pie;
        DynamicCharts.Cell = recharts.Cell;
        DynamicCharts.XAxis = recharts.XAxis;
        DynamicCharts.YAxis = recharts.YAxis;
        DynamicCharts.CartesianGrid = recharts.CartesianGrid;
        DynamicCharts.Tooltip = recharts.Tooltip;
        DynamicCharts.Legend = recharts.Legend;
        DynamicCharts.RadarChart = recharts.RadarChart;
        DynamicCharts.PolarGrid = recharts.PolarGrid;
        DynamicCharts.PolarAngleAxis = recharts.PolarAngleAxis;
        DynamicCharts.PolarRadiusAxis = recharts.PolarRadiusAxis;
        DynamicCharts.Radar = recharts.Radar;
        setChartsLoaded(true);
        setLoading(false);
      });
    }
  }, [chartsLoaded, loading]);

  if (!chartsLoaded) {
    return <ChartSkeleton height={height} />;
  }

  // Pre-destructure all components to avoid scoping conflicts
  const {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
  } = DynamicCharts;

  switch (type) {
    case 'area':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xKey} />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey={config.dataKey} 
              stroke={config.color} 
              fill={config.color} 
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      );

    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ category, percent }: any) => `${category} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xKey} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={config.dataKey} fill={config.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'radar':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={data}>
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
      );

    default:
      return <ChartSkeleton height={height} />;
  }
};

export default function AnalyticsClient() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [chartsLoaded, setChartsLoaded] = useState(true); // Start with charts loaded to remove skeleton states

  const stats = [
    {
      title: 'Productivity Score',
      value: '87%',
      change: '+12%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Tasks Completed',
      value: '142',
      change: '+8',
      trend: 'up',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      title: 'Focus Time',
      value: '28.5h',
      change: '+3.2h',
      trend: 'up',
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      title: 'Active Days',
      value: '23/30',
      change: '+5',
      trend: 'up',
      icon: Calendar,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950">
      {/* Animated cosmic orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto p-6 space-y-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-2">
            <BarChart3 className="h-8 w-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Analytics & Insights
            </h1>
          </div>
          <p className="text-lg text-purple-300/70 max-w-2xl mx-auto">
            Deep insights into your productivity patterns, goal progress, and performance metrics.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-40 bg-purple-950/50 border-purple-800/30 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="border-purple-700/50 text-purple-200 hover:bg-purple-950/50">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden backdrop-blur-xl bg-slate-900/80 border-purple-800/30 shadow-2xl shadow-purple-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-300/70">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-200">{stat.value}</p>
                    <p className={`text-sm ${stat.color} flex items-center`}>
                      {stat.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : null}
                      {stat.change} from last week
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-gradient-to-r ${
                    stat.color.includes('green') ? 'from-green-500 to-emerald-500' :
                    stat.color.includes('blue') ? 'from-blue-500 to-cyan-500' :
                    stat.color.includes('purple') ? 'from-purple-500 to-pink-500' :
                    'from-orange-500 to-red-500'
                  }`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="productivity">Productivity</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="habits">Habits</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Productivity Trend */}
                <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 shadow-2xl shadow-purple-900/50">
                  <CardHeader>
                    <CardTitle className="text-purple-200">Productivity Trend</CardTitle>
                    <CardDescription className="text-purple-300/70">Your productivity score over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SmartChart 
                      type="area" 
                      data={productivityData} 
                      config={{ xKey: 'day', dataKey: 'score', color: '#3b82f6' }}
                      height={300} 
                    />
                  </CardContent>
                </Card>

                {/* Time Distribution */}
                <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 shadow-2xl shadow-purple-900/50">
                  <CardHeader>
                    <CardTitle className="text-purple-200">Time Distribution</CardTitle>
                    <CardDescription className="text-purple-300/70">How you spend your time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SmartChart type="pie" data={timeDistribution} config={{}} height={300} />
                  </CardContent>
                </Card>
              </div>

              {/* Focus Patterns */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 shadow-2xl shadow-purple-900/50">
                <CardHeader>
                  <CardTitle className="text-purple-200">Daily Focus Patterns</CardTitle>
                  <CardDescription className="text-purple-300/70">Your productivity throughout the day</CardDescription>
                </CardHeader>
                <CardContent>
                  <SmartChart 
                    type="bar" 
                    data={focusPatterns} 
                    config={{ xKey: 'hour', dataKey: 'productivity', color: '#3b82f6' }}
                    height={300} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="productivity" className="space-y-6">
              {/* Skills Radar */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 shadow-2xl shadow-purple-900/50">
                <CardHeader>
                  <CardTitle className="text-purple-200">Productivity Skills</CardTitle>
                  <CardDescription className="text-purple-300/70">Your strengths and areas for improvement</CardDescription>
                </CardHeader>
                <CardContent>
                  <SmartChart type="radar" data={skillsRadar} config={{}} height={400} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-6">
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 shadow-2xl shadow-purple-900/50">
                <CardHeader>
                  <CardTitle className="text-purple-200">Goal Progress</CardTitle>
                  <CardDescription className="text-purple-300/70">Track your progress towards your goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {goalProgress.map((goal) => (
                      <div key={goal.goal}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-200">{goal.goal}</span>
                          <span className="text-sm text-purple-300/70">
                            {goal.current}% / {goal.target}%
                          </span>
                        </div>
                        <Progress value={goal.current} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="habits" className="space-y-6">
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 shadow-2xl shadow-purple-900/50">
                <CardHeader>
                  <CardTitle className="text-purple-200">Habit Streaks</CardTitle>
                  <CardDescription className="text-purple-300/70">Your current streaks and consistency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {habitStreaks.map((habit) => (
                      <div key={habit.habit} className="flex items-center justify-between p-4 border border-purple-800/30 rounded-lg bg-purple-950/30">
                        <div>
                          <h4 className="font-medium text-purple-200">{habit.habit}</h4>
                          <p className="text-sm text-purple-300/70">
                            Current streak: {habit.streak} days
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">{habit.consistency}%</div>
                          <div className="text-xs text-purple-300/70">Consistency</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}