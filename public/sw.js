// Local IDE Service Worker
const CACHE_NAME = 'local-ide-v4';
const STATIC_CACHE_NAME = 'local-ide-static-v4';
const DYNAMIC_CACHE_NAME = 'local-ide-dynamic-v4';

// Static assets to cache on install (only essential ones)
const STATIC_ASSETS = [
  '/ide',
  '/manifest.json',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, falling back to network
  cacheFirst: async (request, cacheName = STATIC_CACHE_NAME) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return new Response('Offline', { status: 503 });
    }
  },

  // Network first, falling back to cache
  networkFirst: async (request, cacheName = DYNAMIC_CACHE_NAME) => {
    const cache = await caches.open(cacheName);
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
      return new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  // Stale while revalidate
  staleWhileRevalidate: async (request, cacheName = DYNAMIC_CACHE_NAME) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => cached);

    return cached || fetchPromise;
  },
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      console.log('[SW] Caching static assets');
      // Cache each asset individually to avoid failing entire install
      for (const url of STATIC_ASSETS) {
        try {
          await cache.add(url);
        } catch (error) {
          console.warn('[SW] Failed to cache:', url, error.message);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
          .map((key) => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting, activating new service worker');
    self.skipWaiting();
  }
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API routes - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }

  // Static assets - use network first in development to avoid stale code
  // In production, Next.js uses content-hashed filenames so caching is safe
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    // During development, always fetch fresh to avoid hydration mismatches
    // The URL will contain 'localhost' or the dev server address
    const isDev = url.hostname === 'localhost' ||
                  url.hostname === '127.0.0.1' ||
                  url.port === '3000' ||
                  url.port === '4000';

    if (isDev) {
      event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    } else {
      event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
    }
    return;
  }

  // IDE pages - stale while revalidate
  if (url.pathname.startsWith('/ide')) {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request));
    return;
  }

  // Default - network first
  event.respondWith(CACHE_STRATEGIES.networkFirst(request));
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

// Sync pending actions when back online
async function syncPendingActions() {
  try {
    const cache = await caches.open('local-ide-pending');
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        const cached = await cache.match(request);
        if (cached) {
          const data = await cached.json();
          await fetch(data.url, {
            method: data.method,
            headers: data.headers,
            body: JSON.stringify(data.body),
          });
          await cache.delete(request);
        }
      } catch (error) {
        console.error('[SW] Failed to sync action:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/ide',
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Local IDE', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/ide';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Focus existing window or open new
      for (const client of windowClients) {
        if (client.url.includes('/ide') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

console.log('[SW] Service worker loaded');
