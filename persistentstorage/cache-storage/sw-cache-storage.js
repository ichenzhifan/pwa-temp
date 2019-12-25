const cacheName = 'test-cache-storage';

const deleteOldCache = event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          console.log('delete cache ' + key);
          return caches.delete(key);
        })
      );
    })
  );
};

/**
 * 将请求和响应添加到cache中.
 * @param {*} cache
 * @param {*} request
 * @param {*} response
 */
const addToCache = (cache, request, response) => {
  cache.put(request, response);
};

const getAllCachedImage = async () => {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys();
  const result = [];

  for(request of keys){
    // if(request.url.indexOf('.jpg') !== -1){
      const response = await cache.match(request);
      result.push(response);
    // }
  }

  

  return result;
}

self.addEventListener('install', event => {
  // 安装成功后，更新的 Worker 将 wait，直到现有 Worker 控制零个客户端
  // skipWaiting() 可防止出现等待情况，这意味着 Service Worker 在安装完后立即激活
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  self.clients.claim();

  // 删除未使用的cache.
  deleteOldCache(event);
});

//
self.addEventListener('fetch', event => {
  // 测试cache storage存储大小.
  return event.respondWith(
    fetch(event.request).then(async response => {
      // 缓存图片.
      if (event.request.url.indexOf('.jpg') !== -1) {
        return caches.open(cacheName).then(cache => {
          addToCache(cache, event.request.clone(), response.clone());
          return response;
        });
      } else if (event.request.url.indexOf('/api/getKeys') !== -1) {
        const results = await getAllCachedImage();
        return new Response(JSON.stringify({
          count: results.length
        }));
        // return caches.keys().then(keys => {
        //   return new Response(
        //     JSON.stringify(keys)
        //   );
        // });
      } else {
        return response;
      }
    })
  );

  // return event.respondWith(
  //   caches.match(event.request).then(response => {
  //     // 如果缓存中存在, 就返回缓存中的数据.
  //     if (response) {
  //       console.log('from cache:' + event.request.url);
  //       return response;
  //     }

  //     // 如果缓存中, 没有找到, 就发起请求.
  //     const requestToClone = event.request.clone();
  //     return fetch(requestToClone).then(resp => {
  //       // 返回值, 如果失败， 不缓存.
  //       // 我们只缓存成功的内容.
  //       if (!resp || resp.status !== 200) {
  //         return resp;
  //       }

  //       const responseToClone = resp.clone();
  //       caches.open(cacheName).then(cache => {
  //         cache.put(requestToClone, responseToClone);
  //       });

  //       return resp;
  //     });
  //   })
  // );
});
