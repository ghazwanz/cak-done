const CACHE_VERSION = 'cak-done-pwa-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const STATIC_ASSETS = [
    '/favicon.svg',
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName.startsWith('cak-done-pwa-'))
                        .filter((cacheName) => cacheName !== STATIC_CACHE)
                        .map((cacheName) => caches.delete(cacheName)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

const isCacheableAssetRequest = (request) => {
    const url = new URL(request.url);

    return (
        request.method === 'GET' &&
        url.origin === self.location.origin &&
        (url.pathname.startsWith('/build/') || STATIC_ASSETS.includes(url.pathname))
    );
};

const cacheFirst = async (request) => {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    const response = await fetch(request);

    if (response.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
    }

    return response;
};

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.mode === 'navigate') {
        event.respondWith(fetch(request));
        return;
    }

    if (isCacheableAssetRequest(request)) {
        event.respondWith(cacheFirst(request));
    }
});

self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    const data = event.data?.json() ?? {};
    const title = data.title || 'Cak Done! Notification';
    const options = {
        body: data.body || 'Ada info baru buat bisnisumu rek!',
        icon: data.icon || '/apple-touch-icon.png',
        badge: '/apple-touch-icon.png',
        data: data.action_url || '/',
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(clients.openWindow(event.notification.data));
});
