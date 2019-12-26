/**
 * 添加到桌面.
 *  - beforeinstallprompt
 *  - appinstalled
 */
class XHomeScreen {
  constructor(opt = {}) {
    const { beforeInstall, afterInstall } = opt;
    //  保存beforeinstallprompt的event对象, 方便后面触发.
    this.deferredPrompt = null;

    // 执行beforeinstallprompt的回调.
    this.beforeInstall = beforeInstall;

    // 执行appinstalled的回调.
    this.afterInstall = afterInstall;

    // 初始化.
    this.addBeforeInstallPromptEvent();
    this.addAfterInstallEvent();
  }

  /**
   * 监听beforeinstallprompt事件.
   */
  addBeforeInstallPromptEvent() {
    window.addEventListener('beforeinstallprompt', event => {
      // Chrome 67有效.
      // 更早的版本, 依然会显示prompt弹框.
      event.preventDefault();

      // 保存起来, 方便后面触发.
      this.deferredPrompt = event;

      this.beforeInstall && this.beforeInstall(event);
    });
  }

  /**
   * 兼容appinstalled事件.
   */
  addAfterInstallEvent() {
    window.addEventListener('appinstalled', event => {
      this.afterInstall && this.afterInstall(event);
    });
  }

  /**
   * 添加应用到主屏幕.
   */
  addToHome() {
    return wrapPromise((resolve, reject) => {
      if (!this.deferredPrompt) {
        return reject('this.deferredPrompt is null');
      }

      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then(choiceResult => {
        const { outcome } = choiceResult;
        this.deferredPrompt = null;

        if (outcome === 'accepted') {
          console.log('用户同意添加到主屏幕');
          resolve();
        } else {
          console.log('用户拒绝添加到主屏幕');
          reject();
        }
      });
    });
  }
}
