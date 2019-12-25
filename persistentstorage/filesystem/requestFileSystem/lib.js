// https://www.html5rocks.com/zh/tutorials/file/filesystem/

function wrapPromise(cb) {
  return new Promise((resolve, reject) => cb(resolve, reject));
}

function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
}

function errorHandler(e) {
  var msg = '';

  // switch (e.code) {
  //   case FileError.QUOTA_EXCEEDED_ERR:
  //     msg = 'QUOTA_EXCEEDED_ERR';
  //     break;
  //   case FileError.NOT_FOUND_ERR:
  //     msg = 'NOT_FOUND_ERR';
  //     break;
  //   case FileError.SECURITY_ERR:
  //     msg = 'SECURITY_ERR';
  //     break;
  //   case FileError.INVALID_MODIFICATION_ERR:
  //     msg = 'INVALID_MODIFICATION_ERR';
  //     break;
  //   case FileError.INVALID_STATE_ERR:
  //     msg = 'INVALID_STATE_ERR';
  //     break;
  //   default:
  //     msg = 'Unknown Error';
  //     break;
  // }

  console.log('Error: ' + e);
}

/**
 * opt = {create: true, exclusive: true}
 * @param {*} fs
 * @param {*} fileName
 */
function createFile(fs, fileName, exclusive = true) {
  return wrapPromise((resolve, reject) => {
    const opt = {
      // 创建.
      create: true,

      // 名称相同时, 抛出错误.
      exclusive
    };
    fs.root.getFile(
      fileName,
      opt,
      fileEntry => {
        resolve(fileEntry);
      },
      error => {
        errorHandler(error);
        reject(error);
      }
    );
  });
}

/**
 * 更新文件
 * @param {*} fs
 * @param {*} fileName
 * @param {*} content
 */
function updateFile(fs, fileName, content) {
  return wrapPromise((resolve, reject) => {
    createFile(fs, fileName, false).then(entry => {
      entry.createWriter(
        writer => {
          writer.onwriteend = ev => {
            console.log('更新完成');
            resolve();
          };
          writer.onerror = ev => {
            errorHandler(ev);
            reject(ev);
          };

          writer.write(content);
        },
        error => {
          errorHandler(error);
          reject(error);
        }
      );
    }, reject);
  });
}

/**
 * 读取文件内容
 * @param {*} fs
 * @param {*} fileName
 */
function getFile(fs, fileName) {
  return wrapPromise((resolve, reject) => {
    fs.root.getFile(
      fileName,
      {},
      entry => {
        entry.file(
          file => {
            const reader = new FileReader();
            reader.onloadend = ev => {
              resolve({
                file,
                url: URL.createObjectURL(file)
              });
            };
            reader.readAsDataURL(file);
          },
          error => {
            errorHandler(error);
            reject(error);
          }
        );
      },
      error => {
        errorHandler(error);
        reject(error);
      }
    );
  });
}

/**
 * 删除文件
 * @param {*} fs
 * @param {*} fileName
 */
function deleteFile(fs, fileName) {
  return wrapPromise((resolve, reject) => {
    fs.root.getFile(
      fileName,
      { create: false },
      entry => {
        entry.remove(
          result => {
            console.log('success: remove ' + fileName);
            resolve(result);
          },
          error => {
            errorHandler(error);
            reject(error);
          }
        );
      },
      error => {
        errorHandler(error);
        reject(error);
      }
    );
  });
}

/**
 * 创建目录.
 * @param {*} fs
 * @param {*} foldeName
 */
function createFolder(fs, foldeName, exclusive) {
  return wrapPromise((resolve, reject) => {
    fs.root.getDirectory(
      foldeName,
      {
        create: true,
        exclusive
      },
      folder => {
        console.log('success: create folder ' + foldeName);
        resolve(folder);
      },
      error => {
        errorHandler(error);
        reject(error);
      }
    );
  });
}

function getFolder(fs, foldeName) {
  return wrapPromise((resolve, reject) => {
    fs.root.getDirectory(
      foldeName,
      {},
      folder => {
        console.log('success: create folder ' + foldeName);
        resolve(folder);
      },
      error => {
        errorHandler(error);
        reject(error);
      }
    );
  });
}

/**
 * 不能保证所有目录条目都能在仅调用一次 readEntries()
 * 的情况下同时返回。也就是说，您需要一直调用
 * DirectoryReader.readEntries()，直到系统不再返回结果为止
 * @param {*} reader
 */
function readDirEntires(reader) {
  return wrapPromise((resolve, reject) => {
    reader.readEntries(
      results => {
        if (!results.length) {
          resolve(entries);
        } else {
          entries = entries.concat(toArray(results));

          // 递归调用, 直到系统不再返回结果为止
          readDirEntires(reader);
        }
      },
      error => {
        errorHandler(error);
        reject(error);
      }
    );
  });
}

function getFilesFromFolder(fs, foldeName) {
  return wrapPromise((resolve, reject) => {
    getFolder(fs, foldeName).then(dir => {
      let entries = [];
      const reader = dir.createReader();

      //  不能保证所有目录条目都能在仅调用一次 readEntries()
      //  的情况下同时返回。也就是说，您需要一直调用
      //  DirectoryReader.readEntries()，直到系统不再返回结果为止
      const readDirEntires = () => {
        reader.readEntries(
          results => {
            if(!results.length){
              resolve(entries);
            }else {
              entries = entries.concat(toArray(results));

              // 递归调用, 直到系统不再返回结果为止
              readDirEntires();
            }
          },
          error => {
            errorHandler(error);
            reject(error);
          }
        );
      };

      readDirEntires();      
    }, reject);
  });
}

/**
 * 首次调用 requestFileSystem()，系统会为您的应用创建新的存储。
 * 请注意，这是沙箱文件系统，也就是说，一个网络应用无法访问另一个应用的文件。
 * 这也意味着您无法在用户硬盘上的任意文件夹（例如“我的图片”、“我的文档”等）
 * 中读/写文件。
 * @param {Number} size 申请的空间大小.
 * @param {Number} type 0: window.TEMPORARY, 1: window.PERSISTENT
 */
function initFs(size, type = window.TEMPORARY) {
  return wrapPromise((resolve, reject) => {
    window.requestFileSystem =
      window.requestFileSystem || window.webkitRequestFileSystem;

    // window.requestFileSystem(type, size, successCallback, errorCallback)
    window.requestFileSystem(
      type,
      size,
      fs => {
        console.log('申请成功');
        resolve(fs);
      },
      error => {
        console.log('申请失败', error);
        reject(error);
      }
    );
  });
}

function diskEstimate(){
  return new Promise(resolve => {
    if(navigator.storage.estimate){
      navigator.storage.estimate().then(estimate => {
        // estimate.quota is the estimated quota
        // estimate.usage is the estimated number of bytes used
        // GB
        var ut = 1024*1024 * 1024;
    
        resolve(`total: ${(estimate.quota / ut).toFixed(4)}GB, usage: ${(estimate.usage/ut).toFixed(4)}GB`)
      });
    }else{
      resolve('the browser is not supported');
    }    
  })
  
}
