/* ============ 自媒体常用四大功能 ============ */
/* 发布排期日历 · 标题脚本灵感库 · 平台数据看板 · 对标账号监控 */
(function () {
  const Views = window.Views, Mount = window.Mount;
  const uid = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const PLATFORMS = ['抖音', '视频号', '小红书', '快手', 'B站', '公众号'];
  const PCOLOR = { '抖音': '#fe2c55', '视频号': '#07c160', '小红书': '#ff2442', '快手': '#ff6600', 'B站': '#00a1d6', '公众号': '#576b95' };
  const p2 = n => String(n).padStart(2, '0');
  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  const esc = s => U.esc(s == null ? '' : String(s));
  const N = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const platSel = (id, cur) => '<select id="' + id + '">' + PLATFORMS.map(p => '<option value="' + p + '"' + (p === cur ? ' selected' : '') + '>' + p + '</option>').join('') + '</select>';
  const GRIP = '<button class="drag-handle" title="拖动排序" aria-label="拖动排序"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6h2M13 6h2M9 12h2M13 12h2M9 18h2M13 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>';
  const DELICO = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  async function aiText(sys, user, fallback) {
    try {
      const binds = await window.llmBinds();
      const saved = await DB.getSetting('activeLLM');
      const active = (saved && saved.value) || 'local';
      const b = binds.find(x => x.id === active);
      if (active === 'local' || !b || !b.apiKey) return fallback;
      return await AI.chat(b, sys, user);
    } catch (e) { return fallback; }
  }

  /* ================= 1. 发布排期日历 ================= */
  let scY = new Date().getFullYear(), scM = new Date().getMonth();

  Views.media_schedule = async function () {
    return '<div class="row between" style="margin-bottom:14px">' +
      '<div class="section-title" style="margin:0">🗓️ 发布排期日历</div>' +
      '<button class="btn primary" id="scAdd">＋ 新建排期</button></div>' +
      '<div class="card" style="margin-bottom:16px">' +
        '<div class="row between" style="margin-bottom:10px">' +
          '<button class="btn sm ghost" id="scPrev">‹ 上月</button>' +
          '<strong id="scMonth" style="font-size:16px"></strong>' +
          '<button class="btn sm ghost" id="scNext">下月 ›</button></div>' +
        '<div id="scCal"></div></div>' +
      '<div class="card" style="margin-bottom:16px">' +
        '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end">' +
          '<div class="field" style="flex:2;min-width:170px;margin:0"><label>排期标题</label><input id="scT" placeholder="例如：3个被低估的剪辑技巧"></div>' +
          '<div class="field" style="flex:1;min-width:100px;margin:0"><label>平台</label>' + platSel('scP') + '</div>' +
          '<div class="field" style="flex:1;min-width:130px;margin:0"><label>发布日期</label><input id="scD" type="date" value="' + todayStr() + '"></div>' +
          '<div class="field" style="flex:1;min-width:90px;margin:0"><label>状态</label><select id="scS"><option>待发</option><option>已发</option><option>搁置</option></select></div>' +
          '<div class="field" style="flex:2;min-width:150px;margin:0"><label>备注</label><input id="scN" placeholder="选题来源 / 备注"></div>' +
          '<button class="btn primary" id="scSave">保存排期</button>' +
        '</div></div>' +
      U.searchBar('schedules', '搜索排期标题 / 平台 / 备注…') +
      '<div class="grid" id="scList"></div>';
  };

  function scCard(s) {
    const st = s.status || '待发';
    const cls = st === '已发' ? 'teal' : st === '搁置' ? 'gray' : 'amber';
    return '<div class="item" data-id="' + s.id + '">' + GRIP +
      '<div class="body"><div class="tt">' + esc(s.title) + ' <span class="pill ' + cls + '">' + esc(st) + '</span></div>' +
      '<div class="meta"><span style="color:' + (PCOLOR[s.platform] || 'var(--primary)') + '">' + esc(s.platform) + '</span>' +
      '<span>· ' + esc(s.date) + '</span>' + (s.note ? '<span>· ' + esc(s.note) + '</span>' : '') + '</div></div>' +
      '<div class="act">' + U.favStar('schedules', s.id, s.fav) +
      '<button class="mini" data-act="done" title="切换 已发/待发">✓</button>' +
      '<button class="mini del" data-act="del" title="删除">' + DELICO + '</button></div></div>';
  }

  Mount.media_schedule = async function (el) {
    const order = await Main.getOrder('schedules');
    const listEl = el.querySelector('#scList');
    const calEl = el.querySelector('#scCal');
    let all = [];
    const F = Main.bindListSearch(el, render);

    function drawCal() {
      el.querySelector('#scMonth').textContent = scY + ' 年 ' + (scM + 1) + ' 月';
      const startDow = (new Date(scY, scM, 1).getDay() + 6) % 7;
      const days = new Date(scY, scM + 1, 0).getDate();
      const by = {};
      all.forEach(s => { const k = (s.date || '').slice(0, 10); (by[k] = by[k] || []).push(s); });
      let cells = '';
      for (let i = 0; i < startDow; i++) cells += '<div class="cal-cell empty"></div>';
      for (let d = 1; d <= days; d++) {
        const k = scY + '-' + p2(scM + 1) + '-' + p2(d);
        const arr = by[k] || [];
        cells += '<div class="cal-cell"><div class="cal-d">' + d + '</div>' +
          arr.slice(0, 2).map(s => '<div class="cal-ev" style="background:' + (PCOLOR[s.platform] || '#7c5cff') + '" title="' + esc(s.title) + '">' + esc(s.title) + '</div>').join('') +
          (arr.length > 2 ? '<div class="cal-more">+' + (arr.length - 2) + '</div>' : '') + '</div>';
      }
      calEl.innerHTML = '<div class="cal-head">' + ['一', '二', '三', '四', '五', '六', '日'].map(d => '<div>' + d + '</div>').join('') +
        '</div><div class="cal-grid">' + cells + '</div>';
    }

    async function render() {
      all = await DB.all('schedules');
      const q = F.q();
      let arr = Main.sortByOrder(all, order);
      if (q) arr = arr.filter(s => Main.matchQ(q, s.title, s.platform, s.note));
      if (F.favOnly()) arr = arr.filter(s => s.fav);
      listEl.innerHTML = arr.length ? arr.map(scCard).join('') :
        '<div class="empty-state"><p>还没有排期</p><p class="muted">上方填标题 + 日期，点「保存排期」</p></div>';
      U.makeSortable(listEl, '.drag-handle', ids => { Main.saveOrderMerged('schedules', ids); U.toast('已保存顺序', true); });
      listEl.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
        const id = b.closest('[data-id]').dataset.id;
        if (b.dataset.act === 'del') {
          if (!confirm('删除这条排期？')) return;
          await DB.del('schedules', id); U.toast('已删除');
        } else {
          const it = await DB.get('schedules', id);
          if (it) { it.status = it.status === '已发' ? '待发' : '已发'; await DB.put('schedules', it); }
        }
        await render();
      });
      drawCal();
    }
    el.querySelector('#scPrev').onclick = () => { scM--; if (scM < 0) { scM = 11; scY--; } drawCal(); };
    el.querySelector('#scNext').onclick = () => { scM++; if (scM > 11) { scM = 0; scY++; } drawCal(); };
    el.querySelector('#scAdd').onclick = () => el.querySelector('#scT').focus();
    el.querySelector('#scSave').onclick = async () => {
      const t = el.querySelector('#scT').value.trim();
      if (!t) return U.toast('请填写排期标题');
      await DB.put('schedules', {
        id: uid(), title: t, platform: el.querySelector('#scP').value,
        date: el.querySelector('#scD').value || todayStr(), status: el.querySelector('#scS').value,
        note: el.querySelector('#scN').value.trim(), created: Date.now()
      });
      el.querySelector('#scT').value = ''; el.querySelector('#scN').value = '';
      U.toast('排期已保存', true); await render();
    };
    await render();
  };

  /* ================= 2. 标题 / 脚本灵感库 ================= */
  function localVariants(t) {
    return [t + '（附详细教程）', '90% 的人都不知道：' + t, '我踩过的坑：' + t, t + '，第2个太实用了', '别再乱学了，' + t].join('\n');
  }

  Views.media_titles = async function () {
    return '<div class="row between" style="margin-bottom:14px">' +
      '<div class="section-title" style="margin:0">💡 标题 / 脚本灵感库</div>' +
      '<button class="btn sm ghost" id="tiAi">✨ AI 批量产出标题</button></div>' +
      '<div class="card" style="margin-bottom:16px">' +
        '<div class="field"><label>标题 / 灵感一句话</label>' +
        '<input id="tiT" placeholder="例如：3个被低估的手机剪辑技巧，第2个我每天都在用"></div>' +
        '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end">' +
          '<div class="field" style="flex:1;min-width:120px;margin:0"><label>分类</label><input id="tiC" placeholder="干货 / 剧情 / 种草…"></div>' +
          '<div class="field" style="flex:2;min-width:150px;margin:0"><label>备注</label><input id="tiN" placeholder="钩子类型 / 可用场景"></div>' +
          '<button class="btn primary" id="tiAdd">＋ 加入灵感库</button>' +
        '</div></div>' +
      U.searchBar('titles', '搜索标题 / 分类 / 备注…') +
      '<div class="grid" id="tiList"></div>';
  };

  function tiCard(t) {
    return '<div class="item" data-id="' + t.id + '">' + GRIP +
      '<div class="body"><div class="tt">' + esc(t.text) + '</div>' +
      '<div class="meta">' + (t.cat ? '<span class="pill gray">' + esc(t.cat) + '</span>' : '') +
      (t.note ? '<span>· ' + esc(t.note) + '</span>' : '') + '</div></div>' +
      '<div class="act">' + U.favStar('titles', t.id, t.fav) +
      '<button class="mini" data-act="ai" title="AI 扩写">✨</button>' +
      '<button class="mini" data-act="copy" title="复制">⧉</button>' +
      '<button class="mini del" data-act="del" title="删除">' + DELICO + '</button></div></div>';
  }

  Mount.media_titles = async function (el) {
    const order = await Main.getOrder('titles');
    const listEl = el.querySelector('#tiList');
    const F = Main.bindListSearch(el, render);

    async function render() {
      const q = F.q();
      let arr = Main.sortByOrder(await DB.all('titles'), order);
      if (q) arr = arr.filter(t => Main.matchQ(q, t.text, t.cat, t.note));
      if (F.favOnly()) arr = arr.filter(t => t.fav);
      listEl.innerHTML = arr.length ? arr.map(tiCard).join('') :
        '<div class="empty-state"><p>灵感库还是空的</p><p class="muted">加一条标题，或用 AI 批量产出</p></div>';
      U.makeSortable(listEl, '.drag-handle', ids => { Main.saveOrderMerged('titles', ids); U.toast('已保存顺序', true); });
      listEl.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
        const id = b.closest('[data-id]').dataset.id;
        const it = await DB.get('titles', id);
        if (!it) return;
        if (b.dataset.act === 'del') { if (!confirm('删除这条灵感？')) return; await DB.del('titles', id); U.toast('已删除'); }
        else if (b.dataset.act === 'copy') {
          try { await navigator.clipboard.writeText(it.text); U.toast('已复制', true); }
          catch (e) { U.toast('复制失败，请手动选中'); }
        } else if (b.dataset.act === 'ai') {
          b.disabled = true; b.textContent = '…';
          const out = await aiText('你是爆款短视频标题策划专家。基于给定标题产出5个更具吸引力的改写版本，每行一条，不要编号、不要解释。',
            '原标题：' + it.text, localVariants(it.text));
          const lines = String(out).split('\n').map(s => s.replace(/^[\d.、)\s]+/, '').trim()).filter(Boolean);
          for (const l of lines) await DB.put('titles', { id: uid(), text: l, cat: it.cat, note: 'AI 扩写自：' + it.text, created: Date.now() });
          U.toast('已生成 ' + lines.length + ' 条改写', true);
        }
        await render();
      });
    }
    el.querySelector('#tiAdd').onclick = async () => {
      const t = el.querySelector('#tiT').value.trim();
      if (!t) return U.toast('请输入标题');
      await DB.put('titles', { id: uid(), text: t, cat: el.querySelector('#tiC').value.trim(), note: el.querySelector('#tiN').value.trim(), created: Date.now() });
      el.querySelector('#tiT').value = ''; U.toast('已加入灵感库', true); await render();
    };
    el.querySelector('#tiAi').onclick = async () => {
      const seed = el.querySelector('#tiT').value.trim() || '手机剪辑技巧';
      const btn = el.querySelector('#tiAi'); btn.disabled = true; btn.textContent = '生成中…';
      const out = await aiText('你是爆款短视频选题策划。请直接给出8个高点击潜力的短视频标题，每行一条，不要编号、不要解释。',
        '方向：' + seed, localVariants(seed));
      const lines = String(out).split('\n').map(s => s.replace(/^[\d.、)\s]+/, '').trim()).filter(Boolean);
      for (const l of lines) await DB.put('titles', { id: uid(), text: l, cat: el.querySelector('#tiC').value.trim() || 'AI 产出', note: 'AI 批量 · ' + seed, created: Date.now() });
      btn.disabled = false; btn.textContent = '✨ AI 批量产出标题';
      U.toast('已产出 ' + lines.length + ' 条标题', true); await render();
    };
    await render();
  };

  /* ================= 3. 平台数据看板 ================= */
  function lineSvg(pts) {
    if (pts.length < 2) return '<div class="muted" style="font-size:12px">再记录一条数据就会出现趋势图</div>';
    const w = 640, h = 190, pad = 30;
    const vals = pts.map(p => p.play || 0);
    const max = Math.max.apply(null, vals.concat([1]));
    const step = (w - pad * 2) / (pts.length - 1);
    const cs = vals.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)]);
    const d = cs.map((c, i) => (i ? 'L' : 'M') + c[0].toFixed(1) + ' ' + c[1].toFixed(1)).join(' ');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:190px">' +
      '<path d="' + d + ' L ' + cs[cs.length - 1][0].toFixed(1) + ' ' + (h - pad) + ' L ' + pad + ' ' + (h - pad) + ' Z" fill="rgba(124,92,255,.14)"/>' +
      '<path d="' + d + '" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round"/>' +
      cs.map(c => '<circle cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="3.5" fill="var(--primary)"/>').join('') +
      pts.map((p, i) => '<text x="' + cs[i][0].toFixed(1) + '" y="' + (h - 8) + '" font-size="10" text-anchor="middle" fill="currentColor">' + esc(p.date.slice(5)) + '</text>').join('') +
      '</svg>';
  }

  Views.media_stats = async function () {
    return '<div class="section-title" style="margin-bottom:14px">📈 平台数据看板</div>' +
      '<div class="grid cols-3" id="stCards" style="margin-bottom:16px"></div>' +
      '<div class="card" style="margin-bottom:16px">' +
        '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end">' +
          '<div class="field" style="flex:1;min-width:130px;margin:0"><label>日期</label><input id="stD" type="date" value="' + todayStr() + '"></div>' +
          '<div class="field" style="flex:1;min-width:100px;margin:0"><label>平台</label>' + platSel('stP') + '</div>' +
          '<div class="field" style="flex:1;min-width:100px;margin:0"><label>播放量</label><input id="stPlay" type="number" inputmode="numeric" placeholder="0"></div>' +
          '<div class="field" style="flex:1;min-width:100px;margin:0"><label>粉丝数</label><input id="stFans" type="number" inputmode="numeric" placeholder="0"></div>' +
          '<div class="field" style="flex:1;min-width:100px;margin:0"><label>点赞</label><input id="stLike" type="number" inputmode="numeric" placeholder="0"></div>' +
          '<button class="btn primary" id="stAdd">＋ 记录</button>' +
        '</div>' +
        '<div id="stChart" style="margin-top:14px"></div></div>' +
      U.searchBar('statpts', '搜索平台 / 日期…') +
      '<div class="grid" id="stList"></div>';
  };

  function stCard(s) {
    return '<div class="item" data-id="' + s.id + '">' + GRIP +
      '<div class="body"><div class="tt"><span style="color:' + (PCOLOR[s.platform] || 'var(--primary)') + '">' + esc(s.platform) + '</span> · ' + esc(s.date) + '</div>' +
      '<div class="meta"><span>播放 ' + (s.play || 0).toLocaleString() + '</span><span>· 粉 ' + (s.fans || 0).toLocaleString() + '</span><span>· 赞 ' + (s.like || 0).toLocaleString() + '</span></div></div>' +
      '<div class="act">' + U.favStar('statpts', s.id, s.fav) +
      '<button class="mini del" data-act="del" title="删除">' + DELICO + '</button></div></div>';
  }

  Mount.media_stats = async function (el) {
    const order = await Main.getOrder('statpts');
    const listEl = el.querySelector('#stList');
    const F = Main.bindListSearch(el, render);

    async function render() {
      const all = await DB.all('statpts');
      const sumPlay = all.reduce((s, x) => s + (x.play || 0), 0);
      const sumLike = all.reduce((s, x) => s + (x.like || 0), 0);
      const maxFans = all.reduce((s, x) => Math.max(s, x.fans || 0), 0);
      el.querySelector('#stCards').innerHTML =
        '<div class="card tight"><div class="muted" style="font-size:11px">累计播放</div><div style="font-weight:800;font-size:20px">' + sumPlay.toLocaleString() + '</div></div>' +
        '<div class="card tight"><div class="muted" style="font-size:11px">累计点赞</div><div style="font-weight:800;font-size:20px">' + sumLike.toLocaleString() + '</div></div>' +
        '<div class="card tight"><div class="muted" style="font-size:11px">粉丝峰值</div><div style="font-weight:800;font-size:20px">' + maxFans.toLocaleString() + '</div></div>';
      const pts = all.slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      el.querySelector('#stChart').innerHTML = lineSvg(pts);
      const q = F.q();
      let arr = Main.sortByOrder(all, order);
      if (q) arr = arr.filter(s => Main.matchQ(q, s.platform, s.date));
      if (F.favOnly()) arr = arr.filter(s => s.fav);
      listEl.innerHTML = arr.length ? arr.map(stCard).join('') :
        '<div class="empty-state"><p>还没有数据记录</p><p class="muted">每天记一次播放/粉丝，趋势图就有了</p></div>';
      U.makeSortable(listEl, '.drag-handle', ids => { Main.saveOrderMerged('statpts', ids); U.toast('已保存顺序', true); });
      listEl.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
        if (!confirm('删除这条数据？')) return;
        await DB.del('statpts', b.closest('[data-id]').dataset.id); U.toast('已删除'); await render();
      });
    }
    el.querySelector('#stAdd').onclick = async () => {
      await DB.put('statpts', {
        id: uid(), date: el.querySelector('#stD').value || todayStr(), platform: el.querySelector('#stP').value,
        play: N(el.querySelector('#stPlay').value), fans: N(el.querySelector('#stFans').value),
        like: N(el.querySelector('#stLike').value), created: Date.now()
      });
      el.querySelector('#stPlay').value = ''; el.querySelector('#stLike').value = '';
      U.toast('已记录', true); await render();
    };
    await render();
  };

  /* ================= 4. 对标账号监控 ================= */
  function barSvg(rows) {
    if (!rows.length) return '';
    const w = 640, barH = 30, gap = 14, h = rows.length * (barH + gap) + 8;
    const max = Math.max.apply(null, rows.map(r => r.v).concat([1]));
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:' + h + 'px">' +
      rows.map((r, i) => {
        const y = i * (barH + gap) + 4;
        const bw = Math.max(2, (r.v / max) * (w - 230));
        return '<text x="0" y="' + (y + 15) + '" font-size="13" fill="currentColor">' + esc(r.label) + '</text>' +
          '<rect x="130" y="' + y + '" width="' + bw.toFixed(1) + '" height="' + (barH - 12) + '" rx="6" fill="' + r.color + '"/>' +
          '<text x="' + (130 + bw + 8).toFixed(1) + '" y="' + (y + 15) + '" font-size="12" fill="currentColor">' + r.v.toLocaleString() + '</text>';
      }).join('') + '</svg>';
  }

  Views.media_rivals = async function () {
    return '<div class="section-title" style="margin-bottom:14px">🎯 对标账号监控</div>' +
      '<div class="card" style="margin-bottom:16px">' +
        '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end">' +
          '<div class="field" style="flex:2;min-width:140px;margin:0"><label>对标账号名</label><input id="rvN" placeholder="例如：XX剪辑"></div>' +
          '<div class="field" style="flex:1;min-width:100px;margin:0"><label>平台</label>' + platSel('rvP') + '</div>' +
          '<div class="field" style="flex:1;min-width:110px;margin:0"><label>当前粉丝</label><input id="rvF" type="number" inputmode="numeric" placeholder="0"></div>' +
          '<div class="field" style="flex:2;min-width:140px;margin:0"><label>主页链接</label><input id="rvU" placeholder="https://…"></div>' +
          '<div class="field" style="flex:2;min-width:140px;margin:0"><label>备注</label><input id="rvR" placeholder="值得学的地方"></div>' +
          '<button class="btn primary" id="rvAdd">＋ 添加对标</button>' +
        '</div>' +
        '<div id="rvChart" style="margin-top:14px"></div></div>' +
      U.searchBar('rivals', '搜索账号名 / 平台 / 备注…') +
      '<div class="grid cols-2" id="rvList"></div>';
  };

  Mount.media_rivals = async function (el) {
    const order = await Main.getOrder('rivals');
    const listEl = el.querySelector('#rvList');
    const F = Main.bindListSearch(el, render);

    async function render() {
      const all = await DB.all('rivals');
      const mine = await DB.all('accounts');
      const myMax = mine.reduce((s, a) => Math.max(s, a.fans || 0), 0);
      const q = F.q();
      let arr = Main.sortByOrder(all, order);
      if (q) arr = arr.filter(r => Main.matchQ(q, r.name, r.platform, r.note));
      if (F.favOnly()) arr = arr.filter(r => r.fav);

      listEl.innerHTML = arr.length ? arr.map(r => {
        const snaps = r.snaps || [];
        const first = snaps.length ? snaps[0].fans : (r.fans || 0);
        const grow = (r.fans || 0) - first;
        const gap = (r.fans || 0) - myMax;
        return '<div class="card" data-id="' + r.id + '">' +
          '<div class="drag-handle drag-strip" title="拖动排序"><svg viewBox="0 0 24 24" fill="none"><path d="M5 9h14M5 15h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>' +
          '<div class="row between"><div class="row" style="gap:10px">' +
            '<div style="width:40px;height:40px;border-radius:12px;background:' + (PCOLOR[r.platform] || '#7c5cff') + ';display:grid;place-items:center;color:#fff;font-weight:800">' + esc((r.platform || '?')[0]) + '</div>' +
            '<div><div class="tt" style="font-weight:800">' + esc(r.name) + ' <span class="pill gray">' + esc(r.platform) + '</span></div>' +
            '<div class="muted" style="font-size:12px">' + esc(r.note || '—') + '</div></div></div>' +
          '<div class="act">' + U.favStar('rivals', r.id, r.fav) +
            '<button class="mini" data-act="snap" title="记录今日粉丝">＋</button>' +
            '<button class="mini" data-act="rename" title="改名">✎</button>' +
            (r.url ? '<button class="mini" data-act="open" title="打开主页">↗</button>' : '') +
            '<button class="mini del" data-act="del" title="删除">' + DELICO + '</button></div></div>' +
          '<div class="row" style="gap:18px;margin-top:12px">' +
            '<div><div class="muted" style="font-size:11px">当前粉丝</div><div style="font-weight:800;font-size:18px">' + (r.fans || 0).toLocaleString() + '</div></div>' +
            '<div><div class="muted" style="font-size:11px">追踪涨粉</div><div style="font-weight:800;font-size:18px;color:' + (grow >= 0 ? 'var(--teal)' : 'var(--danger, #e5484d)') + '">' + (grow >= 0 ? '+' : '') + grow.toLocaleString() + '</div></div>' +
            '<div><div class="muted" style="font-size:11px">与我的差距</div><div style="font-weight:800;font-size:18px">' + (gap >= 0 ? '领先 ' + gap.toLocaleString() : '我落后 ' + Math.abs(gap).toLocaleString()) + '</div></div>' +
            '<div><div class="muted" style="font-size:11px">快照数</div><div style="font-weight:800;font-size:18px">' + snaps.length + '</div></div>' +
          '</div></div>';
      }).join('') : '<div class="empty-state"><p>还没有对标账号</p><p class="muted">加几个同行，盯着他们的涨粉节奏</p></div>';

      const rows = arr.map(r => ({ label: r.name + '（' + r.platform + '）', v: r.fans || 0, color: PCOLOR[r.platform] || '#7c5cff' }));
      if (myMax) rows.push({ label: '我（最高账号）', v: myMax, color: '#7c5cff' });
      el.querySelector('#rvChart').innerHTML = rows.length ? barSvg(rows) : '';

      U.makeSortable(listEl, '.drag-handle', ids => { Main.saveOrderMerged('rivals', ids); U.toast('已保存顺序', true); });
      listEl.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
        const id = b.closest('[data-id]').dataset.id;
        const it = await DB.get('rivals', id);
        if (!it) return;
        const a = b.dataset.act;
        if (a === 'del') { if (!confirm('删除该对标账号？')) return; await DB.del('rivals', id); U.toast('已删除'); }
        else if (a === 'open') { window.open(it.url, '_blank'); }
        else if (a === 'rename') {
          const v = prompt('改名为：', it.name || '');
          if (v != null && v.trim()) { it.name = v.trim(); await DB.put('rivals', it); U.toast('已改名', true); }
        } else if (a === 'snap') {
          const v = prompt('今日粉丝数：', String(it.fans || 0));
          if (v != null) {
            it.snaps = it.snaps || [];
            it.snaps.push({ date: todayStr(), fans: N(v) });
            it.fans = N(v);
            await DB.put('rivals', it); U.toast('快照已记录', true);
          }
        }
        await render();
      });
    }
    el.querySelector('#rvAdd').onclick = async () => {
      const n = el.querySelector('#rvN').value.trim();
      if (!n) return U.toast('请填写账号名');
      await DB.put('rivals', {
        id: uid(), name: n, platform: el.querySelector('#rvP').value,
        fans: N(el.querySelector('#rvF').value), url: el.querySelector('#rvU').value.trim(),
        note: el.querySelector('#rvR').value.trim(), snaps: [{ date: todayStr(), fans: N(el.querySelector('#rvF').value) }], created: Date.now()
      });
      el.querySelector('#rvN').value = ''; el.querySelector('#rvF').value = ''; el.querySelector('#rvU').value = ''; el.querySelector('#rvR').value = '';
      U.toast('已添加对标', true); await render();
    };
    await render();
  };
})();
