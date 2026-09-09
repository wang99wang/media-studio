/* ============ 模块一：自媒体创作中心 ============ */
(function () {
  const Views = window.Views = {};
  const Mount = window.Mount = {};

  // 读取已配置 Key 的大模型绑定（提升为全局，供通用模型选择器复用）
  window.llmBinds = async function () {
    const all = await DB.all('settings');
    return all.filter(s => s.id.startsWith('bind_') && s.value && s.value.type === 'llm' && s.value.apiKey)
      .map(s => s.value);
  };
  const llmBinds = window.llmBinds;
  // 各润色风格对应的 AI 系统提示
  const STYLE_PROMPT = {
    douyin: '你是一个抖音短视频口播文案专家。请将用户提供的原始文案改写为抖音口播风格：开头加强吸引力钩子（反常识/悬念），中间保留核心信息并增强情绪与口语感，结尾加一句行动号召（点赞收藏关注）。只输出润色后的纯文案，不要解释。',
    xhs: '你是一个小红书爆款文案写手。请将原始文案改写为小红书风格：开头一句吸引人的标题，正文用 emoji 分段、接地气口语化，结尾加 3 个相关话题标签（#...）。只输出纯文案。',
    ganhuo: '你是一个干货知识类博主。请将原始文案改写为专业干货风格：逻辑清晰、结构化分点（1. 2. 3.），去掉口头禅和废话，保留关键信息。只输出纯文案。',
    story: '你是一个短视频剧情脚本作者。请将原始文案改写为剧情悬念风格：强开头钩子，制造冲突或反转，结尾留悬念引导互动。只输出纯文案。',
    short: '你是一个文案精简助手。请将原始文案精简去水：删除口头禅和冗余词，保留核心信息，输出紧凑的一两段。只输出纯文案。'
  };

  async function todayBox() {
    const works = await DB.all('works');
    const topics = await DB.all('topics');
    const now = Date.now();
    const lines = [];
    works.filter(w => !w.reviewed && w.dueDate).forEach(w => {
      const d = U.daysBetween(now, w.dueDate);
      const over = d < 0;
      lines.push({ cls: over ? 'over' : '', tag: over ? '逾期' : '待复盘', tagCls: over ? 'over' : 'due',
        text: '复盘《' + w.title + '》' + (over ? '（已过期 ' + (-d) + ' 天）' : '（剩 ' + d + ' 天）'),
        go: 'center_works', id: w.id });
    });
    topics.filter(t => t.status === '待写' && t.dueDate).forEach(t => {
      const d = U.daysBetween(now, t.dueDate);
      const over = d < 0;
      lines.push({ cls: over ? 'over' : '', tag: over ? '逾期' : '待写', tagCls: over ? 'over' : 'due',
        text: '选题《' + t.title + '》' + (over ? '（已过期）' : '（剩 ' + d + ' 天）'),
        go: 'center_topics', id: t.id });
    });
    if (!lines.length) return `<div class="today"><h2>🌞 今天要处理</h2><div class="empty">暂无逾期或临期事项，状态很棒，去灵感中枢找点子吧～</div></div>`;
    return `<div class="today"><h2>🌞 今天要处理 <span class="pill">${lines.length}</span></h2>` +
      lines.map(l => `<div class="lin ${l.cls}" data-go="${l.go}" ${l.id ? 'data-id="' + l.id + '"' : ''} style="cursor:pointer">
        <span class="tag ${l.tagCls}">${l.tag}</span><span style="flex:1">${U.esc(l.text)}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" style="color:var(--primary)"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>`).join('') + `</div>`;
  }

  const ic = (p) => `<svg viewBox="0 0 24 24" fill="none">${p}</svg>`;
  const ICONS = {
    play: '<path d="M5 4l14 8-14 8V4z" fill="currentColor"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>',
    heart: '<path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5 6 5c2 0 3 1.5 4 3 1-1.5 2-3 4-3 3.5 0 5 4 3.5 7-2.5 4.5-9.5 9-9.5 9z" fill="currentColor"/>',
    target: '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'
  };

  // ---------- 数据大盘 ----------
  Views.center_dashboard = async function () {
    const accounts = await DB.all('accounts');
    const activeId = await DB.getSetting('activeAccount');
    const activeAcc = activeId ? accounts.find(a => a.id === activeId) : null;
    const scope = activeAcc ? [activeAcc] : accounts;
    const scopeName = activeAcc ? (activeAcc.account || activeAcc.platform) : '';
    const works = await DB.all('works');
    let todayHtml = await todayBox();

    // 聚合近7天播放
    const days = []; const labels = [];
    const base = U.startOfDay(Date.now());
    for (let i = 6; i >= 0; i--) {
      const t = base - i * 86400000;
      labels.push(U.fmt(t, 'short'));
      let sum = 0;
      scope.forEach(a => (a.daily || []).forEach(d => { if (U.startOfDay(d.date) === t) sum += d.play; }));
      days.push({ x: 0, y: sum });
    }
    const totalPlay = scope.reduce((s, a) => s + (a.daily || []).reduce((x, d) => x + d.play, 0), 0);
    const totalFans = scope.reduce((s, a) => s + (a.fans || 0), 0);
    const avgCtr = works.length ? Math.round(works.reduce((s, w) => s + (w.ctr || 0), 0) / works.length) : 0;
    // 平台粉丝柱图
    const platBars = scope.map(a => ({ label: a.platform, value: a.fans || 0, color: a.color || '#7c5cff' }));
    // 本月目标
    const goal = scope[0] && scope[0].goal ? scope[0].goal.play : 0;
    const monthPlay = scope.reduce((s, a) => s + (a.daily || []).filter(d => { const dt = new Date(d.date); const n = new Date(); return dt.getMonth() === n.getMonth() && dt.getFullYear() === n.getFullYear(); }).reduce((x, d) => x + d.play, 0), 0);
    const goalPct = goal ? Math.min(100, Math.round(monthPlay / goal * 100)) : 0;

    // 作品 Top 榜（按播放）
    const topWorks = works.slice().sort((a, b) => (b.play || 0) - (a.play || 0)).slice(0, 5);
    const maxTop = topWorks.length ? Math.max(1, topWorks[0].play || 0) : 1;
    const topColors = ['var(--primary)', 'var(--accent)', 'var(--teal)', 'var(--amber)', '#9b8cff'];
    const topHtml = topWorks.length ? topWorks.map((w, i) => `
      <div class="top-row">
        <span class="rank r${i + 1}">${i + 1}</span>
        <div class="top-main">
          <div class="top-tt">${U.esc(w.title)} <span class="muted" style="font-weight:500;margin-left:6px">${U.esc(w.platform || '')}</span></div>
          <div class="top-bar"><div style="width:${Math.round((w.play || 0) / maxTop * 100)}%;background:${topColors[i] || 'var(--primary)'}"></div></div>
        </div>
        <span class="top-val">${(w.play || 0).toLocaleString()}</span>
      </div>`).join('') : '<div class="muted" style="padding:12px">还没有作品数据，去「作品复盘」添加后这里会自动排名。</div>';

    const lineSvg = U.lineChart([{ color: '#7c5cff', points: days }], { labels });
    const barSvg = platBars.length ? U.barChart(platBars) : '<div class="muted" style="padding:20px;text-align:center">暂无账号数据，点右下「+ 添加账号」</div>';

    const focusBar = scopeName ? `<div class="focus-bar"><span>🎯 当前聚焦：<b>${U.esc(scopeName)}</b></span><button class="btn xs ghost" onclick="Main.setActiveAccount('')">查看全部账号</button></div>` : '';
    return todayHtml + focusBar + `
    <div class="grid cols-4" style="margin-bottom:18px">
      ${stat('play', '近7天播放', totalPlay.toLocaleString(), '#efe9ff', 'var(--primary)', '↗ 实时累计')}
      ${stat('eye', '总粉丝数', totalFans.toLocaleString(), '#ffe6ef', 'var(--accent)', scope.length + ' 个账号')}
      ${stat('heart', '平均完播率', avgCtr + '%', '#e1fbf7', 'var(--teal)', works.length + ' 条作品')}
      ${stat('target', '作品总数', works.length, '#fff2dd', 'var(--amber)', '持续更新中')}
    </div>
    <div class="grid cols-2">
      <div class="card">
        <div class="section-title">📈 播放趋势 <span class="badge">近7天</span></div>
        ${lineSvg}
      </div>
      <div class="card">
        <div class="section-title">👥 各平台粉丝</div>
        ${barSvg}
      </div>
    </div>
    <div class="grid cols-2" style="margin-top:18px">
      <div class="card">
        <div class="section-title">🎯 本月播放目标</div>
        <div class="ring-wrap">
          ${U.ring(goalPct, 'var(--primary)')}
          <div><div style="font-size:14px;font-weight:700">${monthPlay.toLocaleString()} / ${goal.toLocaleString()}</div>
          <div class="muted" style="font-size:12.5px;margin-top:4px">还差 ${(Math.max(0, goal - monthPlay)).toLocaleString()} 播放达成目标</div></div>
        </div>
      </div>
      <div class="card">
        <div class="section-title">⚡ 创作节奏</div>
        <div class="row" style="gap:10px">
          <div class="pill teal">本周选题 ${await weekTopics()}</div>
          <div class="pill pink">待复盘 ${works.filter(w=>!w.reviewed).length}</div>
          <div class="pill">素材 ${await matCount()} 个</div>
        </div>
        <div class="muted" style="font-size:12.5px;margin-top:12px">数据盘来自本地账号记录，联网后可同步到云端 MySQL。点右上「导出」可备份全部。</div>
        <button class="btn primary sm" style="margin-top:12px" onclick="M.go('center_works')">去复盘作品 →</button>
      </div>
    </div>
    <div class="card" style="margin-top:18px">
      <div class="section-title">🏆 作品 Top 榜 <span class="badge">按播放</span></div>
      <button class="btn sm ghost" style="margin-bottom:12px" onclick="Main.dashAI()">📊 AI 数据诊断</button>
      ${topHtml}
    </div>
    <div class="card" style="margin-top:18px">
      <div class="section-title">💾 数据备份 / 跨设备迁移</div>
      <p class="muted" style="font-size:12.5px;margin:0 0 12px">数据存在本地浏览器，各设备不互通。换手机/电脑前先「导出全部数据」存一份 JSON；到新设备点「导入全部数据」选该文件即可迁移（覆盖当前设备数据，建议先导出留底）。</p>
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <button class="btn primary sm" onclick="U.exportAll()">⬇ 导出全部数据</button>
        <button class="btn ghost sm" onclick="Main.importBackup()">⬆ 导入全部数据</button>
      </div>
    </div>`;

    function stat(icon, k, v, bg, col, d) {
      return `<div class="stat"><div class="ic" style="background:${bg};color:${col}">${ic(ICONS[icon])}</div>
        <div class="k">${k}</div><div class="v">${v}</div><div class="d muted">${d}</div></div>`;
    }
  };
  async function weekTopics() {
    const t = await DB.all('topics');
    const base = U.startOfDay(Date.now());
    return t.filter(x => x.dueDate && U.startOfDay(x.dueDate) >= base - 6 * 86400000 && U.startOfDay(x.dueDate) <= base + 86400000).length;
  }
  async function matCount() { return (await DB.all('materials')).length; }

  Mount.center_dashboard = function (el) {
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => M.go(b.dataset.go));
  };

  // ---------- 作品复盘 ----------
  Views.center_works = async function () {
    const works = (await DB.all('works')).sort((a, b) => (b.date || 0) - (a.date || 0));
    const html = works.length ? works.map(w => itemWork(w)).join('') :
      `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.6"/><path d="M8 9h8M8 13h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <p>还没有作品记录</p><p class="muted">添加一条作品，记录播放/点赞并写下复盘</p></div>`;
    const cats = [...new Set(works.map(w => (w.category || '').trim()).filter(Boolean))];
    return `<div class="row between" style="margin-bottom:16px">
      <div class="section-title" style="margin:0">🎬 作品复盘优化存档</div>
      <button class="btn primary" onclick="Main.addWork()">＋ 添加作品</button>
    </div>
    <div class="cat-filter"><span class="lbl">类目</span><select id="wCatFilter">
      <option value="all">全部</option>
      ${cats.map(c => `<option value="${U.esc(c)}">${U.esc(c)}</option>`).join('')}
    </select></div>
    ${U.searchBar('works', '搜索作品标题 / 平台 / 备注…')}
    <div class="grid" id="workList">${html}</div>`;
  };
  function itemWork(w) {
    return `<div class="item" data-id="${w.id}">
      <button class="drag-handle" title="按住拖动排序" aria-label="拖动排序"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6h2M13 6h2M9 12h2M13 12h2M9 18h2M13 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      <div class="body">
        <div class="tt">${U.esc(w.title)} ${w.reviewed ? '<span class="pill teal">已复盘</span>' : '<span class="pill amber">待复盘</span>'}</div>
        <div class="meta"><span>${U.esc(w.platform || '')}</span><span>· ${U.fmt(w.date, 'md')}</span><span>· 播放 ${ (w.play||0).toLocaleString() }</span><span>· 完播 ${w.ctr||0}%</span></div>
        ${w.note ? `<div class="meta" style="color:var(--text);margin-top:6px">💡 ${U.esc(w.note)}</div>` : ''}
      </div>
      <div class="act">
        ${U.favStar('works', w.id, w.fav)}
        <button class="mini" title="改名" onclick="Main.renameItem('works','${w.id}','title')"><svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L20 8l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 6l3 3" stroke="currentColor" stroke-width="1.8"/></svg></button>
        <button class="mini" title="AI 复盘诊断" onclick="Main.workAI('${w.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8"/></svg></button>
        <button class="mini" title="复盘" onclick="Main.editWork('${w.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L20 8l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>
        <button class="mini del" title="删除" onclick="Main.delWork('${w.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>
    </div>`;
  }
  Mount.center_works = async function (el) {
    const all = (await DB.all('works')).sort((a, b) => (b.date || 0) - (a.date || 0));
    const order = await Main.getOrder('works');
    const list = el.querySelector('#workList');
    const sel = el.querySelector('#wCatFilter');
    const F = Main.bindListSearch(el, render);
    function render() {
      const v = sel ? sel.value : 'all';
      let arr = v === 'all' ? all : all.filter(w => (w.category || '').trim() === v);
      const q = F.q();
      if (q) arr = arr.filter(w => Main.matchQ(q, w.title, w.platform, w.note, w.category));
      if (F.favOnly()) arr = arr.filter(w => w.fav);
      arr = Main.sortByOrder(arr, order);
      list.innerHTML = arr.length ? arr.map(itemWork).join('') :
        `<div class="empty-state"><p>该分类下还没有作品</p><p class="muted">换个类目或去添加一条作品</p></div>`;
      U.makeSortable(list, '.drag-handle', ids => { Main.saveOrderMerged('works', ids); U.toast('已保存顺序', true); });
    }
    if (sel) sel.onchange = render;
    render();
  };

  // ---------- 我的账号 ----------
  Views.center_accounts = async function () {
    const accounts = await DB.all('accounts');
    const activeId = await DB.getSetting('activeAccount');
    const switchHtml = accounts.length > 1 ? `<div class="acc-switch">
      ${accounts.map(a => `<button class="acc-chip ${a.id === activeId ? 'on' : ''}" onclick="Main.setActiveAccount('${a.id}')"><span class="dot" style="background:${a.color}"></span>${U.esc(a.account || a.platform)}</button>`).join('')}
      ${activeId ? `<button class="acc-chip ghost" onclick="Main.setActiveAccount('')">全部账号</button>` : ''}
    </div>` : '';
    const cards = accounts.length ? accounts.map(a => accCard(a, activeId)).join('') :
      `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <p>还没有你的账号</p><p class="muted">点「＋ 添加账号」，填你的平台和真实粉丝，大盘就显示你的数据</p></div>`;
    const hasDemo = accounts.some(a => a.demo);
    return `<div class="row between" style="margin-bottom:16px">
      <div class="section-title" style="margin:0">👤 我的账号</div>
      <button class="btn primary" onclick="Main.addAccount()">＋ 添加账号</button>
    </div>
    <div class="muted" style="font-size:12px;margin-bottom:14px">纯前端 PWA 无法直连平台 API 自动抓数，请你手动录入；或在「设置 · API 绑定」填好后端接口后，点账号卡的⬇️ 按钮一键拉取真实粉丝/播放。数据大盘自动聚合。</div>
    ${switchHtml}
    <div class="cat-filter"><span class="lbl">类目</span><select id="aCatFilter">
      <option value="all">全部</option>
      ${[...new Set(accounts.map(a => (a.category || '').trim()).filter(Boolean))].map(c => `<option value="${U.esc(c)}">${U.esc(c)}</option>`).join('')}
    </select></div>
    ${U.searchBar('accounts', '搜索平台 / 账号名 / 类目…')}
    <div class="grid cols-2" id="accGrid">${cards}</div>
    ${hasDemo ? `<div style="margin-top:18px;text-align:right"><button class="btn danger sm" onclick="Main.clearDemo()">清空示例数据</button></div>` : ''}`;
  };
  function accCard(a, activeId) {
    const recs = (a.daily || []).slice(-5).reverse();
    const sumPlay = (a.daily || []).reduce((s, d) => s + (d.play || 0), 0);
    const recHtml = recs.length ? `<div style="margin-top:10px;border-top:1px dashed var(--line);padding-top:8px">
      ${recs.map((d, i) => `<div class="row between" style="font-size:12px;padding:3px 0">
        <span class="muted">${U.fmt(d.date, 'md')}</span>
        <span>播放 ${(d.play || 0).toLocaleString()} · 赞 ${d.like || 0} · 粉 ${d.fans || 0}</span>
        <button class="mini del" style="width:26px;height:26px" title="删除" onclick="Main.delDaily('${a.id}',${a.daily.indexOf(d)})"><svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>`).join('')}
    </div>` : '';
    return `<div class="card ${a.id === activeId ? 'active' : ''}" data-id="${a.id}">
      <div class="drag-handle drag-strip" title="拖动排序" aria-label="拖动排序"><svg viewBox="0 0 24 24" fill="none"><path d="M5 9h14M5 15h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
      <div class="row between">
        <div class="row" style="gap:10px">
          <div style="width:40px;height:40px;border-radius:12px;background:${a.color};display:grid;place-items:center;color:#fff;font-weight:800">${(a.platform || '?')[0]}</div>
          <div><div class="tt" style="font-weight:800">${U.esc(a.platform)}${a.category ? ' <span class="pill gray" style="font-weight:600">${U.esc(a.category)}</span>' : ''}</div><div class="muted" style="font-size:12px">${U.esc(a.account || '')} · ${a.demo ? '示例' : '我的'}</div></div>
        </div>
        <div class="act">
          ${U.favStar('accounts', a.id, a.fav)}
          <button class="mini" title="改名" onclick="Main.renameItem('accounts','${a.id}','name')"><svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L20 8l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 6l3 3" stroke="currentColor" stroke-width="1.8"/></svg></button>
          <button class="mini" title="AI 涨粉建议" onclick="Main.accAI('${a.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8"/></svg></button>
          <button class="mini" title="用 API 绑定拉取真实数据" onclick="Main.pullAccount('${a.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3v10m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="mini" title="记录数据" onclick="Main.addDaily('${a.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
          <button class="mini" title="编辑" onclick="Main.editAccount('${a.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L20 8l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>
          <button class="mini del" title="删除" onclick="Main.delAccount('${a.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2M4 9h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      <div class="row" style="gap:18px;margin-top:12px">
        <div><div class="muted" style="font-size:11px">当前粉丝</div><div style="font-weight:800;font-size:18px">${(a.fans || 0).toLocaleString()}</div></div>
        <div><div class="muted" style="font-size:11px">累计播放</div><div style="font-weight:800;font-size:18px">${sumPlay.toLocaleString()}</div></div>
        <div><div class="muted" style="font-size:11px">记录天数</div><div style="font-weight:800;font-size:18px">${(a.daily || []).length}</div></div>
      </div>
      ${recHtml}
    </div>`;
  }
  Mount.center_accounts = async function (el) {
    const order = await Main.getOrder('accounts');
    const all = Main.sortByOrder(await DB.all('accounts'), order);
    const activeId = await DB.getSetting('activeAccount');
    const grid = el.querySelector('#accGrid');
    const sel = el.querySelector('#aCatFilter');
    const F = Main.bindListSearch(el, render);
    function render() {
      const v = sel ? sel.value : 'all';
      let arr = v === 'all' ? all : all.filter(a => (a.category || '').trim() === v);
      const q = F.q();
      if (q) arr = arr.filter(a => Main.matchQ(q, a.platform, a.account, a.category));
      if (F.favOnly()) arr = arr.filter(a => a.fav);
      grid.innerHTML = arr.length ? arr.map(a => accCard(a, activeId)).join('') :
        `<div class="empty-state"><p>该类目下还没有账号</p><p class="muted">换个类目或添加一个账号</p></div>`;
      U.makeSortable(grid, '.drag-handle', ids => { Main.saveOrderMerged('accounts', ids); U.toast('已保存顺序', true); });
    }
    if (sel) sel.onchange = render;
    render();
  };

  // ---------- 文案润色 ----------
  Views.center_polish = async function () {
    return `<div class="section-title">✨ 文案脚本智能润色</div>
    <div class="grid cols-2">
      <div class="card">
        <div class="field"><label>原始文案</label>
          <textarea id="pIn" placeholder="粘贴你的草稿，例如：今天教大家一个剪辑小技巧，可以让视频更流畅…">今天教大家一个剪辑小技巧，其实很重要，因为很多人都不知道，方法也很简单，注意别弄错了。</textarea>
        </div>
        <div class="field"><label>润色风格</label>
          <div class="seg" id="pStyle">${Polish.styles.map((s, i) => `<button data-v="${s.id}" class="${i === 0 ? 'on' : ''}">${s.name}</button>`).join('')}</div>
        </div>
        <div class="field"><label>使用模型</label>
          <select id="pModel"><option value="local">本地规则引擎（断网可用）</option></select>
          <div id="pModelHint" class="muted" style="font-size:11.5px;margin-top:4px"></div>
        </div>
        <button class="btn primary block" id="pRun">🪄 一键润色</button>
        <div class="muted" style="font-size:11.5px;margin-top:8px">选「本地规则引擎」断网也能用；选你绑定的豆包/DeepSeek/Kimi 等，则调用真实大模型 AI 润色，可随时切换。</div>
      </div>
      <div class="card">
        <div class="row between"><label style="font-weight:700">润色结果</label>
          <div class="row" style="gap:8px">
            <button class="btn sm ghost" id="pCopy">复制</button>
            <button class="btn sm teal" id="pSave">存为脚本</button>
          </div>
        </div>
        <textarea id="pOut" readonly placeholder="点左侧「一键润色」生成…" style="background:#fbfaff"></textarea>
        <div id="pStat" class="muted" style="font-size:12.5px"></div>
      </div>
    </div>`;
  };
  Mount.center_polish = async function (el) {
    let style = 'douyin';
    const modelSel = el.querySelector('#pModel');
    const hint = el.querySelector('#pModelHint');
    const binds = await llmBinds();
    const saved = await DB.get('settings', 'activeLLM');
    let active = (saved && saved.value) || 'local';
    if (active !== 'local' && !binds.find(b => b.id === active)) active = 'local';
    modelSel.innerHTML = '<option value="local">本地规则引擎（断网可用）</option>' +
      binds.map(b => `<option value="${b.id}">${U.esc(b.platform)} · ${U.esc(b.model || '默认模型')}</option>`).join('');
    modelSel.value = active;
    function updHint() {
      const v = modelSel.value;
      const b = binds.find(x => x.id === v);
      if (v === 'local') hint.textContent = '当前：本地规则引擎（断网可用、无需 Key）。';
      else if (b) hint.textContent = `当前：调用 ${b.platform}（${b.model || '默认模型'}）真实大模型。`;
      else hint.textContent = '';
    }
    updHint();
    modelSel.onchange = () => { active = modelSel.value; DB.put('settings', { id: 'activeLLM', value: active }); updHint(); };

    el.querySelectorAll('#pStyle button').forEach(b => b.onclick = () => {
      el.querySelectorAll('#pStyle button').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); style = b.dataset.v;
    });
    el.querySelector('#pRun').onclick = async () => {
      const txt = el.querySelector('#pIn').value;
      if (!txt.trim()) return U.toast('请输入原始文案');
      const btn = el.querySelector('#pRun');
      const outEl = el.querySelector('#pOut');
      const stat = el.querySelector('#pStat');
      btn.disabled = true; const oldTxt = btn.textContent; btn.textContent = '生成中…';
      try {
        if (modelSel.value === 'local') {
          const r = Polish.run(txt, style);
          outEl.value = r.out;
          stat.textContent = r.out ? `本地引擎 · 字数 ${r.words} · 预计口播 ${r.seconds}s` : r.note;
        } else {
          const b = binds.find(x => x.id === modelSel.value);
          if (!b || !b.apiKey) {
            U.toast('该模型未配置 Key，已切回本地', true);
            modelSel.value = 'local'; active = 'local';
            DB.put('settings', { id: 'activeLLM', value: 'local' }); updHint();
            const r = Polish.run(txt, style);
            outEl.value = r.out; stat.textContent = `本地引擎 · 字数 ${r.words}`;
          } else {
            const out = await AI.chat(b, STYLE_PROMPT[style], txt);
            outEl.value = out;
            const words = out.replace(/\s/g, '').length;
            stat.textContent = `AI 润色 · ${b.platform} · 字数 ${words} · 预计口播 ${Math.max(1, Math.round(words / 4))}s`;
          }
        }
      } catch (e) {
        outEl.value = '';
        stat.textContent = 'AI 调用失败：' + (e.message || e) + '（可切回「本地规则引擎」重试）';
        U.toast('AI 调用失败，见结果区', true);
      } finally { btn.disabled = false; btn.textContent = oldTxt; }
    };
    el.querySelector('#pCopy').onclick = () => { navigator.clipboard.writeText(el.querySelector('#pOut').value); U.toast('已复制', true); };
    el.querySelector('#pSave').onclick = async () => {
      const out = el.querySelector('#pOut').value;
      if (!out) return U.toast('先生成润色结果');
      await DB.put('scripts', { id: U.uid('sc'), name: '润色脚本 ' + U.fmt(Date.now(), 'md'), cat: '润色', tpl: out, created: Date.now() });
      U.toast('已存为脚本', true);
    };
  };

  // ---------- 抖音选题库 ----------
  Views.center_topics = async function () {
    const topics = (await DB.all('topics')).sort((a, b) => (b.heat || 0) - (a.heat || 0));
    const tCats = [...new Set(topics.map(t => (t.cat || '').trim()).filter(Boolean))];
    return `<div class="row between" style="margin-bottom:16px">
      <div class="section-title" style="margin:0">🔥 全品类抖音选题库</div>
      <div class="row" style="gap:8px">
        <button class="btn sm ghost" onclick="topicRewrite()">✍️ 批量改写</button>
        <button class="btn sm teal" onclick="topicScore()">📊 爆款评分</button>
        <button class="btn primary" onclick="Main.addTopic()">＋ 添加选题</button>
      </div>
    </div>
    <div class="chips" style="margin-bottom:14px" id="tFilter">
      <span class="chip on" data-c="all">全部</span>
      <span class="chip" data-c="灵感">灵感</span><span class="chip" data-c="待写">待写</span><span class="chip" data-c="已发">已发</span>
    </div>
    <div class="cat-filter" style="margin-bottom:14px">
      <span class="lbl">类目</span>
      <select id="tCatFilter">
        <option value="all">全部</option>
        ${tCats.map(c => `<option value="${U.esc(c)}">${U.esc(c)}</option>`).join('')}
      </select>
    </div>
    ${U.searchBar('topics', '搜索选题标题 / 类目 / 备注…')}
    <div class="grid" id="topicList">${topics.map(itemTopic).join('') || emptyTip()}</div>`;
  };
  function itemTopic(t) {
    const sc = { '灵感': 'gray', '待写': 'amber', '已发': 'teal' }[t.status] || 'gray';
    return `<div class="item" data-id="${t.id}">
      <button class="drag-handle" title="按住拖动排序" aria-label="拖动排序"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6h2M13 6h2M9 12h2M13 12h2M9 18h2M13 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      <div class="body">
        <div class="tt">${U.esc(t.title)}</div>
        <div class="meta"><span class="pill ${sc}">${U.esc(t.status)}</span><span>· ${U.esc(t.cat || '')}</span><span>· 热度 ${t.heat || 0}</span></div>
        ${t.note ? `<div class="meta" style="margin-top:5px">${U.esc(t.note)}</div>` : ''}
      </div>
      <div class="act">
        ${U.favStar('topics', t.id, t.fav)}
        <button class="mini" title="改名" onclick="Main.renameItem('topics','${t.id}','title')"><svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L20 8l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 6l3 3" stroke="currentColor" stroke-width="1.8"/></svg></button>
        <button class="mini" title="批量改写" onclick="topicRewrite('${t.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M4 20l4-1 9-9-3-3-9 9-1 4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 6l3 3" stroke="currentColor" stroke-width="1.8"/></svg></button>
        <button class="mini" title="爆款评分" onclick="topicScore('${t.id}')"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v4l2.5 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
        <button class="mini" title="编辑" onclick="Main.editTopic('${t.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L20 8l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>
        <button class="mini del" title="删除" onclick="Main.delTopic('${t.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>
    </div>`;
  }
  function emptyTip() { return `<div class="empty-state"><p>选题库空空，去「灵感中枢」一键收藏热点</p></div>`; }
  Mount.center_topics = async function (el) {
    const order = await Main.getOrder('topics');
    const chips = el.querySelectorAll('#tFilter .chip');
    const catSel = el.querySelector('#tCatFilter');
    const F = Main.bindListSearch(el, render);
    async function render() {
      const onChip = el.querySelector('#tFilter .chip.on');
      const sv = onChip ? onChip.dataset.c : 'all';
      const cv = catSel ? catSel.value : 'all';
      let list = await DB.all('topics');
      if (sv !== 'all') list = list.filter(t => t.status === sv);
      if (cv !== 'all') list = list.filter(t => (t.cat || '').trim() === cv);
      const q = F.q();
      if (q) list = list.filter(t => Main.matchQ(q, t.title, t.cat, t.note, t.status));
      if (F.favOnly()) list = list.filter(t => t.fav);
      list = Main.sortByOrder(list.sort((a, b) => (b.heat || 0) - (a.heat || 0)), order);
      el.querySelector('#topicList').innerHTML = list.map(itemTopic).join('') || emptyTip();
      U.makeSortable(el.querySelector('#topicList'), '.drag-handle', ids => { Main.saveOrderMerged('topics', ids); U.toast('已保存顺序', true); });
      bindTopicActs(el);
    }
    chips.forEach(c => c.onclick = () => {
      chips.forEach(x => x.classList.remove('on'));
      c.classList.add('on');
      render();
    });
    if (catSel) catSel.onchange = render;
    bindTopicActs(el);
    render();
  };
  function bindTopicActs(el) {
    el.querySelectorAll('[onclick^="Main.editTopic"]').forEach(b => {});
  }

  // ---------- 选题 · 批量改写 / 爆款评分（接入通用模型切换） ----------
  window.topicRewrite = function (id) { rewriteSheet(id); };
  window.topicScore = function (id) { scoreSheet(id); };

  function rewriteSheet(id) {
    const p = id ? DB.get('topics', id) : Promise.resolve(null);
    p.then(t => {
      t = t || { title: '', cat: '' };
      const sh = U.openSheet('<h3>✍️ 批量多版本改写</h3>' +
        '<div class="field"><label>选题 / 原始标题</label><input type="text" id="rwSeed" value="' + U.esc(t.title) + '" placeholder="例如：3个被低估的手机剪辑技巧"/></div>' +
        '<div class="field"><label>生成数量</label><div class="seg" id="rwCount">' +
          '<button data-v="4" class="on">4 个</button><button data-v="6">6 个</button><button data-v="8">8 个</button></div></div>' +
        '<div class="field"><label>使用模型</label><select id="rwModel"></select>' +
          '<div id="rwModelHint" class="muted" style="font-size:11.5px;margin-top:4px"></div></div>' +
        '<button class="btn primary block" id="rwRun">🪄 一键生成多版本</button>' +
        '<div id="rwOut" style="margin-top:14px"></div>' +
        '<div class="muted" style="font-size:11.5px;margin-top:8px">默认本地规则引擎（断网可用）；选你绑定的豆包 / DeepSeek / Kimi 等则调用真实大模型，可随时切换。</div>');
      let count = 4;
      sh.querySelectorAll('#rwCount button').forEach(b => b.onclick = () => {
        sh.querySelectorAll('#rwCount button').forEach(x => x.classList.remove('on')); b.classList.add('on'); count = +b.dataset.v;
      });
      const sel = sh.querySelector('#rwModel');
      U.fillModelSelect(sel, 'topicRewrite', (v, b) => {
        sh.querySelector('#rwModelHint').textContent = v === 'local' ? '当前：本地规则引擎（断网可用）' : '当前：调用 ' + b.platform + '（' + (b.model || '默认模型') + '）';
      });
      sh.querySelector('#rwRun').onclick = async () => {
        const seed = sh.querySelector('#rwSeed').value.trim();
        if (!seed) return U.toast('请输入选题 / 标题');
        const btn = sh.querySelector('#rwRun'), out = sh.querySelector('#rwOut');
        btn.disabled = true; const old = btn.textContent; btn.textContent = '生成中…';
        try {
          let variants = [];
          if (sel.value === 'local') {
            variants = localRewrite(seed, count);
          } else {
            const b = (await window.llmBinds()).find(x => x.id === sel.value);
            if (!b || !b.apiKey) { variants = localRewrite(seed, count); U.toast('该模型未配置 Key，已用本地', true); }
            else {
              const sys = '你是短视频选题标题专家。给定主题，生成多种不同角度的爆款标题变体。只输出标题，每行一个，不要编号和解释。角度覆盖：悬念好奇、数字清单、痛点共鸣、反常识、身份代入、情绪煽动。';
              const txt = await AI.chat(b, sys, '主题：' + seed + '。请生成 ' + count + ' 个不同角度的短视频标题，每行一个。');
              variants = txt.split(String.fromCharCode(10)).map(s => {
                let v = s.trim();
                const m = v.match(/^([0-9]+)[.、)](.*)$/);
                if (m) v = m[2].trim();
                return v;
              }).filter(Boolean).slice(0, count);
              if (!variants.length) variants = localRewrite(seed, count);
            }
          }
          out.innerHTML = variants.map(v => '<div class="variant"><div class="vt">' + U.esc(v) + '</div>' +
            '<div class="row" style="gap:6px;margin-top:7px">' +
            '<button class="btn xs ghost" data-copy="' + U.esc(v) + '">复制</button>' +
            '<button class="btn xs teal" data-v="' + U.esc(v) + '">存为选题</button>' +
            '</div></div>').join('');
          out.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => { navigator.clipboard.writeText(b.dataset.copy); U.toast('已复制', true); });
          out.querySelectorAll('.btn.teal').forEach(b2 => b2.onclick = async () => {
            await DB.put('topics', { id: U.uid('tp'), title: b2.dataset.v, cat: (t && t.cat) || '改写', heat: 80, status: '灵感', note: '批量改写自：' + seed, dueDate: '' });
            U.toast('已存为选题', true);
          });
        } catch (e) {
          out.innerHTML = '<div class="muted">生成失败：' + U.esc(e.message || e) + '</div>';
        } finally { btn.disabled = false; btn.textContent = old; }
      };
    });
  }

  function scoreSheet(id) {
    const p = id ? DB.get('topics', id) : Promise.resolve(null);
    p.then(t => {
      t = t || { title: '', cat: '', heat: 80, status: '灵感', note: '' };
      const sh = U.openSheet('<h3>📊 爆款潜力评分</h3>' +
        '<div class="field"><label>选题标题</label><input type="text" id="scTitle" value="' + U.esc(t.title) + '"/></div>' +
        '<div class="field"><label>使用模型</label><select id="scModel"></select>' +
          '<div id="scModelHint" class="muted" style="font-size:11.5px;margin-top:4px"></div></div>' +
        '<button class="btn primary block" id="scRun">🔍 一键分析潜力</button>' +
        '<div id="scOut" style="margin-top:14px"></div>' +
        '<div class="muted" style="font-size:11.5px;margin-top:8px">默认本地规则打分（断网可用）；选绑定的大模型可做更深度诊断。</div>');
      const sel = sh.querySelector('#scModel');
      U.fillModelSelect(sel, 'topicScore', (v, b) => {
        sh.querySelector('#scModelHint').textContent = v === 'local' ? '当前：本地规则引擎（断网可用）' : '当前：调用 ' + b.platform + '（' + (b.model || '默认模型') + '）';
      });
      sh.querySelector('#scRun').onclick = async () => {
        const title = sh.querySelector('#scTitle').value.trim();
        if (!title) return U.toast('请输入标题');
        const btn = sh.querySelector('#scRun'), out = sh.querySelector('#scOut');
        btn.disabled = true; const old = btn.textContent; btn.textContent = '分析中…';
        try {
          if (sel.value === 'local') {
            out.innerHTML = scoreHtml(localScore(title, t));
          } else {
            const b = (await window.llmBinds()).find(x => x.id === sel.value);
            if (!b || !b.apiKey) { out.innerHTML = scoreHtml(localScore(title, t)); U.toast('未配置 Key，已用本地', true); }
            else {
              const sys = '你是短视频爆款分析专家。给定标题，从钩子力、情绪力、数字感、人群匹配、痛点度5个维度各给0-100分，并给3条可落地优化建议。严格只输出JSON，格式：{"score":数字,"dims":{"钩子力":数字,"情绪力":数字,"数字感":数字,"人群匹配":数字,"痛点度":数字},"建议":["a","b","c"]}';
              const raw = await AI.chat(b, sys, '标题：' + title);
              let obj = null;
              try { obj = JSON.parse(raw.replace(/```/g, '').replace(/json/g, '').trim()); } catch (e) {}
              if (obj && typeof obj.score === 'number') out.innerHTML = scoreHtml(obj);
              else { out.innerHTML = scoreHtml(localScore(title, t)) + '<div class="muted" style="margin-top:8px">AI 返回非标准，已用本地评分兜底</div>'; }
            }
          }
        } catch (e) {
          out.innerHTML = '<div class="muted">分析失败：' + U.esc(e.message || e) + '，已用本地</div>' + scoreHtml(localScore(title, t));
        } finally { btn.disabled = false; btn.textContent = old; }
      };
    });
  }

  function localRewrite(seed, n) {
    const base = (seed || '').trim();
    const tpls = [
      s => '别划走！' + s + ' 的底层逻辑，90% 的人都理解错了',
      s => '3 个关于「' + s + '」的真相，第 2 个很少有人知道',
      s => '还在为 ' + s + ' 头疼？教你一招，一次解决',
      s => '如果你也 ' + s + '，这条视频一定要看完',
      s => '我后悔没早点知道 ' + s + '，现在分享给你',
      s => s + '？其实大多数人第一步就错了',
      s => '普通人怎么把 ' + s + ' 玩明白？这期讲透',
      s => s + '｜从 0 到 1，手把手教你做出来'
    ];
    const out = [base];
    for (let i = 0; i < tpls.length && out.length < n; i++) out.push(tpls[i](base));
    return out.slice(0, n);
  }

  function localScore(title, t) {
    title = title || '';
    let score = 50; const dims = {};
    const len = title.length;
    dims['标题力'] = Math.min(100, Math.round(len >= 8 && len <= 22 ? 85 : (len < 6 ? 42 : 70)));
    const hasNum = /[0-9]/.test(title);
    dims['数字感'] = hasNum ? 82 : 46; score += hasNum ? 8 : -5;
    const emo = ['！', '?', '？', '绝', '后悔', '别', '为什么', '震惊', '不得不', '必看', '真相'];
    const emoC = emo.filter(w => title.indexOf(w) >= 0).length;
    dims['情绪力'] = Math.min(100, 38 + emoC * 14); score += emoC * 4;
    const hook = ['别', '为什么', '如何', '怎么', '揭秘', '真相', '第', '招', '种', '如果你'].some(w => title.indexOf(w) >= 0);
    dims['钩子力'] = hook ? 84 : 52; score += hook ? 6 : 0;
    const heat = (t && t.heat) || 60; dims['热度值'] = Math.max(0, Math.min(100, heat));
    score += Math.round((heat - 60) / 12);
    const status = (t && t.status) || '灵感';
    if (status === '已发') score += 5;
    score = Math.max(5, Math.min(98, Math.round(score)));
    const tips = [];
    if (!hasNum) tips.push('加入具体数字（如「3 个」「7 天」）更易获得点击');
    if (!hook) tips.push('开头加钩子词：别 / 为什么 / 如何 / 真相');
    if (emoC === 0) tips.push('增加情绪词（绝了 / 后悔 / 必看）提升共鸣');
    if (len < 8) tips.push('标题偏短，可补充信息量让观众有预期');
    if (len > 22) tips.push('标题偏长，精简到 20 字内更聚焦');
    if (!tips.length) tips.push('结构已不错，可再加一个数字或身份词进一步提升点击');
    return { score, dims, tips };
  }

  function scoreHtml(o) {
    const color = o.score >= 80 ? 'var(--ok)' : o.score >= 60 ? 'var(--amber)' : 'var(--danger)';
    const bars = Object.keys(o.dims).filter(k => typeof o.dims[k] === 'number').map(k => {
      const v = o.dims[k];
      return '<div class="score-row"><span class="sl">' + k + '</span><div class="score-bar"><div style="width:' + v + '%;background:' + (v >= 80 ? 'var(--ok)' : v >= 60 ? 'var(--amber)' : 'var(--danger)') + '"></div></div><span class="sv">' + v + '</span></div>';
    }).join('');
    const tips = (o.tips || o['建议'] || []).map(x => '<li>' + U.esc(x) + '</li>').join('');
    return '<div class="score-head"><div class="score-num" style="color:' + color + '">' + o.score + '</div><div><div style="font-weight:800">爆款潜力分</div><div class="muted" style="font-size:12px">满分 100 · 综合钩子 / 情绪 / 数字 / 热度</div></div></div>' +
      '<div style="margin:14px 0">' + bars + '</div>' +
      '<div class="section-title" style="margin-bottom:8px;font-size:14px">🛠️ 优化建议</div>' +
      '<ul class="tips">' + tips + '</ul>';
  }

  // ---------- 灵感中枢 ----------
  Views.center_inspo = async function () {
    const insp = Libs.inspo(U.today());
    const hot = Libs.hot();
    const radar = Libs.radar();
    const refer = Libs.refer();
    const scripts = Libs.scripts();
    return `<div class="section-title">💡 灵感中枢</div>
    <div class="grid">
      <div class="card">
        <div class="section-title">🌅 每日灵感 <span class="badge">${U.fmt(Date.now(),'md')}</span></div>
        <div class="grid" style="gap:10px">
          ${insp.map((t, i) => `<div class="item" style="cursor:pointer" onclick="Main.inspoToTopic(${i})"><div class="body"><div class="tt" style="font-size:14px">${U.esc(t)}</div></div><div class="act"><button class="mini" title="AI 扩展" onclick="event.stopPropagation();Main.inspoAI(${i})"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8"/></svg></button><button class="mini" title="存为选题" onclick="event.stopPropagation();Main.inspoToTopic(${i})"><svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="section-title">🔥 实时热门话题</div>
        ${hot.map(h => `<div class="lin" style="display:flex;gap:10px;align-items:center;padding:9px 12px;background:var(--card2);border-radius:13px;margin-bottom:8px;cursor:pointer" onclick="Main.hotToTopic('${U.esc(h.topic)}')">
          <span class="pill pink">${U.esc(h.tag)}</span><span style="flex:1;font-weight:600">${U.esc(h.topic)}</span><span class="muted">${h.heat}万</span>
          <button class="mini" title="AI 一键扩写成脚本" onclick="event.stopPropagation();Main.hotToScript('${U.esc(h.topic)}')"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8"/></svg></button></div>`).join('')}
      </div>
    </div>
    <div class="grid cols-2" style="margin-top:18px">
      <div class="card">
        <div class="section-title">📡 全网热点信息雷达</div>
        ${radar.map(r => `<div class="item"><div class="body"><div class="tt" style="font-size:14px">${U.esc(r.kw)} <span class="pill teal">${r.trend}</span></div><div class="meta">来源 ${U.esc(r.src)} · ${U.esc(r.note)}</div></div></div>`).join('')}
        <div class="muted" style="font-size:11.5px;margin-top:8px">提示：热点数据需联网抓取，当前为本地示例库。云端接入后可自动拉取实时榜单。</div>
      </div>
      <div class="card">
        <div class="section-title">🎞️ 爆款二创参考库</div>
        ${refer.map(r => `<div class="item"><div class="body"><div class="tt" style="font-size:14px">${U.esc(r.title)} <span class="pill gray">${U.esc(r.type)}</span></div><div class="meta">${U.esc(r.desc)}</div></div></div>`).join('')}
      </div>
    </div>
    <div class="card" style="margin-top:18px">
      <div class="section-title">🎬 全类型短视频口播 / 剧情脚本库</div>
      <div class="grid cols-2" id="scriptLib">
        ${scripts.map(s => `<div class="item" style="cursor:pointer" onclick="Main.useScript('${U.esc(s.name)}')"><div class="body"><div class="tt" style="font-size:14px">${U.esc(s.name)} <span class="pill amber">${U.esc(s.cat)}</span></div><div class="meta">${U.esc(s.tpl)}</div></div></div>`).join('')}
      </div>
    </div>`;
  };
  Mount.center_inspo = function () {};

  // ================= 自定义模块页：自由拼接 文本/链接/清单 块 =================
  Views.center_custom = function () {
    return `<div class="row between" style="margin-bottom:14px">
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button class="btn sm" data-add="text">＋ 文本</button>
        <button class="btn sm" data-add="link">＋ 链接</button>
        <button class="btn sm" data-add="check">＋ 清单</button>
      </div>
      <span class="muted" style="font-size:12px">拖动左侧 ⠿ 可排序</span>
    </div>
    <div id="customBlocks"></div>`;
  };
  Mount.center_custom = async function (el) {
    let blocks = await DB.getSetting('customBlocks') || [];
    const box = el.querySelector('#customBlocks');
    const save = () => DB.setSetting('customBlocks', blocks);
    const newId = () => 'cb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    function blockHtml(b) {
      const grip = `<button class="drag-handle" title="拖动排序" aria-label="拖动排序"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6h2M13 6h2M9 12h2M13 12h2M9 18h2M13 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>`;
      const del = `<button class="mini del" data-act="del" title="删除"><svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
      if (b.type === 'text') {
        return `<div class="card cb" data-id="${b.id}" data-type="text">
          <div class="cb-head">${grip}<span class="cb-tag">文本</span>${del}</div>
          <textarea class="cb-text" data-act="text" placeholder="随手记点什么…编辑即自动保存">${U.esc(b.text || '')}</textarea>
        </div>`;
      }
      if (b.type === 'link') {
        return `<div class="card cb" data-id="${b.id}" data-type="link">
          <div class="cb-head">${grip}<span class="cb-tag">链接</span>${del}</div>
          <input class="cb-in" data-act="title" value="${U.esc(b.title || '')}" placeholder="标题">
          <input class="cb-in" data-act="url" value="${U.esc(b.url || '')}" placeholder="https://…">
          <a class="btn sm ghost" href="${U.esc(b.url || '#')}" target="_blank" rel="noopener" style="margin-top:8px;${b.url ? '' : 'display:none'}">打开链接 ↗</a>
        </div>`;
      }
      // checklist
      const items = (b.items || []).map((it, i) => `<label class="cb-item">
        <input type="checkbox" data-act="check" data-i="${i}" ${it.done ? 'checked' : ''}>
        <input class="cb-in item-text" data-act="itemtext" data-i="${i}" value="${U.esc(it.text || '')}" placeholder="清单项…">
        <button class="mini del" data-act="delitem" data-i="${i}" title="删除该项"><svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
      </label>`).join('');
      const done = (b.items || []).filter(i => i.done).length, total = (b.items || []).length;
      return `<div class="card cb" data-id="${b.id}" data-type="check">
        <div class="cb-head">${grip}<span class="cb-tag">清单</span>${del}</div>
        <input class="cb-in" data-act="title" value="${U.esc(b.title || '')}" placeholder="清单标题（可选）">
        <div class="cb-progress muted" style="font-size:12px">已完成 ${done}/${total}</div>
        <div class="cb-items">${items || '<div class=\"muted\" style=\"font-size:12px\">还没有清单项</div>'}</div>
        <button class="btn sm ghost" data-act="additem" style="margin-top:8px">＋ 添加一项</button>
      </div>`;
    }

    function render() {
      box.innerHTML = blocks.length ? blocks.map(blockHtml).join('') :
        `<div class="empty-state"><p>这个页面是空的</p><p class="muted">点上面的「文本 / 链接 / 清单」开始自由搭建你的专属模块</p></div>`;
      bind();
    }

    function bind() {
      box.querySelectorAll('.cb').forEach(card => {
        const id = card.dataset.id;
        const b = blocks.find(x => x.id === id);
        if (!b) return;
        const hd = card.querySelector('.cb-head');
        hd.querySelector('[data-act="del"]').onclick = () => { blocks = blocks.filter(x => x.id !== id); save().then(render); };
        if (b.type === 'text') {
          const ta = card.querySelector('[data-act="text"]');
          ta.oninput = () => { b.text = ta.value; save(); };
        }
        if (b.type === 'link') {
          card.querySelector('[data-act="title"]').oninput = e => { b.title = e.target.value; save(); };
          card.querySelector('[data-act="url"]').oninput = e => {
            b.url = e.target.value; save();
            const a = card.querySelector('a');
            if (a) { if (b.url) { a.href = b.url; a.style.display = ''; } else { a.style.display = 'none'; } }
          };
        }
        if (b.type === 'check') {
          card.querySelector('[data-act="title"]').oninput = e => { b.title = e.target.value; save(); };
          card.querySelectorAll('[data-act="check"]').forEach(cb => {
            cb.onchange = e => { b.items[+cb.dataset.i].done = cb.checked; save(); };
          });
          card.querySelectorAll('[data-act="itemtext"]').forEach(inp => {
            inp.oninput = e => { b.items[+inp.dataset.i].text = e.target.value; save(); };
          });
          card.querySelectorAll('[data-act="delitem"]').forEach(btn => {
            btn.onclick = () => { b.items.splice(+btn.dataset.i, 1); save().then(render); };
          });
          card.querySelector('[data-act="additem"]').onclick = () => { b.items.push({ text: '', done: false }); save().then(render); };
        }
      });
      U.makeSortable(box, '.drag-handle', ids => {
        blocks.sort((a, c) => ids.indexOf(a.id) - ids.indexOf(c.id));
        save();
      });
    }

    // 顶部添加按钮绑定（在 el 上，避免每次 render 重绑）
    el.querySelectorAll('[data-add]').forEach(btn => {
      btn.onclick = () => {
        const type = btn.dataset.add;
        const b = { id: newId(), type, text: '', title: '', url: '', items: type === 'check' ? [{ text: '', done: false }] : [] };
        blocks.push(b);
        save().then(render);
      };
    });

    render();
  };

  window._inspCache = Libs.inspo(U.today());
})();
