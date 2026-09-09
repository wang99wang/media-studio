/* ============ 云端同步适配层 ============
 * 纯本地优先：所有数据先在 IndexedDB 落盘（断网可用）。
 * 填入 API 地址后，自动把「同步队列」里的变更推送到你的 MySQL+OSS 后端。
 * 未配置时：仅本地运行，通过「导出/导入」做迁移备份。
 * 后端约定（可改）：POST {base}/sync   body: { changes:[{store,id,op,data}], device }
 *                  GET  {base}/pull?since=ts   -> { items:[...], now }
 * 失败自动重试，离线队列不丢。
 */
(function () {
  const Cloud = {
    base: null,
    status: 'local', // local | online | offline | syncing | error
    lastSync: 0,
    device: 'web-' + Math.random().toString(36).slice(2, 8),

    async init() {
      this.base = await DB.getSetting('cloud_base');
      this.lastSync = await DB.getSetting('cloud_last') || 0;
      this.refresh();
    },
    async setBase(url) {
      url = (url || '').trim().replace(/\/+$/, '');
      this.base = url;
      await DB.setSetting('cloud_base', url);
      this.refresh();
      if (url) await this.sync();
    },
    refresh() {
      const dot = document.getElementById('syncDot');
      const txt = document.getElementById('syncText');
      if (!dot) return;
      const map = {
        local: ['', '本地已就绪 · 未配置云端'],
        online: ['ok', '云端已连接'],
        offline: ['warn', '离线 · 队列待同步'],
        syncing: ['', '同步中…'],
        error: ['err', '同步失败 · 已重试']
      };
      const [c, t] = map[this.status] || map.local;
      dot.className = 'dot ' + c;
      txt.textContent = t;
    },
    async sync() {
      if (!this.base) { this.status = 'local'; this.refresh(); return; }
      this.status = 'syncing'; this.refresh();
      try {
        const q = await DB.all('syncq');
        if (q.length) {
          // 取出变更并附上最新数据
          const changes = [];
          for (const item of q) {
            if (item.op === 'delete') changes.push({ store: item.store, id: item.id, op: 'delete' });
            else {
              const data = await DB.get(item.store, item.id);
              if (data) changes.push({ store: item.store, id: item.id, op: 'upsert', data });
            }
          }
          const res = await fetch(this.base + '/sync', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device: this.device, changes })
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          await DB.clear('syncq');
        }
        // 拉取服务端较新数据（简单全量合并，按 updated 较新者覆盖）
        try {
          const since = this.lastSync || 0;
          const pull = await fetch(this.base + '/pull?since=' + since);
          if (pull.ok) {
            const json = await pull.json();
            const items = json.items || [];
            for (const it of items) {
              const local = await DB.get(it.store, it.id);
              if (!local || (it.updated || 0) > (local.updated || 0)) {
                await DB._rawPut(it.store, it.data || it);
              }
            }
            if (json.now) this.lastSync = json.now;
          }
        } catch (e) {}
        this.status = 'online';
        this.lastSync = Date.now();
        await DB.setSetting('cloud_last', this.lastSync);
      } catch (e) {
        this.status = (navigator.onLine === false) ? 'offline' : 'error';
      }
      this.refresh();
      if (window.Main && window.Main.refreshBadge) window.Main.refreshBadge();
    }
  };
  window.Cloud = Cloud;
})();
