/* ============ 主控：路由 / 导航 / 初始化 ============ */
(function () {
  const M = window.M = {};
  const NAV = [
    { group: '创作中心', items: [
      { key: 'center_dashboard', label: '数据大盘', icon: '<path d="M4 13h7V4H4v9zM13 20h7V4h-7v16zM4 20h7v-5H4v5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>', tab: true },
      { key: 'center_accounts', label: '我的账号', icon: '<circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' },
      { key: 'center_works', label: '作品复盘', icon: '<path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 9h8M8 13h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' },
      { key: 'center_polish', label: '文案润色', icon: '<path d="M4 20l4-1 9-9-3-3-9 9-1 4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 6l3 3" stroke="currentColor" stroke-width="1.8"/>' },
      { key: 'center_topics', label: '抖音选题', icon: '<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' },
      { key: 'center_inspo', label: '灵感中枢', icon: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3 11c.6.5 1 1.3 1 2h4c0-.7.4-1.5 1-2a6 6 0 00-3-11z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>', tab: true },
      { key: 'center_custom', label: '自定义模块', icon: '<rect x="4" y="4" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="4" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="13" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.8"/>' },
      { key: 'media_schedule', label: '发布排期', icon: '<rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' },
      { key: 'media_titles', label: '标题灵感库', icon: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3 11c.6.5 1 1.3 1 2h4c0-.7.4-1.5 1-2a6 6 0 00-3-11z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' },
      { key: 'media_stats', label: '数据看板', icon: '<path d="M4 19V5M4 19h16M8 15l3-4 3 3 4-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' },
      { key: 'media_rivals', label: '对标监控', icon: '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' },
      { key: 'center_ai', label: 'AI 创作助手', icon: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8"/>' },
      { key: 'center_novel', label: '小说剧本', icon: '<path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 9h8M8 13h6M8 17h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' },
      { key: 'center_novel_search', label: '小说检索', icon: '<circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.8"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' },
      { key: 'bookmarks', label: '网址收藏', icon: '<path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' }
    ]},
    { group: 'AI 工坊', items: [
      { key: 'studio_materials', label: '素材库', icon: '<path d="M4 7l8-4 8 4-8 4-8-4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 12l8 4 8-4M4 17l8 4 8-4" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>', tab: true },
      { key: 'studio_tools', label: '创作工具', icon: '<path d="M14 7l3 3-8 8-3 1 1-3 7-8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>', tab: true }
    ]},
    { group: '系统', items: [
      { key: 'settings', label: '设置 · API 绑定', icon: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-1.7-1l-.3-2.4h-4l-.3 2.4a7 7 0 00-1.7 1l-2.3-1-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 001.7 1l.3 2.4h4l.3-2.4a7 7 0 001.7-1l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>' }
    ]}
  ];
  const TITLES = {
    center_dashboard: ['创作中心 · 数据大盘', '账号数据 · 作品复盘 · 选题灵感'],
    center_accounts: ['我的账号', '添加你的平台 · 记录每日数据'],
    center_works: ['作品复盘', '记录播放并写下优化复盘'],
    center_polish: ['文案润色', '多风格智能优化'],
    center_topics: ['抖音选题库', '全品类选题管理'],
    center_inspo: ['灵感中枢', '每日灵感 · 热点雷达 · 脚本库'],
    center_custom: ['自定义模块', '随手记 · 链接 · 清单 自由拼接'],
    media_schedule: ['发布排期日历', '按月排期 · 平台分色 · 待办追踪'],
    media_titles: ['标题 / 脚本灵感库', '灵感收集 · AI 扩写 · 一键复制'],
    media_stats: ['平台数据看板', '播放 / 涨粉趋势 · 手动录入'],
    media_rivals: ['对标账号监控', '粉丝快照 · 涨粉追踪 · 差距对比'],
    center_ai: ['AI 创作助手', '选题 · 脚本 · 口播 · 小说 智能生成'],
    center_novel: ['小说 · 剧本工坊', 'AI 生成 · 章节编辑 · TXT 导出'],
    center_novel_search: ['小说检索中心', '多平台检索 · 自建API接入'],
    bookmarks: ['网址收藏', '归类 · 收藏常用站点 · 一键直达'],
    studio_materials: ['素材云端库', '图片/视频/音频/文案'],
    studio_tools: ['AI 剪辑工坊', '封面 · 去水印 · 文字视频 · 音频'],
    settings: ['设置 · API 绑定', '云端同步 · 平台开放平台 OAuth']
  };

  let current = 'center_dashboard';

  async function buildNav() {
    const model = await getNavModel();
    const nav = document.getElementById('nav');
    nav.innerHTML = model.groups.map(g => {
      const items = g.items.filter(it => !it.hidden).map(it => {
        if (it.type === 'link') {
          return `<button class="nav-item" data-link="${U.esc(it.url)}"><svg viewBox="0 0 24 24" fill="none"><path d="M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${U.esc(it.label)}</span></button>`;
        }
        return `<button class="nav-item" data-go="${it.key}"><svg viewBox="0 0 24 24" fill="none">${it.icon}</svg><span>${U.esc(it.label)}</span></button>`;
      }).join('');
      return `<div class="nav-group"><div class="nav-label">${U.esc(g.label)}</div>${items}</div>`;
    }).join('');
    nav.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { M.go(b.dataset.go); closeDrawer(); });
    nav.querySelectorAll('[data-link]').forEach(b => b.onclick = () => { window.open(b.dataset.link, '_blank'); closeDrawer(); });

    const tb = document.getElementById('tabbar');
    const tabs = model.groups.flatMap(g => g.items).filter(i => i.tab && !i.hidden && i.type !== 'link');
    tb.innerHTML = tabs.map(it => `<button data-go="${it.key}"><svg viewBox="0 0 24 24" fill="none">${it.icon}</svg><span>${U.esc(it.label)}</span></button>`).join('');
    tb.querySelectorAll('[data-go]').forEach(b => b.onclick = () => M.go(b.dataset.go));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.go === current));
  }

  let _navModel = null;
  async function getNavModel() {
    if (_navModel) return _navModel;
    let m = await DB.getSetting('customNav');
    if (!m) {
      m = { groups: NAV.map(g => ({ id: 'g_' + g.group, label: g.group, items: g.items.map(it => ({ id: 'i_' + it.key, key: it.key, label: it.label, icon: it.icon, tab: !!it.tab, type: 'page', hidden: false })) })) };
      await DB.setSetting('customNav', m);
    } else {
      // 迁移：把 NAV 中新增的菜单项补进已保存的自定义导航（按 key 去重）
      let changed = false;
      NAV.forEach(g => {
        const target = m.groups.find(x => x.label === g.group) || m.groups[NAV.indexOf(g)] || null;
        g.items.forEach(it => {
          const exists = m.groups.some(grp => (grp.items || []).some(i => i.key === it.key));
          if (!exists && target) {
            target.items = target.items || [];
            target.items.push({ id: 'i_' + it.key, key: it.key, label: it.label, icon: it.icon, tab: !!it.tab, type: 'page', hidden: false });
            changed = true;
          }
        });
      });
      if (changed) await DB.setSetting('customNav', m);
    }
    _navModel = m;
    return m;
  }

  M.go = async function (key, arg) {
    current = key; M.cur = key;
    document.getElementById('pageTitle').textContent = (TITLES[key] || ['', ''])[0];
    document.getElementById('pageSub').textContent = (TITLES[key] || ['', ''])[1];
    const content = document.getElementById('content');
    content.innerHTML = '<div class="muted" style="padding:40px;text-align:center">加载中…</div>';
    try {
      const view = await Views[key]();
      content.innerHTML = view;
      content.classList.remove('fade'); void content.offsetWidth; content.classList.add('fade');
      const AI_KEYS = { center_dashboard: 1, center_accounts: 1, center_works: 1, center_topics: 1, center_polish: 1, center_inspo: 1, studio_materials: 1, studio_tools: 1, center_novel: 1, center_custom: 1, media_schedule: 1, media_titles: 1, media_stats: 1, media_rivals: 1 };
      if (AI_KEYS[key]) content.insertAdjacentHTML('afterbegin', '<div class="ai-bar" id="aiBar"><button class="ai-fab" onclick="Main.moduleAI(\'' + key + '\')">🤖 AI 助手</button><span class="ai-bar-tip">本模块常驻 AI 入口 · 可切换你绑定的模型 / 自定义 API</span></div>');
      if (Mount[key]) Mount[key](content, arg);
    } catch (e) {
      content.innerHTML = '<div class="empty-state"><p>页面渲染出错</p><p class="muted">' + U.esc(e.message) + '</p></div>';
    }
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.go === key));
    document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.go === key));
    window.scrollTo(0, 0);
  };

  function openDrawer() { document.getElementById('sidebar').classList.add('open'); document.getElementById('scrim').classList.add('show'); }
  function closeDrawer() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('scrim').classList.remove('show'); }

  // ---------- 导出 / 导入 ----------
  document.getElementById('exportBtn').onclick = () => U.exportAll();
  document.getElementById('importBtn').onclick = () => document.getElementById('fileInput').click();
  document.getElementById('fileInput').onchange = e => { if (e.target.files[0]) U.importAll(e.target.files[0]); e.target.value = ''; };
  document.getElementById('menuBtn').onclick = openDrawer;
  document.getElementById('scrim').onclick = closeDrawer;
  document.getElementById('settingsBtn').onclick = () => M.go('settings');
  document.getElementById('overlay').onclick = e => { if (e.target.id === 'overlay') U.closeSheet(); };
  document.getElementById('navManageBtn').onclick = () => Main.navManager();
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
  document.getElementById('installBtn').onclick = async () => {
    if (deferredPrompt) { try { await deferredPrompt.prompt(); await deferredPrompt.userChoice; } catch (e) {} deferredPrompt = null; }
    else U.toast('手机浏览器打开后，点右上「分享 / ⋯」→「添加到主屏幕」即可', true);
  };

  // ---------- 全站搜索：跨库检索 + 点击定位 ----------
  function typeNameLoc(t) { return { image: '图片', video: '视频', audio: '音频', text: '文案' }[t] || t; }
  function doSearch(q) {
    const panel = document.getElementById('gsPanel');
    q = (q || '').trim().toLowerCase();
    if (!q) { panel.style.display = 'none'; panel.innerHTML = ''; return; }
    Promise.all([DB.all('accounts'), DB.all('works'), DB.all('topics'), DB.all('materials'), DB.all('novels'), DB.all('scripts')]).then(([accounts, works, topics, materials, novels, scripts]) => {
      const res = [];
      accounts.forEach(a => { const hay = [a.platform, a.account, a.note, a.category].join(' ').toLowerCase(); if (hay.includes(q)) res.push({ type: '账号', key: 'center_accounts', id: a.id, title: a.platform + (a.account ? ' · ' + a.account : ''), sub: (a.fans || 0).toLocaleString() + ' 粉' }); });
      works.forEach(w => { const hay = [w.title, w.platform, w.category, w.note].join(' ').toLowerCase(); if (hay.includes(q)) res.push({ type: '作品', key: 'center_works', id: w.id, title: w.title, sub: (w.play || 0).toLocaleString() + ' 播放 · ' + (w.platform || '') }); });
      topics.forEach(t => { const hay = [t.title, t.cat, t.note].join(' ').toLowerCase(); if (hay.includes(q)) res.push({ type: '选题', key: 'center_topics', id: t.id, title: t.title, sub: (t.cat || '') + (t.status ? ' · ' + t.status : '') }); });
      materials.forEach(m => { const hay = [m.name, m.note, (m.tags || []).join(' ')].join(' ').toLowerCase(); if (hay.includes(q)) res.push({ type: '素材', key: 'studio_materials', id: m.id, title: m.name, sub: typeNameLoc(m.type) }); });
      novels.forEach(n => { const hay = [n.title, n.genre, n.outline, n.body].join(' ').toLowerCase(); if (hay.includes(q)) res.push({ type: '小说', key: 'center_novel', id: n.id, title: n.title, sub: (n.genre || '') }); });
      scripts.forEach(s => { const hay = [s.name, s.tpl].join(' ').toLowerCase(); if (hay.includes(q)) res.push({ type: '脚本', key: 'center_inspo', id: '', title: s.name, sub: (s.cat || '') }); });
      renderSearch(res);
    });
  }
  function renderSearch(res) {
    const panel = document.getElementById('gsPanel');
    if (!res.length) { panel.innerHTML = '<div class="gs-empty">没有匹配的内容，换个关键词试试</div>'; panel.style.display = ''; return; }
    const groups = {};
    res.forEach(r => { (groups[r.type] = groups[r.type] || []).push(r); });
    panel.innerHTML = Object.keys(groups).map(g => '<div class="gs-group">' + g + ' · ' + groups[g].length + '</div>' +
      groups[g].map(r => '<div class="gs-item" data-key="' + r.key + '" data-id="' + U.esc(r.id) + '"><span class="gs-typ">' + g + '</span><div class="gs-tt">' + U.esc(r.title) + '</div><span class="gs-sub">' + U.esc(r.sub || '') + '</span></div>').join('')).join('');
    panel.style.display = '';
    panel.querySelectorAll('.gs-item').forEach(it => it.onclick = () => {
      const key = it.dataset.key, id = it.dataset.id;
      document.getElementById('gsPanel').style.display = 'none';
      document.getElementById('globalSearch').value = '';
      jumpTo(key, id);
    });
  }
  async function jumpTo(key, id) {
    try { await M.go(key); } catch (e) {}
    if (!id) return;
    setTimeout(() => {
      const el = document.querySelector('[data-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1700); }
    }, 160);
  }
  document.getElementById('globalSearch').addEventListener('input', e => doSearch(e.target.value));
  document.addEventListener('click', e => {
    const wrap = document.querySelector('.gs-wrap');
    if (wrap && !wrap.contains(e.target)) { const p = document.getElementById('gsPanel'); if (p) p.style.display = 'none'; }
  });

  // ---------- 创作中心：增删改 ----------
  const Main = window.Main = {};
  function confirmSheet(msg, yes) {
    const sh = U.openSheet(`<h3>确认操作</h3><p style="font-size:14px;color:var(--text)">${U.esc(msg)}</p>
      <div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn danger" id="cfYes">确定删除</button></div>`);
    sh.querySelector('#cfYes').onclick = () => { U.closeSheet(); yes(); };
  }
  Main.delConfirm = confirmSheet;

  // ---------- 列表拖拽顺序持久化（存在 settings.order_<store>） ----------
  Main.getOrder = function (store) {
    return DB.getSetting('order_' + store).then(r => (r && Array.isArray(r)) ? r : []);
  };
  Main.saveOrder = function (store, ids) {
    return DB.setSetting('order_' + store, ids);
  };
  // 拖拽后保存：把当前可见 id 的新顺序前置，其余（被筛选隐藏的）保持原相对顺序，避免丢项
  Main.saveOrderMerged = function (store, visibleIds) {
    return Main.getOrder(store).then(old => {
      const set = new Set(visibleIds);
      const rest = (old || []).filter(id => !set.has(id));
      return DB.setSetting('order_' + store, visibleIds.concat(rest));
    });
  };
  // 按已存顺序重排数组；未记录的 id 保持原相对顺序排在后面
  Main.sortByOrder = function (arr, orderArr) {
    if (!orderArr || !orderArr.length) return arr;
    const pos = {}; orderArr.forEach((id, i) => { pos[id] = i; });
    return arr.map((x, i) => ({ x, o: (pos[x.id] != null ? pos[x.id] : 1e9 + i) }))
      .sort((a, b) => a.o - b.o).map(z => z.x);
  };

  Main.addWork = () => workSheet(null);
  Main.editWork = id => DB.get('works', id).then(w => workSheet(w));
  function workSheet(w) {
    w = w || { title: '', platform: '抖音', date: Date.now(), play: 0, like: 0, comment: 0, fav: 0, ctr: 0, category: '', note: '', reviewed: false, dueDate: '' };
    const sh = U.openSheet(`<h3>${w.id ? '✏️ 编辑作品' : '➕ 添加作品'}</h3>
      <div class="field"><label>作品标题</label><input type="text" id="wTitle" value="${U.esc(w.title)}" placeholder="例如：3个剪辑技巧"/></div>
      <div class="grid cols-2">
        <div class="field"><label>平台</label><input type="text" id="wPlat" value="${U.esc(w.platform)}"/></div>
        <div class="field"><label>发布日期</label><input type="date" id="wDate" value="${U.fmt(w.date, 'raw')}"/></div>
      </div>
      <div class="grid cols-3">
        <div class="field"><label>播放</label><input type="number" id="wPlay" value="${w.play || 0}"/></div>
        <div class="field"><label>点赞</label><input type="number" id="wLike" value="${w.like || 0}"/></div>
        <div class="field"><label>完播率%</label><input type="number" id="wCtr" value="${w.ctr || 0}"/></div>
      </div>
      <div class="field"><label>分类</label><input type="text" id="wCat" value="${U.esc(w.category)}" placeholder="剪辑教程"/></div>
      <div class="field"><label>复盘笔记（优化点 / 数据观察）</label><textarea id="wNote">${U.esc(w.note || '')}</textarea></div>
      <div class="field"><label>复盘截止日（用于「今天要处理」提醒）</label><input type="date" id="wDue" value="${w.dueDate ? U.fmt(w.dueDate, 'raw') : ''}"/></div>
      <label class="row" style="gap:8px"><input type="checkbox" id="wRev" ${w.reviewed ? 'checked' : ''} style="width:18px"/> <span style="font-weight:700">已复盘</span></label>
      <div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn primary" id="wSave">保存</button></div>`);
    sh.querySelector('#wSave').onclick = async () => {
      const obj = {
        id: w.id || U.uid('wk'), title: sh.querySelector('#wTitle').value.trim() || '未命名作品',
        platform: sh.querySelector('#wPlat').value, date: new Date(sh.querySelector('#wDate').value || Date.now()).getTime(),
        play: +sh.querySelector('#wPlay').value || 0, like: +sh.querySelector('#wLike').value || 0, ctr: +sh.querySelector('#wCtr').value || 0,
        category: sh.querySelector('#wCat').value, note: sh.querySelector('#wNote').value,
        reviewed: sh.querySelector('#wRev').checked, dueDate: sh.querySelector('#wDue').value ? new Date(sh.querySelector('#wDue').value).getTime() : ''
      };
      await DB.put('works', obj); U.closeSheet(); U.toast('已保存', true); M.go('center_works');
    };
  }
  Main.delWork = id => confirmSheet('确定删除这条作品记录？', async () => { await DB.del('works', id); U.toast('已删除'); M.go('center_works'); });

  Main.addTopic = () => topicSheet(null);
  Main.editTopic = id => DB.get('topics', id).then(t => topicSheet(t));
  function topicSheet(t) {
    t = t || { title: '', cat: '剪辑教程', heat: 80, status: '灵感', note: '', dueDate: '' };
    const st = ['灵感', '待写', '已发'];
    const sh = U.openSheet(`<h3>${t.id ? '✏️ 编辑选题' : '➕ 添加选题'}</h3>
      <div class="field"><label>选题标题</label><input type="text" id="tTitle" value="${U.esc(t.title)}"/></div>
      <div class="grid cols-2">
        <div class="field"><label>分类</label><input type="text" id="tCat" value="${U.esc(t.cat)}"/></div>
        <div class="field"><label>热度</label><input type="number" id="tHeat" value="${t.heat || 80}"/></div>
      </div>
      <div class="field"><label>状态</label><div class="chips" id="tStatus">
        ${st.map(s => `<span class="chip ${t.status === s ? 'on' : ''}" data-v="${s}">${s}</span>`).join('')}</div></div>
      <div class="field"><label>备注</label><input type="text" id="tNote" value="${U.esc(t.note || '')}"/></div>
      <div class="field"><label>计划完成日</label><input type="date" id="tDue" value="${t.dueDate ? U.fmt(t.dueDate, 'raw') : ''}"/></div>
      <div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn primary" id="tSave">保存</button></div>`);
    let status = t.status;
    sh.querySelectorAll('#tStatus .chip').forEach(c => c.onclick = () => { sh.querySelectorAll('#tStatus .chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); status = c.dataset.v; });
    sh.querySelector('#tSave').onclick = async () => {
      const obj = { id: t.id || U.uid('tp'), title: sh.querySelector('#tTitle').value.trim() || '未命名选题', cat: sh.querySelector('#tCat').value, heat: +sh.querySelector('#tHeat').value || 0, status, note: sh.querySelector('#tNote').value, dueDate: sh.querySelector('#tDue').value ? new Date(sh.querySelector('#tDue').value).getTime() : '' };
      await DB.put('topics', obj); U.closeSheet(); U.toast('已保存', true); M.go('center_topics');
    };
  }
  Main.delTopic = id => confirmSheet('确定删除这个选题？', async () => { await DB.del('topics', id); U.toast('已删除'); M.go('center_topics'); });

  // ---------- 账号管理 ----------
  const PCOLORS = ['#7c5cff', '#ff8fb1', '#3fd0bf', '#ffb454', '#34c98a', '#5b8def'];
  Main.addAccount = () => accountSheet(null);
  Main.editAccount = id => DB.get('accounts', id).then(a => accountSheet(a));
  function accountSheet(a) {
    a = a || { platform: '', account: '', fans: 0, color: PCOLORS[0], goal: { play: 50000 }, daily: [] };
    const sh = U.openSheet(`<h3>${a.id ? '✏️ 编辑账号' : '➕ 添加我的账号'}</h3>
      <div class="field"><label>平台名称</label><input type="text" id="aPlat" value="${U.esc(a.platform)}" placeholder="抖音 / 视频号 / 小红书 / B站 …"/></div>
      <div class="field"><label>账号名（可选）</label><input type="text" id="aName" value="${U.esc(a.account || '')}" placeholder="如：你的昵称"/></div>
      <div class="field"><label>类目（可选，用于分类筛选）</label><input type="text" id="aCat" value="${U.esc(a.category || '')}" placeholder="如：剪辑教学 / 生活日常 / 带货"/></div>
      <div class="field"><label>当前粉丝数</label><input type="number" id="aFans" value="${a.fans || 0}"/></div>
      <div class="field"><label>本月播放目标</label><input type="number" id="aGoal" value="${(a.goal && a.goal.play) || 50000}"/></div>
      <div class="field"><label>标识色</label><div class="swatches" id="aColor">
        ${PCOLORS.map(c => `<div class="swatch ${c === a.color ? 'on' : ''}" data-v="${c}" style="background:${c}"></div>`).join('')}</div></div>
      <div class="muted" style="font-size:11.5px">说明：纯前端无法直连平台 API，请手动填入你的真实粉丝与每日数据（或导出/导入批量录入）。有后端后可在「设置」配置同步接口自动拉取。</div>
      <div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn primary" id="aSave">保存</button></div>`);
    let color = a.color;
    sh.querySelectorAll('#aColor .swatch').forEach(s => s.onclick = () => { sh.querySelectorAll('#aColor .swatch').forEach(x => x.classList.remove('on')); s.classList.add('on'); color = s.dataset.v; });
    sh.querySelector('#aSave').onclick = async () => {
      const obj = {
        id: a.id || U.uid('ac'), platform: sh.querySelector('#aPlat').value.trim() || '未命名平台',
        account: sh.querySelector('#aName').value, category: sh.querySelector('#aCat').value, fans: +sh.querySelector('#aFans').value || 0, color,
        goal: { play: +sh.querySelector('#aGoal').value || 0 }, daily: a.daily || []
      };
      await DB.put('accounts', obj); U.closeSheet(); U.toast('已保存', true); M.go('center_accounts');
    };
  }
  Main.delAccount = id => confirmSheet('删除该账号及其全部每日数据？', async () => { await DB.del('accounts', id); U.toast('已删除'); M.go('center_accounts'); });

  // 用「设置」里绑定的平台 API 拉取真实数据
  Main.pullAccount = async id => {
    const acc = await DB.get('accounts', id); if (!acc) return;
    const all = await DB.all('settings');
    const bind = all.map(s => s.value).filter(b => b.type !== 'llm').find(b => b.platform === acc.platform);
    if (!bind || !bind.apiBase) { U.toast('请先在「设置」绑定 ' + acc.platform + ' 的 API'); M.go('settings'); return; }
    U.toast('正在从 ' + acc.platform + ' 拉取真实数据…');
    try {
      const url = bind.apiBase.replace(/\/+$/, '') + '/account';
      const headers = { 'Content-Type': 'application/json' };
      if (bind.accessToken) headers['Authorization'] = 'Bearer ' + bind.accessToken;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const fans = +data.fans || acc.fans;
      const play = +data.play || 0;
      acc.daily = acc.daily || [];
      const now = U.startOfDay(Date.now());
      const ex = acc.daily.find(x => U.startOfDay(x.date) === now);
      if (ex) { ex.fans = fans; if (play) ex.play = play; }
      else acc.daily.push({ date: Date.now(), play, like: 0, fans });
      acc.fans = fans;
      await DB.put('accounts', acc);
      U.toast('已更新 ' + acc.platform + ' 数据 ✓', true);
      M.go('center_accounts');
    } catch (e) {
      U.toast('拉取失败：' + (e.message || '网络/CORS 错误') + '（需你的后端代理开放 /account 接口）');
    }
  };

  // 切换「当前账号」：聚焦某个账号看大盘；传空则显示全部
  Main.setActiveAccount = async id => {
    await DB.setSetting('activeAccount', id || '');
    U.toast(id ? '已切换当前账号 ✓' : '已显示全部账号', true);
    M.go(M.cur || 'center_accounts');
  };

  Main.addDaily = id => dailySheet(id, null);
  function dailySheet(accId, rec) {
    rec = rec || { date: Date.now(), play: 0, like: 0, fans: 0 };
    const sh = U.openSheet(`<h3>${rec.id ? '✏️ 编辑每日数据' : '📅 记录每日数据'}</h3>
      <div class="field"><label>日期</label><input type="date" id="dDate" value="${U.fmt(rec.date, 'raw')}"/></div>
      <div class="grid cols-3">
        <div class="field"><label>当日播放</label><input type="number" id="dPlay" value="${rec.play || 0}"/></div>
        <div class="field"><label>当日点赞</label><input type="number" id="dLike" value="${rec.like || 0}"/></div>
        <div class="field"><label>当日粉丝</label><input type="number" id="dFans" value="${rec.fans || 0}"/></div>
      </div>
      <div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn primary" id="dSave">保存</button></div>`);
    sh.querySelector('#dSave').onclick = async () => {
      const acc = await DB.get('accounts', accId); if (!acc) return;
      const dt = new Date(sh.querySelector('#dDate').value || Date.now()).getTime();
      const play = +sh.querySelector('#dPlay').value || 0, like = +sh.querySelector('#dLike').value || 0, fans = +sh.querySelector('#dFans').value || 0;
      acc.daily = acc.daily || [];
      const ex = acc.daily.find(x => U.startOfDay(x.date) === U.startOfDay(dt));
      if (ex) { ex.play = play; ex.like = like; ex.fans = fans; }
      else acc.daily.push({ date: dt, play, like, fans });
      acc.fans = fans || acc.fans;
      await DB.put('accounts', acc); U.closeSheet(); U.toast('已记录', true); M.go('center_accounts');
    };
  }
  Main.delDaily = (accId, idx) => confirmSheet('删除这条每日记录？', async () => {
    const acc = await DB.get('accounts', accId); if (!acc) return;
    acc.daily.splice(idx, 1); await DB.put('accounts', acc); U.toast('已删除'); M.go('center_accounts');
  });
  Main.clearDemo = () => confirmSheet('清空全部示例账号/作品/选题（不影响你自己添加的）？', async () => {
    for (const s of ['accounts', 'works', 'topics']) {
      const all = await DB.all(s);
      for (const it of all) if (it.demo) await DB.del(s, it.id);
    }
    U.toast('示例数据已清空', true); M.go('center_accounts');
  });

  Main.inspoToTopic = async i => {
    const t = (window._inspCache || [])[i]; if (!t) return;
    await DB.put('topics', { id: U.uid('tp'), title: t.slice(0, 20), cat: '灵感', heat: 70, status: '灵感', note: t, dueDate: '' });
    U.toast('已存为选题', true); M.go('center_topics');
  };
  Main.hotToTopic = async topic => {
    await DB.put('topics', { id: U.uid('tp'), title: topic, cat: '热点', heat: 85, status: '待写', note: '来自热门话题', dueDate: '' });
    U.toast('已加入选题库', true); M.go('center_topics');
  };
  Main.hotToScript = async function (topic) {
    topic = (topic || '').trim(); if (!topic) return;
    const sh = U.openSheet('<h3>🪄 AI 扩写脚本</h3>' +
      '<div class="muted" style="font-size:13px;margin-bottom:12px">热点：<b>' + U.esc(topic) + '</b></div>' +
      '<div class="field"><label>脚本类型</label><div class="seg" id="hsType">' +
        '<button data-v="口播" class="on">口播</button><button data-v="剧情">剧情</button><button data-v="种草">种草</button></div></div>' +
      '<div class="field"><label>使用模型</label><select id="hsModel"></select>' +
        '<div id="hsHint" class="muted" style="font-size:11.5px;margin-top:4px"></div></div>' +
      '<button class="btn primary block" id="hsRun">🪄 一键生成脚本</button>' +
      '<textarea id="hsOut" readonly placeholder="生成结果将出现在这里…" style="margin-top:14px;min-height:170px;background:#fbfaff"></textarea>' +
      '<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm ghost" id="hsCopy">复制</button><button class="btn sm teal" id="hsSave">存为脚本</button></div>' +
      '<div class="muted" style="font-size:11.5px;margin-top:8px">提示词已针对短视频优化；选「本地规则引擎」断网也能生成骨架，选你绑定的大模型则产出更自然脚本。</div>');
    let type = '口播';
    sh.querySelectorAll('#hsType button').forEach(b => b.onclick = () => {
      sh.querySelectorAll('#hsType button').forEach(x => x.classList.remove('on')); b.classList.add('on'); type = b.dataset.v;
    });
    const sel = sh.querySelector('#hsModel');
    U.fillModelSelect(sel, 'hotScript', (v, b) => {
      sh.querySelector('#hsHint').textContent = v === 'local' ? '当前：本地规则引擎（断网可用）' : '当前：调用 ' + b.platform + '（' + (b.model || '默认模型') + '）';
    });
    sh.querySelector('#hsRun').onclick = async () => {
      const btn = sh.querySelector('#hsRun'), out = sh.querySelector('#hsOut');
      btn.disabled = true; const old = btn.textContent; btn.textContent = '生成中…';
      try {
        if (sel.value === 'local') {
          out.value = localScript(topic, type);
        } else {
          const b = (await window.llmBinds()).find(x => x.id === sel.value);
          if (!b || !b.apiKey) { out.value = localScript(topic, type); U.toast('未配置 Key，已用本地', true); }
          else {
            const sys = {
              '口播': '你是短视频口播脚本专家。围绕给定热点，写一篇口播短视频脚本：强开场钩子（反常识/悬念），正文口语化分点讲清价值，结尾加互动引导（点赞收藏关注）。包含必要的[画面]提示。只输出脚本正文，不要解释。',
              '剧情': '你是短视频剧情脚本作者。围绕给定热点，写一篇有反转/冲突的剧情短视频脚本：强开头钩子，制造共鸣或反转，结尾留悬念引导互动。包含[画面]与[台词]提示。只输出脚本正文。',
              '种草': '你是短视频种草文案写手。围绕给定热点，写一篇种草型脚本：痛点引入+方法/产品展示+效果+行动号召。语气真实接地气。包含[画面]提示。只输出脚本正文。'
            }[type];
            out.value = await AI.chat(b, sys, '热点话题：' + topic);
          }
        }
      } catch (e) {
        out.value = '生成失败：' + (e.message || e) + '（可切回「本地规则引擎」重试）';
      } finally { btn.disabled = false; btn.textContent = old; }
    };
    sh.querySelector('#hsCopy').onclick = () => { navigator.clipboard.writeText(sh.querySelector('#hsOut').value); U.toast('已复制', true); };
    sh.querySelector('#hsSave').onclick = async () => {
      const o = sh.querySelector('#hsOut').value; if (!o.trim()) return U.toast('请先生成脚本');
      await DB.put('scripts', { id: U.uid('sc'), name: topic.slice(0, 16) + ' · ' + type, cat: type, tpl: o, created: Date.now() });
      U.toast('已存为脚本', true);
    };
  };
  function localScript(topic, type) {
    const open = '别划走！今天聊一个刚爆上热搜的话题——「' + topic + '」。';
    const body = {
      '口播': '很多人对这个事其实有误解，今天用 1 分钟给你讲清楚：第一，它到底是怎么回事；第二，和我们普通人有什么关系；第三，你下一步可以怎么做。信息差就是机会，越早看懂越受益。',
      '剧情': '我朋友昨天就亲身经历了这件事，一开始他也没当回事，结果……（转折）直到事情闹大才反应过来。你看，很多时候坑就藏在细节里。',
      '种草': '如果你也常被这个问题困扰，这个方法真的可以试试：先……再……最后……亲测有效，关键是坚持。'
    }[type] || '围绕这个热点，给你几个值得深挖的角度，结合你的账号定位选一个展开。';
    const end = '觉得有用点个赞，关注我，下期带你拆解更多热点背后的创作机会。';
    return open + '\n\n' + body + '\n\n' + end;
  }
  // ---------- 通用 AI 助手：每个模块都可调用，支持切换常用 API ----------
  Main.aiChat = async function (opts) {
    opts = opts || {};
    const key = opts.key || 'aiChat';
    const sh = U.openSheet(
      `<h3>${opts.title || '🤖 AI 助手'}</h3>` +
      `<div class="muted" style="font-size:13px;margin-bottom:12px">${U.esc(opts.hint || '可切换你绑定的常用模型（豆包 / DeepSeek / Kimi 等）')}</div>` +
      `<div class="field"><label>使用模型</label><select id="acModel"></select>` +
        `<div id="acHint" class="muted" style="font-size:11.5px;margin-top:4px"></div></div>` +
      `<div class="field"><label>${U.esc(opts.inLabel || '你的需求 / 内容')}</label>` +
        `<textarea id="acIn" placeholder="${U.esc(opts.placeholder || '描述你想要的…')}">${U.esc(opts.defPrompt || '')}</textarea></div>` +
      `<button class="btn primary block" id="acRun">🤖 生成</button>` +
      `<textarea id="acOut" readonly placeholder="生成结果将出现在这里…" style="margin-top:14px;min-height:180px;background:#fbfaff"></textarea>` +
      `<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm ghost" id="acCopy">复制</button>` +
        (opts.save ? `<button class="btn sm teal" id="acSave">${U.esc(opts.saveLabel || '保存')}</button>` : '') + `</div>` +
      `<div class="muted" style="font-size:11.5px;margin-top:8px">选「本地规则引擎」断网也能给基础建议；选你绑定的大模型则更智能。未配置 Key 会自动回退本地。</div>`
    );
    const sel = sh.querySelector('#acModel');
    U.fillModelSelect(sel, key, (v, b) => {
      sh.querySelector('#acHint').textContent = v === 'local' ? '当前：本地规则引擎（断网可用）' : '当前：调用 ' + b.platform + '（' + (b.model || '默认模型') + '）';
    });
    sh.querySelector('#acRun').onclick = async () => {
      const btn = sh.querySelector('#acRun'), out = sh.querySelector('#acOut');
      const q = sh.querySelector('#acIn').value.trim();
      if (!q) return U.toast('请先填写需求或内容');
      btn.disabled = true; const old = btn.textContent; btn.textContent = '生成中…';
      try {
        if (sel.value === 'local') {
          out.value = (opts.localFallback ? opts.localFallback(q) : '（本地模式）\n' + q + '\n\n— 建议在「设置」绑定大模型以获得更专业建议。');
        } else {
          const b = (await window.llmBinds()).find(x => x.id === sel.value);
          if (!b || !b.apiKey) { out.value = (opts.localFallback ? opts.localFallback(q) : q); U.toast('未配置 Key，已用本地', true); }
          else out.value = await AI.chat(b, opts.sys || '你是自媒体创作助手，帮助用户产出优质内容。', q);
        }
      } catch (e) {
        out.value = '生成失败：' + (e.message || e) + '（可切回「本地规则引擎」重试）';
      } finally { btn.disabled = false; btn.textContent = old; }
    };
    sh.querySelector('#acCopy').onclick = () => { navigator.clipboard.writeText(sh.querySelector('#acOut').value); U.toast('已复制', true); };
    if (opts.save) sh.querySelector('#acSave').onclick = async () => {
      const o = sh.querySelector('#acOut').value; if (!o.trim()) return U.toast('请先生成内容');
      await opts.save(o); U.toast('已保存', true);
    };
  };

  // 数据大盘：AI 诊断
  Main.dashAI = async function () {
    const accounts = await DB.all('accounts');
    const works = await DB.all('works');
    const top = works.slice().sort((a, b) => b.play - a.play).slice(0, 3).map(w => w.title + '(' + w.play + '播放)').join('、');
    const ctx = '账号数：' + accounts.length + '，作品数：' + works.length + '，播放最高作品：' + (top || '无');
    Main.aiChat({
      key: 'dashAI', title: '📊 AI 数据诊断', hint: '基于你的账号与作品数据给出优化建议',
      inLabel: '补充背景（可选）', placeholder: '例如：最近流量下滑，想提升完播率',
      defPrompt: '我的创作数据概览：' + ctx + '\n请帮我分析现状并给出 3 条可落地的优化建议。',
      sys: '你是短视频数据分析师。根据创作者的账号与作品数据，指出问题、给出可落地的优化建议。语言简洁、可操作。'
    });
  };

  // 我的账号：AI 涨粉建议（按账号）
  Main.accAI = async function (id) {
    const a = await DB.get('accounts', id); if (!a) return;
    const recent = (a.daily || []).slice(-3).map(d => Math.round(d.play) + '播放/' + d.fans + '粉').join('，');
    Main.aiChat({
      key: 'accAI', title: '🤖 AI 涨粉建议', hint: '针对「' + a.platform + '」账号给出内容方向',
      defPrompt: '平台：' + a.platform + '，当前粉丝：' + a.fans + '，近期数据：' + (recent || '无') + '\n请给我 3 个适合该账号的涨粉内容方向，并说明为什么。',
      sys: '你是账号增长顾问。根据平台与账号数据，给出具体、可执行的内容方向与选题建议。',
      saveLabel: '存为账号备注', save: async (text) => {
        const acc = await DB.get('accounts', id); acc.note = (acc.note || '') + '\n[AI建议] ' + text; await DB.put('accounts', acc);
      }
    });
  };

  // 作品复盘：AI 诊断（按作品）
  Main.workAI = async function (id) {
    const w = await DB.get('works', id); if (!w) return;
    Main.aiChat({
      key: 'workAI', title: '🤖 AI 复盘诊断', hint: '针对作品「' + w.title + '」给出复盘优化',
      defPrompt: '作品：' + w.title + '，平台：' + w.platform + '，播放：' + w.play + '，点赞：' + w.like + '，完播率：' + w.ctr + '%\n请从数据角度分析表现，并指出可优化点。',
      sys: '你是短视频复盘专家。分析作品数据，指出亮点和问题，给出具体优化建议。',
      saveLabel: '追加到复盘笔记', save: async (text) => {
        w.note = (w.note || '') + '\n[AI诊断] ' + text; await DB.put('works', w);
      }
    });
  };

  // 灵感中枢：AI 扩展单条灵感
  Main.inspoAI = async function (i) {
    const t = (window._inspCache || [])[i]; if (!t) return;
    Main.aiChat({
      key: 'inspoAI', title: '💡 AI 灵感扩展', hint: '把一个灵感扩写成可拍的选题',
      defPrompt: '灵感：' + t + '\n请把它扩写成一个具体的短视频选题：给出标题、核心钩子、3 个内容角度和适合的平台。',
      sys: '你是短视频创意策划。把一个简短灵感扩写成具体、可执行的选题方案。',
      saveLabel: '存为选题', save: async (text) => {
        await DB.put('topics', { id: U.uid('tp'), title: t.slice(0, 20), cat: '灵感', heat: 70, status: '灵感', note: text, dueDate: '' });
      }
    });
  };

  // 素材库：AI 标签与文案（按素材）
  Main.matAI = async function (id) {
    const m = await DB.get('materials', id); if (!m) return;
    Main.aiChat({
      key: 'matAI', title: '🤖 AI 素材建议', hint: '为素材「' + (m.name || '未命名') + '」生成标签与文案',
      defPrompt: '素材名称：' + (m.name || '未命名') + '，类型：' + (m.type || '') + '\n请为它生成 5 个分类标签，以及一句可用于视频描述的文案。',
      sys: '你是内容素材管理助手。为给定素材生成分类标签与简短描述文案。',
      saveLabel: '写进素材备注', save: async (text) => {
        const mm = await DB.get('materials', id); mm.note = (mm.note || '') + '\n[AI] ' + text; await DB.put('materials', mm);
      }
    });
  };

  // 创作工具：通用 AI 文案/脚本
  Main.toolAI = async function () {
    Main.aiChat({
      key: 'toolAI', title: '🤖 AI 文案 / 脚本', hint: '生成短视频文案或脚本，用于封面 / 去水印 / 文字视频等场景',
      defPrompt: '请帮我写一条 30 秒短视频口播文案，主题：', placeholder: '主题，如：周末探店',
      sys: '你是短视频文案写手，输出可直接使用的文案或脚本。'
    });
  };

  // 小说检索：AI 选书建议
  Main.novelSearchAI = async function () {
    Main.aiChat({
      key: 'novelSearchAI', title: '🤖 AI 选书建议', hint: '描述你想看的小说类型，获取推荐与检索思路',
      defPrompt: '我想找一类小说：', placeholder: '如：都市爽文 + 系统 + 轻松搞笑',
      sys: '你是网文推荐助手，根据用户偏好推荐小说类型与具体题材方向，并给出检索关键词。'
    });
  };

  // 选题：AI 生成选题（无需指定条目）
  Main.topicAI = async function () {
    Main.aiChat({
      key: 'topicAI', title: '💡 AI 选题生成', hint: '输入一个方向，生成可拍的短视频选题',
      defPrompt: '请基于「」方向，生成 5 个适合短视频平台的选题，每个包含：标题、核心钩子、目标人群、适合平台。',
      placeholder: '如：职场新人 / 减脂餐 / 宠物日常',
      sys: '你是短视频选题策划。根据用户给的方向，产出具体、有传播力的选题，避免空泛。'
    });
  };

  // 通用：从某库挑选一条，再用 AI 针对它分析（用于模块级常驻入口）
  Main.pickItem = function (store, title, textFn, onPick) {
    DB.all(store).then(items => {
      const html = '<h3>' + title + '</h3><div class="pick-list">' +
        (items.length ? items.map(it => '<div class="pick-item" data-id="' + it.id + '">' + U.esc(textFn(it)) + '</div>').join('') : '<div class="muted" style="padding:10px">暂无数据，请先添加条目</div>') +
        '</div><div class="muted" style="font-size:12px;margin-top:8px">选择一条，用 AI 针对它分析</div>';
      const sh = U.openSheet(html);
      sh.querySelectorAll('.pick-item').forEach(el => el.onclick = () => {
        U.closeSheet();
        const it = items.find(x => x.id === el.dataset.id);
        it && onPick(it);
      });
    });
  };

  // 模块级常驻 AI 入口分发
  Main.moduleAI = async function (key) {
    switch (key) {
      case 'center_dashboard': return Main.dashAI();
      case 'center_accounts': return Main.pickItem('accounts', '🤖 选择账号做 AI 诊断', a => (a.platform || '') + ' · ' + (a.account || ''), a => Main.accAI(a.id));
      case 'center_works': return Main.pickItem('works', '🤖 选择作品做 AI 复盘', w => w.title || '未命名', w => Main.workAI(w.id));
      case 'center_topics': return Main.topicAI();
      case 'center_polish': return Main.toolAI();
      case 'center_inspo': return Main.inspoAI(0);
      case 'studio_materials': return Main.pickItem('materials', '🤖 选择素材让 AI 打标', m => (m.name || '未命名'), m => Main.matAI(m.id));
      case 'studio_tools': return Main.toolAI();
      case 'center_novel': return Main.novelSearchAI();
      case 'center_custom': return Main.toolAI();
      case 'bookmarks': return Main.bookmarkAI();
      default: return Main.toolAI();
    }
  };

  Main.bookmarkAI = async function () {
    const list = (await DB.all('bookmarks')).filter(b => b.title || b.url);
    const txt = list.length ? list.map(b => '• ' + (b.title || b.url) + (b.cat ? '（' + b.cat + '）' : '')).join('\n') : '（暂无收藏）';
    Main.aiChat({
      title: '🤖 网址收藏助手',
      sys: '你是自媒体创作者的网址收藏整理助手。可以帮用户把一堆网址归纳分类、去重、给出访问建议，或根据需求推荐该收藏哪些站点（如选题库、素材站、数据平台、剪辑工具）。',
      prefill: '这是我的网址收藏列表：\n' + txt + '\n\n请帮我：1) 归纳出清晰的分类；2) 指出重复或可合并的项；3) 补充这类创作者还该收藏的关键站点。'
    });
  };

  // ---------- 工坊工具（数据驱动：可改名 / 拖拽 / 增删） ----------
  const DEFAULT_TOOLS = [
    { id: 'cover', icon: '🖼️', name: '智能封面制作', desc: '视频抽帧 / 上传图 + 文字排版，一键导出竖版/横版 PNG', fn: 'Tools.cover()', builtin: true },
    { id: 'wm', icon: '🧽', name: '图片去水印', desc: 'Canvas 涂抹定位水印，邻域取样修复导出原图', fn: 'Tools.watermark()', builtin: true },
    { id: 'tv', icon: '🎞️', name: '文字生成视频', desc: '文案分句卡片 → 录制导出 WebM 短视频', fn: 'Tools.textVideo()', builtin: true },
    { id: 'au', icon: '🎵', name: '视频音频分离', desc: '从视频解码音轨并导出音频文件', fn: 'Tools.extractAudio()', builtin: true }
  ];
  Main.getTools = async function () {
    let t = await DB.getSetting('tools');
    if (!t) { t = DEFAULT_TOOLS.slice(); await DB.setSetting('tools', t); }
    return t;
  };
  Main.saveTools = arr => DB.setSetting('tools', arr);
  Main.addTool = async function () {
    const sh = U.openSheet(`<h3>＋ 添加工具 / 快捷项</h3>
      <div class="field"><label>类型</label><select id="ttype"><option value="link">外部链接（打开网页 / 工具站）</option><option value="builtin">内置功能（复用已有工具）</option></select></div>
      <div class="field"><label>名称</label><input id="tname" placeholder="如：剪映网页版"/></div>
      <div class="field"><label>说明（可选）</label><input id="tdesc" placeholder="一句话描述"/></div>
      <div class="field" id="fUrl"><label>链接地址</label><input id="turl" placeholder="https://..."/></div>
      <div class="field" id="fFn" style="display:none"><label>内置功能</label><select id="tfn">${DEFAULT_TOOLS.map(t => '<option value="' + t.fn + '">' + U.esc(t.name) + '</option>').join('')}</select></div>
      <div class="field"><label>图标 emoji（可选）</label><input id="ticon" placeholder="🚀" maxlength="4"/></div>
      <button class="btn primary block" id="tAdd">添加</button>`);
    sh.querySelector('#ttype').onchange = e => {
      sh.querySelector('#fUrl').style.display = e.target.value === 'link' ? '' : 'none';
      sh.querySelector('#fFn').style.display = e.target.value === 'builtin' ? '' : 'none';
    };
    sh.querySelector('#tAdd').onclick = async () => {
      const type = sh.querySelector('#ttype').value;
      const name = sh.querySelector('#tname').value.trim(); if (!name) return U.toast('请填名称');
      const tools = await Main.getTools();
      const t = { id: 'tool_' + Date.now(), icon: sh.querySelector('#ticon').value.trim() || '🧩', name, desc: sh.querySelector('#tdesc').value.trim(), builtin: false };
      if (type === 'link') t.url = sh.querySelector('#turl').value.trim(); else t.fn = sh.querySelector('#tfn').value;
      tools.push(t); await Main.saveTools(tools); U.closeSheet(); M.go('studio_tools');
    };
  };
  Main.renameTool = async function (id) {
    const tools = await Main.getTools(); const t = tools.find(x => x.id === id); if (!t) return;
    const sh = U.openSheet(`<h3>✎ 编辑工具</h3>
      <div class="field"><label>名称</label><input id="tname" value="${U.esc(t.name)}"/></div>
      <div class="field"><label>说明</label><input id="tdesc" value="${U.esc(t.desc || '')}"/></div>
      <div class="field"><label>图标 emoji</label><input id="ticon" value="${U.esc(t.icon || '🧩')}" maxlength="4"/></div>
      <button class="btn primary block" id="tSave">保存</button>`);
    sh.querySelector('#tSave').onclick = async () => {
      t.name = sh.querySelector('#tname').value.trim() || t.name;
      t.desc = sh.querySelector('#tdesc').value.trim();
      t.icon = sh.querySelector('#ticon').value.trim() || t.icon;
      await Main.saveTools(tools); U.closeSheet(); M.go('studio_tools');
    };
  };
  Main.delTool = async function (id) {
    if (!confirm('确定删除该工具项？')) return;
    const tools = await Main.getTools();
    await Main.saveTools(tools.filter(x => x.id !== id)); M.go('studio_tools');
  };
  Main.resetTools = async function () {
    if (!confirm('恢复为默认 4 个内置工具？你的自定义项将被清空。')) return;
    await Main.saveTools(DEFAULT_TOOLS.slice()); M.go('studio_tools');
  };

  /* ============ 全站通用：收藏 + 列表搜索 ============ */
  U.favStar = function (store, id, on) {
    return `<button class="mini fav ${on ? 'on' : ''}" data-fav="${id}" data-fav-store="${store}" title="${on ? '取消收藏' : '加入收藏'}" aria-label="收藏"><svg viewBox="0 0 24 24" fill="${on ? 'currentColor' : 'none'}"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button>`;
  };
  U.searchBar = function (store, ph) {
    return `<div class="ls-bar" data-favbox="1" data-fav-store="${store}">
      <input class="ls-in" data-lsearch type="search" placeholder="${ph || '搜索…'}">
      <button class="chip" data-favonly type="button" title="只看收藏">★ 收藏</button>
    </div>`;
  };
  Main.matchQ = function (q) {
    if (!q) return true;
    for (let i = 1; i < arguments.length; i++) {
      const v = arguments[i];
      if (v != null && String(v).toLowerCase().indexOf(q) >= 0) return true;
    }
    return false;
  };
  Main.bindListSearch = function (el, render) {
    const inp = el.querySelector('[data-lsearch]');
    const chip = el.querySelector('[data-favonly]');
    const box = el.querySelector('[data-favbox]');
    if (inp) inp.oninput = render;
    if (chip) chip.onclick = () => {
      chip.classList.toggle('on');
      if (box) box.dataset.favonly = chip.classList.contains('on') ? '1' : '0';
      render();
    };
    if (box) box.addEventListener('favchange', render);
    return {
      q: () => (inp ? (inp.value || '').trim().toLowerCase() : ''),
      favOnly: () => !!(chip && chip.classList.contains('on'))
    };
  };
  Main.toggleFav = async function (store, id) {
    const it = await DB.get(store, id);
    if (!it) return;
    it.fav = !it.fav;
    await DB.put(store, it);
    U.toast(it.fav ? '已加入收藏 ★' : '已取消收藏', it.fav);
    document.querySelectorAll('[data-fav="' + id + '"]').forEach(b => {
      b.classList.toggle('on', !!it.fav);
      b.title = it.fav ? '取消收藏' : '加入收藏';
      const p = b.querySelector('svg path');
      if (p) p.parentNode.setAttribute('fill', it.fav ? 'currentColor' : 'none');
    });
    document.querySelectorAll('[data-favbox]').forEach(box => {
      if (box.dataset.favonly === '1') box.dispatchEvent(new CustomEvent('favchange'));
    });
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    Main.toggleFav(b.dataset.favStore, b.dataset.fav);
  }, true);

  // 通用改名：store 数据表；id 条目；field 名称字段（title/name）
  Main.renameItem = async function (store, id, field) {
    const obj = await DB.get(store, id);
    if (!obj) return U.toast('条目不存在');
    const cur = obj[field] || '';
    const sh = U.openSheet(`<h3>✏️ 重命名</h3>
      <div class="field"><label>新名称</label><input type="text" id="rnInput" value="${U.esc(cur)}" placeholder="输入名称"/></div>
      <div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn primary" id="rnOk">保存</button></div>`);
    setTimeout(() => { const i = sh.querySelector('#rnInput'); i && i.focus(); }, 30);
    sh.querySelector('#rnOk').onclick = async () => {
      const v = sh.querySelector('#rnInput').value.trim();
      if (!v) return U.toast('名称不能为空');
      obj[field] = v;
      await DB.put(store, obj);
      U.closeSheet(); U.toast('已改名', true);
      const key = M.cur; M.go(key);
    };
  };

  // 导入全部数据：弹出文件选择 -> U.importAll
  Main.importBackup = function () {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => { if (inp.files && inp.files[0]) U.importAll(inp.files[0]); };
    inp.click();
  };

  Main.useScript = name => {
    const s = (window.Libs.scripts().find(x => x.name === name)); if (!s) return;
    navigator.clipboard.writeText(s.tpl); U.toast('脚本模板已复制', true);
  };

  // ---------- 首次种子数据 ----------
  async function seed() {
    const flag = await DB.getSetting('seeded');
    if (flag) return;
    const colors = ['#7c5cff', '#ff8fb1', '#3fd0bf'];
    const plats = ['抖音', '视频号', '小红书'];
    const accounts = plats.map((p, i) => {
      const daily = []; const base = U.startOfDay(Date.now());
      let fans = 12000 - i * 1500;
      for (let d = 6; d >= 0; d--) {
        const dt = base - d * 86400000;
        const play = Math.round((800 + Math.random() * 2200) * (i === 0 ? 1.4 : 1));
        fans += Math.round(Math.random() * 120);
        daily.push({ date: dt, play, like: Math.round(play * 0.06), fans });
      }
      return { id: U.uid('ac'), platform: p, account: p + '主号', fans: fans, color: colors[i], goal: { play: 60000 }, daily, demo: true };
    });
    for (const a of accounts) await DB.put('accounts', a);

    const titles = ['新手剪辑5个坑', '手机调色秘籍', '一条爆款的结构', '我如何日更30天', '治愈系vlog怎么拍'];
    for (let i = 0; i < titles.length; i++) {
      await DB.put('works', { id: U.uid('wk'), title: titles[i], platform: plats[i % 3], date: Date.now() - i * 86400000 * 2, play: 5000 + i * 1300, like: 300 + i * 60, comment: 40 + i * 8, fav: 120 + i * 20, ctr: 35 + i * 3, category: '剪辑教程', note: i % 2 ? '前3秒钩子还可以更强' : '封面点击率不错，保持', reviewed: i > 2, dueDate: i > 2 ? '' : Date.now() + (3 - i) * 86400000, demo: true });
    }
    for (const t of Libs.topicSeed()) await DB.put('topics', { id: U.uid('tp'), title: t.title, cat: t.cat, heat: t.heat, status: t.status, note: t.note, dueDate: '', demo: true });
    await DB.setSetting('seeded', 1);
  }

  // ---------- 启动 ----------
  (async function init() {
    await buildNav();
    await Cloud.init();
    await seed();
    await applyWbName();
    M.go('center_dashboard');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    window.addEventListener('online', () => Cloud.sync());
    if (navigator.onLine) setTimeout(() => Cloud.sync(), 1500);
  })();

  // ---------- 工作台改名 + 自定义菜单 ----------
  async function applyWbName() {
    const n = (await DB.getSetting('wbName')) || '创作剪辑台';
    const b = document.querySelector('.brand b'); if (b) b.textContent = n;
    const t = document.querySelector('title'); if (t) t.textContent = n;
    const am = document.querySelector('meta[name=apple-mobile-web-app-title]'); if (am) am.setAttribute('content', n);
  }

  Main.navManager = async function () {
    const m = await getNavModel();
    const wb = (await DB.getSetting('wbName')) || '创作剪辑台';
    let dragId = null;
    const sh = U.openSheet(`<h3>⚙ 自定义菜单</h3>
      <div class="field"><label>工作台名称（左侧品牌 / 浏览器标题）</label><input type="text" id="nmWb" value="${U.esc(wb)}"/></div>
      <div class="muted" style="font-size:12px;margin:2px 0 10px">拖动 ⠿ 调整顺序，可改名、隐藏或删除；也可新增「外部链接」或「分组」。</div>
      <div id="nmGroups"></div>
      <div class="row" style="gap:8px;margin-top:10px">
        <button class="btn sm ghost" id="nmAddGroup">＋ 新增分组</button>
        <button class="btn sm ghost" id="nmAddLink">＋ 新增链接</button>
      </div>
      <div class="actions" style="margin-top:14px"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn primary" id="nmSave">保存并应用</button></div>`);
    const box = sh.querySelector('#nmGroups');
    function render() {
      box.innerHTML = m.groups.map((g, gi) => `<div class="nm-group" data-g="${gi}">
        <div class="nm-ghead"><input class="nm-gname" data-g="${gi}" value="${U.esc(g.label)}"/><button class="mini" data-addg="${gi}" title="在本组添加链接项">＋</button><button class="mini del" data-delg="${gi}" title="删除分组">✕</button></div>
        <div class="nm-items">${g.items.map((it, ii) => `<div class="nm-item ${it.hidden ? 'hide' : ''}" draggable="true" data-g="${gi}" data-i="${ii}">
          <span class="nm-handle">⠿</span>
          <input class="nm-label" data-g="${gi}" data-i="${ii}" value="${U.esc(it.label)}"/>
          ${it.type === 'link' ? '<span class="pill gray">链接</span>' : ''}
          <button class="mini" data-hide="${gi}:${ii}" title="${it.hidden ? '显示' : '隐藏'}">${it.hidden ? '👁' : '🙈'}</button>
          <button class="mini del" data-del="${gi}:${ii}" title="删除">✕</button>
        </div>`).join('')}</div>
      </div>`).join('');
      box.querySelectorAll('.nm-gname').forEach(inp => inp.onchange = () => { m.groups[+inp.dataset.g].label = inp.value; });
      box.querySelectorAll('[data-delg]').forEach(b => b.onclick = () => { if (m.groups.length <= 1) return U.toast('至少保留一个分组'); m.groups.splice(+b.dataset.delg, 1); render(); });
      box.querySelectorAll('[data-addg]').forEach(b => b.onclick = () => {
        const gi = +b.dataset.addg;
        const name = prompt('菜单项名称（显示文字）'); if (!name) return;
        const url = prompt('链接地址（含 https://，例如 https://example.com）'); if (!url) return;
        m.groups[gi].items.push({ id: 'i_' + Date.now().toString(36), key: 'link:' + url, label: name, icon: '<path d="M14 3h7v7M21 3l-9 9M10 5H5a2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>', tab: false, type: 'link', url, hidden: false });
        render();
      });
      box.querySelectorAll('.nm-label').forEach(inp => inp.onchange = () => { m.groups[+inp.dataset.g].items[+inp.dataset.i].label = inp.value; });
      box.querySelectorAll('[data-hide]').forEach(b => b.onclick = () => { const [g, i] = b.dataset.hide.split(':').map(Number); m.groups[g].items[i].hidden = !m.groups[g].items[i].hidden; render(); });
      box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const [g, i] = b.dataset.del.split(':').map(Number); m.groups[g].items.splice(i, 1); render(); });
      box.querySelectorAll('.nm-item').forEach(el => {
        el.ondragstart = e => { dragId = el.dataset.g + ':' + el.dataset.i; try { e.dataTransfer.setData('text/plain', dragId); } catch (x) {} e.dataTransfer.effectAllowed = 'move'; };
        el.ondragover = e => { e.preventDefault(); };
        el.ondrop = e => {
          e.preventDefault();
          if (!dragId) return;
          let [fg, fi] = dragId.split(':').map(Number);
          let [tg, ti] = [+el.dataset.g, +el.dataset.i];
          if (fg === tg && fi < ti) ti--;
          const item = m.groups[fg].items.splice(fi, 1)[0];
          m.groups[tg].items.splice(ti, 0, item);
          dragId = null; render();
        };
      });
      box.querySelectorAll('.nm-group').forEach(gr => {
        gr.ondragover = e => { if (e.target === gr || e.target.classList.contains('nm-items')) e.preventDefault(); };
        gr.ondrop = e => {
          if (!dragId) return;
          const [fg, fi] = dragId.split(':').map(Number);
          const tg = +gr.dataset.g;
          if (tg === fg) return;
          const item = m.groups[fg].items.splice(fi, 1)[0];
          m.groups[tg].items.push(item);
          dragId = null; render();
        };
      });
    }
    render();
    sh.querySelector('#nmAddGroup').onclick = () => { m.groups.push({ id: 'g_' + Date.now().toString(36), label: '新分组', items: [] }); render(); };
    sh.querySelector('#nmAddLink').onclick = () => {
      const name = prompt('链接名称（菜单显示）'); if (!name) return;
      const url = prompt('链接地址（含 https://）'); if (!url) return;
      const gi = m.groups.length - 1;
      m.groups[gi].items.push({ id: 'i_' + Date.now().toString(36), key: 'link:' + url, label: name, icon: '<path d="M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>', tab: false, type: 'link', url, hidden: false });
      render();
    };
    sh.querySelector('#nmSave').onclick = async () => {
      const wbName = sh.querySelector('#nmWb').value.trim() || '创作剪辑台';
      await DB.setSetting('wbName', wbName);
      await DB.setSetting('customNav', m);
      _navModel = m;
      U.closeSheet(); U.toast('已保存', true);
      await applyWbName(); await buildNav();
    };
  };
})();
