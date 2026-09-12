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
      Sync.touch(store);
      return obj;
    },
    _rawPut(store, obj) {
      return tx(S[store], 'readwrite').then(os => req2p(os.put(obj)));
    },
    async del(store, id) {
      await tx(S[store], 'readwrite').then(os => req2p(os.delete(id)));
      try { await this._rawPut('syncq', { id: store + ':' + id, store, id, op: 'delete', updated: Date.now() }); } catch (e) {}
      Sync.touch(store);
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

  /* ============ 局域网共享同步层 ============
   * 探测同源后端 /api/ping：
   *   - 有后端：拉取服务器数据覆盖本地（服务器为当前真相），之后本地任何写操作 debounce 推送全量
   *   - 无后端（如 GitHub Pages）：保持纯前端 IndexedDB 模式，完全不受影响
   * 数据统一存在本机 server.js 的 data.json，手机连同一 WiFi 访问即共享同一份。
   */
  const Sync = window.Sync = {
    enabled: false,
    ready: false,
    timer: null,
    _pending: new Set(),
    async ping() {
      try {
        const r = await fetch('api/ping?t=' + Date.now(), { cache: 'no-store', headers: { 'Cache-Control': 'no-store' } });
        if (!r.ok) return false;
        const j = await r.json();
        return !!(j && j.ok);
      } catch (e) { return false; }
    },
    async init() {
      this.refresh();
      if (!navigator.onLine) return;
      const ok = await this.ping();
      if (!ok) { this.enabled = false; this.ready = false; this.refresh(); return; }
      this.enabled = true;
      try {
        const serverData = await this.fetchData();
        const empty = !serverData || !serverData.data || Object.keys(serverData.data).length === 0;
        if (empty) {
          // 服务器还没有数据：把本机现有数据推上去（避免空拉清空本地）
          await this.push();
        } else {
          await this.applyServer(serverData);
        }
        this.ready = true;
        this.refresh();
        if (typeof U !== 'undefined' && U.toast) U.toast('已连接本机共享服务，数据跨设备同步', true);
      } catch (e) {
        this.enabled = false;
        this.ready = false;
        this.refresh();
      }
    },
    refresh() {
      const dot = document.getElementById('lanDot');
      const txt = document.getElementById('lanText');
      if (!dot || !txt) return;
      if (this.ready) { dot.className = 'dot ok'; txt.textContent = '共享模式·已同步'; }
      else if (this.enabled) { dot.className = 'dot'; txt.textContent = '共享模式·连接中'; }
      else { dot.className = 'dot warn'; txt.textContent = '本地模式'; }
    },
    async fetchData() {
      const r = await fetch('api/data?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return null;
      return await r.json();
    },
    async applyServer(d) {
      const data = (d && d.data) || {};
      for (const s of Object.keys(S)) {
        if (s === 'syncq') continue; // 不同步本地队列
        const items = (data[s] || []).filter(it => it && it.id);
        await this.clearStore(s);
        for (const it of items) {
          // 素材图片：服务器存的是 dataUrl，转回 blob 存本地
          if (s === 'materials' && it.dataUrl && it.blob === undefined) {
            try { it.blob = await U.dataURLToBlob(it.dataUrl); } catch (e) {}
            delete it.dataUrl;
          }
          try { await DB._rawPut(s, it); } catch (e) {}
        }
      }
    },
    async clearStore(s) {
      try { await DB.clear(s); } catch (e) {}
    },
    async pack() {
      const out = {};
      for (const s of Object.keys(S)) {
        if (s === 'syncq') { out[s] = []; continue; }
        const items = await DB.all(s);
        if (s === 'materials' && typeof U !== 'undefined' && U.blobToDataURL) {
          for (const m of items) {
            if (m.blob) {
              try {
                const url = await U.blobToDataURL(m.blob);
                if (url && url.length < 4 * 1024 * 1024) { m.dataUrl = url; delete m.blob; }
              } catch (e) { delete m.blob; }
            }
          }
        }
        out[s] = items;
      }
      return out;
    },
    async push() {
      if (!this.enabled) return;
      try {
        const payload = await this.pack();
        const r = await fetch('api/data', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: payload })
        });
        if (!r.ok) throw new Error('push failed ' + r.status);
      } catch (e) { /* 服务不可用静默忽略 */ }
    },
    touch(store) {
      if (!this.ready) return;
      if (store) this._pending.add(store);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { this.push(); }, 600);
    }
  };
})();
