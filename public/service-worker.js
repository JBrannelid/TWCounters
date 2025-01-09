const CACHE_NAME = 'swgoh-cache-v1';
const STATIC_CACHE = 'static-cache-v1';
const FIREBASE_CACHE = 'firebase-cache-v1';
const ASSET_CACHE = 'asset-cache-v1';
const ALLOWED_SCHEMES = ['http:', 'https:'];

// Firebase domains to cache
const FIREBASE_DOMAINS = [
  'firebaseinstallations.googleapis.com',
  'firestore.googleapis.com',
  'firebase.googleapis.com'
];

// Cache times in seconds
const CACHE_TIMES = {
  firebase: 3600, // 1 hour
  static: 31536000, // 1 year
  assets: 31536000 // 1 year
};

const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/src/styles/critical.css'
];

const ASSET_FILES = [
  '/asset/characters/',
  '/asset/ships/'
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_FILES)),
      caches.open(ASSET_CACHE).then(cache => cache.addAll(ASSET_FILES)),
      caches.open(FIREBASE_CACHE).then(cache => {
        // Pre-cache empty Firebase cache to ensure it exists
        return Promise.resolve();
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activation - cleanup old caches and claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(keys => {
        return Promise.all(
          keys.map(key => {
            if (![STATIC_CACHE, ASSET_CACHE, FIREBASE_CACHE, CACHE_NAME].includes(key)) {
              return caches.delete(key);
            }
          })
        );
      }),
      // Claim clients so the service worker is in control from the start
      self.clients.claim()
    ])
  );
});

// Handle Firebase requests with caching
async function handleFirebaseRequest(request) {
  const cache = await caches.open(FIREBASE_CACHE);
  const cachedResponse = await cache.match(request);
  
  try {
    // Always try network first for Firebase requests
    const response = await fetch(request);
    if (response.ok) {
      // Add proper cache headers
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', `public, max-age=${CACHE_TIMES.firebase}`);
      
      const modifiedResponse = new Response(
        await response.clone().blob(),
        {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        }
      );

      // Store in cache
      cache.put(request, modifiedResponse.clone());
      return response;
    }
    
    // If network request failed but we have a cached version, return it
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If everything failed, throw to trigger offline handling
    throw new Error('Network response was not ok and no cache available');
  } catch (error) {
    console.warn('Firebase request failed:', error);
    // Return cached response if available
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page as last resort
    return caches.match('/offline.html');
  }
}

// Enhanced cache-first strategy for static assets
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached response immediately
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Add proper cache headers
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', `public, max-age=${CACHE_TIMES.static}, immutable`);
      
      const modifiedResponse = new Response(
        await response.clone().blob(),
        {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        }
      );

      // Store in cache
      cache.put(request, modifiedResponse.clone());
      return response;
    }
    throw new Error('Network response was not ok');
  } catch (error) {
    console.error('Error fetching static asset:', error);
    // Try cache again as last resort
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page if everything fails
    return caches.match('/offline.html');
  }
}

// Updated fetch event handler
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and non-allowed schemes
  if (event.request.method !== 'GET' || !ALLOWED_SCHEMES.includes(url.protocol)) {
    return;
  }

  // Handle Firebase requests
  if (FIREBASE_DOMAINS.some(domain => url.hostname.includes(domain))) {
    event.respondWith(handleFirebaseRequest(event.request));
    return;
  }

  // Handle static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2|woff|ttf)$/)) {
    event.respondWith(handleStaticAsset(event.request));
    return;
  }

  // Default to network first for other requests
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(request))
      .catch(() => caches.match('/offline.html'))
  );
});