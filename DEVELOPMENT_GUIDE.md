# 🛠️ Astral Planner - Development Guide

## Overview

This guide covers everything you need to know to develop and contribute to the Astral Planner application. The codebase has been fully harmonized with enterprise-grade standards and modern best practices.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Stack Auth
- **State Management**: Tanstack Query (React Query)
- **UI Components**: Radix UI + Tailwind
- **Animations**: Framer Motion
- **Logging**: Winston
- **Validation**: Zod
- **Testing**: Jest + Testing Library

### Project Structure

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API routes
│   ├── (pages)/           # Application pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # Base UI components (shadcn/ui)
│   └── providers/        # Context providers
├── db/                   # Database configuration
│   └── schema/           # Database schemas
├── features/             # Feature-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── auth.ts           # Authentication utilities
│   ├── logger.ts         # Logging configuration
│   ├── security.ts       # Security middleware
│   └── validation.ts     # Input validation
├── providers/            # App-level providers
├── types/                # TypeScript type definitions
└── utils/                # General utilities
```

## 🚀 Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL (local or remote)
- Git
- Code editor (VS Code recommended)

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd astral-planner
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Run automated setup
   node setup-environment.js
   
   # Or copy example and configure manually
   cp .env.example .env.local
   ```

3. **Database Setup**
   ```bash
   # Run migrations
   npm run db:migrate
   
   # Seed development data
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## 🎯 Development Features

### Hot Reloading
- Automatic page refresh on file changes
- Component state preservation
- Fast build times with webpack caching

### Developer Tools
- React Query DevTools (development only)
- TypeScript strict mode
- ESLint with Next.js configuration
- Prettier for code formatting

### Debug Features
- Comprehensive logging with log levels
- Test user mode for development
- Database query logging
- Performance monitoring

## 📝 Code Standards

### TypeScript
- Strict TypeScript configuration
- Type-first development approach
- Comprehensive interface definitions
- No `any` types in production code

### Code Style
```typescript
// ✅ Good: Proper typing and error handling
interface User {
  id: string;
  email: string;
  firstName?: string;
}

async function fetchUser(id: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`User not found: ${id}`);
    }
    return await response.json();
  } catch (error) {
    Logger.error('Failed to fetch user:', error);
    return null;
  }
}

// ❌ Bad: No typing, poor error handling
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  return await response.json();
}
```

### Component Structure
```tsx
// ✅ Good: Proper component structure
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async () => {
    if (!onEdit) return;
    
    setIsLoading(true);
    try {
      await onEdit(user);
    } catch (error) {
      Logger.error('Edit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex justify-between items-center">
        <h3>{user.firstName} {user.lastName}</h3>
        {onEdit && (
          <Button onClick={handleEdit} disabled={isLoading}>
            {isLoading ? <Spinner /> : 'Edit'}
          </Button>
        )}
      </div>
    </Card>
  );
}
```

### Error Handling
```typescript
// ✅ Good: Comprehensive error handling
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  if (error instanceof AppError) {
    Logger.warn('Known error:', error.message);
    return { success: false, error: error.message };
  }
  
  Logger.error('Unexpected error:', error);
  return { success: false, error: 'An unexpected error occurred' };
}
```

## 🗄️ Database Development

### Schema Management
- Database schemas in `src/db/schema/`
- Use Drizzle ORM for type-safe queries
- Migrations managed with Drizzle Kit

### Adding New Tables
1. Create schema file in `src/db/schema/`
2. Export from `src/db/schema/index.ts`
3. Generate and run migration:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### Query Examples
```typescript
// ✅ Good: Type-safe queries with relations
const userGoals = await db
  .select({
    id: goals.id,
    title: goals.title,
    progress: goals.progress,
    user: {
      id: users.id,
      name: users.firstName
    }
  })
  .from(goals)
  .leftJoin(users, eq(goals.createdBy, users.id))
  .where(eq(goals.createdBy, userId))
  .orderBy(desc(goals.createdAt));
```

## 🎨 UI Development

### Component Library
- Base components from Radix UI
- Styled with Tailwind CSS
- Consistent design tokens
- Dark/light mode support

### Adding New Components
1. Create in appropriate directory (`components/ui/` for base, `components/` for complex)
2. Export from `components/ui/index.ts` if UI component
3. Include proper TypeScript interfaces
4. Add to Storybook (if applicable)

### Styling Guidelines
```tsx
// ✅ Good: Semantic class names and responsive design
<div className="flex flex-col gap-4 p-6 bg-card rounded-lg border shadow-sm md:flex-row md:items-center">
  <h2 className="text-lg font-semibold text-card-foreground">Title</h2>
  <Button variant="outline" size="sm" className="ml-auto">
    Action
  </Button>
