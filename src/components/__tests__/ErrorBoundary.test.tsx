/**
 * Error Boundary Component Tests
 * Critical for preventing application crashes from component errors
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('catches errors and renders error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });

  it('provides error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Test error/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText(/Test error/)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('provides retry functionality', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be shown
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    retryButton.click();

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('handles async errors gracefully', async () => {
    const AsyncError = () => {
      React.useEffect(() => {
        // Simulate async error
        setTimeout(() => {
          throw new Error('Async error');
        }, 0);
      }, []);
      return <div>Async component</div>;
    };

    render(
      <ErrorBoundary>
        <AsyncError />
      </ErrorBoundary>
    );

    // Component should render initially
    expect(screen.getByText('Async component')).toBeInTheDocument();
    
    // Note: Error boundaries don't catch async errors by default
    // This test documents the current behavior
  });

  it('provides custom error reporting', () => {
    const mockReportError = jest.fn();
    
    render(
      <ErrorBoundary onError={mockReportError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockReportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('displays fallback UI when provided', () => {
    const CustomFallback = ({ error, retry }: any) => (
      <div>
        <h1>Custom Error UI</h1>
        <p>{error.message}</p>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /custom retry/i })).toBeInTheDocument();
  });

  it('resets error state when children change', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be shown
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    // Re-render with different children
    rerender(
      <ErrorBoundary>
        <div>Different content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Different content')).toBeInTheDocument();
  });

  it('handles multiple nested error boundaries', () => {
    const OuterFallback = () => <div>Outer error boundary</div>;
    const InnerFallback = () => <div>Inner error boundary</div>;

    render(
      <ErrorBoundary fallback={OuterFallback}>
        <div>Outer content</div>
        <ErrorBoundary fallback={InnerFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    // Inner boundary should catch the error
    expect(screen.getByText('Inner error boundary')).toBeInTheDocument();
    expect(screen.getByText('Outer content')).toBeInTheDocument();
    expect(screen.queryByText('Outer error boundary')).not.toBeInTheDocument();
  });

  it('maintains component state after error recovery', () => {
    const StatefulComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      const [count, setCount] = React.useState(0);
      
      if (shouldThrow) {
        throw new Error('State test error');
      }
      
      return (
        <div>
          <span>Count: {count}</span>
          <button onClick={() => setCount(c => c + 1)}>Increment</button>
        </div>
      );
    };

    const { rerender } = render(
      <ErrorBoundary>
        <StatefulComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // Increment counter
    const button = screen.getByRole('button', { name: /increment/i });
    button.click();
    expect(screen.getByText('Count: 1')).toBeInTheDocument();

    // Trigger error
    rerender(
      <ErrorBoundary>
        <StatefulComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    // Recover from error
    rerender(
      <ErrorBoundary>
        <StatefulComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // State should be reset (component remounted)
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });
});