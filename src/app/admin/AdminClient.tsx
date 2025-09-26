'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Users, Activity, Database, Settings, TrendingUp, 
  AlertCircle, CheckCircle, XCircle, RefreshCw,
  Download, Upload, Search, Filter
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Logger from '@/lib/logger'
import type { AdminUser, AdminActivity, AdminStats } from '@/types'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalTasks: number
  completedTasks: number
  totalGoals: number
  activeHabits: number
  totalWorkspaces: number
  storageUsed: string
}

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down'
  redis: 'healthy' | 'degraded' | 'down'
  pusher: 'healthy' | 'degraded' | 'down'
  api: 'healthy' | 'degraded' | 'down'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  // const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, healthRes, usersRes, activitiesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/health'),
        fetch('/api/admin/users?limit=10'),
        fetch('/api/admin/activities?limit=20'),
      ])

      if (!statsRes.ok || !healthRes.ok || !usersRes.ok || !activitiesRes.ok) {
        throw new Error('Failed to fetch admin data')
      }

      const [statsData, healthData, usersData, activitiesData] = await Promise.all([
        statsRes.json(),
        healthRes.json(),
        usersRes.json(),
        activitiesRes.json(),
      ])

      setStats(statsData)
      setHealth(healthData)
      setUsers(usersData.users)
      setActivities(activitiesData.activities)
      setLoading(false)
    } catch (error) {
      Logger.error('Admin dashboard error:', error)
      toast('Failed to load dashboard data', {
        description: 'Could not fetch admin dashboard data',
      })
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/admin/export')
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `admin-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast('Export successful', {
        description: 'Admin data has been exported',
      })
    } catch (error) {
      Logger.error('Export failed:', error)
      toast('Export failed', {
        description: 'Failed to export admin data',
      })
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {health && Object.entries(health).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="capitalize font-medium">{service}</span>
                {getHealthIcon(status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} active today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedTasks || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGoals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.storageUsed || '0 MB'}</div>
            <p className="text-xs text-muted-foreground">
              Database storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Users and Activities */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>User Management</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">Edit</Button>
                          <Button variant="ghost" size="sm">Suspend</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest system activities and events</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 pb-4 border-b">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>
                          {' '}{activity.action}{' '}
                          <span className="font-medium">{activity.target}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {activity.metadata && (
                        <Badge variant="outline">{activity.metadata.type}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system parameters and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Maintenance Mode</label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Enable</Button>
                    <span className="text-sm text-muted-foreground">Currently: Disabled</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cache Management</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Clear Redis</Button>
                    <Button variant="outline" size="sm">Clear CDN</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Database Backup</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Create Backup</Button>
                    <span className="text-sm text-muted-foreground">Last: 2 hours ago</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Feature Flags</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Manage Flags</Button>
                    <span className="text-sm text-muted-foreground">5 active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}