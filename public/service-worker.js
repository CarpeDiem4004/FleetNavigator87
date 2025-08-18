// Service Worker for Murici Fleet PWA
const CACHE_NAME = 'murici-fleet-v2';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install event
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[SW] Cache install error:', error);
      })
  );
  self.skipWaiting();
});

// Fetch event - Allow all network requests to pass through
self.addEventListener('fetch', event => {
  // Don't intercept API calls or authentication requests
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('auth') ||
      event.request.url.includes('login')) {
    return fetch(event.request);
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
      .catch(() => {
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});