importScripts('../common/strings.js');
importScripts('../common/util.js');
importScripts('../common/sw-lifecycle.js');
importScripts('../common/cache.js');
importScripts('../common/indexedDb.js');

const cacheName = 'pwa-demo';
const offlineUrl = 'offline.html';

// 用来保存页面的对象, 做sw -> page之间的通信.
let pageTarget;

const cacheInstance = new XCache(cacheName);
const swInstance = new XServiceWorker({
  immediate: true
});
const dbInstance = new IndexDB({
  dbName: 'pwa-db',
  storeName: 'pwa-image-store'
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
 * 查找cache中的图片, 并且发送回页面.
 * @param {*} event
 */
const findCacheImagesAndSendToPage = event => {
  cacheInstance
    .filterItems(request => {
      return request.url.toLowerCase().indexOf('.jpg') !== -1;
    })
    .then(async items => {
      const results = [];

      for (let i = 0; i < items.length; i++) {
        results.push({
          url: items[i].url,
          size: await computedResponseLength(items[i], 'MB')
        });
      }

      event.source.postMessage({
        type: actionTypes.getgetCacheImages,
        items: results
      });
    });
};

/**
 * 查找db中的图片, 并且发送回页面.
 * @param {*} event
 */
const findDbImagesAndSendToPage = event => {
  dbInstance.getAll().then(items => {
    event.source.postMessage({
      type: actionTypes.getDatabaseImages,
      items
    });
  });
}

/**
 * 添加图片到database中.
 * @param {*} event
 */
const addFilesToDatabase = event => {
  const {
    files
  } = event.data;
  const stacks = [];
  const newFiles =  toArray(files);
  newFiles.forEach(file => {
    stacks.push(dbInstance.add(guid(), file));
  });
  
  Promise.all(stacks).then(results => {
    event.source.postMessage({
      type: actionTypes.addFileToDatabaseSuccess,
      items: newFiles
    });
  }, error => {
    console.log(error);
  })
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
    case actionTypes.getgetCacheImages: {
      // 获取cache中的图片..
      findCacheImagesAndSendToPage(event);
      break;
    }
    case actionTypes.addFileToDatabase: {
      // 添加图片到indexed db中..
      addFilesToDatabase(event);
      break;
    }
    case actionTypes.getDatabaseImages:{
      // 获取db中的图片..
      findDbImagesAndSendToPage(event);
      break;
    }
    default: {
      break;
    }
  }
};

/**
 * 初始化.
 */
const init = async () => {
  // 初始化indexeddb.
  await dbInstance.createDb();

  // 安装期间， 初始化cache实例.
  await cacheInstance.openStorage();

  swInstance.addInstallEvent(event => {
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
};

init();
