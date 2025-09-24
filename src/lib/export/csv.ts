import Papa from 'papaparse'

export interface ExportTask {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  createdAt: string
  completedAt?: string
  tags?: string[]
  estimatedHours?: number
  actualHours?: number
}

export interface ExportGoal {
  id: string
  title: string
  description?: string
  category: string
  status: string
  targetValue: number
  currentValue: number
  unit?: string
  deadline?: string
  createdAt: string
  progress: number
}

export interface ExportHabit {
  id: string
  name: string
  description?: string
  frequency: string
  targetCount: number
  currentStreak: number
  longestStreak: number
  completionRate: number
  createdAt: string
}

export function exportTasksToCSV(tasks: ExportTask[]): string {
  const csvData = tasks.map(task => ({
    ID: task.id,
    Title: task.title,
    Description: task.description || '',
    Status: task.status,
    Priority: task.priority,
    'Due Date': task.dueDate || '',
    'Created At': task.createdAt,
    'Completed At': task.completedAt || '',
    Tags: task.tags?.join(', ') || '',
    'Estimated Hours': task.estimatedHours || '',
    'Actual Hours': task.actualHours || '',
  }))

  return Papa.unparse(csvData)
}

export function exportGoalsToCSV(goals: ExportGoal[]): string {
  const csvData = goals.map(goal => ({
    ID: goal.id,
    Title: goal.title,
    Description: goal.description || '',
    Category: goal.category,
    Status: goal.status,
    'Target Value': goal.targetValue,
    'Current Value': goal.currentValue,
    Unit: goal.unit || '',
    Deadline: goal.deadline || '',
    'Created At': goal.createdAt,
    'Progress (%)': goal.progress,
  }))

  return Papa.unparse(csvData)
}

export function exportHabitsToCSV(habits: ExportHabit[]): string {
  const csvData = habits.map(habit => ({
    ID: habit.id,
    Name: habit.name,
    Description: habit.description || '',
    Frequency: habit.frequency,
    'Target Count': habit.targetCount,
    'Current Streak': habit.currentStreak,
    'Best Streak': habit.longestStreak,
    'Completion Rate (%)': Math.round(habit.completionRate * 100),
    'Created At': habit.createdAt,
  }))

  return Papa.unparse(csvData)
}

export function downloadCSV(csvData: string, filename: string) {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}