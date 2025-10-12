// ✅ Basic PWA caching for offline support
const CACHE_NAME = "lbizzo-vape-cache-v1";
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./firebase.js",
  "./script.js",
  "./manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
