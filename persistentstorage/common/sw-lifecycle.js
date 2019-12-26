/**
 * service worker的三个阶段
 *  - Registration
 *  - Installation
 *  - Activation
 */

const swEventTypes = {
  install: 'install',
  activate: 'activate'
};

class XServiceWorker {
  constructor(opt = {}) {
    const {
      // 安装后立即激活.
      immediate = true
    } = opt;
    this.immediate = immediate;
  }

  /**
   * 添加事件监听.
   * @param {String} type 事件名称. fecth, install等
   * @param {Funtion} cb event => {}
   */

  addEvent(type, cb) {
    self.addEventListener(type, cb);
  }

  /**
   * 添加serverWorker安装时事件
   * @param {Function} cb event => {}
   */
  addInstallEvent(cb) {
    this.addEvent(swEventTypes.install, event => {
      if (this.immediate) {
        // 立即激活等待的sw.
        self.skipWaiting();
      }

      cb && cb(event);
    });
  }

  /**
   * 添加serverWorker激活时事件
   * @param {Function} cb event => {}
   */
  addActiveEvent(cb) {
    this.addEvent(swEventTypes.activate, event => {
      if (this.immediate) {
        // 将当前的sw设为scope范围内的控制者.
        self.clients.claim();
      }

      cb && cb(event);
    });
  }
}
