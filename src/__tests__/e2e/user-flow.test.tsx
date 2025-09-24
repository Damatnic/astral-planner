import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import { App } from 'next/app'

/**
 * End-to-End User Flow Tests
 * 
 * These tests simulate complete user journeys through the application.
 * While not true E2E tests (those would use tools like Cypress or Playwright),
 * these integration tests cover full user workflows.
 */

// Mock Next.js App component for testing
const MockApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="app-container">
      <header data-testid="app-header">Ultimate Digital Planner</header>
      <main data-testid="app-main">{children}</main>
    </div>
  )
}

// Mock authenticated user state
const mockAuthenticatedUser = {
  isSignedIn: true,
  userId: 'test-user-123',
  user: {
    id: 'test-user-123',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  },
}

describe('End-to-End User Flows', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // The useAuth mock is already configured in jest.setup.js
    // Just update the return value if needed
    require('@clerk/nextjs').useAuth.mockReturnValue(mockAuthenticatedUser)
  })

  describe('New User Onboarding Flow', () => {
    it('should complete new user onboarding', async () => {
      // Mock first-time user
      const firstTimeUser = {
        ...mockAuthenticatedUser,
        user: {
          ...mockAuthenticatedUser.user,
          createdAt: new Date().getTime() - 1000, // Just created
        },
      }

      render(<MockApp><div>Onboarding Component</div></MockApp>)

      // Should show welcome message
      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument()
      })

      // Complete onboarding steps
      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)

      // Step 2: Setup preferences
      await waitFor(() => {
        expect(screen.getByText(/preferences/i)).toBeInTheDocument()
      })

      const timezoneSelect = screen.getByLabelText(/timezone/i)
      fireEvent.change(timezoneSelect, { target: { value: 'America/New_York' } })

      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      // Step 3: Create first workspace
      await waitFor(() => {
        expect(screen.getByText(/workspace/i)).toBeInTheDocument()
      })

      const workspaceInput = screen.getByLabelText(/workspace name/i)
      fireEvent.change(workspaceInput, { target: { value: 'My First Workspace' } })

      fireEvent.click(screen.getByRole('button', { name: /create workspace/i }))

      // Should complete onboarding
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
      })
    })
  })

  describe('Task Management Flow', () => {
    it('should complete full task lifecycle', async () => {
      render(<MockApp><div>Task Manager</div></MockApp>)

      // 1. Create a new task
      const createTaskButton = screen.getByRole('button', { name: /create task/i })
      fireEvent.click(createTaskButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Fill out task form
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Complete project documentation' },
      })

      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Write comprehensive documentation for the project' },
      })

      fireEvent.change(screen.getByLabelText(/priority/i), {
        target: { value: 'high' },
      })

      fireEvent.change(screen.getByLabelText(/due date/i), {
        target: { value: '2024-12-31' },
      })

      fireEvent.click(screen.getByRole('button', { name: /save task/i }))

      // 2. Verify task appears in list
      await waitFor(() => {
        expect(screen.getByText('Complete project documentation')).toBeInTheDocument()
        expect(screen.getByText(/high priority/i)).toBeInTheDocument()
      })

      // 3. Edit the task
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Complete project documentation')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByDisplayValue('Complete project documentation'), {
        target: { value: 'Complete and review project documentation' },
      })

      fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

      // 4. Mark task as completed
      await waitFor(() => {
        expect(screen.getByText('Complete and review project documentation')).toBeInTheDocument()
      })

      const completeButton = screen.getByRole('button', { name: /mark as complete/i })
      fireEvent.click(completeButton)

      // 5. Verify task status changed
      await waitFor(() => {
        expect(screen.getByText(/completed/i)).toBeInTheDocument()
      })

      // 6. Filter to show only completed tasks
      const filterSelect = screen.getByLabelText(/filter/i)
      fireEvent.change(filterSelect, { target: { value: 'completed' } })

      await waitFor(() => {
        expect(screen.getByText('Complete and review project documentation')).toBeInTheDocument()
      })
    })
  })

  describe('Goal Setting and Tracking Flow', () => {
    it('should create and track goal progress', async () => {
      render(<MockApp><div>Goals Dashboard</div></MockApp>)

      // 1. Create a new goal
      fireEvent.click(screen.getByRole('button', { name: /create goal/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/goal title/i), {
        target: { value: 'Read 12 books this year' },
      })

      fireEvent.change(screen.getByLabelText(/target value/i), {
        target: { value: '12' },
      })

      fireEvent.change(screen.getByLabelText(/unit/i), {
        target: { value: 'books' },
      })

      fireEvent.change(screen.getByLabelText(/deadline/i), {
        target: { value: '2024-12-31' },
      })

      fireEvent.click(screen.getByRole('button', { name: /create goal/i }))

      // 2. Verify goal appears with progress bar
      await waitFor(() => {
        expect(screen.getByText('Read 12 books this year')).toBeInTheDocument()
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      })

      // 3. Update goal progress
      const updateProgressButton = screen.getByRole('button', { name: /update progress/i })
      fireEvent.click(updateProgressButton)

      fireEvent.change(screen.getByLabelText(/current progress/i), {
        target: { value: '3' },
      })

      fireEvent.change(screen.getByLabelText(/progress note/i), {
        target: { value: 'Finished reading "Clean Code", "The Pragmatic Programmer", and "Design Patterns"' },
      })

      fireEvent.click(screen.getByRole('button', { name: /save progress/i }))

      // 4. Verify progress update
      await waitFor(() => {
        expect(screen.getByText('25%')).toBeInTheDocument() // 3/12 = 25%
      })

      // 5. View goal details and history
      fireEvent.click(screen.getByText('Read 12 books this year'))

      await waitFor(() => {
        expect(screen.getByText(/progress history/i)).toBeInTheDocument()
        expect(screen.getByText('Clean Code')).toBeInTheDocument()
      })
    })
  })

  describe('Collaboration Flow', () => {
    it('should handle real-time collaboration', async () => {
      // Mock multiple users
      const mockCollaborators = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com', color: '#ff0000' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com', color: '#00ff00' },
      ]

      render(<MockApp><div>Collaborative Workspace</div></MockApp>)

      // 1. Verify presence indicators
      await waitFor(() => {
        expect(screen.getByText(/2 online/i)).toBeInTheDocument()
      })

      // 2. See collaborator avatars
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()

      // 3. Receive real-time notification
      // Simulate incoming notification
      const mockNotification = {
        title: 'Task Updated',
        message: 'Alice completed "Review design mockups"',
        type: 'success',
      }

      // Should show toast notification
      await waitFor(() => {
        expect(screen.getByText('Task Updated')).toBeInTheDocument()
        expect(screen.getByText(/Alice completed/i)).toBeInTheDocument()
      })

      // 4. View collaborator activity
      fireEvent.click(screen.getByRole('button', { name: /activity/i }))

      await waitFor(() => {
        expect(screen.getByText(/recent activity/i)).toBeInTheDocument()
        expect(screen.getByText(/Alice is typing/i)).toBeInTheDocument()
      })
    })
  })

  describe('Template Usage Flow', () => {
    it('should browse and apply templates', async () => {
      render(<MockApp><div>Template Marketplace</div></MockApp>)

      // 1. Browse template categories
      expect(screen.getByText(/productivity/i)).toBeInTheDocument()
      expect(screen.getByText(/health/i)).toBeInTheDocument()
      expect(screen.getByText(/business/i)).toBeInTheDocument()

      // 2. Select and preview template
      fireEvent.click(screen.getByText(/productivity/i))

      await waitFor(() => {
        expect(screen.getByText('Daily Productivity Planner')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Daily Productivity Planner'))

      // 3. Preview template contents
      await waitFor(() => {
        expect(screen.getByText(/template preview/i)).toBeInTheDocument()
        expect(screen.getByText(/morning routine/i)).toBeInTheDocument()
        expect(screen.getByText(/daily goals/i)).toBeInTheDocument()
      })

      // 4. Apply template to workspace
      fireEvent.click(screen.getByRole('button', { name: /use template/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/apply to workspace/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /apply template/i }))

      // 5. Verify template was applied
      await waitFor(() => {
        expect(screen.getByText(/template applied successfully/i)).toBeInTheDocument()
      })

      // Navigate back to dashboard
      fireEvent.click(screen.getByRole('link', { name: /dashboard/i }))

      // Should see template items
      await waitFor(() => {
        expect(screen.getByText('Morning Routine')).toBeInTheDocument()
        expect(screen.getByText('Daily Goals')).toBeInTheDocument()
      })
    })
  })

  describe('Settings and Integrations Flow', () => {
    it('should configure integrations', async () => {
      render(<MockApp><div>Settings Page</div></MockApp>)

      // 1. Navigate to integrations
      fireEvent.click(screen.getByRole('tab', { name: /integrations/i }))

      await waitFor(() => {
        expect(screen.getByText(/google calendar/i)).toBeInTheDocument()
      })

      // 2. Connect Google Calendar
      fireEvent.click(screen.getByRole('button', { name: /connect google calendar/i }))

      // Mock OAuth flow completion
      await waitFor(() => {
        expect(screen.getByText(/connected/i)).toBeInTheDocument()
        expect(screen.getByText(/sync settings/i)).toBeInTheDocument()
      })

      // 3. Configure sync settings
      const autoSyncToggle = screen.getByLabelText(/auto sync/i)
      fireEvent.click(autoSyncToggle)

      const syncIntervalSelect = screen.getByLabelText(/sync interval/i)
      fireEvent.change(syncIntervalSelect, { target: { value: '15' } })

      // 4. Test sync
      fireEvent.click(screen.getByRole('button', { name: /sync now/i }))

      await waitFor(() => {
        expect(screen.getByText(/sync completed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Flow', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      render(<MockApp><div>Task Manager</div></MockApp>)

      // Attempt to create task
      fireEvent.click(screen.getByRole('button', { name: /create task/i }))

      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Test Task' },
      })

      fireEvent.click(screen.getByRole('button', { name: /save task/i }))

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })

      // Test retry functionality
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      fireEvent.click(screen.getByRole('button', { name: /retry/i }))

      await waitFor(() => {
        expect(screen.getByText(/task created successfully/i)).toBeInTheDocument()
      })
    })
  })
})