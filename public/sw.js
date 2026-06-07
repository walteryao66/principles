// Service Worker — 个人原则库 PWA
// 提供基本离线缓存支持

const CACHE_NAME = 'principles-v2-1';
const STATIC_ASSETS = [
  './',
  './index.html',
];

// 安装：缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clientsClaim();
});

// 请求拦截：缓存优先策略（对构建产物）
self.addEventListener('fetch', (event) => {
  // 跳过 chrome-extension 和非 HTTP 请求
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // 只缓存成功的 GET 请求
        if (
          event.request.method === 'GET' &&
          response.status === 200 &&
          /\.(js|css|html|svg|png|ico|json|woff2?)$/.test(event.request.url)
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
