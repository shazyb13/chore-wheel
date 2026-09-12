// Bump this version whenever you re-upload index.html so phones pick up the new
// version instead of serving the old cached one.
const CACHE = 'chore-wheel-v3';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache sync traffic — those calls must always hit the network so the
  // house state stays current. Let them fail naturally when offline; the app
  // already falls back to its local copy.
  if (url.hostname.includes('jsonbin.io')) return;

  if (event.request.method !== 'GET') return;

  // Network-first for the app shell, so a re-upload reaches people quickly,
  // with the cache as the offline fallback.
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html')))
  );
});
