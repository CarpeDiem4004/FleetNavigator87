// Murici SaaS Service Worker
const CACHE_NAME = 'murici-saas-v1.0.0';
const API_CACHE_NAME = 'murici-saas-api-v1.0.0';

// Static resources to cache
const STATIC_RESOURCES = [
  '/',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/favicon.svg'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth/verify',
  '/api/bases'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Murici SaaS Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('Murici SaaS Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME;
          })
          .map(cacheName => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // API requests - Network First with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Static resources - Cache First with network fallback
  if (STATIC_RESOURCES.includes(url.pathname) || 
      url.pathname.includes('/icons/') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css')) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // HTML pages - Network First with cache fallback
  if (request.headers.get('Accept').includes('text/html')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Default to network
  event.respondWith(fetch(request));
});

// Network First Strategy (for API and dynamic content)
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    
    // Clone response for caching
    const responseClone = response.clone();
    
    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(
        request.url.includes('/api/') ? API_CACHE_NAME : CACHE_NAME
      );
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache and HTML request, return offline page
    if (request.headers.get('Accept').includes('text/html')) {
      return new Response(
        generateOfflinePage(),
        {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
    
    // Return error for other requests
    return new Response(
      JSON.stringify({ error: 'Network error and no cache available' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache First Strategy (for static resources)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.status === 200) {
      const responseClone = response.clone();
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.error('Both cache and network failed:', error);
    return new Response('Resource not available', { status: 404 });
  }
}

// Generate offline page
function generateOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Murici SaaS - Offline</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
        <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div class="text-center max-w-md mx-auto p-8">
                <div class="text-6xl mb-6">🚫</div>
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Você está offline</h1>
                <p class="text-gray-600 mb-6">
                    Não foi possível conectar com os servidores do Murici SaaS. 
                    Verifique sua conexão com a internet.
                </p>
                <button onclick="window.location.reload()" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
                    Tentar Novamente
                </button>
                <div class="mt-8 text-sm text-gray-500">
                    <p>Murici SaaS - External Links</p>
                </div>
            </div>
        </div>
        
        <script>
            // Auto-retry when back online
            window.addEventListener('online', () => {
                console.log('Back online, reloading...');
                window.location.reload();
            });
        </script>
    </body>
    </html>
  `;
}

// Background sync for failed API requests
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-fuel-cards') {
    event.waitUntil(syncFailedRequests());
  }
});

// Sync failed requests when back online
async function syncFailedRequests() {
  const failedRequests = await getFailedRequestsFromIndexedDB();
  
  for (const request of failedRequests) {
    try {
      await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      
      // Remove from failed requests
      await removeFailedRequestFromIndexedDB(request.id);
      
      console.log('Synced failed request:', request.url);
    } catch (error) {
      console.error('Failed to sync request:', error);
    }
  }
}

// IndexedDB helpers for failed requests
async function getFailedRequestsFromIndexedDB() {
  // Simplified - in production, implement proper IndexedDB handling
  return [];
}

async function removeFailedRequestFromIndexedDB(id) {
  // Simplified - in production, implement proper IndexedDB handling
  return;
}

// Push notifications (for future use)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const url = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.openWindow(url)
  );
});

console.log('Murici SaaS Service Worker loaded');