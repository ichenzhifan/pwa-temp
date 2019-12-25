function wrapPromise(cb) {
  return new Promise((resolve, reject) => cb(resolve, reject));
}

function fileToBlob(file) {
  return wrapPromise(resolve => {
    const reader = new FileReader();
    reader.onloadend = ev => {
      const blob = new Blob([ev.target.result], {
        type: file.type,
        name: file.name
      });
      resolve(blob);
    };
    reader.readAsArrayBuffer(file);
  });
}

function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
}

function getFileHandle() {
  const opt = {
    // openFile, saveFile, openDirectory
    type: 'openFile',
    accepts: [
      {
        mimeTypes: ['image/*']
      }
    ]
  };

  return window.chooseFileSystemEntries(opt);
}

function getSaveAsFileHandle({ name, type, description, extensions }) {
  const opt = {
    type: 'saveFile',
    accepts: [
      {
        name,
        description,
        extensions,
        mimeTypes: type
      }
    ]
  };

  return window.chooseFileSystemEntries(opt);
}

function getFile(fileHandle) {
  return wrapPromise((resolve, reject) => {
    fileHandle.getFile().then(
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
        console.log('getFile failed', error);
        reject(error);
      }
    );
  });
}

function writeFile(fileHandle, content) {
  return wrapPromise(async (resolve, reject) => {
    try {
      const writer = await fileHandle.createWriter();
      await writer.write(0, content);
      await writer.close();

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
