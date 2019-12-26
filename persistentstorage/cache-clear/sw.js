importScripts('../common/strings.js');
importScripts('../common/util.js');
importScripts('../common/sw-lifecycle.js');
importScripts('../common/cache.js');

const cacheName = 'pwa-demo';
const offlineUrl = 'offline.html';

const cacheInstance = new XCache(cacheName);
const swInstance = new XServiceWorker({
  immediate: true
});

/**
 * 处理fetch请求， 返回一个promise.
 * @param {*} event
 */
const fetchHandle = event => {
  return wrapPromise(async (resolve, reject) => {
    console.log(event.request.url);

    cacheInstance.getItem(event.request).then(response => {
      if (response) {
        return resolve(response);
      }

      fetch(event.request).then(response => {
        const isImage = event.request.url.indexOf('.JPG');

        // 缓存图片.
        if (isImage) {
          const newRequest = event.request.clone();
          const newResponse = response.clone();

          cacheInstance.setItem(newRequest, newResponse).then(() => {
            resolve(response);
          }, reject);
        } else {
          resolve(response);
        }
      }, reject);
    }, reject);
  });
};

/**
 * onmessage handle
 * @param {*} event
 */
const messageHandle = event => {
  const { data } = event;

  switch (data.type) {
    case actionTypes.clearCache: {
      // 清空缓存.
      cacheInstance.deleteAllItems();
      break;
    }
    default: {
      break;
    }
  }
};

swInstance.addInstallEvent(event => {
  // 安装期间， 初始化cache实例.
  cacheInstance.openStorage();

  event.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(['./css/main.css', './index.html', './offline.html']);
    })
  );
});

swInstance.addActiveEvent(event => {
  console.log('sw激活了ss');
});

swInstance.addEvent('fetch', event => {
  event.respondWith(fetchHandle(event));
});

swInstance.addEvent('message', event => {
  messageHandle(event);
});
