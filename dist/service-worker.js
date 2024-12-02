const CACHE_NAME = 'swgoh-cache-v1';
const ALLOWED_SCHEMES = ['http:', 'https:'];

self.addEventListener('fetch', event => {
  if (!ALLOWED_SCHEMES.includes(new URL(event.request.url).protocol)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => new Response('Network error occurred', { status: 408 }))
  );
});