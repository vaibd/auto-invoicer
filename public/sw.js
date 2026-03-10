const CACHE_NAME = "invoicer-v2";
const STATIC_ASSETS = ["/", "/setup"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  // Only cache same-origin, http(s) requests
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.protocol.startsWith("http")) return;

  // Network-first: serve fresh content, fall back to cache when offline
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          // Respect cache-control directives
          const cacheControl = response.headers.get("Cache-Control") || "";
          if (!cacheControl.includes("no-store") && !cacheControl.includes("no-cache")) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
