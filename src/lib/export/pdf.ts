import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportTask, ExportGoal, ExportHabit } from './csv'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
  }
}

const COLORS = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
}

function addHeader(doc: jsPDF, title: string) {
  // Logo/Brand area
  doc.setFillColor(59, 130, 246) // primary color
  doc.rect(0, 0, doc.internal.pageSize.width, 25, 'F')
  
  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('✨ Astral Planner', 20, 17)
  
  // Report title
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 20, 40)
  
  // Date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 50)
  
  return 60 // Return Y position for content
}

function addFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width
  
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('Powered by Astral Planner', 20, pageHeight - 10)
  
  // Page number
  const pageCount = (doc as any).internal.getNumberOfPages()
  doc.text(`Page 1 of ${pageCount}`, pageWidth - 40, pageHeight - 10)
}

export function exportTasksToPDF(tasks: ExportTask[], title = 'Tasks Report'): jsPDF {
  const doc = new jsPDF()
  
  const startY = addHeader(doc, title)
  
  // Summary stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const overdueTasks = tasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
  ).length
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 20, startY + 10)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Tasks: ${totalTasks}`, 20, startY + 25)
  doc.text(`Completed: ${completedTasks} (${Math.round((completedTasks/totalTasks)*100)}%)`, 20, startY + 35)
  doc.text(`Overdue: ${overdueTasks}`, 20, startY + 45)
  
  // Tasks table
  const tableData = tasks.map(task => [
    task.title,
    task.status,
    task.priority,
    task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-',
    task.tags?.join(', ') || '-',
    task.estimatedHours?.toString() || '-',
  ])
  
  autoTable(doc, {
    head: [['Title', 'Status', 'Priority', 'Due Date', 'Tags', 'Est. Hours']],
    body: tableData,
    startY: startY + 60,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 60 }, // Title
      1: { cellWidth: 25 }, // Status
      2: { cellWidth: 25 }, // Priority
      3: { cellWidth: 30 }, // Due Date
      4: { cellWidth: 40 }, // Tags
      5: { cellWidth: 20 }, // Hours
    },
  })
  
  addFooter(doc)
  return doc
}

export function exportGoalsToPDF(goals: ExportGoal[], title = 'Goals Report'): jsPDF {
  const doc = new jsPDF()
  
  const startY = addHeader(doc, title)
  
  // Summary stats
  const totalGoals = goals.length
  const completedGoals = goals.filter(g => g.status === 'completed').length
  const avgProgress = goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 20, startY + 10)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Goals: ${totalGoals}`, 20, startY + 25)
  doc.text(`Completed: ${completedGoals} (${Math.round((completedGoals/totalGoals)*100)}%)`, 20, startY + 35)
  doc.text(`Average Progress: ${Math.round(avgProgress)}%`, 20, startY + 45)
  
  // Goals table
  const tableData = goals.map(goal => [
    goal.title,
    goal.category,
    goal.status,
    `${goal.currentValue}/${goal.targetValue} ${goal.unit || ''}`,
    `${goal.progress}%`,
    goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '-',
  ])
  
  autoTable(doc, {
    head: [['Title', 'Category', 'Status', 'Progress', '%', 'Deadline']],
    body: tableData,
    startY: startY + 60,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 50 }, // Title
      1: { cellWidth: 30 }, // Category
      2: { cellWidth: 25 }, // Status
      3: { cellWidth: 40 }, // Progress
      4: { cellWidth: 20 }, // %
      5: { cellWidth: 35 }, // Deadline
    },
  })
  
  addFooter(doc)
  return doc
}

export function exportHabitsToPDF(habits: ExportHabit[], title = 'Habits Report'): jsPDF {
  const doc = new jsPDF()
  
  const startY = addHeader(doc, title)
  
  // Summary stats
  const totalHabits = habits.length
  const avgStreak = habits.reduce((sum, h) => sum + h.currentStreak, 0) / totalHabits
  const avgCompletion = habits.reduce((sum, h) => sum + h.completionRate, 0) / totalHabits
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 20, startY + 10)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Habits: ${totalHabits}`, 20, startY + 25)
  doc.text(`Average Streak: ${Math.round(avgStreak)} days`, 20, startY + 35)
  doc.text(`Average Completion: ${Math.round(avgCompletion * 100)}%`, 20, startY + 45)
  
  // Habits table
  const tableData = habits.map(habit => [
    habit.name,
    habit.frequency,
    habit.currentStreak.toString(),
    habit.longestStreak.toString(),
    `${Math.round(habit.completionRate * 100)}%`,
  ])
  
  autoTable(doc, {
    head: [['Name', 'Frequency', 'Current Streak', 'Best Streak', 'Completion Rate']],
    body: tableData,
    startY: startY + 60,
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 60 }, // Name
      1: { cellWidth: 30 }, // Frequency
      2: { cellWidth: 30 }, // Current Streak
      3: { cellWidth: 30 }, // Best Streak
      4: { cellWidth: 40 }, // Completion Rate
    },
  })
  
  addFooter(doc)
  return doc
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
}