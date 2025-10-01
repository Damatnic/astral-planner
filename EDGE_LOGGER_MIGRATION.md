# Edge Runtime Logger Migration Guide

**Date:** January 10, 2025  
**Purpose:** Replace Winston logger with edge-compatible logger to eliminate 70 build warnings  
**Status:** 🔧 **IMPLEMENTATION READY**

---

## 🎯 Overview

The Winston logger causes 70+ warnings during build because it uses Node.js APIs (fs, net, tls) that aren't available in Edge Runtime:

```
⚠ Compiled with warnings

./node_modules/winston/lib/winston/transports/file.js
Module not found: Can't resolve 'fs' in 'C:\...\node_modules\winston\lib\winston\transports'

Import trace for requested module:
./node_modules/winston/lib/winston/transports/file.js
./node_modules/winston/lib/winston/transports/index.js
...
```

These warnings don't break the build but:
- ⚠️ May cause Vercel deployment failures
- ⚠️ Clutter build output
- ⚠️ Indicate non-optimal architecture
- ⚠️ Could fail in Edge Runtime contexts

---

## 🔧 Solution: Edge-Compatible Logger

Created `src/lib/logger/edge.ts` - a lightweight logger that works in both Node.js and Edge Runtime.

### Features

- ✅ **Zero dependencies** - No external packages
- ✅ **Edge Runtime compatible** - Uses only console APIs
- ✅ **Node.js compatible** - Works everywhere Winston worked
- ✅ **Structured logging** - JSON metadata support
- ✅ **Log levels** - debug, info, warn, error
- ✅ **Child loggers** - Context-aware logging
- ✅ **TypeScript** - Fully typed
- ✅ **Environment aware** - Respects LOG_LEVEL env var

### API Compatibility

The Edge Logger maintains the same API as Winston:

```typescript
// Before (Winston)
import Logger from '@/lib/logger';
Logger.info('Message', { key: 'value' });
Logger.error('Error', error);

// After (Edge Logger)
import { Logger } from '@/lib/logger/edge';
Logger.info('Message', { key: 'value' });
Logger.error('Error', error);
```

---

## 📋 Migration Checklist

### Phase 1: Identify Files Using Winston

Run search to find all Winston imports:

```bash
# PowerShell
Select-String -Path "src/**/*.ts","src/**/*.tsx" -Pattern "from '@/lib/logger'" -Exclude "*.test.ts"
```

**Files to Update:**
- [ ] `src/middleware.ts` - **Critical** (Edge Runtime)
- [ ] `src/app/api/**/*.ts` - API routes (may use Edge Runtime)
- [ ] `src/lib/auth/**/*.ts` - Authentication utilities
- [ ] `src/lib/api/**/*.ts` - API client code
- [ ] Any other files using `@/lib/logger`

### Phase 2: Update Imports

For each file identified:

```typescript
// Before
import Logger from '@/lib/logger';

// After
import { Logger } from '@/lib/logger/edge';
```

### Phase 3: Verify Usage Patterns

Most code should work without changes. Check for these patterns:

#### ✅ Standard Logging (No Changes Needed)
```typescript
Logger.info('User authenticated', { userId: user.id });
Logger.warn('Rate limit approaching', { remaining: 10 });
Logger.error('Database connection failed', error);
```

#### ✅ Child Loggers (Minor Syntax Change)
```typescript
// Before (Winston)
const childLogger = Logger.child({ requestId: req.id });

// After (Edge Logger)
const childLogger = Logger.child({ requestId: req.id });
// Same API! ✅
```

#### ❌ Winston-Specific Features (Need Alternatives)
```typescript
// Winston transports - not available in Edge Logger
Logger.add(new winston.transports.File({ filename: 'error.log' }));
// Solution: Use Vercel's built-in logging or external service

// Winston metadata - use Edge Logger's metadata parameter
Logger.info('Message', { metadata: { key: 'value' } });
// Solution: Logger.info('Message', { key: 'value' });
```

### Phase 4: Update Tests

If you have logger tests:

