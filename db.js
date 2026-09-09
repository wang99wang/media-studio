/* ============ IndexedDB 数据层 ============ */
(function () {
  const DB_NAME = 'creator_studio';
  const DB_VER = 4;
  const STORES = {
    accounts: '账号数据',
    works: '作品复盘',
    topics: '抖音选题库',
   灵感: 'inspirations',
    scripts: '脚本库',
    materials: '素材库',
    settings: '设置',
    syncq: '同步队列',
    novels: '小说剧本',
    schedules: '发布排期',
    titles: '标题灵感库',
    statpts: '平台数据',
    rivals: '对标账号',
    bookmarks: '网址收藏'
  };
  // 实际 store 名（英文 key，避免中文索引问题）
  const S = {
    accounts: 'accounts',
    works: 'works',
    topics: 'topics',
    inspirations: 'inspirations',
    scripts: 'scripts',
    materials: 'materials',
    settings: 'settings',
    syncq: 'syncq',
    novels: 'novels',
    schedules: 'schedules',
    titles: 'titles',
    statpts: 'statpts',
    rivals: 'rivals',
    bookmarks: 'bookmarks'
  };
  let _db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (_db) return resolve(_db);
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        Object.values(S).forEach(name => {
          if (!db.objectStoreNames.contains(name)) {
            const os = db.createObjectStore(name, { keyPath: 'id' });
            os.createIndex('updated', 'updated', { unique: false });
          }
        });
      };
      req.onsuccess = e => { _db = e.target.result; resolve(_db); };
      req.onerror = e => reject(e.target.error);
    });
  }

  function tx(store, mode) {
    return open().then(db => db.transaction(store, mode).objectStore(store));
  }
  function req2p(req) {
    return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
  }

  const DB = {
    S,
    all(store) {
      return tx(S[store], 'readonly').then(os => req2p(os.getAll()));
    },
    get(store, id) {
      return tx(S[store], 'readonly').then(os => req2p(os.get(id)));
    },
    async put(store, obj) {
      obj.updated = obj.updated || Date.now();
      await tx(S[store], 'readwrite').then(os => req2p(os.put(obj)));
      // 写入同步队列
      try {
        const q = await this.all('syncq');
        const ex = q.find(x => x.store === store && x.id === obj.id);
        if (ex) { ex.updated = obj.updated; await this._rawPut('syncq', ex); }
        else await this._rawPut('syncq', { id: store + ':' + obj.id, store, id: obj.id, updated: obj.updated, op: 'upsert' });
      } catch (e) {}
      return obj;
    },
    _rawPut(store, obj) {
      return tx(S[store], 'readwrite').then(os => req2p(os.put(obj)));
    },
    async del(store, id) {
      await tx(S[store], 'readwrite').then(os => req2p(os.delete(id)));
      try { await this._rawPut('syncq', { id: store + ':' + id, store, id, op: 'delete', updated: Date.now() }); } catch (e) {}
    },
    clear(store) {
      return tx(S[store], 'readwrite').then(os => req2p(os.clear()));
    },
    setSetting(k, v) {
      return this.put('settings', { id: k, value: v });
    },
    getSetting(k) {
      return this.get('settings', k).then(r => r ? r.value : null);
    }
  };
  window.DB = DB;
})();
