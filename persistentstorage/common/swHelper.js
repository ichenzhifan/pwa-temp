function registerWorker(swUrl, scope = '') {
  return wrapPromise((resolve, reject) => {
    // 判断是否支持serviceWorker.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(swUrl, { scope })
        .then(registration => {
          // 注册成功
          console.log('注册成功，', registration.scope);
          resolve();
        })
        .catch(err => {
          // 注册失败
          console.log(err);
          reject('registed is failed', err);
        });
    } else {
      reject('serviceWorker is not supported');
    }
  });
}

function unregister() {
  return wrapPromise((resolve, reject) => {
    // 判断是否支持serviceWorker.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister();
        }

        resolve();
      }, reject);
    } else {
      reject('serviceWorker is not supported');
    }
  });
}

/**
 * 向SW发送数据.
 * @param {Object} message
 */
function postMessageToSW(message) {
  return wrapPromise((resolve, reject) => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
      resolve();
    } else {
      reject('navigator.serviceWorker.controller.postMessage is not supported');
    }
  });
}
