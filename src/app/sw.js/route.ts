import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const serviceWorkerCode = `
// Service worker cleanup script
// This service worker unregisters itself and cleans up old caches

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately (silent)
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Delete all caches (silent cleanup)
        const cacheNames = await caches.keys();
        
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );

        // Claim all clients
        await self.clients.claim();

        // Get all clients and post a message to reload
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });

        // Unregister this service worker after cleanup (silent)
        setTimeout(() => {
          self.registration.unregister().catch(() => {
            // Silent error handling
          });
        }, 1000);

      } catch (error) {
        // Silent error handling for production
      }
    })()
  );
});

// Handle fetch events (minimal implementation)
self.addEventListener('fetch', (event) => {
  // Just pass through all requests without caching
  event.respondWith(fetch(event.request));
});
`;

  return new NextResponse(serviceWorkerCode, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}