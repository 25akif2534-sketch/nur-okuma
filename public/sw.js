const CACHE_NAME = 'nur-okuma-v7';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.g')) {
    return;
  }

  const isAppShellOrIndex =
    request.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/manifest.json') ||
    url.pathname.endsWith('/books-index.json');

  if (isAppShellOrIndex) {
    // Ana sayfa ve kitap fihristi için: İnternet varsa günceli al ve önbelleğe yaz, internet yoksa önbellekten aç
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await cache.match(request);
          return cached || (await cache.match('./index.html'));
        }
      })
    );
    return;
  }

  // Okunan bahisler (ch-*.json), arama dizini (search-index.json) ve yazı tipleri için: Önbellek öncelikli + arka planda güncelle
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const networkPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkPromise;
    })
  );
});
