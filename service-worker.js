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
    '/icons/icon-512-maskable.png',
    '/icons/splash.svg'
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
    const url = event.request.url;
    const isNavigate = event.request.mode === 'navigate';
    const isHTMLorJS = url.endsWith('.html') || url.endsWith('.js');

    if (isNavigate || isHTMLorJS) {
        // Network-first for HTML and JS files
        event.respondWith(
            fetch(event.request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match(event.request))
        );
    } else {
        // Cache-first for everything else (images, CSS, icons)
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                });
            })
        );
    }
});