```typescript
// Before
import Logger from '@/lib/logger';

// After
import { Logger, EdgeLogger } from '@/lib/logger/edge';

// For testing, you can create isolated instances
const testLogger = new EdgeLogger();
```

---

## 🔍 File-by-File Migration Plan

### Priority 1: Edge Runtime Files (Critical)

#### `src/middleware.ts`
```typescript
// BEFORE
import Logger from '@/lib/logger';

// AFTER
import { Logger } from '@/lib/logger/edge';

// Rest of the code remains the same
Logger.info('Middleware processing request', { path: req.nextUrl.pathname });
```

**Impact:** Eliminates Edge Runtime warnings immediately  
**Risk:** Low - same API  
**Testing:** Test authentication flow, rate limiting

---

### Priority 2: API Routes (High)

Update all API routes that might run in Edge Runtime:

#### `src/app/api/*/route.ts`
```typescript
// BEFORE
import Logger from '@/lib/logger';

// AFTER
import { Logger } from '@/lib/logger/edge';
```

**Files:**
- `src/app/api/auth/**/*.ts`
- `src/app/api/goals/**/*.ts`
- `src/app/api/habits/**/*.ts`
- `src/app/api/tasks/**/*.ts`
- `src/app/api/ai/**/*.ts`
- All other API routes

**Impact:** Ensures API routes work in Edge Runtime  
**Risk:** Low - no code changes needed beyond import  
**Testing:** Test each API endpoint

---

### Priority 3: Utility Libraries (Medium)

#### `src/lib/auth/auth-utils.ts`
```typescript
// BEFORE
import Logger from '@/lib/logger';

// AFTER
import { Logger } from '@/lib/logger/edge';
```

#### `src/lib/api/phoenix-api-optimizer.ts`
```typescript
// BEFORE
import Logger from '@/lib/logger';

// AFTER
import { Logger } from '@/lib/logger/edge';
```

**Impact:** Makes utilities edge-compatible  
**Risk:** Low  
**Testing:** Test authentication and API optimization features

---

## 🔧 Automated Migration Script

Create a migration script to update all imports:

```typescript
// scripts/migrate-to-edge-logger.ts
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']
});

let updatedCount = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const original = content;
  
  // Replace Winston import with Edge Logger import
  content = content.replace(
    /import Logger from ['"]@\/lib\/logger['"]/g,
    "import { Logger } from '@/lib/logger/edge'"
  );
  
  if (content !== original) {
    writeFileSync(file, content);
    updatedCount++;
    console.log(`✅ Updated: ${file}`);
  }
}

console.log(`\n🎉 Updated ${updatedCount} files`);
```

Run with:
```bash
npx tsx scripts/migrate-to-edge-logger.ts
```

---

## ✅ Verification Steps

After migration:

### 1. Build Check
```bash
npm run build
# Should see 0 warnings about Winston/fs/net/tls
```

### 2. Type Check
```bash
npm run type-check
# Should pass with 0 errors
```

### 3. Runtime Test
```bash
npm run dev
# Test key features:
# - Login/logout
# - Create/update goals
# - API requests
# - Rate limiting
```

### 4. Edge Runtime Test
Deploy to Vercel preview and test:
- Middleware authentication
- API routes
- Rate limiting
- Error logging

---

## 📊 Expected Impact

### Before Migration
```
⚠ Compiled with warnings

- 70+ Edge Runtime warnings
- Winston dependencies included in bundle
- Potential Vercel deployment failures
- Build output cluttered
```

### After Migration
```
✓ Compiled successfully

- 0 Edge Runtime warnings ✅
- Smaller bundle size (no Winston dependencies)
- Reliable Vercel deployments
- Clean build output
```

### Bundle Size Impact
- **Winston + dependencies:** ~500 KB
- **Edge Logger:** ~2 KB
- **Savings:** ~498 KB (~99% reduction)

### Build Time Impact
- **Before:** 25.8s with 70 warnings
- **After:** Expected 20-23s with 0 warnings
- **Improvement:** Faster builds, cleaner output

---

## 🚨 Rollback Plan

If issues arise, easy rollback:

