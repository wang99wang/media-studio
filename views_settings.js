/* ============ 系统设置：云端同步 + 平台 API 绑定 ============ */
(function () {
  const Views = window.Views = window.Views || {};
  const Mount = window.Mount = window.Mount || {};
  const PLATS = ['抖音', '快手', '视频号', '小红书', 'B站', '微博', '其他'];

  /* 常用 AI 大模型预设：选了就自动填好官方 OpenAI 兼容接口地址 + 默认模型，
     你只需把 API Key 贴进去即可，在「文案润色 / 智能生成」等场景调用。 */
  const MODELS = {
    '豆包（火山方舟）': { base: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-seed-1-6-250615' },
    'DeepSeek':       { base: 'https://api.deepseek.com/v1',              model: 'deepseek-chat' },
    'Kimi（月之暗面）': { base: 'https://api.moonshot.cn/v1',               model: 'moonshot-v1-8k' },
    '智谱 GLM':        { base: 'https://open.bigmodel.cn/api/paas/v4',     model: 'glm-4-plus' },
    '通义千问':        { base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-max' },
    'OpenAI':         { base: 'https://api.openai.com/v1',                model: 'gpt-4o-mini' }
  };
  const isLlm = p => !!MODELS[p];

  // ---------- 视图 ----------
  Views.settings = function () {
    return `<div class="grid" style="gap:18px">

      <!-- 云端同步 -->
      <div class="card">
        <h3 class="section-title">☁️ 云端同步（MySQL + OSS）</h3>
        <div class="muted" style="font-size:12.5px;margin:-6px 0 14px">填好后端 API 地址后，本地数据断网可用、联网自动上传同步。未配置则仅本地运行 + 导出备份。</div>
        <div class="field"><label>后端同步 API 地址</label><input type="text" id="setCloudBase" placeholder="https://your-server.com/api"/></div>
        <div class="row between" style="margin-top:4px">
          <span class="muted" id="setCloudStatus">—</span>
          <button class="btn primary sm" id="setCloudSave">保存并同步</button>
        </div>
      </div>

      <!-- 平台 / 大模型 API 绑定 -->
      <div class="card">
        <div class="between row" style="margin-bottom:4px">
          <h3 class="section-title" style="margin:0">🔗 API 绑定</h3>
          <button class="btn primary sm" onclick="Settings.addBind()">＋ 新增绑定</button>
        </div>
        <div class="muted" style="font-size:12.5px;margin:-4px 0 14px">两类都能绑：① <b>平台开放平台</b>（抖音/视频号等）——保存凭据后，在「我的账号」点「拉取真实数据」即可读取粉丝 / 播放；② <b>常用 AI 大模型</b>（豆包 / DeepSeek / Kimi 等）——选了自动填好接口地址，你只贴 API Key，可用于文案润色、智能生成。所有密钥<b>仅存本地</b>，不会发往第三方。</div>
        <div id="bindList"></div>
        <p class="muted" style="font-size:11.5px;margin-top:14px;line-height:1.7">
          ⚠️ <strong>诚实边界</strong>：纯前端 PWA 无法完成 OAuth 重定向与 token 交换（需后端持有 redirect_uri 收授权码）。平台数据请在<strong>你自己的后端</strong>完成开放平台授权，然后把「接口基地址 + Access Token（或长期令牌）」填到这里。大模型调用走官方 OpenAI 兼容接口或你的代理，<strong>不会</strong>向第三方暴露密钥。
        </p>
        <div class="muted" style="font-size:11.5px;line-height:1.7;background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-top:8px">
          📐 <strong>平台数据拉数约定</strong>：GET <code>{接口基地址}/account</code> 返回 <code>{"fans":N,"play":N}</code>；前端带上 <code>Authorization: Bearer {token}</code>。可在绑定里用「测试连接」校验你的接口。
        </div>
      </div>
    </div>`;
  };

  Mount.settings = async function () {
    const elBase = document.getElementById('setCloudBase');
    if (elBase) elBase.value = (await DB.getSetting('cloud_base')) || '';
    const st = document.getElementById('setCloudStatus');
    if (st) st.textContent = Cloud.status === 'local' ? '当前：仅本地运行' : ('当前状态：' + Cloud.status);
    document.getElementById('setCloudSave').onclick = async () => {
      const v = document.getElementById('setCloudBase').value.trim();
      await Cloud.setBase(v);
      U.toast(v ? '已保存并开始同步' : '已清空云端地址', true);
      M.go('settings');
    };
    renderBinds();
  };

  // ---------- 绑定列表渲染 ----------
  async function renderBinds() {
    const box = document.getElementById('bindList');
    if (!box) return;
    const list = await allBinds();
    if (!list.length) {
      box.innerHTML = `<div class="empty-state" style="padding:22px"><p>还没有任何绑定</p><p class="muted">点右上「＋ 新增绑定」开始</p></div>`;
      return;
    }
    box.innerHTML = list.map(b => `
      <div class="item">
        <div class="body">
          <div class="tt">${U.esc(b.platform)} ${b.type === 'llm' ? '<span class="pill" style="background:#efe7ff;color:#7a3cff">AI 大模型</span>' : ''} ${b.apiBase ? '<span class="pill teal">已配置</span>' : '<span class="pill gray">未配置</span>'}</div>
          <div class="meta">${b.type === 'llm' ? (U.esc(b.model || '') ? '模型 ' + U.esc(b.model) + ' · ' : '') : ''}${U.esc(b.apiBase || '接口基地址未填')}${b.authType === 'oauth2' ? ' · OAuth2 客户端' : (b.accessToken && b.type !== 'llm' ? ' · Token 已填' : (b.apiKey && b.type === 'llm' ? ' · Key 已填' : ''))}</div>
        </div>
        <div class="act">
          <button class="mini" title="测试连接" data-act="test"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="mini" title="编辑" data-act="edit"><svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L20 8l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>
          <button class="mini del" title="删除" data-act="del"><svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>`).join('');
    box.querySelectorAll('.item').forEach((el, i) => {
      el.querySelector('[data-act=test]').onclick = () => testBind(list[i]);
      el.querySelector('[data-act=edit]').onclick = () => Settings.editBind(list[i].id);
      el.querySelector('[data-act=del]').onclick = () => Settings.delBind(list[i].id);
    });
  }

  async function allBinds() {
    const all = await DB.all('settings');
    return all.filter(s => s.id.startsWith('bind_')).map(s => s.value)
      .sort((a, b) => (a.type === b.type ? a.platform.localeCompare(b.platform) : (a.type === 'llm' ? 1 : -1)));
  }

  window.Settings = {
    addBind() { bindSheet(null); },
    async editBind(id) {
      const rec = (await DB.all('settings')).find(s => s.id === id);
      bindSheet(rec ? rec.value : null);
    },
    async delBind(id) {
      if (!confirm('删除该绑定？')) return;
      await DB.del('settings', id);
      U.toast('已删除绑定');
      renderBinds();
    }
  };

  function bindSheet(b) {
    b = b || { platform: '抖音', type: 'platform', apiBase: '', authType: 'token', clientId: '', clientSecret: '', tokenUrl: '', accessToken: '', apiKey: '', model: '', note: '' };
    if (!b.type) b.type = isLlm(b.platform) ? 'llm' : 'platform';
    const platOpts = PLATS.map(p => `<option ${p === b.platform ? 'selected' : ''}>${p}</option>`).join('');
    const llmOpts = ['自定义（自填接口地址）'].concat(Object.keys(MODELS)).map(p => `<option ${p === b.platform ? 'selected' : ''}>${p}</option>`).join('');
    const sh = U.openSheet(`<h3>${b.id ? '✏️ 编辑绑定' : '➕ 新增 API 绑定'}</h3>
      <div class="field"><label>授权方式（先选这个，下面的服务会跟着变）</label><div class="chips" id="bAuth">
        <span class="chip ${b.type === 'llm' ? 'on' : ''}" data-v="llm">长期令牌 / API Key</span>
        <span class="chip ${b.type === 'platform' ? 'on' : ''}" data-v="platform">OAuth2 客户端</span></div></div>
      <div class="field"><label id="bPlatLabel">服务类型</label><select id="bPlat"></select></div>
      <div class="field"><label>接口基地址</label><input type="text" id="bBase" value="${U.esc(b.apiBase)}" placeholder="你的后端代理或官方 endpoint"/></div>

      <div data-type="llm">
        <div class="field"><label>API Key（长期令牌）</label><input type="password" id="bKey" value="${U.esc(b.apiKey)}" placeholder="粘贴你的模型 API Key / 长期令牌"/></div>
        <div class="field"><label>模型名称</label><input type="text" id="bModel" value="${U.esc(b.model)}" placeholder="如 deepseek-chat"/></div>
        <div class="muted" style="font-size:11.5px">支持 OpenAI 兼容协议。选好服务类型会自动填好基地址与默认模型，你改模型名即可切换版本。密钥仅存本地。</div>
      </div>

      <div data-type="platform">
        <div class="grid cols-2">
          <div class="field"><label>Client ID</label><input type="text" id="bCid" value="${U.esc(b.clientId)}"/></div>
          <div class="field"><label>Client Secret</label><input type="password" id="bSec" value="${U.esc(b.clientSecret)}" placeholder="OAuth2 客户端必填"/></div>
        </div>
        <div class="field"><label>Token 接口地址（OAuth2 取码用）</label><input type="text" id="bTurl" value="${U.esc(b.tokenUrl)}" placeholder="https://open.xxx.com/oauth/access_token"/></div>
        <div class="field"><label>长期令牌 / Access Token</label><input type="password" id="bTok" value="${U.esc(b.accessToken)}" placeholder="粘贴开放平台返回的 token 或长期密钥"/></div>
      </div>

      <div class="field"><label>备注</label><input type="text" id="bNote" value="${U.esc(b.note || '')}"/></div>
      <div class="muted" style="font-size:11.5px">平台数据拉取约定：GET <code>{基地址}/account</code> 返回 <code>{"fans":N,"play":N}</code>，前端带 <code>Authorization: Bearer {token}</code>。</div>
      <div class="actions"><button class="btn ghost" onclick="U.closeSheet()">取消</button><button class="btn primary" id="bSave">保存</button></div>`);

    let curType = b.type;
    function renderPlat() {
      const isL = curType === 'llm';
      const list = isL ? Object.keys(MODELS) : PLATS;
      const sel = sh.querySelector('#bPlat');
      sel.innerHTML = list.map(p => `<option ${p === b.platform ? 'selected' : ''}>${p}</option>`).join('');
      sh.querySelector('#bPlatLabel').textContent = isL ? 'AI 大模型' : '平台开放平台';
    }
    function toggleType() {
      sh.querySelectorAll('[data-type]').forEach(d => {
        d.style.display = (d.getAttribute('data-type') === curType) ? '' : 'none';
      });
    }
    function fillByPlat() {
      const p = sh.querySelector('#bPlat').value;
      if (curType === 'llm' && MODELS[p]) {
        sh.querySelector('#bBase').value = MODELS[p].base;
        sh.querySelector('#bModel').value = MODELS[p].model;
      }
    }
    renderPlat(); toggleType(); fillByPlat();
    sh.querySelectorAll('#bAuth .chip').forEach(c => c.onclick = () => {
      sh.querySelectorAll('#bAuth .chip').forEach(x => x.classList.remove('on'));
      c.classList.add('on');
      curType = c.dataset.v;
      const inScope = (curType === 'llm') ? Object.keys(MODELS) : PLATS;
      if (!inScope.includes(b.platform)) b.platform = inScope[0];
      renderPlat(); toggleType(); fillByPlat();
    });
    sh.querySelector('#bPlat').onchange = fillByPlat;
    sh.querySelector('#bSave').onclick = async () => {
      const plat = sh.querySelector('#bPlat').value;
      const obj = {
        id: b.id || ('bind_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)),
        platform: plat,
        type: curType,
        apiBase: sh.querySelector('#bBase').value.trim(),
        authType: curType,
        clientId: sh.querySelector('#bCid').value.trim(),
        clientSecret: sh.querySelector('#bSec').value,
        tokenUrl: sh.querySelector('#bTurl').value.trim(),
        accessToken: sh.querySelector('#bTok').value.trim(),
        apiKey: sh.querySelector('#bKey').value.trim(),
        model: sh.querySelector('#bModel').value.trim(),
        note: sh.querySelector('#bNote').value.trim()
      };
      await DB.put('settings', { id: obj.id, value: obj });
      U.closeSheet(); U.toast('绑定已保存', true); renderBinds();
    };
  }

  async function testBind(b) {
    if (!b.apiBase) { U.toast('请先填写接口基地址'); return; }
    U.toast('正在测试连接…');
    try {
      const url = b.apiBase.replace(/\/+$/, '') + '/ping';
      const headers = {};
      if (b.accessToken) headers['Authorization'] = 'Bearer ' + b.accessToken;
      if (b.apiKey) headers['Authorization'] = 'Bearer ' + b.apiKey;
      const res = await fetch(url, { headers });
      if (res.ok) U.toast(b.platform + ' 连接成功 ✓', true);
      else U.toast(b.platform + ' 接口返回 ' + res.status);
    } catch (e) {
      U.toast('连接失败：' + (e.message || '网络错误') + '（前端直连可能被 CORS 拦截，建议走你的后端代理）');
    }
  }
})();
