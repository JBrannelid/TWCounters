self.addEventListener("install", event => {
    event.waitUntil(
      caches.open("swgoh-cache-v1").then(cache => {
        return cache.addAll([
          "/", // Hemsidans startpunkt
          "/index.html", // Indexfilen
          "/dist/main.js", // Byggd main.js fil
          "/dist/styles.css", // Byggd styles.css fil
        ]).catch(error => {
          console.error('Error caching files:', error);
        });
      })
    );
  });
  
  self.addEventListener("fetch", event => {
    if (event.request.method === "GET") { // Cacha endast GET-begärningar
      event.respondWith(
        caches.match(event.request).then(response => {
          // Om vi hittar en cachead version, returnera den, annars gör en ny fetch
          return response || fetch(event.request).then(fetchResponse => {
            // Lägg till den hämtade resursen i cachen för framtida användning
            return caches.open("swgoh-cache-v1").then(cache => {
              cache.put(event.request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        }).catch(error => {
          console.error('Error handling fetch:', error);
          return new Response('Network error occurred', { status: 408 }); // Returnera ett felmeddelande om nätverksproblem
        })
      );
    }
  });
  