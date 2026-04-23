const CACHE_NAME = 'trackline-v3-network-first';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './sunmoon_logo.png'
];

// 1. 安裝階段：強制新版引擎立刻接管，不准等待！
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
});

// 2. 啟動階段：清空所有舊版快取垃圾，保持戰場淨空
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('清除舊版快取:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // 立刻控制所有開啟中的網頁
});

// 3. 攔截要求階段 (終極戰術：網路優先 Network-First)
self.addEventListener('fetch', (event) => {
  // 只攔截 GET 請求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // 戰術 A：先去問網路（GitHub）有沒有最新版
    fetch(event.request)
      .then(response => {
        // 如果成功拿到最新版，就偷偷把它存進快取當作未來的備用乾糧
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response; // 把最新版顯示給使用者
      })
      .catch(() => {
        // 戰術 B：如果網路斷線（例如在深山裡），才從快取包裡面拿出備用乾糧
        console.log('網路斷線，啟用離線快取模式');
        return caches.match(event.request);
      })
  );
});