// BCH Sourcing OS — Service Worker (§10.2)
// Strategy: network-first with cache fallback.

const CACHE_NAME = "bch-sourcing-v2";

self.addEventListener("install", (event) => {
  // Activate this SW as soon as it's finished installing.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clear out any stale caches from previous versions.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests; let everything else hit the network untouched.
  if (request.method !== "GET") {
    return;
  }

  // Never cache extension requests or Next.js data/HMR payloads.
  if (
    url.protocol === "chrome-extension:" ||
    url.pathname.startsWith("/_next/data")
  ) {
    return;
  }

  // Page loads (HTML documents) always go straight to the network so the app
  // can never be served stale. Only hashed static assets get cached below.
  if (request.mode === "navigate") {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Network-first.
        const response = await fetch(request);

        // Clone + cache successful GET responses for offline fallback.
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }

        return response;
      } catch (err) {
        // Offline / network failure → fall back to cache.
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }

        // Nothing cached → return a basic offline response.
        return new Response("Offline", {
          status: 503,
          statusText: "Offline",
          headers: { "Content-Type": "text/plain" },
        });
      }
    })()
  );
});
