# 🚀 QUICK ACTION PLAN - Priority Fixes

**Date:** October 1, 2025  
**Status:** Ready for Implementation

---

## ⚡ IMMEDIATE ACTIONS (< 3 hours total)

### 1. Fix Next.js Configuration (30 minutes)

**File:** `next.config.js`

```javascript
// Replace experimental config
const nextConfig = {
  // REMOVE this:
  // experimental: {
  //   serverComponentsExternalPackages: [...]
  // },
  
  // ADD this:
  serverExternalPackages: [
    '@neondatabase/serverless',
    'winston',
    'winston-daily-rotate-file',
    'pusher'
  ],
  
  // Add workspace root
  outputFileTracingRoot: require('path').join(__dirname),
  
  // Keep existing config...
}
```

---

### 2. Add CSS Type Declarations (15 minutes)

**Create file:** `src/app/globals.css.d.ts`

```typescript
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
```

---

### 3. Fix Prisma Warnings (30 minutes)

**File:** `next.config.js` (add to webpack config)

```javascript
webpack: (config, { isServer }) => {
  if (!isServer) {
    // Existing fallbacks...
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@prisma/instrumentation': false,
      '@opentelemetry/instrumentation': false
    };
    
    // Add warning ignores
    config.ignoreWarnings = [
      { module: /node_modules\/@prisma\/instrumentation/ },
      { module: /node_modules\/@opentelemetry\/instrumentation/ }
    ];
  }
  return config;
}
```

---

### 4. Clean Up Duplicated TODOs (45 minutes)

**File:** `src/lib/utils.tsx` (lines 134, 238, 249)

**Find:**
```typescript
// TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error(...)
```

**Replace with:**
```typescript
// Logging will be replaced with unified logger system
console.error(...)
```

---

### 5. Fix Performance Monitor (30 minutes)

**File:** `src/components/PerformanceMonitor.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';

export function PerformanceMonitor() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMonitoring = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isMonitoring.current) return;
    isMonitoring.current = true;

    console.log('CATALYST Performance Monitor initialized');
    
    const handleUnload = () => {
      performanceMonitor.forceCleanup();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    
    const checkMemory = () => {
      const metrics = performanceMonitor.getLatestMetrics();
      if (metrics && metrics.memoryUsage > 50 * 1024 * 1024) {
        console.warn('High memory usage detected, triggering cleanup');
        performanceMonitor.forceCleanup();
      }
    };

    intervalRef.current = setInterval(checkMemory, 60000);

    return () => {
      isMonitoring.current = false;
      window.removeEventListener('beforeunload', handleUnload);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return null;
}
```

---

## 🧪 TEST AFTER CHANGES

```bash
# 1. Clean build
npm run build

# 2. Verify no critical warnings
# Should see: "Compiled successfully" or only minor warnings

# 3. Run tests
npm run test

# 4. Check bundle size
npm run bundle:size
```

---

## ✅ SUCCESS CRITERIA

After applying these fixes:
- ✅ No Next.js configuration warnings
- ✅ No TypeScript import errors
- ✅ No Prisma instrumentation warnings
- ✅ Clean code (no duplicated TODOs)
- ✅ Performance monitor properly cleaned up

---

## 📊 EXPECTED IMPROVEMENTS

| Metric | Before | After |
|--------|--------|-------|
| Build Warnings | 15+ | 5-7 |
| Console Logs | 100+ | 100+ (temp) |
| Type Errors | 1 | 0 |
| Code Quality | 70/100 | 85/100 |

---

## 🔄 NEXT STEPS (After Quick Wins)

1. **Week 1:** Implement unified logging system
2. **Week 2:** Update deprecated dependencies
3. **Week 3:** Improve test coverage to 80%
4. **Week 4:** Performance optimizations

See `COMPREHENSIVE_AUDIT_AND_IMPROVEMENT_PLAN.md` for full details.

---

**Total Time Required:** 2.5 hours  
**Developer:** 1 person  
**Risk Level:** Low (all changes are backwards compatible)
