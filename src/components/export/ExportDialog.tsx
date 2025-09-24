'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/lib/hooks/use-toast'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { exportTasksToCSV, exportGoalsToCSV, exportHabitsToCSV, downloadCSV } from '@/lib/export/csv'
import { exportTasksToPDF, exportGoalsToPDF, exportHabitsToPDF, downloadPDF } from '@/lib/export/pdf'

interface ExportDialogProps {
  children: React.ReactNode
  dataType: 'tasks' | 'goals' | 'habits' | 'all'
  data?: any[]
}

export function ExportDialog({ children, dataType, data = [] }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv')
  const [dateRange, setDateRange] = useState('all')
  const [includeCompleted, setIncludeCompleted] = useState(true)
  const [includeArchived, setIncludeArchived] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setLoading(true)
    
    try {
      // Filter data based on selections
      let filteredData = data

      // Date range filtering
      if (dateRange !== 'all') {
        const now = new Date()
        const cutoffDate = new Date()
        
        switch (dateRange) {
          case 'week':
            cutoffDate.setDate(now.getDate() - 7)
            break
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1)
            break
          case 'quarter':
            cutoffDate.setMonth(now.getMonth() - 3)
            break
          case 'year':
            cutoffDate.setFullYear(now.getFullYear() - 1)
            break
        }
        
        filteredData = filteredData.filter((item: any) => 
          new Date(item.createdAt) >= cutoffDate
        )
      }

      // Status filtering
      if (!includeCompleted) {
        filteredData = filteredData.filter((item: any) => 
          item.status !== 'completed'
        )
      }

      if (!includeArchived) {
        filteredData = filteredData.filter((item: any) => 
          !item.isArchived && !item.isDeleted
        )
      }

      const filename = `${dataType}_export`
      
      if (format === 'csv') {
        let csvData: string
        
        switch (dataType) {
          case 'tasks':
            csvData = exportTasksToCSV(filteredData)
            break
          case 'goals':
            csvData = exportGoalsToCSV(filteredData)
            break
          case 'habits':
            csvData = exportHabitsToCSV(filteredData)
            break
          default:
            throw new Error('Unsupported data type for CSV export')
        }
        
        downloadCSV(csvData, filename)
      } else {
        let doc
        
        switch (dataType) {
          case 'tasks':
            doc = exportTasksToPDF(filteredData, 'Tasks Report')
            break
          case 'goals':
            doc = exportGoalsToPDF(filteredData, 'Goals Report')
            break
          case 'habits':
            doc = exportHabitsToPDF(filteredData, 'Habits Report')
            break
          default:
            throw new Error('Unsupported data type for PDF export')
        }
        
        downloadPDF(doc, filename)
      }
      
      toast({
        title: 'Export successful',
        description: `Your ${dataType} have been exported as ${format.toUpperCase()}`,
      })
      
      setOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export {dataType}
          </DialogTitle>
          <DialogDescription>
            Choose your export format and options
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value: 'csv' | 'pdf') => setFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Spreadsheet)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF (Report)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="week">Past week</SelectItem>
                <SelectItem value="month">Past month</SelectItem>
                <SelectItem value="quarter">Past 3 months</SelectItem>
                <SelectItem value="year">Past year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Include</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="completed" 
                  checked={includeCompleted}
                  onCheckedChange={(checked) => setIncludeCompleted(checked as boolean)}
                />
                <Label htmlFor="completed" className="text-sm cursor-pointer">
                  Completed items
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="archived" 
                  checked={includeArchived}
                  onCheckedChange={(checked) => setIncludeArchived(checked as boolean)}
                />
                <Label htmlFor="archived" className="text-sm cursor-pointer">
                  Archived items
                </Label>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredData?.length || data.length} items will be exported
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading || data.length === 0}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Export {format.toUpperCase()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}