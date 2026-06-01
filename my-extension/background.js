// Minimal service worker — does nothing on its own.
// Playwright will evaluate fetch() calls inside it via sw.evaluate().
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
