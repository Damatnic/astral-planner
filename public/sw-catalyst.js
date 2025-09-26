// Catalyst Service Worker - High-Performance PWA
const CACHE_NAME = 'astral-chronos-v1.0.2';
const STATIC_CACHE = 'static-v1.0.2';
const DYNAMIC_CACHE = 'dynamic-v1.0.2';
const API_CACHE = 'api-v1.0.2';
const IMAGE_CACHE = 'images-v1.0.2';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/calendar',
  '/goals',
  '/habits',
  '/planner',
  '/offline',
  '/manifest.json',
  '/_next/static/css/app.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/tasks',
  '/api/goals',
  '/api/habits',
  '/api/calendar',
  '/api/analytics'
];

// Network-first strategies for dynamic content
const NETWORK_FIRST = [
  '/api/auth',
  '/api/sync',
  '/api/realtime'
];

// Cache-first strategies for static assets
const CACHE_FIRST = [
  '/_next/static/',
  '/icons/',
  '/images/',
  '.woff2',
  '.woff',
  '.ttf'
];

// Stale-while-revalidate for frequently updated content
const STALE_WHILE_REVALIDATE = [
  '/api/dashboard',
  '/api/notifications'
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== STATIC_CACHE &&
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== API_CACHE &&
                     cacheName !== IMAGE_CACHE;
            })
            .map(cacheName => {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - Handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  event.respondWith(handleRequest(request));
});

// Main request handling logic
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // API requests
    if (pathname.startsWith('/api/')) {
      return await handleApiRequest(request);
    }
    
    // Static assets (JS, CSS, fonts)
    if (shouldCacheFirst(pathname)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // Images
    if (isImageRequest(request)) {
      return await handleImageRequest(request);
    }
    
    // Navigation requests (HTML pages)
    if (request.mode === 'navigate') {
      return await handleNavigationRequest(request);
    }
    
    // Default: network first with cache fallback
    return await networkFirst(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('Service Worker: Request failed', error);
    return await handleOffline(request);
  }
}

// Handle API requests with intelligent caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Network-first for authentication and real-time endpoints
  if (NETWORK_FIRST.some(pattern => pathname.includes(pattern))) {
    return await networkFirst(request, API_CACHE);
  }
  
  // Stale-while-revalidate for frequently updated content
  if (STALE_WHILE_REVALIDATE.some(pattern => pathname.includes(pattern))) {
    return await staleWhileRevalidate(request, API_CACHE);
  }
  
  // Cache with network fallback for other API endpoints
  return await cacheFirst(request, API_CACHE, 300000); // 5 minutes TTL
}

// Handle image requests with aggressive caching
async function handleImageRequest(request) {
  // Check if it's a Next.js optimized image
  if (request.url.includes('/_next/image')) {
    return await cacheFirst(request, IMAGE_CACHE, 86400000); // 24 hours TTL
  }
  
  // Handle other images
  return await staleWhileRevalidate(request, IMAGE_CACHE);
}

// Handle navigation requests with app shell pattern
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback to offline page
    return await caches.match('/offline') || new Response('Offline', { status: 503 });
  }
}

// Cache strategies implementation
async function cacheFirst(request, cacheName, ttl = null) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Check if cached response is still valid
  if (cached && ttl) {
    const cachedDate = new Date(cached.headers.get('date') || 0);
    const now = new Date();
    if (now.getTime() - cachedDate.getTime() > ttl) {
      // Cache expired, try to update
      updateCache(request, cacheName);
      return cached; // Return stale cache while updating
    }
  }
  
  if (cached) {
    return cached;
  }
  
  // Not in cache, fetch from network
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Start network request in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Return cached version immediately if available
  if (cached) {
    return cached;
  }
  
  // Wait for network if no cache
  return await networkPromise || new Response('Network error', { status: 503 });
}

// Update cache in background
async function updateCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
  } catch (error) {
    console.log('Background cache update failed:', error);
  }
}

// Helper functions
function shouldCacheFirst(pathname) {
  return CACHE_FIRST.some(pattern => pathname.includes(pattern));
}

function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(request.url);
}

async function handleOffline(request) {
  const url = new URL(request.url);
  
  // Try to serve from cache
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  // Return appropriate offline responses
  if (request.mode === 'navigate') {
    return await caches.match('/offline') || 
           new Response('You are offline', { status: 503 });
  }
  
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No network connection' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return new Response('Resource not available offline', { status: 503 });
}

// Background sync for data synchronization
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // Sync offline changes when connection is restored
    const tasks = await getOfflineData('pending-tasks');
    const goals = await getOfflineData('pending-goals');
    const habits = await getOfflineData('pending-habits');
    
    // Sync tasks
    for (const task of tasks) {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
    }
    
    // Clear offline data after successful sync
    await clearOfflineData(['pending-tasks', 'pending-goals', 'pending-habits']);
    
    // Notify clients about sync completion
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SYNC_COMPLETE' });
      });
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helpers for offline data
async function getOfflineData(storeName) {
  // Implementation would use IndexedDB
  return [];
}

async function clearOfflineData(storeNames) {
  // Implementation would clear IndexedDB stores
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || 'notification',
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  const data = event.notification.data;
  const action = event.action;
  
  let url = '/dashboard';
  
  if (data && data.url) {
    url = data.url;
  }
  
  if (action) {
    // Handle specific actions
    switch (action) {
      case 'view_task':
        url = `/tasks/${data.taskId}`;
        break;
      case 'complete_habit':
        url = `/habits/${data.habitId}`;
        break;
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clients => {
      // Check if app is already open
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_CLEAR':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'FORCE_UPDATE':
      update().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  
  // Notify clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'CACHE_CLEARED' });
    });
  });
}

async function update() {
  await self.registration.update();
}