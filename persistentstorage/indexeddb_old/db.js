function wrapPromise(cb) {
  return new Promise((resolve, reject) => cb(resolve, reject));
}

/**
 * 创建或打开db.
 */
function createDb(opt) {
  return wrapPromise((resolve, reject) => {
    const { name, version = 1, createStore } = opt;
    const request = window.indexedDB.open(name, version);
    request.onerror = ev => {
      console.log(`${name} open indexDb is fail`, ev);
      reject();
    };

    request.onsuccess = ev => {
      console.log(`${name} open success`);

      resolve(ev.target.result);
    };

    // 创建object store对象只能从onupgradeneeded版本变化回调中进行。
    request.onupgradeneeded = ev => {       
      createStore && createStore(ev.target.result);
    };
  });
}

function closeDb(db) {
  db && db.close();
}

function deleteDb(db) {
  db && window.indexedDB.deleteDatabase(db);
}

/**
 *
 * @param {Object} opt {db, storeName, keyPathObject}
 */
function createStore(opt) {
  const {
    db,

    // object store的名称, 相当于表.
    storeName,

    // 使用每条记录中的某个指定字段作为键值
    key,

    // 构建store时, 创建对应的索引.
    indexes = []
  } = opt;
  const store = db.createObjectStore(storeName, { keyPath: key });

  if(indexes && indexes.length){
    indexes.forEach(item => {
      const { indexName, propertyKey, option } = item;
      store.createIndex(indexName, propertyKey, option);
    });
  }
  console.log('store', store);

  return store;
}

function createTransaction(opt){
  const {
    db,
    storeName, 
    transactionName, 

    // readOnly, readwrite, versionchange
    model = 'readOnly'
  } = opt
  // 创建一个事务
  const trans = db.transaction([transactionName], model);

  // 获取objectStore的数据
  const transStore = trans.objectStore(storeName);
  
  return transStore;
}

function add(store, data){
  return wrapPromise((resolve, reject) => {
    const obj = store.add(data);
    obj.onerror = ev => {
      reject(ev.target.error)
    };
    obj.onsuccess = ev => {
      resolve(ev.target.result);
    };
  });
}

async function init() {
  const storeName = 'test_table';
  let store;
  const db = await createDb({
    name: 'pwa',
    createStore: dataBase => {
      // 创建store.
      // 创建object store对象只能从onupgradeneeded版本变化回调中进行。
      store = createStore({ 
        db: dataBase, 
        storeName, 

        // 使用每条记录中的某个指定字段作为键值
        key: 'id',

        // 表的索引.
        indexes: [
          {indexName: 'by_name', propertyKey: 'name'}
        ]
      });
    }
  });


  const tranStore = createTransaction({
    db,
    storeName,
    transactionName: 'test_table',
    model: 'readwrite'
  });
  add(tranStore, {
    id: 1,
    name: 'jack',
    age: 18
  });

  add(tranStore, {
    id: 2,
    name: 'denver',
    age: 22
  });
}
