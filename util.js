/* ============ 通用工具 ============ */
(function () {
  const U = {
    uid(p) { return (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
    esc(s) {
      if (s == null) return '';
      return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    pad(n) { return n < 10 ? '0' + n : '' + n; },
    fmt(ts, f) {
      if (!ts) return '';
      const d = new Date(ts);
      const y = d.getFullYear(), m = this.pad(d.getMonth() + 1), da = this.pad(d.getDate());
      if (f === 'md') return m + '月' + da + '日';
      if (f === 'short') return m + '-' + da;
      return y + '-' + m + '-' + da;
    },
    today() { const d = new Date(); return this.fmt(d.getTime(), 'raw'); },
    startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); },
    daysBetween(a, b) { return Math.round((this.startOfDay(b) - this.startOfDay(a)) / 86400000); },

    toast(msg, ok) {
      const t = document.getElementById('toast');
      t.innerHTML = (ok ? '<span class="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : '') + U.esc(msg);
      t.classList.add('show');
      clearTimeout(this._tt);
      this._tt = setTimeout(() => t.classList.remove('show'), 2400);
    },

    openSheet(html) {
      const ov = document.getElementById('overlay'), sh = document.getElementById('sheet');
      sh.innerHTML = html;
      ov.classList.add('show');
      return sh;
    },
    closeSheet() { document.getElementById('overlay').classList.remove('show'); },

    download(name, data, type) {
      const blob = (data instanceof Blob) ? data : new Blob([data], { type: type || 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },

    // ---------- 全量导出 / 导入 ----------
    async exportAll() {
      const stores = ['accounts', 'works', 'topics', 'inspirations', 'scripts', 'materials', 'settings'];
      const out = { _app: 'creator-studio', _ver: 1, _time: new Date().toISOString(), data: {} };
      for (const s of stores) out.data[s] = await DB.all(s);
      // 素材转 base64 以便随包迁移
      for (const m of (out.data.materials || [])) {
        if (m.blob) {
          try { m.dataUrl = await U.blobToDataURL(m.blob); delete m.blob; } catch (e) {}
        }
      }
      U.download('创作剪辑台-备份-' + U.today() + '.json', JSON.stringify(out, null, 2), 'application/json');
      U.toast('已导出全部数据（含素材）', true);
    },
    async importAll(file) {
      const text = await file.text();
      let json;
      try { json = JSON.parse(text); } catch (e) { U.toast('文件不是有效 JSON'); return; }
      const data = json.data || json;
      for (const s of Object.keys(data)) {
        if (!DB.S[s]) continue;
        for (const item of (data[s] || [])) {
          if (item.dataUrl && item.blob === undefined) {
            try { item.blob = await U.dataURLToBlob(item.dataUrl); } catch (e) {}
            delete item.dataUrl;
          }
          if (item.id) await DB._rawPut(s, item);
        }
      }
      U.toast('导入完成，刷新中…', true);
      setTimeout(() => location.reload(), 700);
    },

    blobToDataURL(blob) {
      return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
    },
    dataURLToBlob(durl) {
      return fetch(durl).then(r => r.blob());
    },

    // ---------- SVG 图表 ----------
    lineChart(series, opts) {
      // series: [{color,label,points:[{x,y}]}], opts:{w,h,maxY,labels}
      opts = opts || {};
      const w = opts.w || 520, h = opts.h || 200, pad = 34;
      const allPts = series.flatMap(s => s.points);
      const maxY = opts.maxY || Math.max(1, ...allPts.map(p => p.y)) * 1.1;
      const n = (opts.labels || []).length || (allPts.length ? allPts.length : 1);
      const xAt = i => pad + (w - pad * 1.6) * (n <= 1 ? .5 : i / (n - 1));
      const yAt = v => h - pad - (h - pad * 2) * (v / maxY);
      let g = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto">`;
      // grid
      for (let i = 0; i <= 3; i++) {
        const y = pad + (h - pad * 2) * i / 3;
        g += `<line x1="${pad}" y1="${y}" x2="${w - pad * .6}" y2="${y}" stroke="#eee9fb"/>`;
      }
      series.forEach(s => {
        const d = s.points.map((p, i) => (i ? 'L' : 'M') + xAt(i).toFixed(1) + ' ' + yAt(p.y).toFixed(1)).join(' ');
        g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
        s.points.forEach((p, i) => { g += `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(p.y).toFixed(1)}" r="3.2" fill="${s.color}"/>`; });
      });
      (opts.labels || []).forEach((lb, i) => {
        g += `<text x="${xAt(i).toFixed(1)}" y="${h - 10}" font-size="10" fill="#a9a4c6" text-anchor="middle">${lb}</text>`;
      });
      g += `</svg>`;
      return g;
    },
    barChart(items, opts) {
      // items:[{label,value,color}]
      opts = opts || {};
      const w = opts.w || 520, h = opts.h || 220, pad = 30;
      const maxV = Math.max(1, ...items.map(i => i.value));
      const bw = (w - pad * 2) / items.length * 0.56;
      const gap = (w - pad * 2) / items.length;
      let g = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto">`;
      items.forEach((it, i) => {
        const bh = (h - pad * 2) * (it.value / maxV);
        const x = pad + gap * i + (gap - bw) / 2;
        const y = h - pad - bh;
        g += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="6" fill="${it.color || '#7c5cff'}"/>`;
        g += `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" font-size="10.5" fill="#6b6790" text-anchor="middle" font-weight="700">${it.value}</text>`;
        g += `<text x="${(x + bw / 2).toFixed(1)}" y="${h - 10}" font-size="10" fill="#a9a4c6" text-anchor="middle">${U.esc(it.label)}</text>`;
      });
      g += `</svg>`;
      return g;
    },
    donut(segs, opts) {
      // segs:[{label,value,color}]
      opts = opts || {};
      const size = 180, r = 64, cx = 90, cy = 90, sw = 22;
      const total = segs.reduce((a, s) => a + s.value, 0) || 1;
      let ang = -Math.PI / 2;
      let g = `<svg viewBox="0 0 ${size} ${size}" style="width:100%;max-width:200px;height:auto">`;
      g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f0edfb" stroke-width="${sw}"/>`;
      segs.forEach(s => {
        const a2 = ang + (s.value / total) * Math.PI * 2;
        const large = (s.value / total) > 0.5 ? 1 : 0;
        const x1 = cx + r * Math.cos(ang), y1 = cy + r * Math.sin(ang);
        const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
        g += `<path d="M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" fill="none" stroke="${s.color}" stroke-width="${sw}" stroke-linecap="round"/>`;
        ang = a2;
      });
      g += `<text x="${cx}" y="${cy + 2}" font-size="15" font-weight="800" fill="#2d2a45" text-anchor="middle">${opts.center || total}</text>`;
      if (opts.sub) g += `<text x="${cx}" y="${cy + 18}" font-size="9.5" fill="#a9a4c6" text-anchor="middle">${opts.sub}</text>`;
      g += `</svg>`;
      return g;
    },
    ring(percent, color, label) {
      const size = 120, r = 50, cx = 60, cy = 60, c = 2 * Math.PI * r;
      const off = c * (1 - Math.min(100, percent) / 100);
      return `<div class="ring"><svg viewBox="0 0 ${size} ${size}" width="100%" height="100%">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f0edfb" stroke-width="12"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"
          stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
        <text x="${cx}" y="${cy + 6}" font-size="22" font-weight="800" fill="#2d2a45" text-anchor="middle">${percent}%</text>
      </svg></div>`;
    },
    // 通用「模型选择器」：本地规则引擎 + 已绑定的豆包/DeepSeek/Kimi 等，记忆上次选择
    async fillModelSelect(selEl, key, onChange) {
      const binds = await (window.llmBinds ? window.llmBinds() : Promise.resolve([]));
      const saved = await DB.get('settings', key);
      let active = (saved && saved.value) || 'local';
      if (active !== 'local' && !binds.find(b => b.id === active)) active = 'local';
      selEl.innerHTML = '<option value="local">本地规则引擎（断网可用）</option>' +
        binds.map(b => `<option value="${b.id}">${U.esc(b.platform)} · ${U.esc(b.model || '默认模型')}</option>`).join('');
      selEl.value = active;
      selEl.onchange = () => {
        active = selEl.value;
        DB.put('settings', { id: key, value: active });
        onChange && onChange(active, binds.find(b => b.id === active));
      };
      return { active, binds };
    },
    // ---------- 通用「列表拖拽排序」（鼠标 + 触屏通用，零依赖） ----------
    // listEl: 容器；handleSel: 拖拽手柄选择器（如 '.drag-handle'）；onEnd(ids): 拖完回调，传入新顺序的 id 数组
    makeSortable(listEl, handleSel, onEnd) {
      if (!listEl || listEl._sortableBound) return;
      listEl._sortableBound = true;
      let dragging = null;
      function ptOf(e) { return e.touches ? e.touches[0] : e; }
      function onDown(e) {
        const handle = e.target.closest(handleSel);
        if (!handle) return;
        const item = handle.closest('[data-id]');
        if (!item) return;
        e.preventDefault();
        dragging = item;
        item.classList.add('dragging');
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
        document.addEventListener('touchcancel', onUp);
      }
      function onMove(e) {
        if (!dragging) return;
        e.preventDefault();
        const pt = ptOf(e);
        dragging.style.display = 'none';
        const under = document.elementFromPoint(pt.clientX, pt.clientY);
        dragging.style.display = '';
        const over = under && under.closest('[data-id]');
        if (over && over !== dragging && listEl.contains(over)) {
          const rect = over.getBoundingClientRect();
          const after = pt.clientY > rect.top + rect.height / 2;
          listEl.insertBefore(dragging, after ? over.nextSibling : over);
        }
      }
      function onUp() {
        if (!dragging) return;
        dragging.classList.remove('dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
        document.removeEventListener('touchcancel', onUp);
        const ids = Array.from(listEl.children)
          .filter(c => c.dataset && c.dataset.id)
          .map(c => c.dataset.id);
        dragging = null;
        if (onEnd) onEnd(ids);
      }
      listEl.addEventListener('mousedown', onDown);
      listEl.addEventListener('touchstart', onDown, { passive: false });
    }
  };
  window.U = U;
})();
