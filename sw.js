
const CACHE_NAME = 'bus-pro-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './constants.tsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Check if the request is for an external module (esm.sh)
  // We allow these to be cached by the browser or fetch them normally
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          // Cache successful responses for future offline use
          if (event.request.url.startsWith('http')) {
             // Optional: cache external modules here if desired
          }
          return fetchRes;
        });
      });
    }).catch(() => {
      // Fallback if both fail
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
