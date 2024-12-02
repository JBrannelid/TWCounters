const CACHE_NAME = 'swgoh-cache-v1';
const ALLOWED_SCHEMES = ['http:', 'https:'];

// Add assets to cache during installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]);
    })
  );
});

// Handle fetch events
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and chrome-extension URLs
  if (event.request.method !== 'GET' || 
      !ALLOWED_SCHEMES.includes(url.protocol)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request).then(response => {
          // Don't cache if not successful
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => new Response('Network error occurred', { 
        status: 408,
        headers: { 'Content-Type': 'text/plain' }
      }))
  );
});