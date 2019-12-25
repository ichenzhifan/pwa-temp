const cacheName = 'pwa-demo';
const offlineUrl = 'offline.html';

// 安装期间, 缓存已知的资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(['./css/main.css', './index.html', './offline.html']);
    })
  );
});

// Cache any new resources as they are fetched
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }
      var fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then(function(response) {
          if (!response || response.status !== 200) {
            return response;
          }

          var responseToCache = response.clone();
          caches.open(cacheName).then(function(cache) {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(error => {
          // Check if the user is offline first and is trying to navigate to a web page
          if (
            event.request.method === 'GET' &&
            event.request.headers.get('accept').includes('text/html')
          ) {
            // Return the offline page
            return caches.match(offlineUrl);
          }
        });
    })
  );
});
