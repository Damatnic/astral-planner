import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import { TaskManager } from '@/features/tasks/TaskManager'
import { mockTask, createMockQuery, createMockMutation } from '../utils/test-utils'
import * as ReactQuery from '@tanstack/react-query'

// Mock the React Query hooks
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
  }),
}))

const mockUseQuery = ReactQuery.useQuery as jest.MockedFunction<typeof ReactQuery.useQuery>
const mockUseMutation = ReactQuery.useMutation as jest.MockedFunction<typeof ReactQuery.useMutation>

describe('Task Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should complete a full task creation flow', async () => {
    const mockTasks = [mockTask]
    const mockCreateMutation = createMockMutation()

    // Mock the queries and mutations
    mockUseQuery.mockReturnValue(createMockQuery(mockTasks))
    mockUseMutation.mockReturnValue(mockCreateMutation)

    render(<TaskManager />)

    // Open task creation dialog
    const createButton = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(createButton)

    // Fill in task details
    const titleInput = screen.getByLabelText(/title/i)
    const descriptionInput = screen.getByLabelText(/description/i)

    fireEvent.change(titleInput, { target: { value: 'New Integration Task' } })
    fireEvent.change(descriptionInput, { target: { value: 'Task created via integration test' } })

    // Select priority
    const prioritySelect = screen.getByLabelText(/priority/i)
    fireEvent.change(prioritySelect, { target: { value: 'high' } })

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save task/i })
    fireEvent.click(submitButton)

    // Verify mutation was called
    expect(mockCreateMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Integration Task',
        description: 'Task created via integration test',
        priority: 'high',
      })
    )
  })

  it('should handle task status updates through the UI', async () => {
    const mockTasks = [{ ...mockTask, status: 'todo' }]
    const mockUpdateMutation = createMockMutation()

    mockUseQuery.mockReturnValue(createMockQuery(mockTasks))
    mockUseMutation.mockReturnValue(mockUpdateMutation)

    render(<TaskManager />)

    // Find the task card
    const taskCard = screen.getByText(mockTask.title).closest('[data-testid="task-card"]')
    expect(taskCard).toBeInTheDocument()

    // Click the status change button
    const statusButton = screen.getByRole('button', { name: /mark as done/i })
    fireEvent.click(statusButton)

    // Should call the update mutation
    expect(mockUpdateMutation.mutate).toHaveBeenCalledWith({
      id: mockTask.id,
      status: 'done',
    })
  })

  it('should handle task editing flow', async () => {
    const mockTasks = [mockTask]
    const mockUpdateMutation = createMockMutation()

    mockUseQuery.mockReturnValue(createMockQuery(mockTasks))
    mockUseMutation.mockReturnValue(mockUpdateMutation)

    render(<TaskManager />)

    // Find and click edit button
    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)

    // Should open edit modal
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockTask.title)).toBeInTheDocument()
    })

    // Modify the task
    const titleInput = screen.getByDisplayValue(mockTask.title)
    fireEvent.change(titleInput, { target: { value: 'Updated Task Title' } })

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    // Verify update was called
    expect(mockUpdateMutation.mutate).toHaveBeenCalledWith({
      id: mockTask.id,
      title: 'Updated Task Title',
    })
  })

  it('should handle task deletion with confirmation', async () => {
    const mockTasks = [mockTask]
    const mockDeleteMutation = createMockMutation()

    mockUseQuery.mockReturnValue(createMockQuery(mockTasks))
    mockUseMutation.mockReturnValue(mockDeleteMutation)

    render(<TaskManager />)

    // Find and click delete button
    const deleteButton = screen.getByRole('button', { name: /delete task/i })
    fireEvent.click(deleteButton)

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    fireEvent.click(confirmButton)

    // Verify deletion was called
    expect(mockDeleteMutation.mutate).toHaveBeenCalledWith(mockTask.id)
  })

  it('should handle task filtering and search', async () => {
    const mockTasks = [
      { ...mockTask, id: '1', title: 'High Priority Task', priority: 'high' },
      { ...mockTask, id: '2', title: 'Low Priority Task', priority: 'low' },
      { ...mockTask, id: '3', title: 'Work Related Task', category: 'work' },
    ]

    mockUseQuery.mockReturnValue(createMockQuery(mockTasks))
    mockUseMutation.mockReturnValue(createMockMutation())

    render(<TaskManager />)

    // Initially should show all tasks
    expect(screen.getByText('High Priority Task')).toBeInTheDocument()
    expect(screen.getByText('Low Priority Task')).toBeInTheDocument()
    expect(screen.getByText('Work Related Task')).toBeInTheDocument()

    // Filter by priority
    const priorityFilter = screen.getByLabelText(/filter by priority/i)
    fireEvent.change(priorityFilter, { target: { value: 'high' } })

    // Should update the query parameters
    await waitFor(() => {
      // The useQuery should be called with new filter parameters
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining(['tasks']),
        })
      )
    })

    // Test search functionality
    const searchInput = screen.getByPlaceholderText(/search tasks/i)
    fireEvent.change(searchInput, { target: { value: 'Work' } })

    await waitFor(() => {
      // Should filter results to show only work-related tasks
      expect(screen.queryByText('High Priority Task')).not.toBeInTheDocument()
      expect(screen.getByText('Work Related Task')).toBeInTheDocument()
    })
  })

  it('should handle bulk operations', async () => {
    const mockTasks = [
      { ...mockTask, id: '1', title: 'Task 1' },
      { ...mockTask, id: '2', title: 'Task 2' },
      { ...mockTask, id: '3', title: 'Task 3' },
    ]

    const mockBulkUpdateMutation = createMockMutation()

    mockUseQuery.mockReturnValue(createMockQuery(mockTasks))
    mockUseMutation.mockReturnValue(mockBulkUpdateMutation)

    render(<TaskManager />)

    // Select multiple tasks
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0]) // Task 1
    fireEvent.click(checkboxes[1]) // Task 2

    // Should show bulk action buttons
    await waitFor(() => {
      expect(screen.getByText(/2 selected/i)).toBeInTheDocument()
    })

    // Perform bulk status update
    const bulkStatusButton = screen.getByRole('button', { name: /mark selected as done/i })
    fireEvent.click(bulkStatusButton)

    // Should call bulk update mutation
    expect(mockBulkUpdateMutation.mutate).toHaveBeenCalledWith({
      taskIds: ['1', '2'],
      updates: { status: 'done' },
    })
  })

  it('should handle error states gracefully', async () => {
    const mockError = new Error('Failed to load tasks')
    mockUseQuery.mockReturnValue({
      ...createMockQuery([], false, mockError),
      isError: true,
      error: mockError,
    })
    mockUseMutation.mockReturnValue(createMockMutation())

    render(<TaskManager />)

    // Should show error message
    expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument()

    // Should show retry button
    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()

    fireEvent.click(retryButton)
    // Should attempt to refetch data
  })

  it('should show loading states appropriately', async () => {
    mockUseQuery.mockReturnValue(createMockQuery([], true))
    mockUseMutation.mockReturnValue(createMockMutation())

    render(<TaskManager />)

    // Should show loading skeleton or spinner
    expect(screen.getByTestId('tasks-loading')).toBeInTheDocument()
  })

  it('should persist task state across navigation', async () => {
    const mockTasks = [mockTask]
    mockUseQuery.mockReturnValue(createMockQuery(mockTasks))
    mockUseMutation.mockReturnValue(createMockMutation())

    const { rerender } = render(<TaskManager />)

    // Verify initial state
    expect(screen.getByText(mockTask.title)).toBeInTheDocument()

    // Simulate navigation away and back
    rerender(<div>Other Page</div>)
    rerender(<TaskManager />)

    // Should still show the tasks (React Query caching)
    expect(screen.getByText(mockTask.title)).toBeInTheDocument()
  })
})