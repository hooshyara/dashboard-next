// سرویس ورکر سامانهٔ گلستان علی
// استراتژی: network-first برای ناوبری، cache-first برای دارایی‌های استاتیک
const CACHE_VERSION = 'golestan-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // فقط درخواست‌های GET کش می‌شوند
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // درخواست‌های هم‌مبدأ نیستند را دست نمی‌زنیم (مثل API های خارجی)
  if (url.origin !== self.location.origin) return;

  // درخواست‌های API را همیشه از شبکه می‌گیریم (بدون کش‌کردن دادهٔ حساس)
  if (url.pathname.startsWith('/api')) return;

  // ناوبری صفحات: network-first با fallback به کش
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // دارایی‌های استاتیک: cache-first
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.startsWith('/fonts') ||
    /\.(?:js|css|png|jpg|jpeg|svg|webp|woff2?|ttf)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
