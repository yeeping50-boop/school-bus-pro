
// ultra-minimal service worker to avoid origin issues
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', (event) => {
  // Pass through all requests to network
  event.respondWith(fetch(event.request));
});
