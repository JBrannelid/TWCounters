self.addEventListener("install", event => {
    event.waitUntil(
      caches.open("swgoh-cache-v1").then(cache => {
        return cache.addAll([
          "/",
          "/index.html",
          "/src/main.tsx",
          "/src/styles.css",
          "/icons/icon-192x192.png",
          "/icons/icon-512x512.png"
        ]);
      })
    );
  });
  
  self.addEventListener("fetch", event => {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  });
  