</div>
```

## 🔌 API Development

### Route Structure
```
src/app/api/
├── auth/              # Authentication routes
├── goals/             # Goals CRUD operations
├── habits/            # Habits management
├── health/            # Health checks
└── users/             # User management
```

### API Route Template
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getUserForRequest } from '@/lib/auth';
import { securityMiddleware } from '@/lib/security';
import { db } from '@/db';
import Logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Security check
    const securityResponse = await securityMiddleware(req);
    if (securityResponse) return securityResponse;

    // Authentication
    const user = await getUserForRequest(req);
    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    // Business logic
    const data = await db.query.users.findMany({
      where: eq(users.id, user.id)
    });

    // Response
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    Logger.error('API error:', { error, responseTime });
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🧪 Testing

### Test Structure
```
__tests__/
├── components/        # Component tests
├── pages/            # Page tests
├── api/              # API route tests
└── utils/            # Utility function tests
```

### Writing Tests
```typescript
// Component test example
import { render, screen, userEvent } from '@testing-library/react';
import { UserCard } from '../UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  };

  it('renders user information', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = jest.fn();
    render(<UserCard user={mockUser} onEdit={onEdit} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledWith(mockUser);
  });
});
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 📊 Monitoring & Debugging

### Logging
```typescript
import Logger from '@/lib/logger';

// Different log levels
Logger.error('Critical error occurred', { error, userId });
Logger.warn('Potential issue detected', { context });
Logger.info('Operation completed', { duration, result });
Logger.debug('Detailed debugging info', { state, props });
```

### Performance Monitoring
```bash
# Analyze bundle size
npm run bundle:analyze

# Performance audit
npm run perf:audit

# Lighthouse audit
npm run perf:lighthouse
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Enable React Query DevTools (automatic in development)
NODE_ENV=development npm run dev
```

## 🔒 Security Best Practices

### Input Validation
```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50)
});

// Always validate input
const validated = CreateUserSchema.parse(requestBody);
```

### Authentication
```typescript
// Always check authentication
const user = await getUserForRequest(req);
if (!user) {
  throw new AppError('Authentication required', 401);
}

// Check permissions
if (user.id !== resourceOwnerId) {
  throw new AppError('Access denied', 403);
}
```

### Database Security
```typescript
// ✅ Good: Parameterized queries (Drizzle handles this)
const users = await db
  .select()
  .from(users)
  .where(eq(users.email, userEmail));

// ❌ Bad: String concatenation (vulnerable to SQL injection)
// const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

## 📦 Build & Deployment

### Development Build
```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Build for production
npm run build

# Analyze bundle
npm run analyze
```

### Environment-Specific Builds
```bash
# Development
NODE_ENV=development npm run build

# Production
NODE_ENV=production npm run build
```

## 🤝 Contributing

### Git Workflow
1. Create feature branch from `main`
2. Make changes following code standards
3. Write/update tests
4. Run quality checks:
   ```bash
   npm run type-check
   npm run lint
   npm test
   npm run build
   ```
5. Create pull request
6. Address review feedback
7. Merge after approval

### Commit Messages
```bash
# Good examples
git commit -m "feat: add user profile editing functionality"
git commit -m "fix: resolve authentication timeout issue"
git commit -m "docs: update API documentation for goals endpoint"
git commit -m "refactor: optimize database query performance"

# Prefixes
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation only
style:    # Formatting, missing semicolons, etc.
refactor: # Code change that neither fixes a bug nor adds a feature
test:     # Adding missing tests
chore:    # Updating build tasks, package manager configs, etc.
```

## 🆘 Common Issues & Solutions

### Development Issues

**Issue**: "Module not found" errors
**Solution**: Clear cache and reinstall dependencies
```bash
rm -rf .next node_modules package-lock.json
npm install
```

**Issue**: Database connection fails
**Solution**: Check environment variables and database server status
```bash
# Test database connection
npm run db:check
```

**Issue**: Build fails with TypeScript errors
**Solution**: Run type checking to see detailed errors
```bash
npm run type-check
```

### Performance Issues

**Issue**: Slow page loads in development
**Solution**: Enable webpack caching (already configured)

**Issue**: Large bundle size
**Solution**: Analyze and optimize imports
```bash
npm run bundle:analyze
```

## 📚 Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Drizzle ORM](https://orm.drizzle.team)

### Tools & Extensions
- VS Code Extensions:
  - TypeScript and JavaScript
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Auto Rename Tag
  - Prettier
  - ESLint

### Community
- Discord: [Join our Discord server](#)
- GitHub Issues: Report bugs and request features
- Contributing Guidelines: See CONTRIBUTING.md

Happy coding! 🚀