// Jest setup file
import '@testing-library/jest-dom'

// Mock window.matchMedia (required for many UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}))

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockReturnValue({ userId: 'test-user-id' }),
  currentUser: jest.fn().mockReturnValue({
    id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  }),
}))

jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    userId: 'test-user-id',
    isSignedIn: true,
    signOut: jest.fn(),
  }),
  useUser: () => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
    isLoaded: true,
  }),
  SignIn: ({ children }) => children,
  SignUp: ({ children }) => children,
  UserButton: () => <div data-testid="user-button">User Button</div>,
}))

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  }),
  QueryClient: jest.fn().mockImplementation(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClientProvider: ({ children }) => children,
}))

// Mock Pusher
jest.mock('pusher-js', () => {
  return jest.fn().mockImplementation(() => ({
    subscribe: jest.fn().mockReturnValue({
      bind: jest.fn(),
      unbind: jest.fn(),
      unbind_all: jest.fn(),
      trigger: jest.fn(),
    }),
    unsubscribe: jest.fn(),
    disconnect: jest.fn(),
  }))
})

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock Sonner (toast notifications)
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}))

// Polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Web APIs for Node.js environment - removed to use Next.js built-in mocks

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.statusText = options.statusText || 'OK'
    this.headers = new Map(Object.entries(options.headers || {}))
  }

  json() {
    return Promise.resolve(JSON.parse(this.body))
  }
}

// Environment variables for tests
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_test'
process.env.CLERK_SECRET_KEY = 'sk_test_test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.STACK_PROJECT_ID = 'test-project-id'
process.env.STACK_SECRET_SERVER_KEY = 'test-secret-key'
process.env.STACK_PUBLISHABLE_CLIENT_KEY = 'test-client-key'
process.env.NEXT_PUBLIC_PUSHER_KEY = 'test-pusher-key'
process.env.NEXT_PUBLIC_PUSHER_CLUSTER = 'us2'
process.env.PUSHER_APP_ID = 'test-app-id'
process.env.PUSHER_SECRET = 'test-pusher-secret'
process.env.OPENAI_API_KEY = 'sk-test-openai-key'
process.env.ENABLE_TEST_USER = 'true'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'

// ============================================================================
// Authentication Testing Utilities
// ============================================================================

// Mock console methods for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  // Suppress console.log in tests unless VERBOSE_TESTS is set
  log: process.env.VERBOSE_TESTS ? originalConsole.log : jest.fn(),
  info: process.env.VERBOSE_TESTS ? originalConsole.info : jest.fn(),
  // Always show warnings and errors
  warn: originalConsole.warn,
  error: originalConsole.error,
};

// Create a helper for creating mock NextRequest objects
global.createMockNextRequest = (options = {}) => {
  const {
    method = 'GET',
    url = 'http://localhost:3000',
    headers = {},
    cookies = {},
    body = null
  } = options;

  return {
    method,
    url,
    headers: {
      get: jest.fn((key) => headers[key] || null),
      has: jest.fn((key) => key in headers),
      entries: jest.fn(() => Object.entries(headers)),
      keys: jest.fn(() => Object.keys(headers)),
      values: jest.fn(() => Object.values(headers)),
      forEach: jest.fn()
    },
    cookies: {
      get: jest.fn((key) => cookies[key] ? { value: cookies[key] } : undefined),
      has: jest.fn((key) => key in cookies),
      getAll: jest.fn(() => Object.entries(cookies).map(([name, value]) => ({ name, value }))),
      set: jest.fn(),
      delete: jest.fn()
    },
    nextUrl: {
      pathname: new URL(url).pathname,
      searchParams: new URL(url).searchParams,
      clone: jest.fn(() => ({ pathname: new URL(url).pathname }))
    },
    json: jest.fn(() => Promise.resolve(body)),
    text: jest.fn(() => Promise.resolve(JSON.stringify(body))),
    formData: jest.fn(),
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    clone: jest.fn(() => global.createMockNextRequest(options))
  };
};

