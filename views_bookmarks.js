/* ============ 网址收藏（带分类） ============ */
(function () {
  const Views = window.Views, Mount = window.Mount;
  const uid = () => 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const esc = s => U.esc(s == null ? '' : String(s));
  const GRIP = '<button class="drag-handle" title="拖动排序" aria-label="拖动排序"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6h2M13 6h2M9 12h2M13 12h2M9 18h2M13 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>';
  const DELICO = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const EDIICO = '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20l4-1 9-9-3-3-9 9-1 4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 6l3 3" stroke="currentColor" stroke-width="1.8"/></svg>';
  const xesc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function domainOf(url) {
    try { const u = new URL(/^https?:/i.test(url) ? url : ('https://' + url)); return u.hostname; } catch (e) { return ''; }
  }
  function faviconImg(url, cls) {
    const d = domainOf(url);
    return d ? '<img class="' + (cls || 'bm-ico') + '" src="https://icons.duckduckgo.com/ip3/' + esc(d) + '.ico" onerror="this.style.display=\'none\'" alt="" loading="lazy">' : '';
  }

  Views.bookmarks = async function () {
    return '<div class="row between" style="margin-bottom:14px"><div class="section-title" style="margin:0">🔖 网址收藏</div>' +
      '<div class="row" style="gap:8px"><button class="btn sm ghost" id="bmExport">⬇ 导出书签</button><button class="btn primary" id="bmAdd">＋ 添加网址</button></div></div>' +
      U.searchBar('bookmarks', '搜索标题 / 网址 / 分类…') +
      '<div class="chips" id="bmCats" style="margin:10px 0 14px"></div>' +
      '<div class="grid" id="bmList"></div>';
  };

  function bmCard(b) {
    const url = (b.url || '').trim();
    const safe = /^(https?:|mailto:)/i.test(url) ? url : (url ? 'https://' + url : '');
    const open = safe ? '<a class="mini" href="' + esc(safe) + '" target="_blank" rel="noopener" title="打开">' + EDIICO.replace('<svg', '<svg') + '↗</a>' : '';
    return '<div class="item" data-id="' + b.id + '">' + GRIP +
      '<div class="body"><div class="tt">' + faviconImg(url) + '<a href="' + esc(safe) + '" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">' + esc(b.title || url || '未命名') + '</a></div>' +
      '<div class="meta">' + (b.cat ? '<span class="pill gray">' + esc(b.cat) + '</span>' : '') +
      (url ? '<span class="muted" style="word-break:break-all">' + esc(url) + '</span>' : '') + '</div>' +
      (b.note ? '<div class="muted" style="font-size:12.5px;margin-top:4px">' + esc(b.note) + '</div>' : '') + '</div>' +
      '<div class="act">' + U.favStar('bookmarks', b.id, b.fav) + open +
      '<button class="mini" data-act="edit" title="编辑">' + EDIICO + '</button>' +
      '<button class="mini del" data-act="del" title="删除">' + DELICO + '</button></div></div>';
  }

  function bmSheet(b, onSave) {
    const isNew = !b;
    const sh = U.openSheet('<h3>' + (isNew ? '🔖 添加网址' : '🔖 编辑网址') + '</h3>' +
      '<div class="field"><label>标题</label><input type="text" id="bmTitle" value="' + esc(b ? b.title : '') + '" placeholder="如：剪映模板站"></div>' +
      '<div class="field"><label>网址</label><input type="text" id="bmUrl" value="' + esc(b ? b.url : '') + '" placeholder="https://…"></div>' +
      '<div id="bmIcoBox" style="margin:-6px 0 4px">' + (b ? faviconImg(b.url, 'bm-ico lg') : '') + '</div>' +
      '<div class="field"><label>分类</label><input type="text" id="bmCat" value="' + esc(b ? b.cat : '') + '" placeholder="如：素材站 / 数据平台 / 剪辑工具"></div>' +
      '<div class="field"><label>备注（可选）</label><textarea id="bmNote" placeholder="用途说明">' + esc(b ? b.note : '') + '</textarea></div>' +
      '<div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn primary" id="bmSave">保存</button></div>');
    sh.querySelector('#bmSave').onclick = () => {
      const obj = {
        id: b ? b.id : uid(),
        title: sh.querySelector('#bmTitle').value.trim(),
        url: sh.querySelector('#bmUrl').value.trim(),
        cat: sh.querySelector('#bmCat').value.trim(),
        note: sh.querySelector('#bmNote').value.trim(),
        fav: b ? !!b.fav : false,
        created: b ? b.created : Date.now()
      };
      if (!obj.title && !obj.url) { U.toast('至少填标题或网址'); return; }
      onSave(obj);
    };
    const urlInp = sh.querySelector('#bmUrl');
    if (urlInp) urlInp.oninput = () => { const box = sh.querySelector('#bmIcoBox'); if (box) box.innerHTML = faviconImg(urlInp.value.trim(), 'bm-ico lg'); };
  }

  Mount.bookmarks = async function (el) {
    const order = await Main.getOrder('bookmarks');
    const listEl = el.querySelector('#bmList');
    const catsEl = el.querySelector('#bmCats');
    let all = [];
    let curCat = 'all';
    const F = Main.bindListSearch(el, render);

    async function refreshCats() {
      const cats = [...new Set(all.map(b => (b.cat || '').trim()).filter(Boolean))];
      if (cats.length) {
        catsEl.style.display = '';
        catsEl.innerHTML = '<span class="chip ' + (curCat === 'all' ? 'on' : '') + '" data-c="all">全部</span>' +
          cats.map(c => '<span class="chip ' + (curCat === c ? 'on' : '') + '" data-c="' + esc(c) + '">' + esc(c) + '</span>').join('');
        catsEl.querySelectorAll('.chip').forEach(ch => ch.onclick = () => {
          curCat = ch.dataset.c;
          catsEl.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x.dataset.c === curCat));
          render();
        });
      } else catsEl.style.display = 'none';
    }

    function render() {
      const q = F.q();
      const favOnly = F.favOnly();
      let arr = all;
      if (curCat !== 'all') arr = arr.filter(b => (b.cat || '').trim() === curCat);
      if (favOnly) arr = arr.filter(b => b.fav);
      if (q) arr = arr.filter(b => Main.matchQ(q, b.title, b.url, b.cat, b.note));
      arr = Main.sortByOrder(arr, order);
      listEl.innerHTML = arr.length ? arr.map(bmCard).join('') :
        '<div class="empty-state"><p>还没有网址收藏</p><p class="muted">点右上「＋ 添加网址」，或 CSV 之外的任意站点都能归类</p></div>';
    }

    el.querySelector('#bmAdd').onclick = () => bmSheet(null, async obj => {
      await DB.put('bookmarks', obj); U.closeSheet(); U.toast('已添加', true);
      all = await DB.all('bookmarks'); await refreshCats(); render();
    });

    listEl.addEventListener('click', e => {
      const act = e.target.closest('[data-act]');
      if (!act) return;
      const id = act.closest('[data-id]').dataset.id;
      if (act.dataset.act === 'del') {
        Main.delConfirm('确定删除这条网址收藏？', async () => { await DB.del('bookmarks', id); U.toast('已删除'); all = await DB.all('bookmarks'); await refreshCats(); render(); });
      } else if (act.dataset.act === 'edit') {
        const it = all.find(x => x.id === id);
        if (it) bmSheet(it, async obj => { await DB.put('bookmarks', obj); U.closeSheet(); U.toast('已保存', true); all = await DB.all('bookmarks'); await refreshCats(); render(); });
      }
    });

    U.makeSortable(listEl, '.drag-handle', ids => {
      Main.saveOrderMerged('bookmarks', ids);
      order.length = 0; order.push(...ids); U.toast('已保存顺序', true);
    });

    function exportHtml() {
      if (!all.length) { U.toast('还没有可导出的网址'); return; }
      const groups = {};
      all.forEach(b => { const c = (b.cat || '').trim() || '未分类'; (groups[c] = groups[c] || []).push(b); });
      let s = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n';
      Object.keys(groups).forEach(c => {
        s += '    <DT><H3>' + xesc(c) + '</H3>\n    <DL><p>\n';
        groups[c].forEach(b => {
          const u = (b.url || '').trim();
          const safe = /^https?:/i.test(u) ? u : (u ? 'https://' + u : '');
          if (!safe) return;
          s += '        <DT><A HREF="' + xesc(safe) + '" ADD_DATE="' + Math.floor((b.created || Date.now()) / 1000) + '">' + xesc(b.title || u || '未命名') + '</A>\n';
        });
        s += '    </DL><p>\n';
      });
      s += '</DL><p>\n';
      const blob = new Blob([s], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '我的网址收藏.html';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      U.toast('已导出书签 HTML，可直接导入浏览器', true);
    }
    el.querySelector('#bmExport').onclick = exportHtml;

    all = await DB.all('bookmarks');
    await refreshCats();
    render();
  };
})();
