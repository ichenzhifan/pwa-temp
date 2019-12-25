function wrapPromise(cb) {
  return new Promise((resolve, reject) => cb(resolve, reject));
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
}

function diskEstimate() {
  return new Promise(resolve => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        // estimate.quota is the estimated quota
        // estimate.usage is the estimated number of bytes used
        // GB
        var ut = 1024 * 1024 * 1024;

        resolve(
          `total: ${(estimate.quota / ut).toFixed(4)}GB, usage: ${(
            estimate.usage / ut
          ).toFixed(4)}GB`
        );
      });
    } else {
      resolve('estimate: the browser is not supported');
    }
  });
}

class IndexDB {
  constructor(opt) {
    const { dbName, storeName, dbVersion = 1, storeOptions = {} } = opt;
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.storeName = storeName;
    this.storeOptions = storeOptions;

    this.db = null;
  }

  createDb() {
    return wrapPromise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onsuccess = ev => {
        this.db = ev.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = ev => {
        this.db = ev.target.result;

        // 如果没有创建过. 就创建.
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          this.store = this.db.createObjectStore(this.storeName);
        }

        resolve(this.db);
      };
      request.onerror = ev => {
        console.log(ev);
        reject();
      };
    });
  }

  getStore(model = 'readwrite') {
    const transaction = this.db.transaction(this.storeName, model);
    return transaction.objectStore(this.storeName);
  }

  add(key, data) {
    return wrapPromise((resolve, reject) => {
      try {
        const store = this.getStore();
        const request = store.put(data, key);
        request.onsuccess = ev => {
          resolve(ev.target.result);
        };
        request.onerror = ev => {
          reject(ev);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  get(key, _store) {
    return wrapPromise((resolve, reject) => {
      try {
        // _store: 提高性能. 不需要每次都创建.
        const store = _store || this.getStore('readonly');
        const request = store.get(key);

        request.onsuccess = ev => {
          resolve(ev.target.result);
        };
        request.onerror = ev => {
          reject(ev);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  getAll() {
    return wrapPromise((resolve, reject) => {
      this.getAllKeys().then(keys => {
        const store = this.getStore('readonly');
        const stack = [];

        keys.forEach(key => {
          stack.push(this.get(key, store));
        });

        Promise.all(stack).then(resolve, reject);
      });
    });
  }

  getAllKeys() {
    return wrapPromise((resolve, reject) => {
      try {
        const store = this.getStore();
        const request = store.getAllKeys();

        request.onsuccess = ev => {
          resolve(ev.target.result);
        };
        request.onerror = ev => {
          reject(ev);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
}
