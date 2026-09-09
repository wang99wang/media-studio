/* ============ 小说检索中心：多平台检索 + 可选自建API ============ */
(function () {
  const Views = window.Views = window.Views || {};
  const Mount = window.Mount = window.Mount || {};

  // 正版平台真实检索地址（纯前端可打开，无需后端）
  const PLATS = [
    { name: '起点中文网', url: k => 'https://www.qidian.com/search?kw=' + k },
    { name: '晋江文学城', url: k => 'https://www.jjwxc.net/search.php?keyword=' + k },
    { name: '番茄小说', url: k => 'https://fanqienovel.com/search?keyword=' + k },
    { name: '微信读书', url: k => 'https://weread.qq.com/web/search?keyword=' + k },
    { name: '豆瓣读书', url: k => 'https://search.douban.com/book/subject_search?search_text=' + k },
    { name: '百度', url: k => 'https://www.baidu.com/s?wd=' + k + '%20小说%20txt' }
  ];

  function openUrl(u) {
    const a = document.createElement('a');
    a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); a.remove();
  }

  Views.center_novel_search = function () {
    return `<div class="row between" style="margin-bottom:0"><div class="section-title" style="margin:0">🔎 小说检索中心</div><button class="btn sm ghost" onclick="Main.novelSearchAI()">🤖 AI 选书建议</button></div>
    <div class="card">
      <div class="muted" style="font-size:12px;margin-bottom:12px">输入书名或作者，一键在各大正版平台检索；找到后复制 TXT，回到「小说剧本」点「⬆ 导入 TXT」即可入库继续创作。<b>纯前端、不爬站、不碰版权</b>。</div>
      <div class="field"><label>书名 / 作者 / 关键词</label>
        <div class="row" style="gap:8px">
          <input id="nsKw" placeholder="如：诡秘之主 / 都市 系统 爽文" style="flex:1" />
          <button class="btn primary" id="nsSearch">检索</button>
        </div>
      </div>
      <div id="nsPlats" class="row" style="gap:8px;flex-wrap:wrap;margin-top:4px"></div>
      <div class="muted" style="font-size:11.5px;margin-top:10px">点击平台会在新标签打开真实搜索结果页，由平台返回内容。本应用不抓取、不存储第三方正文。</div>
    </div>

    <div class="card" style="margin-top:14px">
      <details>
        <summary style="cursor:pointer;font-weight:600;color:var(--primary)">⚙ 高级：接入自建检索 API（可选）</summary>
        <div style="margin-top:12px">
          <div class="muted" style="font-size:11.5px;margin-bottom:8px">若你自建了检索后端，填好地址后上方「检索」会同时在页内列出结果。约定：<code>GET {基地址}/search?q=关键词</code> 返回 JSON 数组 <code>[{"title","author","source","intro","url"}]</code>，可选 <code>Authorization: Bearer {密钥}</code>。</div>
          <div class="field"><label>API 基地址</label><input id="nsApiBase" placeholder="https://your-server.com/novel"/></div>
          <div class="grid cols-2">
            <div class="field"><label>密钥（可选）</label><input id="nsApiKey" type="password" placeholder="Bearer 令牌"/></div>
            <div class="field"><label>&nbsp;</label><button class="btn ghost" id="nsApiSave">保存配置</button></div>
          </div>
          <div id="nsApiStat" class="muted" style="font-size:11.5px"></div>
        </div>
      </details>
    </div>

    <div class="card" style="margin-top:14px" id="nsResultWrap" style="display:none">
      <div class="row between"><strong>API 检索结果</strong><span id="nsResultStat" class="muted" style="font-size:12px"></span></div>
      <div id="nsResults" class="list" style="margin-top:10px"></div>
    </div>`;
  };

  Mount.center_novel_search = async function (el) {
    const $ = s => el.querySelector(s);
    const kwEl = $('#nsKw');
    let apiData = [];

    $('#nsPlats').innerHTML = PLATS.map((p, i) =>
      `<span class="plat-chip"><span class="pc-name">${U.esc(p.name)}</span>
        <button class="btn xs ghost" data-open="${i}">检索</button>
        <button class="btn xs primary" data-coll="${i}" title="收藏为「小说剧本」空作品并记来源">＋收藏</button></span>`).join('');

    async function collect(platIdx) {
      const kw = kwEl.value.trim();
      if (!kw) return U.toast('先输入书名/作者/关键词');
      const p = PLATS[platIdx];
      const url = p.url(encodeURIComponent(kw));
      const id = U.uid('nv');
      await DB.put('novels', { id, title: kw, genre: '', outline: '', body: '', source: p.name, sourceUrl: url, created: Date.now(), updated: Date.now() });
      U.toast('已收藏到「小说剧本」并记来源', true);
      M.go('center_novel', id);
    }

    function doSearch(alsoApi) {
      const kw = kwEl.value.trim();
      if (!kw) return U.toast('先输入书名/作者/关键词');
      const enc = encodeURIComponent(kw);
      PLATS.forEach(p => openUrl(p.url(enc)));
      if (alsoApi) runApi(kw);
    }
    $('#nsSearch').onclick = () => doSearch(false);
    kwEl.onkeydown = e => { if (e.key === 'Enter') doSearch(false); };
    $('#nsPlats').querySelectorAll('[data-open]').forEach(b => b.onclick = () => {
      const kw = kwEl.value.trim();
      if (!kw) return U.toast('先输入检索词');
      openUrl(PLATS[+b.dataset.open].url(encodeURIComponent(kw)));
    });
    $('#nsPlats').querySelectorAll('[data-coll]').forEach(b => b.onclick = () => collect(+b.dataset.coll));

    // ---- 自建 API ----
    const cfg = await DB.get('settings', 'novel_search_api');
    if (cfg && cfg.value) {
      $('#nsApiBase').value = cfg.value.base || '';
      $('#nsApiKey').value = cfg.value.key || '';
    }
    $('#nsApiSave').onclick = async () => {
      const base = $('#nsApiBase').value.trim();
      const key = $('#nsApiKey').value.trim();
      if (!base) return U.toast('基地址不能为空');
      await DB.put('settings', { id: 'novel_search_api', value: { base, key } });
      $('#nsApiStat').textContent = '已保存。下次点「检索」会同时拉取页内结果。';
      U.toast('已保存', true);
    };

    async function runApi(kw) {
      const cfg = (await DB.get('settings', 'novel_search_api') || {}).value;
      if (!cfg || !cfg.base) {
        $('#nsResultWrap').style.display = 'block';
        $('#nsResults').innerHTML = '<div class="muted" style="font-size:12px;padding:8px 0">未配置检索 API，仅打开平台检索标签。可在上方「高级」里填写。</div>';
        $('#nsResultStat').textContent = '';
        return;
      }
      $('#nsResultWrap').style.display = 'block';
      $('#nsResults').innerHTML = '<div class="muted" style="padding:10px 0">检索中…</div>';
      $('#nsResultStat').textContent = kw;
      try {
        const headers = { 'Accept': 'application/json' };
        if (cfg.key) headers['Authorization'] = 'Bearer ' + cfg.key;
        const r = await fetch(cfg.base.replace(/\/$/, '') + '/search?q=' + encodeURIComponent(kw), { headers });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const data = await r.json();
        if (!Array.isArray(data) || !data.length) {
          $('#nsResults').innerHTML = '<div class="muted" style="padding:10px 0">未返回结果。</div>';
          return;
        }
        apiData = data;
        $('#nsResults').innerHTML = data.map((d, i) => `<div class="list-item">
          <div style="flex:1;min-width:0">
            <div class="li-title">${U.esc(d.title || '未命名')}</div>
            <div class="li-sub">${U.esc(d.author || '')}${d.author ? ' · ' : ''}${U.esc(d.source || '')}</div>
            ${d.intro ? `<div class="li-sub" style="margin-top:4px;white-space:normal">${U.esc(String(d.intro).slice(0, 80))}</div>` : ''}
          </div>
          <button class="mini" title="打开来源" data-url="${U.esc(d.url || '')}"><svg viewBox="0 0 24 24" fill="none"><path d="M14 4h6v6M20 4l-9 9M19 13v6H5V5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="mini" title="收藏到作品库" data-coll-i="${i}">＋</button>
        </div>`).join('');
        $('#nsResults').querySelectorAll('[data-url]').forEach(b => b.onclick = () => {
          const u = b.dataset.url; if (u) openUrl(u);
        });
        $('#nsResults').querySelectorAll('[data-coll-i]').forEach(b => b.onclick = async () => {
          const d = apiData[+b.dataset.collI]; if (!d) return;
          const id = U.uid('nv');
          await DB.put('novels', { id, title: d.title || kwEl.value.trim() || '未命名', genre: '', outline: '', body: '', source: d.source || '自建API', sourceUrl: d.url || '', created: Date.now(), updated: Date.now() });
          U.toast('已收藏到「小说剧本」', true);
          M.go('center_novel', id);
        });
      } catch (e) {
        $('#nsResults').innerHTML = '<div class="muted" style="padding:10px 0">检索失败：' + U.esc(e.message || e) + '（自建 API 需支持跨域 CORS）</div>';
      }
    }
  };
})();
