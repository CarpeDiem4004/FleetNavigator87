const CACHE_NAME = 'murici-fleet-v2.0.0';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/favicon.svg'
];

const DYNAMIC_CACHE_NAME = 'murici-fleet-dynamic-v2';

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        // Cache static assets one by one to handle failures gracefully
        return Promise.allSettled(
          STATIC_CACHE_URLS.map(url => 
            cache.add(url).catch(error => {
              console.warn(`[Service Worker] Failed to cache ${url}:`, error);
              return null;
            })
          )
        );
      })
      .then((results) => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`[Service Worker] Cached ${successful}/${STATIC_CACHE_URLS.length} assets`);
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch Event - Cache Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - Network First with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response for caching
          const responseClone = response.clone();
          
          // Cache successful responses
          if (response.status === 200) {
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Return offline page for failed API calls
              return new Response(
                JSON.stringify({ 
                  error: 'Sem conexão com a internet',
                  offline: true 
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Static resources - Cache First
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response for caching
            const responseClone = response.clone();

            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });

            return response;
          })
          .catch(() => {
            // Fallback for HTML pages
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html')
                .then((offlinePage) => {
                  if (offlinePage) {
                    return offlinePage;
                  }
                  
                  // Create a basic offline page if none exists
                  return new Response(
                    `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Offline - Murici Line Haul</title>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body { 
                          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                          text-align: center; 
                          padding: 50px;
                          background: #f5f5f5;
                        }
                        .offline-container {
                          background: white;
                          padding: 30px;
                          border-radius: 10px;
                          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                          max-width: 400px;
                          margin: 0 auto;
                        }
                        .offline-icon { font-size: 48px; margin-bottom: 20px; }
                        h1 { color: #333; margin-bottom: 10px; }
                        p { color: #666; line-height: 1.5; }
                        .retry-btn {
                          background: #2563eb;
                          color: white;
                          border: none;
                          padding: 12px 24px;
                          border-radius: 6px;
                          cursor: pointer;
                          margin-top: 20px;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="offline-container">
                        <div class="offline-icon">📱</div>
                        <h1>Modo Offline</h1>
                        <p>Você está offline. Algumas funcionalidades podem estar limitadas.</p>
                        <p>Verifique sua conexão com a internet e tente novamente.</p>
                        <button class="retry-btn" onclick="window.location.reload()">
                          Tentar Novamente
                        </button>
                      </div>
                    </body>
                    </html>
                    `,
                    {
                      headers: { 'Content-Type': 'text/html' }
                    }
                  );
                });
            }
            
            throw error;
          });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  
  if (event.tag === 'checklist-sync') {
    event.waitUntil(syncPendingChecklists());
  }
});

// Sync pending checklists when back online
async function syncPendingChecklists() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const keys = await cache.keys();
    
    for (const request of keys) {
      if (request.url.includes('/api/line-hall/checklist') && request.method === 'POST') {
        try {
          await fetch(request);
          await cache.delete(request);
          console.log('[Service Worker] Synced pending checklist');
        } catch (error) {
          console.error('[Service Worker] Failed to sync checklist:', error);
        }
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Push notifications for trip updates
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Detalhes',
        icon: '/icons/icon-72x72.svg'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/icon-72x72.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Murici Line Haul', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/motorista-line-hall')
    );
  }
});