### Option 1: Git Revert
```bash
git revert HEAD
```

### Option 2: Keep Both Loggers
```typescript
// Node.js contexts (Server Components, API routes)
import Logger from '@/lib/logger'; // Winston

// Edge Runtime contexts (Middleware, Edge API routes)
import { Logger } from '@/lib/logger/edge'; // Edge Logger
```

### Option 3: Runtime Detection
```typescript
// Auto-detect runtime and use appropriate logger
const Logger = typeof EdgeRuntime !== 'undefined'
  ? require('@/lib/logger/edge').Logger
  : require('@/lib/logger').default;
```

---

## 📚 Testing Strategy

### Unit Tests
```typescript
import { Logger, EdgeLogger } from '@/lib/logger/edge';

describe('EdgeLogger', () => {
  it('should log info messages', () => {
    const spy = jest.spyOn(console, 'log');
    Logger.info('Test message');
    expect(spy).toHaveBeenCalled();
  });

  it('should log errors with stack traces', () => {
    const spy = jest.spyOn(console, 'error');
    const error = new Error('Test error');
    Logger.error('Error occurred', error);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
  });

  it('should support child loggers', () => {
    const child = Logger.child({ requestId: '123' });
    const spy = jest.spyOn(console, 'log');
    child.info('Test');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('requestId'));
  });
});
```

### Integration Tests
```typescript
import { Logger } from '@/lib/logger/edge';

describe('Authentication with Edge Logger', () => {
  it('should log authentication events', async () => {
    const spy = jest.spyOn(console, 'log');
    
    await authenticate(request);
    
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('User authenticated')
    );
  });
});
```

### E2E Tests (Playwright)
```typescript
test('should log API requests', async ({ page }) => {
  // Intercept console logs
  const logs: string[] = [];
  page.on('console', msg => logs.push(msg.text()));
  
  // Make API request
  await page.goto('/api/goals');
  
  // Verify logging
  expect(logs.some(log => log.includes('API request'))).toBe(true);
});
```

---

## 🎯 Success Criteria

Migration is successful when:

- [x] Edge Logger created (`src/lib/logger/edge.ts`)
- [ ] All Winston imports replaced with Edge Logger
- [ ] Build completes with **0 Edge Runtime warnings**
- [ ] All tests passing
- [ ] Type checking passes
- [ ] Development server works correctly
- [ ] Vercel deployment succeeds
- [ ] Production logging works as expected
- [ ] Bundle size reduced by ~500 KB
- [ ] Documentation updated

---

## 📞 Support

If issues arise:

### Common Issues

**Issue:** `Logger.child is not a function`  
**Solution:** Ensure using Edge Logger, not old Winston instance

**Issue:** Logs not appearing in Vercel  
**Solution:** Vercel captures stdout/stderr automatically, check deployment logs

**Issue:** Missing context in logs  
**Solution:** Use metadata parameter: `Logger.info('Message', { key: 'value' })`

**Issue:** Type errors after migration  
**Solution:** Run `npm run type-check` and fix any imports

---

## 🚀 Next Steps

After successful migration:

1. **Monitor Production Logs**
   - Verify all expected logs appear
   - Check for any missing context
   - Ensure error reporting works

2. **Optimize Further**
   - Consider external log aggregation (Datadog, LogRocket)
   - Implement structured logging standards
   - Add request tracing/correlation IDs

3. **Update Documentation**
   - Document new logger usage
   - Update contribution guidelines
   - Add logging best practices

---

**Ready to Start?**

Run this command to begin migration:

```bash
# Find all files using Winston logger
Select-String -Path "src/**/*.ts","src/**/*.tsx" -Pattern "from '@/lib/logger'" | Select-Object Path -Unique
```

Then update each file's import from:
```typescript
import Logger from '@/lib/logger';
```

To:
```typescript
import { Logger } from '@/lib/logger/edge';
```

---

**Last Updated:** January 10, 2025  
**Status:** Ready for implementation  
**Estimated Time:** 30 minutes  
**Risk Level:** 🟢 **LOW**
