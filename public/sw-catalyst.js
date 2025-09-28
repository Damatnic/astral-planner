// CATALYST CRITICAL: Optimized Service Worker for Bundle Performance
// Designed to handle micro-bundles and prevent quota errors

const CACHE_NAME = 'catalyst-cache-v1';
const CRITICAL_CACHE = 'critical-v1';
const STATIC_CACHE = 'static-v1';

// CRITICAL: Maximum cache sizes to prevent quota errors
const MAX_CACHE_SIZE = 50; // Maximum 50 entries per cache
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// CRITICAL: Only cache essential resources
const CRITICAL_RESOURCES = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/chunks/react-',
  '/_next/static/chunks/react-dom-',
  '/_next/static/chunks/main-',
  '/_next/static/chunks/webpack-',
];

// CRITICAL: Static resources that change infrequently
const STATIC_PATTERNS = [
  /\/_next\/static\/css\//,
  /\/_next\/static\/chunks\/react-/,
  /\/_next\/static\/chunks\/react-dom-/,
  /\/_next\/static\/chunks\/main-/,
  /\/_next\/static\/chunks\/webpack-/,
  /\/_next\/static\/chunks\/critical-/,
  /\/_next\/static\/chunks\/clsx-/,
  /\/_next\/static\/chunks\/cva-/,
  /\/_next\/static\/chunks\/tailwind-merge-/,
];

// CRITICAL: Heavy resources that should be cached separately
const HEAVY_PATTERNS = [
  /\/_next\/static\/chunks\/recharts-/,
  /\/_next\/static\/chunks\/framer-motion-/,
  /\/_next\/static\/chunks\/tanstack-/,
  /\/_next\/static\/chunks\/radix-/,
  /\/_next\/static\/chunks\/lucide-/,
];

// CRITICAL: Never cache these patterns
const NEVER_CACHE = [
  /\/api\//,
  /\/_next\/static\/chunks\/.*-devtools-/,
  /\.map$/,
  /hot-update/,
  /\/monitoring\//,
];

// Helper: Check if URL should never be cached
function shouldNeverCache(url) {
  return NEVER_CACHE.some(pattern => pattern.test(url));
}

// Helper: Get cache name for URL
function getCacheNameForUrl(url) {
  if (CRITICAL_RESOURCES.some(resource => url.includes(resource))) {
    return CRITICAL_CACHE;
  }
  if (STATIC_PATTERNS.some(pattern => pattern.test(url))) {
    return STATIC_CACHE;
  }
  return CACHE_NAME;
}

// Helper: Clean old cache entries
async function cleanCache(cacheName, maxSize = MAX_CACHE_SIZE) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    const entriesToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(entriesToDelete.map(key => cache.delete(key)));
  }
  
  // Clean by age
  const now = Date.now();
  const promises = keys.map(async (request) => {
    const response = await cache.match(request);
    if (response) {
      const cachedTime = response.headers.get('sw-cached-time');
      if (cachedTime && (now - parseInt(cachedTime)) > MAX_CACHE_AGE) {
        await cache.delete(request);
      }
    }
  });
  
  await Promise.all(promises);
}

// Install event - Cache critical resources only
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CRITICAL_CACHE);
      // Only cache the absolute essentials
      const criticalUrls = [
        '/',
        '/manifest.json'
      ];
      
      try {
        await cache.addAll(criticalUrls);
      } catch (error) {
        console.warn('Failed to cache some critical resources:', error);
      }
      
      self.skipWaiting();
    })()
  );
});

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        !name.includes('catalyst-cache-v1') && 
        !name.includes('critical-v1') && 
        !name.includes('static-v1')
      );
      
      await Promise.all(oldCaches.map(name => caches.delete(name)));
      
      // Clean existing caches
      await Promise.all([
        cleanCache(CRITICAL_CACHE, 20),
        cleanCache(STATIC_CACHE, 30),
        cleanCache(CACHE_NAME, 50)
      ]);
      
      self.clients.claim();
    })()
  );
});

// Fetch event - Smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and never-cache patterns
  if (request.method !== 'GET' || shouldNeverCache(url.pathname)) {
    return;
  }
  
  // Skip cross-origin requests except for critical CDNs
  if (url.origin !== location.origin && !url.hostname.includes('fonts.')) {
    return;
  }
  
  event.respondWith(
    (async () => {
      const cacheName = getCacheNameForUrl(url.pathname);
      const cache = await caches.open(cacheName);
      
      // Try cache first for static resources
      if (STATIC_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
      }
      
      try {
        // Fetch from network
        const response = await fetch(request, {
          credentials: 'same-origin'
        });
        
        // Only cache successful responses
        if (response.status === 200) {
          // Check cache size before adding
          const keys = await cache.keys();
          if (keys.length < MAX_CACHE_SIZE) {
            const responseToCache = response.clone();
            // Add timestamp for age-based cleanup
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-time', Date.now().toString());
            
            const responseWithTimestamp = new Response(responseToCache.body, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: headers
            });
            
            // Don't await cache put to avoid blocking response
            cache.put(request, responseWithTimestamp).catch(() => {
              // Ignore cache errors to prevent blocking
            });
          }
        }
        
        return response;
      } catch (error) {
        // Try cache as fallback
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return new Response(
            `<!DOCTYPE html>
            <html>
            <head>
              <title>Offline - Astral Planner</title>
              <style>
                body { font-family: system-ui; text-align: center; padding: 50px; }
                .offline { color: #666; }
              </style>
            </head>
            <body>
              <div class="offline">
                <h1>You're offline</h1>
                <p>Please check your internet connection and try again.</p>
              </div>
            </body>
            </html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
        
        throw error;
      }
    })()
  );
});

// Message event - Handle cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'CLEAN_CACHE':
        event.waitUntil(
          Promise.all([
            cleanCache(CRITICAL_CACHE, 10),
            cleanCache(STATIC_CACHE, 15),
            cleanCache(CACHE_NAME, 25)
          ])
        );
        break;
      case 'CACHE_SIZE':
        event.waitUntil(
          (async () => {
            const cacheNames = [CRITICAL_CACHE, STATIC_CACHE, CACHE_NAME];
            const sizes = await Promise.all(
              cacheNames.map(async (name) => {
                const cache = await caches.open(name);
                const keys = await cache.keys();
                return { name, size: keys.length };
              })
            );
            
            event.ports[0].postMessage({ sizes });
          })()
        );
        break;
    }
  }
});

// Error handler
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

// Unhandled promise rejection handler
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled promise rejection:', event.reason);
  event.preventDefault();
});