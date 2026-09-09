/* ============ 小说 · 剧本工坊：AI 生成 + 章节编辑 + TXT 导出 ============ */
(function () {
  const Views = window.Views = window.Views || {};
  const Mount = window.Mount = window.Mount || {};

  async function llmBinds() {
    const all = await DB.all('settings');
    return all.filter(s => s.id.startsWith('bind_') && s.value && s.value.type === 'llm' && s.value.apiKey).map(s => s.value);
  }

  const SYS = {
    outline: '你是有经验的网文/短剧策划。请根据用户给的题材与关键词（可能含一句话设定），生成一份小说或短剧大纲：① 核心设定（世界观/背景）② 主角与人物小传 ③ 主要矛盾/目标 ④ 3-5 个关键情节节点。用清晰的条目列出，语言简洁。',
    chapter: '你是有经验的网文/短剧编剧。请根据题材、大纲与（若有）已有内容，生成一段引人入胜的小说或短剧正文（约 400-600 字）。要求人物一致、有冲突钩子、结尾留悬念，纯正文输出，不要加注释。',
    cont: '你是有经验的网文/短剧编剧。请基于下方已有正文，自然地续写后续情节（约 400-600 字），保持人物与文风一致，推进冲突，结尾留钩子。纯正文输出。'
  };

  function localOutline(genre, kw) {
    return `【${genre || '未命名题材'}】大纲（本地草稿）
· 核心设定：${kw || genre || '一个普通人在意外中获得转机'}的世界，规则暗藏玄机。
· 主角：${kw || '林默'}，表面平凡，实则藏着不为人知的过去。
· 主要矛盾：渴望安稳的生活，却被卷入一场无法抽身的纷争。
· 情节节点：
  1）平静被打破——一封信/一个陌生人出现
  2）被迫应战，初露锋芒
  3）真相一角浮现，盟友变敌人
  4）绝境反杀，格局升级
  5）更大的局，才刚刚展开`;
  }
  function localChapter(genre, kw) {
    return `${kw || genre || '故事'}的世界里，主角本过着平凡日子。
直到那一天——一桩意外打破平静。
他握紧拳头，低声道："原来，一切都不是巧合。"
（此处展开人物与冲突，留悬念）`;
  }

  Views.center_novel = function () {
    return `<div class="section-title">📖 小说 · 剧本工坊</div>
    <div class="grid cols-2">
      <div class="card">
        <div class="row between"><strong>我的作品</strong><button class="btn sm primary" id="nNew">＋ 新建</button></div>
        <div class="cat-filter" style="margin-top:10px;margin-bottom:0"><span class="lbl">类目</span><select id="nCatFilter"><option value="all">全部</option></select></div>
        ${U.searchBar('novels', '搜索作品标题 / 题材 / 正文…')}
        <div id="nList" class="list" style="margin-top:10px"></div>
        <div class="muted" style="font-size:11.5px;margin-top:10px">纯前端本地存储（IndexedDB），断网可用、永久保存。导出为 .txt 文件，可在任意设备继续编辑。</div>
      </div>
      <div class="card">
        <div class="field"><label>标题</label><input id="nTitle" placeholder="作品标题"/></div>
        <div class="field"><label>题材 / 类型</label><input id="nGenre" placeholder="都市逆袭 / 悬疑短剧 / 古风 / 甜宠…"/></div>
        <div class="field"><label>大纲（可选）</label><textarea id="nOutline" placeholder="一句话设定或人物小传，AI 可据此生成大纲"></textarea></div>
        <div class="field"><label>使用模型</label>
          <select id="nModel"><option value="local">本地草稿（断网可用）</option></select>
          <div id="nModelHint" class="muted" style="font-size:11.5px;margin-top:4px"></div>
        </div>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">
          <button class="btn sm ghost" id="nGenOutline">✨ 生成大纲</button>
          <button class="btn sm ghost" id="nGenChap">✨ 生成第一章</button>
          <button class="btn sm ghost" id="nCont">✨ 续写</button>
        </div>
        <div class="field"><label>正文</label><textarea id="nBody" placeholder="在此写作，或让 AI 生成开头…" style="min-height:300px;background:#fbfaff"></textarea></div>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
          <button class="btn primary" id="nSave">💾 保存</button>
          <button class="btn teal" id="nExport">⬇ 导出 TXT</button>
          <button class="btn ghost" id="nImport">⬆ 导入 TXT</button>
          <button class="btn ghost del" id="nDel">删除</button>
          <input type="file" id="nFile" accept=".txt" style="display:none"/>
        </div>
        <div id="nStat" class="muted" style="font-size:12px;margin-top:8px"></div>
      </div>
    </div>`;
  };

  Mount.center_novel = async function (el, openId) {
    let curId = null;
    const $ = s => el.querySelector(s);
    const listEl = $('#nList');
    let F = { q: () => '', favOnly: () => false };
    F = Main.bindListSearch(el, loadList);
    const order = await Main.getOrder('novels');
    const binds = await llmBinds();
    const saved = await DB.get('settings', 'activeLLM');
    let active = (saved && saved.value) || 'local';
    if (active !== 'local' && !binds.find(b => b.id === active)) active = 'local';

    function fillModel() {
      const sel = $('#nModel');
      sel.innerHTML = '<option value="local">本地草稿（断网可用）</option>' +
        binds.map(b => `<option value="${b.id}">${U.esc(b.platform)} · ${U.esc(b.model || '默认模型')}</option>`).join('');
      sel.value = active;
      const b = binds.find(x => x.id === active);
      $('#nModelHint').textContent = active === 'local'
        ? '当前：本地草稿（断网可用、无需 Key）。'
        : `当前：调用 ${b.platform}（${b.model || '默认模型'}）真实大模型。`;
    }
    fillModel();
    $('#nModel').onchange = () => {
      active = $('#nModel').value;
      DB.put('settings', { id: 'activeLLM', value: active });
      const b = binds.find(x => x.id === active);
      $('#nModelHint').textContent = active === 'local'
        ? '当前：本地草稿（断网可用、无需 Key）。'
        : `当前：调用 ${b.platform}（${b.model || '默认模型'}）真实大模型。`;
    };

    async function aiGen(kind, targetSel) {
      const genre = $('#nGenre').value.trim() || '未命名题材';
      const outline = $('#nOutline').value.trim();
      const body = $('#nBody').value.trim();
      const btn = kind === 'outline' ? $('#nGenOutline') : kind === 'chapter' ? $('#nGenChap') : $('#nCont');
      const old = btn.textContent; btn.disabled = true; btn.textContent = '生成中…';
      try {
        let userText, sys = SYS[kind], out;
        if (kind === 'outline') userText = `题材：${genre}\n关键词/设定：${outline || '自由发挥'}`;
        else if (kind === 'chapter') userText = `题材：${genre}\n大纲：${outline || '无'}\n请写小说/剧本开头。`;
        else userText = `题材：${genre}\n已有正文：\n${body}\n\n请续写后续。`;
        if (active === 'local') {
          out = kind === 'outline' ? localOutline(genre, outline) : localChapter(genre, outline);
        } else {
          const b = binds.find(x => x.id === active);
          if (!b || !b.apiKey) { U.toast('该模型未配置 Key，已切回本地', true); active = 'local'; DB.put('settings', { id: 'activeLLM', value: 'local' }); fillModel(); out = kind === 'outline' ? localOutline(genre, outline) : localChapter(genre, outline); }
          else out = await AI.chat(b, sys, userText);
        }
        if (kind === 'outline') $('#nOutline').value = out;
        else if (kind === 'chapter') $('#nBody').value = (body ? body + '\n\n' : '') + out;
        else $('#nBody').value = body + '\n\n' + out;
        $('#nStat').textContent = (active === 'local' ? '本地草稿' : 'AI 生成 · ' + (binds.find(x => x.id === active) || {}).platform) + ' · ' + (kind === 'outline' ? '大纲' : '正文') + ' · 字数 ' + out.replace(/\s/g, '').length;
      } catch (e) {
        $('#nStat').textContent = '生成失败：' + (e.message || e) + '（可切回本地草稿重试）';
        U.toast('生成失败，见提示', true);
      } finally { btn.disabled = false; btn.textContent = old; }
    }
    $('#nGenOutline').onclick = () => aiGen('outline');
    $('#nGenChap').onclick = () => aiGen('chapter');
    $('#nCont').onclick = () => aiGen('cont');

    async function fillCatFilter(all) {
      const sel = $('#nCatFilter');
      if (!sel) return;
      const cats = [...new Set((all || []).map(n => (n.genre || '').trim()).filter(Boolean))];
      const keep = sel.value;
      sel.innerHTML = '<option value="all">全部</option>' + cats.map(c => `<option value="${U.esc(c)}">${U.esc(c)}</option>`).join('');
      sel.value = cats.indexOf(keep) >= 0 ? keep : 'all';
      sel.onchange = loadList;
    }
    async function loadList() {
      const novelAll = (await DB.all('novels')).sort((a, b) => (b.updated || 0) - (a.updated || 0));
      await fillCatFilter(novelAll);
      const cv = ($('#nCatFilter') && $('#nCatFilter').value) || 'all';
      let items = cv === 'all' ? novelAll : novelAll.filter(n => (n.genre || '').trim() === cv);
      const q = F.q();
      if (q) items = items.filter(n => Main.matchQ(q, n.title, n.genre, n.body));
      if (F.favOnly()) items = items.filter(n => n.fav);
      const ordered = Main.sortByOrder(items, order);
      if (!items.length) { listEl.innerHTML = '<div class="muted" style="font-size:12px;padding:8px 0">该分类下还没有作品，点「＋ 新建」开始。</div>'; return; }
      listEl.innerHTML = ordered.map(n => `<div class="list-item ${n.id === curId ? 'on' : ''}" data-id="${n.id}">
        <button class="drag-handle li-grip" title="拖动排序" aria-label="拖动排序"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6h2M13 6h2M9 12h2M13 12h2M9 18h2M13 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        <div style="flex:1;min-width:0"><div class="li-title">${U.esc(n.title || '未命名')}</div>
        <div class="li-sub">${U.esc(n.genre || '—')} · ${((n.body || '').length)} 字</div></div>
        ${U.favStar('novels', n.id, n.fav)}
        <button class="mini" title="改名" onclick="Main.renameItem('novels','${n.id}','title')"><svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L20 8l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 6l3 3" stroke="currentColor" stroke-width="1.8"/></svg></button>
        <button class="mini del" data-del="${n.id}" title="删除"><svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>`).join('');
      listEl.querySelectorAll('.list-item').forEach(li => {
        li.onclick = e => { if (e.target.closest('[data-del]') || e.target.closest('.drag-handle')) return; openNovel(li.dataset.id); };
      });
      U.makeSortable(listEl, '.drag-handle', ids => { Main.saveOrderMerged('novels', ids); U.toast('已保存顺序', true); });
      listEl.querySelectorAll('[data-del]').forEach(b => b.onclick = async e => {
        e.stopPropagation();
        if (!confirm('确定删除该作品？')) return;
        await DB.del('novels', b.dataset.del);
        if (curId === b.dataset.del) { curId = null; clearForm(); }
        await loadList(); U.toast('已删除');
      });
    }
    function clearForm() {
      $('#nTitle').value = ''; $('#nGenre').value = ''; $('#nOutline').value = ''; $('#nBody').value = '';
      $('#nStat').textContent = '';
    }
    async function openNovel(id) {
      const n = await DB.get('novels', id); if (!n) return;
      curId = id;
      $('#nTitle').value = n.title || ''; $('#nGenre').value = n.genre || '';
      $('#nOutline').value = n.outline || ''; $('#nBody').value = n.body || '';
      let stat = '已载入 · 更新于 ' + U.fmt(n.updated || n.created || Date.now(), 'md');
      if (n.source) stat += ' · 来源：' + n.source + (n.sourceUrl ? '（已记录链接）' : '');
      $('#nStat').textContent = stat;
      await loadList();
    }
    $('#nNew').onclick = () => { curId = null; clearForm(); $('#nStat').textContent = '新建模式，写好后点保存。'; loadList(); };
    $('#nSave').onclick = async () => {
      const title = $('#nTitle').value.trim() || '未命名作品';
      const rec = { id: curId || U.uid('nv'), title, genre: $('#nGenre').value.trim(), outline: $('#nOutline').value, body: $('#nBody').value, updated: Date.now(), created: curId ? undefined : Date.now() };
      if (curId) { const old = await DB.get('novels', curId); rec.created = old.created || Date.now(); if (old.source) rec.source = old.source; if (old.sourceUrl) rec.sourceUrl = old.sourceUrl; }
      await DB.put('novels', rec); curId = rec.id;
      await loadList();
      $('#nStat').textContent = '已保存 · ' + U.fmt(rec.updated, 'md');
      U.toast('已保存', true);
    };
    $('#nExport').onclick = () => {
      const title = $('#nTitle').value.trim() || '未命名作品';
      const genre = $('#nGenre').value.trim();
      const outline = $('#nOutline').value.trim();
      const body = $('#nBody').value;
      if (!outline && !body) return U.toast('没有可导出的内容');
      const txt = `${title}\n${genre ? '【' + genre + '】' : ''}\n\n` +
        (outline ? `=== 大纲 ===\n${outline}\n\n` : '') +
        (body ? `=== 正文 ===\n${body}\n` : '');
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = title.replace(/[\\/:*?"<>|]/g, '_') + '.txt';
      a.click(); URL.revokeObjectURL(a.href);
      U.toast('已导出 TXT', true);
    };
    $('#nImport').onclick = () => $('#nFile').click();
    $('#nFile').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        const t = String(r.result || '');
        const m = t.match(/^(.+)\n/);
        $('#nTitle').value = (m ? m[1] : '导入作品').trim().slice(0, 40);
        const gm = t.match(/【(.+?)】/);
        if (gm) $('#nGenre').value = gm[1];
        const om = t.split('=== 大纲 ===');
        const bm = t.split('=== 正文 ===');
        $('#nOutline').value = om[1] ? om[1].split('=== 正文 ===')[0].trim() : '';
        $('#nBody').value = bm[1] ? bm[1].trim() : (om[1] ? '' : t.replace(/^.+\n/, '').trim());
        curId = null; $('#nStat').textContent = '已导入，点「保存」存入作品库。';
        U.toast('已导入', true);
      };
      r.readAsText(f, 'utf-8'); e.target.value = '';
    };
    $('#nDel').onclick = async () => {
      if (!curId) return U.toast('没有打开的作品');
      if (!confirm('确定删除当前作品？')) return;
      await DB.del('novels', curId); curId = null; clearForm(); await loadList(); U.toast('已删除');
    };

    await loadList();
    if (openId) { const n = await DB.get('novels', openId); if (n) await openNovel(openId); }
  };
})();
