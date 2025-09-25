// Service worker cleanup script
// This service worker unregisters itself and cleans up old caches

self.addEventListener('install', (event) => {
  console.log('Cleanup service worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Cleanup service worker activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Delete all caches
        const cacheNames = await caches.keys();
        console.log('Found caches to delete:', cacheNames);
        
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );

        // Claim all clients
        await self.clients.claim();

        // Get all clients and post a message to reload
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });

        console.log('Cache cleanup completed');

        // Unregister this service worker after cleanup
        setTimeout(() => {
          self.registration.unregister().then(() => {
            console.log('Service worker unregistered successfully');
          });
        }, 1000);

      } catch (error) {
        console.error('Error during cache cleanup:', error);
      }
    })()
  );
});

// Handle fetch events (minimal implementation)
self.addEventListener('fetch', (event) => {
  // Just pass through all requests without caching
  event.respondWith(fetch(event.request));
});