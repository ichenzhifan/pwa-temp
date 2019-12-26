function wrapPromise(cb) {
  return new Promise((resolve, reject) => cb(resolve, reject));
}

// 检查是否支持cacheStorage
const verifyIsSupportCaches = () => {
  return typeof window === 'object' ? 'caches' in window : 'caches' in self;
};

/**
 * 封装cache storage.
 */
class XCache {
  constructor(cacheName) {
    this.cacheName = cacheName;
    this.isSupport = verifyIsSupportCaches();

    // 在openStorage中初始化.
    this.cache = null;
  }

  /**
   * 调用api之前, 做兼容性判断和cache初始化.
   * @param {*} cb
   */
  before(cb) {
    return wrapPromise((resolve, reject) => {
      if (!this.isSupport) {
        return reject('caches is not support');
      }

      return cb(resolve, reject);
    });
  }

  /**
   * 返回一个指定cacheName的cache对象, 如果
   * 不存在, 就会创建一个新的cache.
   */
  openStorage() {
    return this.before((resolve, reject) => {
      caches.open(this.cacheName).then(cache => {
        this.cache = cache;
        resolve(cache);
      }, reject);
    });
  }

  /**
   * 删除指定名称的cache对象. 如果cache存储, 删除它并返回true.
   * 如果不存在, 返回false.
   */
  deleteStorage(name) {
    return this.before((resolve, reject) => {
      caches.delete(name || this.cacheName).then(resolve, reject);
    });
  }

  /**
   * 获取cachestorage下的所有cache对象.
   */
  getCacheStorageNames() {
    return this.before((resolve, reject) => {
      caches.keys().then(resolve, reject);
    });
  }

  /**
   * 删除cachestorage下的所有cache对象.
   */
  deleteAllStorage() {
    return this.before((resolve, reject) => {
      this.getCacheStorageNames().then(names => {
        const promises = [];

        names.forEach(name => {
          promises.push(this.deleteStorage(name));
        });

        return Promise.all(promises).then(resolve, reject);
      }, reject);
    });
  }

  /**
   * 添加的cache中.
   * @param {*} request
   * @param {*} response
   */
  setItem(request, response) {
    return this.before((resolve, reject) => {
      const isUrl = typeof request === 'string';

      if (isUrl) {
        return this.cache.put(request, response).then(resolve, reject);
      }

      return this.cache.add(request, response).then(resolve, reject);
    });
  }

  /**
   * 将一系列url添加到cache中.
   * @param {Array} requests ['/xxx', '/ccc']
   */
  setAll(requests) {
    return this.before((resolve, reject) => {
      return this.cache.addAll(requests).then(resolve, reject);
    });
  }

  /**
   * 根据request请求, 从cache中查找第一个匹配的响应.
   * @param {Request} request
   * @param {Object} opt 可设置的字段 {ignoreSearch, ignoreMethod, ignoreVary}
   */
  getItem(request, opt = {}) {
    return this.before((resolve, reject) => {
      return this.cache.match(request, opt).then(resolve, reject);
    });
  }

  /**
   * 根据request请求, 从cache中查找所有匹配的响应.
   * @param {Request} request
   * @param {Object} opt 可设置的字段 {ignoreSearch, ignoreMethod, ignoreVary}
   */
  getItems(request, opt = {}) {
    return this.before((resolve, reject) => {
      return this.cache.matchAll(request, opt).then(resolve, reject);
    });
  }

  /**
   * 获取cache下所有的entries的keys.
   * @param {Object} opt 可设置的字段 {ignoreSearch, ignoreMethod, ignoreVary}
   */
  getAllKeys(opt) {
    return this.before((resolve, reject) => {
      return this.cache.keys(opt).then(resolve, reject);
    });
  }

  /**
   * 获取cache下的所有entry.
   * @param {Object} opt 可设置的字段 {ignoreSearch, ignoreMethod, ignoreVary}
   */
  getAllItems(opt) {
    return this.before((resolve, reject) => {
      return this.getAllKeys(opt).then(keys => {
        const promises = [];

        keys.forEach(request => {
          promises.push(this.getItem(request, opt));
        });

        return Promise.all(promises).then(resolve, reject);
      }, reject);
    });
  }

  /**
   * 查找满足条件的第一个匹配的entry.
   * @param {Function} comparator (request) => true/false
   */
  findItem(comparator) {
    return this.before(async (resolve, reject) => {
      try {
        const entryKeys = await this.cache.keys();
        let result = null;

        for (const request of entryKeys) {
          const isMatched = comparator ? comparator(request) : true;
          if (isMatched) {
            result = await this.cache.match(request);
            break;
          }
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 查找满足条件的所有entries.
   * @param {Function} comparator (request) => true/false
   */
  filterItems(comparator) {
    return this.before(async (resolve, reject) => {
      try {
        const entryKeys = await this.cache.keys();
        const result = [];

        for (const request of entryKeys) {
          const isMatched = comparator ? comparator(request) : true;
          if (isMatched) {
            const response = await this.cache.match(request);
            result.push(response);
          }
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 删除指定的entry
   * @param {Request} request
   * @param {Object} opt 可设置的字段 {ignoreSearch, ignoreMethod, ignoreVary}
   */
  deleteItem(request, opt) {
    return this.before((resolve, reject) => {
      return this.cache.delete(request, opt).then(resolve, reject);
    });
  }

  /**
   * 从cache中删除匹配条件下的所有entry.
   * @param {Array} requests
   * @param {Object} opt
   */
  deleteItems(requests, opt) {
    const promises = [];

    requests.forEach(request => {
      promises.push(this.deleteItem(request, opt));
    });

    return Promise.all(promises);
  }

  /**
   * 清除cache下的所有entry.
   */
  deleteAllItems() {
    return this.deleteStorage().then(() => {
      return this.openStorage();
    });
  }

  /**
   * 删除不再使用的cache.
   * @param {Boolean} isExcludeCurrent 是否排除当前的正在使用的cache.
   */
  clearCache(isExcludeCurrent = true) {
    return this.before((resolve, reject) => {
      return this.getCacheStorageNames().then(names => {
        Promise.all(
          names
            .filter(name => {
              if (isExcludeCurrent) {
                return name !== this.cacheName;
              }

              // 删除所有.
              return true;
            })
            .map(key => {
              return this.deleteStorage(key);
            })
        ).then(resolve, reject);
      }, reject);
    });
  }
}
