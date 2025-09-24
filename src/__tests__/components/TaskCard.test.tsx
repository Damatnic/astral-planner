import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '../utils/test-utils'
import { TaskCard } from '@/features/tasks/TaskCard'
import { mockTask } from '../utils/test-utils'

// Mock the hooks
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useMutation: () => ({
    mutate: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}))

describe('TaskCard', () => {
  const defaultProps = {
    task: mockTask,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onStatusChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders task information correctly', () => {
    render(<TaskCard {...defaultProps} />)
    
    expect(screen.getByText(mockTask.title)).toBeInTheDocument()
    expect(screen.getByText(mockTask.description)).toBeInTheDocument()
    expect(screen.getByText(mockTask.priority)).toBeInTheDocument()
  })

  it('displays task status correctly', () => {
    render(<TaskCard {...defaultProps} />)
    
    // Check if status indicator is present
    const statusElement = screen.getByText(mockTask.status)
    expect(statusElement).toBeInTheDocument()
  })

  it('shows priority with correct styling', () => {
    const highPriorityTask = { ...mockTask, priority: 'high' as const }
    render(<TaskCard {...defaultProps} task={highPriorityTask} />)
    
    const priorityElement = screen.getByText('high')
    expect(priorityElement).toBeInTheDocument()
    expect(priorityElement).toHaveClass('text-red-600') // Assuming high priority is red
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn()
    render(<TaskCard {...defaultProps} onEdit={onEdit} />)
    
    const editButton = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editButton)
    
    expect(onEdit).toHaveBeenCalledWith(mockTask)
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn()
    render(<TaskCard {...defaultProps} onDelete={onDelete} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)
    
    expect(onDelete).toHaveBeenCalledWith(mockTask.id)
  })

  it('calls onStatusChange when status is changed', () => {
    const onStatusChange = jest.fn()
    render(<TaskCard {...defaultProps} onStatusChange={onStatusChange} />)
    
    const statusButton = screen.getByRole('button', { name: /mark as done/i })
    fireEvent.click(statusButton)
    
    expect(onStatusChange).toHaveBeenCalledWith(mockTask.id, 'done')
  })

  it('shows due date when present', () => {
    const taskWithDueDate = {
      ...mockTask,
      dueDate: new Date('2024-12-31'),
    }
    
    render(<TaskCard {...defaultProps} task={taskWithDueDate} />)
    
    expect(screen.getByText(/due:/i)).toBeInTheDocument()
  })

  it('shows overdue styling for past due tasks', () => {
    const overDueTask = {
      ...mockTask,
      dueDate: new Date('2023-01-01'), // Past date
      status: 'todo' as const,
    }
    
    render(<TaskCard {...defaultProps} task={overDueTask} />)
    
    const card = screen.getByRole('article') || screen.getByTestId('task-card')
    expect(card).toHaveClass('border-red-500') // Assuming overdue styling
  })

  it('displays task tags when present', () => {
    const taskWithTags = {
      ...mockTask,
      tags: ['urgent', 'work', 'project'],
    }
    
    render(<TaskCard {...defaultProps} task={taskWithTags} />)
    
    taskWithTags.tags.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })
  })

  it('shows assignee information when present', () => {
    const taskWithAssignee = {
      ...mockTask,
      assignedTo: 'John Doe',
      assigneeAvatar: 'https://example.com/avatar.jpg',
    }
    
    render(<TaskCard {...defaultProps} task={taskWithAssignee} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('handles loading state correctly', () => {
    const TaskCardWithLoading = () => {
      const [isLoading, setIsLoading] = React.useState(false)
      return (
        <TaskCard 
          {...defaultProps} 
          isLoading={isLoading}
          onStatusChange={(id, status) => {
            setIsLoading(true)
            defaultProps.onStatusChange(id, status)
          }}
        />
      )
    }
    
    render(<TaskCardWithLoading />)
    
    const statusButton = screen.getByRole('button', { name: /mark as done/i })
    fireEvent.click(statusButton)
    
    // Should show loading indicator
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('supports keyboard navigation', () => {
    render(<TaskCard {...defaultProps} />)
    
    const card = screen.getByRole('article') || screen.getByTestId('task-card')
    card.focus()
    
    expect(card).toHaveFocus()
    
    // Test keyboard shortcuts
    fireEvent.keyDown(card, { key: 'e' })
    expect(defaultProps.onEdit).toHaveBeenCalled()
  })

  it('renders in compact mode when specified', () => {
    render(<TaskCard {...defaultProps} compact />)
    
    const card = screen.getByRole('article') || screen.getByTestId('task-card')
    expect(card).toHaveClass('compact') // Assuming compact styling class
  })

  it('handles long titles with truncation', () => {
    const longTitleTask = {
      ...mockTask,
      title: 'This is a very long task title that should be truncated when displayed in the card component to prevent layout issues',
    }
    
    render(<TaskCard {...defaultProps} task={longTitleTask} />)
    
    const titleElement = screen.getByText(longTitleTask.title)
    expect(titleElement).toHaveClass('truncate')
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<TaskCard {...defaultProps} />)
      
      const card = screen.getByRole('article', { name: /task:/i })
      expect(card).toHaveAttribute('aria-label')
    })

    it('supports screen readers', () => {
      render(<TaskCard {...defaultProps} />)
      
      // Should have proper semantic structure
      expect(screen.getByRole('heading', { name: mockTask.title })).toBeInTheDocument()
    })
  })
})