// ============================================================================
// Custom Jest Matchers for Authentication Testing
// ============================================================================

expect.extend({
  // Matcher for checking authentication responses
  toBeAuthenticatedResponse(received) {
    const pass = received && 
                 typeof received === 'object' && 
                 received.isAuthenticated === true &&
                 received.user !== null &&
                 typeof received.user === 'object';

    if (pass) {
      return {
        message: () => `expected response not to be authenticated`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to be authenticated with user object`,
        pass: false,
      };
    }
  },

  // Matcher for checking unauthenticated responses
  toBeUnauthenticatedResponse(received) {
    const pass = received && 
                 typeof received === 'object' && 
                 received.isAuthenticated === false &&
                 received.user === null;

    if (pass) {
      return {
        message: () => `expected response not to be unauthenticated`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to be unauthenticated with null user`,
        pass: false,
      };
    }
  },

  // Matcher for checking demo authentication
  toBeDemoAuthentication(received) {
    const pass = received && 
                 typeof received === 'object' && 
                 received.isAuthenticated === true &&
                 received.isDemo === true &&
                 received.user !== null;

    if (pass) {
      return {
        message: () => `expected response not to be demo authentication`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to be demo authentication`,
        pass: false,
      };
    }
  },

  // Matcher for checking user roles
  toHaveRole(received, expectedRole) {
    const pass = received && 
                 received.user && 
                 received.user.role === expectedRole;

    if (pass) {
      return {
        message: () => `expected user not to have role ${expectedRole}`,
        pass: true,
      };
    } else {
      const actualRole = received?.user?.role || 'none';
      return {
        message: () => `expected user to have role ${expectedRole}, but got ${actualRole}`,
        pass: false,
      };
    }
  },

  // Matcher for checking execution time
  toCompleteWithin(received, maxTime) {
    const pass = received <= maxTime;

    if (pass) {
      return {
        message: () => `expected execution time ${received}ms not to be within ${maxTime}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected execution time ${received}ms to be within ${maxTime}ms`,
        pass: false,
      };
    }
  }
});

// ============================================================================
// Global Test Helpers for Authentication
// ============================================================================

// Helper for creating test users
global.createTestUser = (overrides = {}) => {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

// Helper for creating demo user
global.createDemoUser = () => {
  return {
    id: 'demo-user',
    email: 'demo@astralchronos.com',
    role: 'user',
    firstName: 'Demo',
    lastName: 'User',
    name: 'Demo User',
    imageUrl: '/avatars/demo-user.png'
  };
};

// Helper for creating admin user
global.createAdminUser = (overrides = {}) => {
  return {
    id: 'admin-user-123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

// Helper for measuring execution time
global.measureExecutionTime = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    executionTime: end - start
  };
};

// Authentication test data
global.AuthTestData = {
  validJWT: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  
  invalidJWTs: [
    'invalid-token',
    'header.payload', // Missing signature
    'not.a.jwt.token.extra',
    '',
    null,
    undefined
  ],
  
  maliciousHeaders: {
    'authorization': 'Bearer admin\r\nSet-Cookie: role=admin',
    'x-forwarded-for': '127.0.0.1\r\nX-Admin: true',
    'user-agent': 'Mozilla/5.0\r\nAuthorization: Bearer admin-token'
  }
};

// ============================================================================
// Test Environment Cleanup
// ============================================================================

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  if (global.fetch && typeof global.fetch.mockClear === 'function') {
    global.fetch.mockClear();
  }
});

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
  
  // Clear timers
  jest.clearAllTimers();
});

afterAll(() => {
  // Restore original console
  global.console = originalConsole;
  
  // Clean up any global state
  jest.restoreAllMocks();
});

// Set default timeout for all tests
jest.setTimeout(30000); // 30 seconds

console.log('🧪 Authentication Test Suite Setup Complete');
console.log(`📋 Test Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📊 Verbose Logging: ${process.env.VERBOSE_TESTS ? 'Enabled' : 'Disabled'}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');