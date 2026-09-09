/* ============ 模块二：AI 剪辑创作工坊 ============ */
(function () {
  const Views = window.Views, Mount = window.Mount;
  const Tools = window.Tools = {};

  // ---------- 素材云端库 ----------
  Views.studio_materials = async function () {
    const mats = (await DB.all('materials')).sort((a, b) => (b.created || 0) - (a.created || 0));
    return `<div class="row between" style="margin-bottom:16px">
      <div class="section-title" style="margin:0">🗂️ 全品类素材云端库</div>
      <div class="row" style="gap:8px">
        <button class="btn ghost" onclick="Studio.exportMats()">导出素材</button>
        <button class="btn primary" onclick="Studio.uploadMat()">＋ 上传素材</button>
      </div>
    </div>
    <div class="muted" style="font-size:12px;margin-bottom:12px">图片/视频/音频/文案 Blob 存本地 IndexedDB（永久保存，断网可用）；联网后随同步队列上传云端 OSS。点「导出素材」可下载全部文件做备份。</div>
    <div class="row" style="gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <div class="seg" id="matType">
        <button data-v="all" class="on">全部</button><button data-v="image">图片</button><button data-v="video">视频</button><button data-v="audio">音频</button><button data-v="text">文案</button>
      </div>
      <input type="text" id="matSearch" data-lsearch placeholder="搜索名称 / 标签 / 备注…" style="flex:1;min-width:140px"/>
      <button class="chip" data-favonly type="button" title="只看收藏">★ 收藏</button>
    </div>
    <div data-favbox="1" style="display:none"></div>
    <div class="chips" id="matTags" style="margin-bottom:14px;display:none"><span class="muted" style="font-size:12px;align-self:center">标签</span><span class="chip on" data-t="all">全部</span></div>
    <input type="file" id="matFile" multiple accept="image/*,video/*,audio/*,.txt,.md" style="display:none" />
    <div class="grid cols-3" id="matGrid">${mats.map(cardMat).join('') || emptyMat()}</div>`;
  };
  function cardMat(m) {
    const prev = m.type === 'image' ? `<img src="${m.thumb || ''}" style="width:100%;height:120px;object-fit:cover;border-radius:12px"/>`
      : m.type === 'video' ? `<div style="position:relative;height:120px;border-radius:12px;overflow:hidden;background:#1c1830;display:grid;place-items:center">${m.thumb ? `<img src="${m.thumb}" style="width:100%;height:100%;object-fit:cover"/>` : ''}<span style="position:absolute;color:#fff;font-size:12px">▶ 视频</span></div>`
      : m.type === 'audio' ? `<div style="height:120px;border-radius:12px;background:var(--teal-s);display:grid;place-items:center;color:var(--teal)"><svg viewBox="0 0 24 24" width="40" height="40" fill="none"><path d="M9 18V6l10-2v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="16" r="3" stroke="currentColor" stroke-width="2"/></svg></div>`
      : `<div style="height:120px;border-radius:12px;background:var(--primary-s);display:grid;place-items:center;color:var(--primary-d)"><svg viewBox="0 0 24 24" width="40" height="40" fill="none"><path d="M5 4h14v16H5z" stroke="currentColor" stroke-width="2"/><path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>`;
    return `<div class="card tight" data-id="${m.id}">
      <button class="drag-handle mat-grip" title="拖动排序" aria-label="拖动排序"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6h2M13 6h2M9 12h2M13 12h2M9 18h2M13 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      ${prev}
      <div class="tt" style="font-weight:700;font-size:13.5px;margin:10px 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.esc(m.name)}</div>
      <div class="row between" style="margin-top:2px">
        <div class="meta"><span class="pill gray">${typeName(m.type)}</span><span class="muted">${fmtSize(m.size)}</span></div>
        ${U.favStar('materials', m.id, m.fav)}
        <button class="mini" title="改名" onclick="Main.renameItem('materials','${m.id}','name')"><svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L20 8l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 6l3 3" stroke="currentColor" stroke-width="1.8"/></svg></button>
      </div>
      ${(m.tags && m.tags.length) ? `<div class="row" style="gap:5px;flex-wrap:wrap;margin-top:7px">${m.tags.map(t=>`<span class="chip" style="cursor:default;padding:2px 8px;font-size:11px">${U.esc(t)}</span>`).join('')}</div>` : ''}
      <div class="row" style="gap:6px;margin-top:10px">
        <button class="btn sm ghost" onclick="Main.matAI('${m.id}')">🤖 AI</button>
        <button class="btn sm ghost" onclick="Studio.editMat('${m.id}')">详情</button>
        <button class="btn sm ghost" onclick="Studio.dlMat('${m.id}')">下载</button>
        <button class="btn sm danger" onclick="Studio.delMat('${m.id}')">删除</button>
      </div>
    </div>`;
  }
  function typeName(t) { return { image: '图片', video: '视频', audio: '音频', text: '文案' }[t] || t; }
  function fmtSize(b) { if (!b) return ''; return b > 1048576 ? (b / 1048576).toFixed(1) + 'MB' : (b / 1024).toFixed(0) + 'KB'; }
  function emptyMat() { return `<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none"><path d="M5 4h14v16H5z" stroke="currentColor" stroke-width="1.6"/><path d="M9 10l3 3 3-3M12 13v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><p>还没有素材，点「上传素材」开始积累</p></div>`; }
  Mount.studio_materials = async function (el) {
    const order = await Main.getOrder('materials');
    const inp = el.querySelector('#matFile');
    inp.onchange = async () => {
      for (const f of inp.files) await Studio.addMatFile(f);
      inp.value = '';
      M.go('studio_materials');
    };
    let curType = 'all', curTag = 'all', curSearch = '';
    const tagsBox = el.querySelector('#matTags');
    async function refreshTags() {
      const all = await DB.all('materials');
      const tags = [...new Set(all.flatMap(m => m.tags || []))];
      if (tags.length) {
        tagsBox.style.display = '';
        tagsBox.innerHTML = '<span class="muted" style="font-size:12px;align-self:center">标签</span><span class="chip ' + (curTag === 'all' ? 'on' : '') + '" data-t="all">全部</span>' +
          tags.map(t => '<span class="chip ' + (curTag === t ? 'on' : '') + '" data-t="' + U.esc(t) + '">' + U.esc(t) + '</span>').join('');
      } else tagsBox.style.display = 'none';
    }
    async function render() {
      let mats = (await DB.all('materials')).sort((a, b) => (b.created || 0) - (a.created || 0));
      if (curType !== 'all') mats = mats.filter(m => m.type === curType);
      if (curTag !== 'all') mats = mats.filter(m => (m.tags || []).includes(curTag));
      const mq = F.q();
      if (mq) mats = mats.filter(m => Main.matchQ(mq, m.name, m.note, (m.tags || []).join(' ')));
      if (F.favOnly()) mats = mats.filter(m => m.fav);
      mats = Main.sortByOrder(mats, order);
      el.querySelector('#matGrid').innerHTML = mats.length ? mats.map(cardMat).join('') : emptyMat();
      U.makeSortable(el.querySelector('#matGrid'), '.drag-handle', ids => { Main.saveOrderMerged('materials', ids); U.toast('已保存顺序', true); });
    }
    el.querySelectorAll('#matType button').forEach(b => b.onclick = () => {
      el.querySelectorAll('#matType button').forEach(x => x.classList.remove('on')); b.classList.add('on'); curType = b.dataset.v; render();
    });
    const F = Main.bindListSearch(el, render);
    tagsBox.onclick = e => { const c = e.target.closest('.chip'); if (!c) return; curTag = c.dataset.t; refreshTags(); render(); };
    refreshTags();
  };

  const Studio = window.Studio = {
    uploadMat() { document.getElementById('matFile').click(); },
    async addMatFile(f) {
      const type = f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'text';
      let thumb = null;
      if (type === 'image') thumb = await makeThumb(f, 360);
      if (type === 'video') thumb = await videoThumb(f);
      await DB.put('materials', { id: U.uid('mt'), name: f.name, type, mime: f.type, size: f.size, blob: f, thumb, tags: [], created: Date.now() });
      U.toast('已保存：' + f.name, true);
    },
    async dlMat(id) {
      const m = await DB.get('materials', id);
      if (!m) return;
      if (m.type === 'text') U.download(m.name, m.text || '', 'text/plain');
      else U.download(m.name, m.blob, m.mime);
    },
    async delMat(id) { await DB.del('materials', id); U.toast('已删除'); M.go('studio_materials'); },
    async exportMats() {
      const mats = await DB.all('materials');
      if (!mats.length) return U.toast('暂无素材可导出');
      for (const m of mats) {
        if (m.type === 'text') U.download(m.name, m.text || '');
        else U.download(m.name, m.blob, m.mime);
        await new Promise(r => setTimeout(r, 150));
      }
      U.toast('已逐个下载 ' + mats.length + ' 个素材', true);
    }
  };

  Studio.editMat = async function (id) {
    const m = await DB.get('materials', id); if (!m) return;
    const url = (m.type !== 'text' && m.blob) ? URL.createObjectURL(m.blob) : '';
    let prev;
    if (m.type === 'image') prev = `<img src="${url}" style="max-width:100%;border-radius:12px"/>`;
    else if (m.type === 'video') prev = `<video src="${url}" controls style="max-width:100%;border-radius:12px;max-height:300px"></video>`;
    else if (m.type === 'audio') prev = `<audio src="${url}" controls style="width:100%"></audio>`;
    else prev = `<div class="card" style="white-space:pre-wrap;font-size:13px;max-height:200px;overflow:auto">${U.esc(m.text || '(空文案)')}</div>`;
    const sh = U.openSheet(`<h3>📄 素材详情</h3>
      <div class="preview" style="min-height:auto;text-align:center">${prev}</div>
      <div class="field"><label>名称</label><input type="text" id="emName" value="${U.esc(m.name)}"/></div>
      <div class="field"><label>标签（点已有标签删除，输入后回车添加）</label>
        <div class="chips" id="emTags">${(m.tags || []).map(t => `<span class="chip on" data-v="${U.esc(t)}">${U.esc(t)} ✕</span>`).join('')}</div>
        <input type="text" id="emTagIn" placeholder="输入标签，回车添加"/></div>
      <div class="field"><label>备注</label><textarea id="emNote" placeholder="用途 / 来源 / 关联作品">${U.esc(m.note || '')}</textarea></div>
      <div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn primary" id="emSave">保存</button></div>`);
    const tags = (m.tags || []).slice();
    const tagsEl = sh.querySelector('#emTags');
    function paintTags() { tagsEl.innerHTML = tags.map(t => `<span class="chip on" data-v="${U.esc(t)}">${U.esc(t)} ✕</span>`).join(''); }
    tagsEl.onclick = e => { const c = e.target.closest('.chip'); if (!c) return; const v = c.dataset.v; const i = tags.indexOf(v); if (i >= 0) tags.splice(i, 1); paintTags(); };
    sh.querySelector('#emTagIn').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v && !tags.includes(v)) { tags.push(v); paintTags(); } e.target.value = ''; } };
    sh.querySelector('#emSave').onclick = async () => {
      m.name = sh.querySelector('#emName').value.trim() || m.name;
      m.tags = tags; m.note = sh.querySelector('#emNote').value;
      await DB.put('materials', m); if (url) URL.revokeObjectURL(url); U.closeSheet(); U.toast('已更新', true); M.go('studio_materials');
    };
  };

  async function makeThumb(file, max) {
    return new Promise(res => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => {
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = img.width * sc; c.height = img.height * sc;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.7)); URL.revokeObjectURL(url);
      };
      img.onerror = () => res(null); img.src = url;
    });
  }
  async function videoThumb(file) {
    return new Promise(res => {
      const v = document.createElement('video'); const url = URL.createObjectURL(file);
      v.muted = true; v.src = url; v.preload = 'metadata';
      v.onloadeddata = () => { v.currentTime = Math.min(1, v.duration / 2); };
      v.onseeked = () => {
        const c = document.createElement('canvas'); c.width = 320; c.height = 180;
        try { c.getContext('2d').drawImage(v, 0, 0, 320, 180); res(c.toDataURL('image/jpeg', 0.6)); } catch (e) { res(null); }
        URL.revokeObjectURL(url);
      };
      v.onerror = () => res(null);
    });
  }

  // ---------- 工坊工具 ----------
  Views.studio_tools = async function () {
    const tools = await Main.getTools();
    return `<div class="row between" style="margin-bottom:14px">
      <div class="section-title" style="margin:0">🛠️ AI 剪辑创作工坊</div>
      <div class="row" style="gap:8px">
        <button class="btn sm ghost" onclick="Main.toolAI()">🤖 AI 文案 / 脚本</button>
        <button class="btn sm" onclick="Main.addTool()">＋ 添加</button>
        <button class="btn sm ghost" onclick="Main.resetTools()">恢复默认</button>
      </div>
    </div>
    <div class="grid cols-2" id="toolGrid">
      ${tools.map(toolCard).join('')}
    </div>
    <div class="card" style="margin-top:18px">
      <div class="section-title">🗺️ 后续迭代路线图 <span class="badge">需后端算力 / 第三方 API</span></div>
      <div class="road">
        ${road('视频文案提取（语音转写）', '需云端 ASR 语音识别，浏览器原生无法直接转写；接入后支持上传视频自动出字幕文案。')}
        ${road('批量自动混剪', '需服务端转码/合成能力，前端可先做「片段编排预览」，合成放后端。')}
        ${road('AI 画质高清修复', '需超分模型推理（后端 GPU），前端仅能做轻量锐化/对比度增强。')}
        ${road('全网小说检索 + TXT 下载', '涉及版权与爬虫合规，建议仅支持「自有文本导入 + AI 续写生成」。')}
        ${road('实时全网热点抓取', '需联网数据源，接入后热点雷达自动更新，当前为本地示例库。')}
      </div>
      <div class="muted" style="font-size:12px;margin-top:10px">说明：以上功能在当前「纯前端离线」架构下无法真正实现，已在 UI 明确标注，不会给假按钮。你有后端后，按 cloud.js 的同步约定接入即可扩展。</div>
    </div>`;
  };
  function toolCard(t) {
    const open = t.url ? `window.open(${JSON.stringify(t.url)},'_blank')` : (t.fn || '');
    return `<div class="card tool-card" data-id="${t.id}" style="position:relative">
      <button class="drag-handle" title="拖动排序" aria-label="拖动排序" style="position:absolute;top:12px;right:12px"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6h2M13 6h2M9 12h2M13 12h2M9 18h2M13 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      <div class="row" style="gap:14px;align-items:flex-start;padding-right:34px">
        <div style="width:54px;height:54px;border-radius:16px;background:var(--primary-s);display:grid;place-items:center;font-size:26px">${U.esc(t.icon || '🧩')}</div>
        <div style="flex:1;min-width:0"><div class="tt" style="font-weight:800;font-size:16px">${U.esc(t.name)}</div><div class="muted" style="font-size:13px;margin-top:4px">${U.esc(t.desc || '')}</div></div>
      </div>
      <div class="row" style="gap:8px;margin-top:12px">
        ${open ? `<button class="btn sm primary" onclick="${open}">打开</button>` : ''}
        <button class="btn sm ghost" onclick="Main.renameTool('${t.id}')">✎ 改名</button>
        <button class="btn sm ghost del" onclick="Main.delTool('${t.id}')">删除</button>
      </div>
    </div>`;
  }
  function road(t, d) {
    return `<div class="r"><span class="badge2">规划中</span><div><div class="tt" style="font-weight:700">${t}</div><div class="muted" style="font-size:12.5px;margin-top:2px">${d}</div></div></div>`;
  }
  Mount.studio_tools = async function (el) {
    const grid = el.querySelector('#toolGrid');
    if (grid) U.makeSortable(grid, '.drag-handle', async ids => {
      const tools = await Main.getTools();
      const map = {}; tools.forEach(t => map[t.id] = t);
      await Main.saveTools(ids.map(id => map[id]).filter(Boolean));
      U.toast('已保存顺序', true);
    });
  };

  // ---------- 工具实现 ----------
  function closeAfter() { U.closeSheet(); }

  // 智能封面
  Tools.cover = function () {
    const sh = U.openSheet(`<h3>🖼️ 智能封面制作</h3>
      <div class="field"><label>背景图（图片或视频抽帧）</label><input type="file" id="cvFile" accept="image/*,video/*"/></div>
      <div class="tool-wrap" style="grid-template-columns:1fr">
        <div class="preview"><canvas id="cvCanvas" width="360" height="640" style="width:100%"></canvas></div>
      </div>
      <div class="field" style="margin-top:12px"><label>主标题</label><input type="text" id="cvTitle" placeholder="一行吸睛标题" value="3个被低估的剪辑技巧"/></div>
      <div class="field"><label>副标题</label><input type="text" id="cvSub" placeholder="补充说明（可空）" value="新手必看 · 第2个绝了"/></div>
      <div class="field"><label>尺寸</label><div class="seg" id="cvSize">
        <button data-v="v" class="on">竖屏 1080×1920</button><button data-v="h">横屏 1280×720</button></div></div>
      <div class="field"><label>配色</label><div class="swatches" id="cvColor">
        ${[['#7c5cff', '#ffffff'], ['#ff5a76', '#fff'], ['#2d2a45', '#ffd34e'], ['#1c9e90', '#fff'], ['#111', '#fff']].map((c, i) => `<div class="swatch ${i === 0 ? 'on' : ''}" data-bg="${c[0]}" data-fg="${c[1]}" style="background:${c[0]}"></div>`).join('')}
      </div></div>
      <div class="field"><label>标题字号 <span id="cvFsV">44</span></label><div class="range-row"><input type="range" id="cvFs" min="28" max="72" value="44"/></div></div>
      <div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn primary" id="cvExport">导出 PNG</button></div>`);
    const canvas = sh.querySelector('#cvCanvas');
    const ctx = canvas.getContext('2d');
    let bgImg = null, sizeMode = 'v', bg = '#7c5cff', fg = '#ffffff', fs = 44;
    function draw() {
      const W = sizeMode === 'v' ? 1080 : 1280, H = sizeMode === 'v' ? 1920 : 720;
      canvas.width = W; canvas.height = H;
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      if (bgImg) {
        // cover
        const r = Math.max(W / bgImg.width, H / bgImg.height);
        const w = bgImg.width * r, h = bgImg.height * r;
        ctx.globalAlpha = 0.5; ctx.drawImage(bgImg, (W - w) / 2, (H - h) / 2, w, h); ctx.globalAlpha = 1;
        const g = ctx.createLinearGradient(0, H * 0.45, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, bg); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `800 ${fs}px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif`;
      wrapText(ctx, sh.querySelector('#cvTitle').value || '', W / 2, H * (sizeMode === 'v' ? 0.62 : 0.5), W * 0.84, fs * 1.18);
      ctx.font = `600 ${Math.round(fs * 0.5)}px -apple-system,"PingFang SC",sans-serif`;
      const sub = sh.querySelector('#cvSub').value;
      if (sub) ctx.fillText(sub, W / 2, H * (sizeMode === 'v' ? 0.62 : 0.5) + fs * 1.5);
    }
    function wrapText(c, text, x, y, maxW, lh) {
      const ch = text.split(''); let line = '', lines = [];
      for (const s of ch) { if (c.measureText(line + s).width > maxW && line) { lines.push(line); line = s; } else line += s; }
      if (line) lines.push(line);
      const startY = y - (lines.length - 1) * lh / 2;
      lines.forEach((l, i) => c.fillText(l, x, startY + i * lh));
    }
    sh.querySelector('#cvFile').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const url = URL.createObjectURL(f);
      if (f.type.startsWith('video')) {
        const v = document.createElement('video'); v.muted = true; v.src = url; v.onloadeddata = () => v.currentTime = Math.min(1, (v.duration || 2) / 2);
        v.onseeked = () => { bgImg = v; draw(); };
      } else { const img = new Image(); img.onload = () => { bgImg = img; draw(); }; img.src = url; }
    };
    sh.querySelectorAll('#cvSize button').forEach(b => b.onclick = () => { sh.querySelectorAll('#cvSize button').forEach(x => x.classList.remove('on')); b.classList.add('on'); sizeMode = b.dataset.v; draw(); });
    sh.querySelectorAll('#cvColor .swatch').forEach(s => s.onclick = () => { sh.querySelectorAll('#cvColor .swatch').forEach(x => x.classList.remove('on')); s.classList.add('on'); bg = s.dataset.bg; fg = s.dataset.fg; draw(); });
    sh.querySelector('#cvFs').oninput = e => { fs = +e.target.value; sh.querySelector('#cvFsV').textContent = fs; draw(); };
    sh.querySelector('#cvTitle').oninput = draw; sh.querySelector('#cvSub').oninput = draw;
    sh.querySelector('#cvExport').onclick = () => {
      canvas.toBlob(b => { U.download('封面-' + Date.now() + '.png', b); U.toast('封面已导出', true); }, 'image/png');
    };
    draw();
  };

  // 图片去水印
  Tools.watermark = function () {
    const sh = U.openSheet(`<h3>🧽 图片去水印（涂抹修复）</h3>
      <div class="field"><label>上传图片</label><input type="file" id="wmFile" accept="image/*"/></div>
      <div class="preview" style="min-height:auto"><canvas id="wmCanvas" style="max-width:100%;cursor:crosshair;touch-action:none"></canvas></div>
      <div class="muted" style="font-size:12px">在画布上按住拖动，涂抹水印区域；点「修复」用周围像素智能填充，再导出。</div>
      <div class="field" style="margin-top:10px"><label>笔刷大小 <span id="wmBsV">26</span></label><div class="range-row"><input type="range" id="wmBs" min="8" max="80" value="26"/></div></div>
      <div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn pink" id="wmFix">修复</button><button class="btn primary" id="wmExport">导出</button></div>`);
    const canvas = sh.querySelector('#wmCanvas'); const ctx = canvas.getContext('2d');
    let img = null, mask = null, bs = 26, drawing = false;
    sh.querySelector('#wmFile').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const url = URL.createObjectURL(f); const im = new Image();
      im.onload = () => {
        const max = 1000; const sc = Math.min(1, max / Math.max(im.width, im.height));
        canvas.width = im.width * sc; canvas.height = im.height * sc;
        ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
        img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        mask = new Uint8Array(canvas.width * canvas.height);
      };
      im.src = url;
    };
    function paint(x, y) {
      if (!mask) return;
      const r = Math.ceil(bs / 2);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const px = Math.floor(x + dx), py = Math.floor(y + dy);
        if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue;
        mask[py * canvas.width + px] = 1;
        ctx.fillStyle = 'rgba(255,90,118,.55)';
        ctx.beginPath(); ctx.arc(px, py, 1.4, 0, 7); ctx.fill();
      }
    }
    function pos(e) { const rect = canvas.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: (t.clientX - rect.left) * canvas.width / rect.width, y: (t.clientY - rect.top) * canvas.height / rect.height }; }
    canvas.onmousedown = e => { drawing = true; const p = pos(e); paint(p.x, p.y); };
    canvas.onmousemove = e => { if (drawing) { const p = pos(e); paint(p.x, p.y); } };
    window.addEventListener('mouseup', () => drawing = false);
    canvas.ontouchstart = e => { e.preventDefault(); drawing = true; const p = pos(e); paint(p.x, p.y); };
    canvas.ontouchmove = e => { e.preventDefault(); if (drawing) { const p = pos(e); paint(p.x, p.y); } };
    canvas.ontouchend = () => drawing = false;
    sh.querySelector('#wmBs').oninput = e => { bs = +e.target.value; sh.querySelector('#wmBsV').textContent = bs; };
    sh.querySelector('#wmFix').onclick = () => {
      if (!mask) return U.toast('先上传并涂抹水印');
      const W = canvas.width, H = canvas.height;
      const src = img.data, out = ctx.getImageData(0, 0, W, H), o = out.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x; if (!mask[i]) continue;
        // 螺旋搜索最近非遮罩像素
        let found = null;
        for (let rad = 1; rad <= 40 && !found; rad++) {
          for (let a = 0; a < 360; a += 20) {
            const nx = x + Math.round(rad * Math.cos(a * Math.PI / 180)), ny = y + Math.round(rad * Math.sin(a * Math.PI / 180));
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            if (!mask[ny * W + nx]) { found = (ny * W + nx) * 4; break; }
          }
        }
        if (found) { o[i * 4] = src[found]; o[i * 4 + 1] = src[found + 1]; o[i * 4 + 2] = src[found + 2]; o[i * 4 + 3] = 255; }
      }
      ctx.putImageData(out, 0, 0);
      U.toast('修复完成，可导出', true);
    };
    sh.querySelector('#wmExport').onclick = () => { canvas.toBlob(b => { U.download('去水印-' + Date.now() + '.png', b); U.toast('已导出', true); }, 'image/png'); };
  };

  // 文字生成视频
  Tools.textVideo = function () {
    const sh = U.openSheet(`<h3>🎞️ 文字生成视频</h3>
      <div class="field"><label>文案（自动按句子分句）</label><textarea id="tvText" placeholder="第一行标题&#10;第二句内容&#10;第三句金句…">3个被低估的剪辑技巧&#10;第一招：关键帧调速&#10;第二招：蒙版转场&#10;关注我，下期更硬核</textarea></div>
      <div class="grid cols-2">
        <div class="field"><label>背景色</label><input type="color" id="tvBg" value="#1c1830" style="height:44px;padding:4px"/></div>
        <div class="field"><label>文字色</label><input type="color" id="tvFg" value="#ffffff" style="height:44px;padding:4px"/></div>
      </div>
      <div class="grid cols-2">
        <div class="field"><label>每句时长 <span id="tvSecV">2</span>s</label><input type="range" id="tvSec" min="1" max="6" value="2"/></div>
        <div class="field"><label>字号 <span id="tvFsV">48</span></label><input type="range" id="tvFs" min="28" max="80" value="48"/></div>
      </div>
      <div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn teal" id="tvRun">▶ 生成并下载</button></div>
      <div class="muted" style="font-size:12px;margin-top:8px" id="tvMsg">生成中会在本地用 Canvas + MediaRecorder 录制为 WebM（无需联网）。</div>`);
    const getSec = () => +sh.querySelector('#tvSec').value;
    sh.querySelector('#tvSec').oninput = e => sh.querySelector('#tvSecV').textContent = e.target.value;
    sh.querySelector('#tvFs').oninput = e => sh.querySelector('#tvFsV').textContent = e.target.value;
    sh.querySelector('#tvRun').onclick = async () => {
      const sentences = sh.querySelector('#tvText').value.split(/\n+/).map(s => s.trim()).filter(Boolean);
      if (!sentences.length) return U.toast('请输入文案');
      if (!window.MediaRecorder) return U.toast('当前浏览器不支持录制，请换 Chrome/Edge');
      const W = 720, H = 1280, fps = 30;
      const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(fps);
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = []; rec.ondataavailable = e => chunks.push(e.data);
      const done = new Promise(res => rec.onstop = res);
      const bg = sh.querySelector('#tvBg').value, fg = sh.querySelector('#tvFg').value, fs = +sh.querySelector('#tvFs').value, sec = getSec();
      function frame(text, t) {
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, H); g.addColorStop(0, 'rgba(255,255,255,.06)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `800 ${fs}px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif`;
        const ch = text.split(''); let line = '', lines = [];
        for (const s of ch) { if (ctx.measureText(line + s).width > W * 0.86 && line) { lines.push(line); line = s; } else line += s; }
        if (line) lines.push(line);
        const lh = fs * 1.3, startY = H / 2 - (lines.length - 1) * lh / 2;
        const alpha = Math.min(1, t / 0.4) * Math.min(1, (sec - t) / 0.3 + 0.2);
        ctx.globalAlpha = Math.max(0.15, alpha);
        lines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lh));
        ctx.globalAlpha = 1;
      }
      sh.querySelector('#tvMsg').textContent = '录制中…';
      rec.start();
      for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i];
        const frames = sec * fps;
        for (let f = 0; f < frames; f++) { frame(s, f / fps); await new Promise(r => setTimeout(r, 1000 / fps)); }
      }
      rec.stop(); await done;
      const blob = new Blob(chunks, { type: 'video/webm' });
      U.download('文字视频-' + Date.now() + '.webm', blob);
      sh.querySelector('#tvMsg').textContent = '生成完成，已下载 WebM';
      U.toast('文字视频已生成', true);
    };
  };

  // 视频音频分离
  Tools.extractAudio = function () {
    const sh = U.openSheet(`<h3>🎵 视频音频分离提取</h3>
      <div class="field"><label>上传视频</label><input type="file" id="auFile" accept="video/*"/></div>
      <div class="muted" style="font-size:12px">用 Web Audio 解码音轨并录制为音频文件导出（无需联网）。</div>
      <div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn primary" id="auRun" disabled>▶ 提取音频</button></div>
      <div class="muted" style="font-size:12px;margin-top:8px" id="auMsg"></div>`);
    let videoEl = null;
    sh.querySelector('#auFile').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const url = URL.createObjectURL(f); videoEl = document.createElement('video'); videoEl.src = url; videoEl.muted = false;
      sh.querySelector('#auRun').disabled = false; sh.querySelector('#auMsg').textContent = '已就绪，点「提取音频」开始';
    };
    sh.querySelector('#auRun').onclick = async () => {
      if (!videoEl) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        const ac = new AC();
        const src = ac.createMediaElementSource(videoEl);
        const dest = ac.createMediaStreamDestination();
        src.connect(ac.destination); src.connect(dest);
        if (!window.MediaRecorder) throw new Error('no recorder');
        const rec = new MediaRecorder(dest.stream);
        const chunks = []; rec.ondataavailable = e => chunks.push(e.data);
        const done = new Promise(r => rec.onstop = r);
        sh.querySelector('#auMsg').textContent = '提取中…';
        rec.start(); videoEl.currentTime = 0; await videoEl.play();
        await new Promise(r => videoEl.onended = r);
        rec.stop(); await done;
        const blob = new Blob(chunks, { type: 'audio/webm' });
        U.download('提取音频-' + Date.now() + '.weba', blob);
        sh.querySelector('#auMsg').textContent = '完成，已下载音频（.weba）';
        U.toast('音频已提取', true);
      } catch (err) { sh.querySelector('#auMsg').textContent = '提取失败：' + err.message + '（部分浏览器不支持该解码）'; }
    };
  };

  // ---------- 路线图页（独立入口，避免菜单过长）----------
  Views.studio_roadmap = async function () { return Views.studio_tools(); };
  Mount.studio_roadmap = function () {};
})();
