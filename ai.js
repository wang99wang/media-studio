/* ============ 大模型调用（OpenAI 兼容 /chat/completions）============ */
(function () {
  const AI = {
    // bind: { apiBase, apiKey, model }  sysPrompt/userText: string
    async chat(bind, sysPrompt, userText) {
      if (!bind || !bind.apiKey) throw new Error('该绑定未配置 API Key');
      let base = (bind.apiBase || '').replace(/\/+$/, '');
      if (!base) throw new Error('该绑定未配置接口基地址');
      const url = base + '/chat/completions';
      const body = {
        model: bind.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userText }
        ],
        temperature: 0.8
      };
      let res;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + bind.apiKey },
          body: JSON.stringify(body)
        });
      } catch (e) {
        throw new Error('网络或地址错误：' + (e.message || e));
      }
      if (!res.ok) {
        let msg = 'HTTP ' + res.status;
        try { const j = await res.json(); if (j.error && j.error.message) msg = j.error.message; } catch (e) {}
        throw new Error(msg);
      }
      const j = await res.json();
      const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!text) throw new Error('模型返回为空（检查模型名是否正确）');
      return text.trim();
    }
  };
  window.AI = AI;
})();
