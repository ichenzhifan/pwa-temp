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

self.addEventListener('fetch', function(event) {
  // 利用Promise.race的竞争机制, 如果网速慢, 在指定的时间没有返回, 就会先执行timeout方法. 返回408 timed out。
  // 前端可以根据返回的状态, 来做对应的逻辑处理.
  event.respondWith(Promise.race([timeout(3000), fetch(event.request.url)]));
});
