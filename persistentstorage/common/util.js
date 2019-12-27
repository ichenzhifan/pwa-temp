function wrapPromise(cb) {
  return new Promise((resolve, reject) => cb(resolve, reject));
}

function sleep(delay = 0) {
  return wrapPromise(resolve => setTimeout(resolve, delay));
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

/**
 * 在网速慢的时候, 返回408响应的service worker代码
 */
function timeout(delay) {
  return new Promise(resolve => {
    setTimeout(() => {
      const resp = new Response('', {
        status: 408,
        statusText: 'Request timed out'
      });

      resolve(resp);
    }, delay);
  });
}

/**
 * 用户授权。申请持久存储.
 */
function grantPersist() {
  return wrapPromise((resolve, reject) => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(granted => {
        // granted: true/false
        resolve(granted);
      });
    } else {
      reject('navigator.storage.persist: the browser is not supported');
    }
  });
}

/**
 * 查看存储模式
 */
function checkPersisted() {
  return wrapPromise((resolve, reject) => {
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(result => resolve(result));
    } else {
      reject('navigator.storage.persisted is not support');
    }
  });
}

/**
 * 获取可使用磁盘空间和已使用的空间的信息.
 */
function estimateSpace() {
  return new Promise((resolve, reject) => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        // 原始的单位是byte. 转成MB
        const ut = 1024 * 1024;
        resolve({
          total: estimate.quota / ut,
          usage: estimate.usage / ut
        });
      });
    } else {
      reject('navigator.storage.estimate: the browser is not supported');
    }
  });
}

/**
 * 计算Response对象的大小.
 * @param {Response} response
 */
function computedResponseLength(response, unit = 'kb') {
  return wrapPromise((resolve, reject) => {
    response.arrayBuffer().then(buffer => {
      const byteLength = buffer.byteLength;

      let ut = 1024;
      switch (unit) {
        case 'KB': {
          ut = 1024;
          break;
        }
        case 'MB': {
          ut = 1024 * 1024;
          break;
        }
        case 'GB': {
          ut = 1024 * 1024 * 1024;
          break;
        }
        default: {
          break;
        }
      }

      // 转换为kb
      resolve(byteLength / ut);
    }, error => {
      console.log(error);
      reject(error);
    });
  });
}
