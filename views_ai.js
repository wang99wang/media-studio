/* ============ AI 创作助手：选题/脚本/口播/小说 智能生成 ============ */
(function () {
  const Views = window.Views = window.Views || {};
  const Mount = window.Mount = window.Mount || {};

  const TYPES = [
    { id: 'topic', name: '选题灵感', save: 'topic', ph: '赛道/领域，如：知识科普、美食探店、职场成长', extra: '数量（个）' },
    { id: 'script', name: '短视频脚本', save: 'script', ph: '主题/类型，如：知识口播三段式、剧情反转', extra: '时长/集数，如：30秒 / 3集' },
    { id: 'voice', name: '口播文案', save: 'script', ph: '要讲的核心内容，如：普通人怎么用 AI 提效' },
    { id: 'novel', name: '小说/剧本', save: 'script', ph: '题材+关键词，如：都市逆袭、悬疑短剧' }
  ];

  const SYS = {
    topic: '你是资深短视频选题策划。请根据用户给的赛道/领域与数量，生成有爆款潜力的短视频选题。每条含：① 吸睛标题 ② 所属垂类 ③ 爆点/角度理由。用编号列出，语言简洁。',
    script: '你是短视频脚本编剧。请根据主题/类型生成一段完整的短视频拍摄脚本，包含：分镜（画面描述）、台词/旁白、运镜或时长提示。用清晰的结构化格式输出。',
    voice: '你是抖音口播文案写手。请根据核心内容生成一段口播文案：强开头钩子（反常识/悬念）+ 干货主体 + 结尾行动号召（点赞收藏关注）。只输出纯文案。',
    novel: '你是有经验的网文/短剧编剧。请根据题材与关键词，生成一段引人入胜的小说或短剧开头（约 300-500 字），要有鲜明人物与冲突钩子，留悬念。'
  };

  async function llmBinds() {
    const all = await DB.all('settings');
    return all.filter(s => s.id.startsWith('bind_') && s.value && s.value.type === 'llm' && s.value.apiKey).map(s => s.value);
  }

  Views.center_ai = function () {
    return `<div class="section-title">🤖 AI 创作助手</div>
    <div class="grid cols-2">
      <div class="card">
        <div class="field"><label>生成类型</label>
          <div class="seg" id="aType">${TYPES.map((t, i) => `<button data-v="${t.id}" class="${i === 0 ? 'on' : ''}">${t.name}</button>`).join('')}</div>
        </div>
        <div class="field"><label>核心主题 / 关键词</label>
          <textarea id="aPrompt" placeholder="例如：新手做自媒体最容易踩的 5 个坑">新手做自媒体最容易踩的 5 个坑</textarea>
        </div>
        <div class="field" id="aExtraWrap" style="display:none"><label id="aExtraLabel"></label><input type="text" id="aExtra" placeholder="选填"/></div>
        <div class="field"><label>使用模型</label>
          <select id="aModel"><option value="local">本地草稿（断网可用）</option></select>
          <div id="aModelHint" class="muted" style="font-size:11.5px;margin-top:4px"></div>
        </div>
        <button class="btn primary block" id="aRun">🚀 智能生成</button>
        <div class="muted" style="font-size:11.5px;margin-top:8px">选你绑定的豆包/DeepSeek/Kimi 等即调用真实大模型；选「本地草稿」则按关键词生成结构化模板，断网也能用。</div>
      </div>
      <div class="card">
        <div class="row between"><label style="font-weight:700">生成结果</label>
          <div class="row" style="gap:8px">
            <button class="btn sm ghost" id="aCopy">复制</button>
            <button class="btn sm teal" id="aSave">保存到库</button>
          </div>
        </div>
        <textarea id="aOut" readonly placeholder="点左侧「智能生成」…" style="background:#fbfaff;min-height:320px"></textarea>
        <div id="aStat" class="muted" style="font-size:12.5px"></div>
      </div>
    </div>`;
  };

  Mount.center_ai = async function (el) {
    let type = 'topic';
    const modelSel = el.querySelector('#aModel');
    const hint = el.querySelector('#aModelHint');
    const binds = await llmBinds();
    const saved = await DB.get('settings', 'activeLLM');
    let active = (saved && saved.value) || 'local';
    if (active !== 'local' && !binds.find(b => b.id === active)) active = 'local';
    modelSel.innerHTML = '<option value="local">本地草稿（断网可用）</option>' +
      binds.map(b => `<option value="${b.id}">${U.esc(b.platform)} · ${U.esc(b.model || '默认模型')}</option>`).join('');
    modelSel.value = active;
    function updHint() {
      const v = modelSel.value; const b = binds.find(x => x.id === v);
      if (v === 'local') hint.textContent = '当前：本地草稿（断网可用、无需 Key）。';
      else if (b) hint.textContent = `当前：调用 ${b.platform}（${b.model || '默认模型'}）真实大模型。`;
      else hint.textContent = '';
    }
    updHint();
    modelSel.onchange = () => { active = modelSel.value; DB.put('settings', { id: 'activeLLM', value: active }); updHint(); };

    function syncExtra() {
      const t = TYPES.find(x => x.id === type);
      const w = el.querySelector('#aExtraWrap');
      if (t.extra) { w.style.display = ''; el.querySelector('#aExtraLabel').textContent = t.extra; }
      else w.style.display = 'none';
    }
    syncExtra();
    el.querySelectorAll('#aType button').forEach(b => b.onclick = () => {
      el.querySelectorAll('#aType button').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); type = b.dataset.v; syncExtra();
    });

    el.querySelector('#aRun').onclick = async () => {
      const prompt = el.querySelector('#aPrompt').value.trim();
      if (!prompt) return U.toast('请填写核心主题/关键词');
      const extra = el.querySelector('#aExtra').value.trim();
      const btn = el.querySelector('#aRun'); const outEl = el.querySelector('#aOut'); const stat = el.querySelector('#aStat');
      btn.disabled = true; const old = btn.textContent; btn.textContent = '生成中…';
      try {
        if (modelSel.value === 'local') {
          const t = TYPES.find(x => x.id === type);
          const out = localDraft(type, prompt, extra);
          outEl.value = out;
          stat.textContent = `本地草稿 · ${t.name} · 字数 ${out.replace(/\s/g, '').length}（建议绑定大模型获得更好效果）`;
        } else {
          const b = binds.find(x => x.id === modelSel.value);
          if (!b || !b.apiKey) {
            U.toast('该模型未配置 Key，已切回本地', true);
            modelSel.value = 'local'; active = 'local'; DB.put('settings', { id: 'activeLLM', value: 'local' }); updHint();
            const t = TYPES.find(x => x.id === type); const out = localDraft(type, prompt, extra);
            outEl.value = out; stat.textContent = `本地草稿 · ${t.name} · 字数 ${out.replace(/\s/g, '').length}`;
          } else {
            let userText = prompt;
            if (extra) userText += `\n补充要求：${extra}`;
            const out = await AI.chat(b, SYS[type], userText);
            outEl.value = out;
            const words = out.replace(/\s/g, '').length;
            stat.textContent = `AI 生成 · ${b.platform} · ${TYPES.find(x => x.id === type).name} · 字数 ${words}`;
          }
        }
      } catch (e) {
        outEl.value = ''; stat.textContent = '生成失败：' + (e.message || e) + '（可切回「本地草稿」重试）';
        U.toast('生成失败，见结果区', true);
      } finally { btn.disabled = false; btn.textContent = old; }
    };

    el.querySelector('#aCopy').onclick = () => { navigator.clipboard.writeText(el.querySelector('#aOut').value); U.toast('已复制', true); };
    el.querySelector('#aSave').onclick = async () => {
      const out = el.querySelector('#aOut').value; if (!out) return U.toast('先生成内容');
      const t = TYPES.find(x => x.id === type);
      if (t.save === 'topic') {
        await DB.put('topics', { id: U.uid('tp'), title: (out.split('\n')[0] || 'AI 选题').slice(0, 24), cat: 'AI生成', heat: 80, status: '灵感', note: out, dueDate: '' });
        U.toast('已存为选题', true); M.go('center_topics');
      } else {
        await DB.put('scripts', { id: U.uid('sc'), name: 'AI' + t.name + ' ' + U.fmt(Date.now(), 'md'), cat: 'AI生成', tpl: out, created: Date.now() });
        U.toast('已存为脚本', true); M.go('center_inspo');
      }
    };
  };

  // 本地结构化草稿（无 Key 时也能用）
  function localDraft(type, kw, extra) {
    const t = TYPES.find(x => x.id === type);
    if (type === 'topic') {
      const n = Math.max(3, Math.min(10, parseInt(extra) || 5));
      let s = `【${kw}】选题灵感（本地草稿）：\n`;
      for (let i = 1; i <= n; i++) s += `${i}. ${kw}第${i}坑：很多人忽略的${kw}细节\n   垂类：${kw} · 爆点：用「反常识」角度切入，制造好奇\n`;
      return s;
    }
    if (type === 'script') {
      return `【${kw}】短视频脚本（本地草稿）${extra ? ' · ' + extra : ''}：\n分镜1｜画面：${kw}开头特写\n台词：别再这样做了…\n分镜2｜画面：演示正确做法\n台词：正确姿势是…\n分镜3｜画面：对比收尾\n台词：你学会了吗？关注我看更多`;
    }
    if (type === 'voice') {
      return `【${kw}】口播文案（本地草稿）：\n注意了！${kw}这件事，90%的人都做错了。\n其实关键就一点：……（展开干货）\n觉得有用记得点赞收藏，关注我每天一个干货。`;
    }
    return `【${kw}】小说/剧本开头（本地草稿）：\n${kw}的世界里，主角本过着平凡日子，直到那一天——一桩意外打破平静。\n（此处展开人物与冲突，留悬念）`;
  }
})();
