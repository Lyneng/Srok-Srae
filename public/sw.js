// Minimal service worker so browsers offer "Add to Home Screen".
// It does not cache anything: the game needs the server anyway.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
