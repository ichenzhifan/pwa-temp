function registerWorker(swUrl) {
  return new Promise((resolve, reject) => {
    // 判断是否支持serviceWorker.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(swUrl)
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
