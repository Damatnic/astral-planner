# Testing Documentation

## Overview

This project uses a comprehensive testing suite built with Jest and React Testing Library to ensure code quality, reliability, and maintainability.

## Testing Stack

- **Jest** - JavaScript testing framework
- **React Testing Library** - React component testing utilities
- **JSDOM** - DOM implementation for Node.js
- **MSW** - Mock Service Worker for API mocking (future enhancement)

## Test Structure

```
src/__tests__/
├── api/                    # API route tests
├── components/             # Component tests
│   ├── ui/                # UI component tests
│   └── features/          # Feature component tests
├── hooks/                 # Custom hook tests
├── integration/           # Integration tests
├── e2e/                   # End-to-end workflow tests
├── lib/                   # Utility function tests
├── setup/                 # Test setup and configuration
└── utils/                 # Test utilities and helpers
```

## Test Categories

### 1. Unit Tests
- **Components**: Test individual React components in isolation
- **Hooks**: Test custom React hooks
- **Utils**: Test utility functions and helpers
- **API Routes**: Test individual API endpoints

### 2. Integration Tests
- **Feature Workflows**: Test complete user workflows
- **Component Integration**: Test component interactions
- **API Integration**: Test API route interactions with database

### 3. End-to-End Tests
- **User Journeys**: Test complete user flows
- **Cross-Feature Integration**: Test features working together

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Advanced Commands
```bash
# Run only unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run tests in CI mode
npm run test:ci

# Debug tests
npm run test:debug

# Check test environment health
npm run test:health

# Generate comprehensive test report
npm run test:report

# Update snapshots
npm run test:update

# Clear Jest cache
npm run test:clear
```

## Writing Tests

### Component Tests

```typescript
import { render, screen, fireEvent } from '../utils/test-utils'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Hook Tests

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from '@/hooks/useCounter'

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })
})
```

### API Tests

```typescript
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/tasks/route'
import { auth } from '@clerk/nextjs/server'

jest.mock('@clerk/nextjs/server')

describe('/api/tasks', () => {
  beforeEach(() => {
    ;(auth as jest.Mock).mockReturnValue({ userId: 'test-user' })
  })

  it('should return tasks for authenticated user', async () => {
    const request = new NextRequest('http://localhost/api/tasks')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.tasks).toBeDefined()
  })
})
```

## Test Utilities

### Custom Render
The `test-utils.tsx` file provides a custom render function that includes necessary providers:

```typescript
import { render } from '../utils/test-utils' // Use custom render

// This automatically wraps components with:
// - QueryClientProvider
// - ClerkProvider  
// - Other necessary providers
```

### Mock Data
Pre-defined mock data is available:

```typescript
import { mockTask, mockGoal, mockHabit } from '../utils/test-utils'

// Use in tests
render(<TaskCard task={mockTask} />)
```

### Mock Utilities
Helper functions for creating mocks:

```typescript
import { createMockQuery, createMockMutation } from '../utils/test-utils'

const mockQuery = createMockQuery(mockData, false, null)
const mockMutation = createMockMutation()
```

## Mocking Strategy

### Automatic Mocks
The following are automatically mocked in `jest.setup.js`:
- `@clerk/nextjs` - Authentication
- `@tanstack/react-query` - Data fetching
- `pusher-js` - Real-time features
- `framer-motion` - Animations
- `sonner` - Toast notifications

### Manual Mocks
For specific test needs, create manual mocks:

```typescript
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
}))
```

## Coverage Requirements

The project maintains the following coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Best Practices

### 1. Test Structure
- Follow AAA pattern: Arrange, Act, Assert
- Use descriptive test names
- Group related tests with `describe` blocks

### 2. Test Content
- Test behavior, not implementation
- Focus on user interactions and outcomes
- Include edge cases and error scenarios

### 3. Accessibility
- Always test with semantic queries (`getByRole`, `getByLabelText`)
- Include accessibility assertions
- Test keyboard navigation

### 4. Async Testing
- Use `waitFor` for async operations
- Avoid using `setTimeout` in tests
- Mock API responses appropriately

### 5. Error Handling
- Test error boundaries
- Test network failure scenarios
- Test validation errors

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Commits to main branch
- Scheduled nightly runs

CI configuration includes:
- Parallel test execution
- Coverage reporting
- Test result artifacts
- Failure notifications

## Debugging Tests

### Debug Mode
```bash
npm run test:debug
```

### VS Code Integration
Add to `.vscode/launch.json`:
```json
{
  "name": "Debug Jest Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Common Issues

1. **Tests timeout**: Increase timeout in Jest config
2. **Memory leaks**: Ensure proper cleanup in `afterEach`
3. **Async issues**: Use `waitFor` instead of manual delays
4. **Mock issues**: Clear mocks between tests with `jest.clearAllMocks()`

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update test documentation if needed

For bug fixes:
1. Write a failing test that reproduces the bug
2. Fix the bug
3. Ensure the test now passes
4. Verify no regressions

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)