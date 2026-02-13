const CACHE_NAME = 'pew-run-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/game.js',
    '/style.css',
    '/manifest.json',
    '/privacy-policy.html',
    '/icons/icon-48.png',
    '/icons/icon-72.png',
    '/icons/icon-96.png',
    '/icons/icon-120.png',
    '/icons/icon-144.png',
    '/icons/icon-152.png',
    '/icons/icon-167.png',
    '/icons/icon-180.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-192-maskable.png',
    '/icons/icon-512-maskable.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => cached);
            return cached || fetchPromise;
        })
    );
});
