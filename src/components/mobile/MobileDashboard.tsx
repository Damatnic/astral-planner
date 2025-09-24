'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  Calendar,
  Target,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileDashboardProps {
  className?: string
}

// Mock data for demonstration
const mockData = {
  todayTasks: [
    { id: '1', title: 'Review quarterly reports', completed: false, priority: 'high' },
    { id: '2', title: 'Team standup meeting', completed: true, priority: 'medium' },
    { id: '3', title: 'Update project documentation', completed: false, priority: 'low' },
  ],
  goals: [
    { id: '1', title: 'Complete React certification', progress: 75 },
    { id: '2', title: 'Read 12 books this year', progress: 45 },
  ],
  stats: {
    completedToday: 8,
    totalToday: 12,
    weeklyStreak: 5,
    monthlyGoals: 3
  }
}

export function MobileDashboard({ className }: MobileDashboardProps) {
  const [activeSection, setActiveSection] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const sections = [
    { id: 'overview', title: 'Overview', icon: TrendingUp },
    { id: 'tasks', title: 'Tasks', icon: CheckCircle2 },
    { id: 'goals', title: 'Goals', icon: Target },
    { id: 'calendar', title: 'Calendar', icon: Calendar },
  ]

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const containerWidth = container.clientWidth
      const scrollLeft = container.scrollLeft
      const sectionIndex = Math.round(scrollLeft / containerWidth)
      setActiveSection(sectionIndex)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (index: number) => {
    const container = scrollContainerRef.current
    if (!container) return

    const containerWidth = container.clientWidth
    container.scrollTo({
      left: index * containerWidth,
      behavior: 'smooth'
    })
    setActiveSection(index)
  }

  return (
    <div className={cn('w-full mobile:pb-4', className)}>
      {/* Section Navigation */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {sections.map((section, index) => (
          <Button
            key={section.id}
            variant={activeSection === index ? 'default' : 'outline'}
            size="sm"
            onClick={() => scrollToSection(index)}
            className={cn(
              'flex-shrink-0 text-mobile-sm',
              activeSection === index && 'shadow-sm'
            )}
          >
            <section.icon className="h-4 w-4 mr-2" />
            {section.title}
          </Button>
        ))}
      </div>

      {/* Scrollable Sections */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Overview Section */}
        <div className="w-full flex-shrink-0 snap-start px-1">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-mobile-xs text-muted-foreground">Today</p>
                  <p className="text-mobile-lg font-semibold">
                    {mockData.stats.completedToday}/{mockData.stats.totalToday}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Zap className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-mobile-xs text-muted-foreground">Streak</p>
                  <p className="text-mobile-lg font-semibold">{mockData.stats.weeklyStreak} days</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-mobile-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12 text-mobile-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              <Button variant="outline" className="h-12 text-mobile-sm">
                <Target className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section */}
        <div className="w-full flex-shrink-0 snap-start px-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-mobile-base">Today's Tasks</CardTitle>
                <Button variant="ghost" size="sm" className="text-mobile-xs">
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockData.todayTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <button className="flex-shrink-0">
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-mobile-sm font-medium truncate',
                      task.completed && 'line-through text-muted-foreground'
                    )}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        'text-mobile-xs px-2 py-0.5 rounded-full',
                        task.priority === 'high' && 'bg-destructive/20 text-destructive',
                        task.priority === 'medium' && 'bg-warning/20 text-warning',
                        task.priority === 'low' && 'bg-muted text-muted-foreground'
                      )}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Goals Section */}
        <div className="w-full flex-shrink-0 snap-start px-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-mobile-base">Active Goals</CardTitle>
                <Button variant="ghost" size="sm" className="text-mobile-xs">
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockData.goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-mobile-sm font-medium">{goal.title}</p>
                    <span className="text-mobile-xs text-muted-foreground">
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Calendar Section */}
        <div className="w-full flex-shrink-0 snap-start px-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-mobile-base">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-mobile-sm font-medium">Team Meeting</p>
                    <p className="text-mobile-xs text-muted-foreground">Today, 2:00 PM</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-mobile-sm font-medium">Project Deadline</p>
                    <p className="text-mobile-xs text-muted-foreground">Tomorrow, 5:00 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              activeSection === index ? 'bg-primary' : 'bg-muted-foreground/30'
            )}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>

      {/* Mobile Styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default MobileDashboard