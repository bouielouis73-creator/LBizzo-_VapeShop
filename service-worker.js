// ✅ LBizzo Vape Shop Service Worker
const CACHE_NAME = "lbizzo-vape-cache-v1";
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./firebase.js",
  "./script.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install: cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑 Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache first, then network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Bypass cache for Firebase Storage requests (so images always update)
  const url = event.request.url;
  if (url.includes("firebasestorage.googleapis.com")) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).then((response) => {
          // Cache new requests dynamically
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      );
    })
  );
});
