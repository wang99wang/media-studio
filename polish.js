/* ============ 文案润色引擎 + 内容灵感库 ============ */
(function () {
  // ---- 本地规则润色（非云端 AI，纯前端模板+词库）----
  const HOOKS = ['注意了，', '别划走！', '90%的人都不知道，', '今天教你一招，', '说实话，', '我敢打赌，', '你绝对想不到，', '听好了，', '划重点——'];
  const CTAS = ['评论区告诉我你的想法👇', '点个赞收藏，下次找得到！', '关注我，每天一个干货💡', '你觉得呢？说说看～', '转发给需要的朋友🤝'];
  const EMOTE = [
    ['很好', '真的太顶了'], ['重要', '关键来了'], ['可以', '完全没问题'],
    ['很多', '超多'], ['时候', '关键时刻'], ['问题', '大坑'], ['方法', '野路子'],
    ['注意', '千万注意'], ['觉得', '个人觉得'], ['因为', '说白了就是因为']
  ];
  const EMOJI_BLOCKS = ['✨', '🔥', '💡', '⚠️', '📌', '🎯', '💥', '🌟'];

  function pick(arr, i) { return arr[((i % arr.length) + arr.length) % arr.length]; }
  function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

  const Polish = {
    styles: [
      { id: 'douyin', name: '抖音口播' },
      { id: 'xhs', name: '小红书' },
      { id: 'ganhuo', name: '干货专业' },
      { id: 'story', name: '剧情悬念' },
      { id: 'short', name: '精简去水' }
    ],
    run(text, style) {
      text = (text || '').trim();
      if (!text) return { out: '', words: 0, seconds: 0, note: '请输入要润色的文案' };
      let out = text;
      const seed = hashStr(text);
      if (style === 'short') {
        out = text.replace(/[，,。.\s]{2,}/g, '，').replace(/\b(其实|然后|就是说|那个|嗯|啊)\b/g, '').replace(/\s+/g, '');
      } else {
        // 情绪词替换
        EMOTE.forEach(([a, b]) => { out = out.split(a).join(b); });
        let parts = out.split(/(?<=[。！？!?])/).filter(p => p.trim());
        if (parts.length === 0) parts = [out];
        const hook = (style !== 'ganhuo') ? pick(HOOKS, seed) : '';
        const cta = (style !== 'ganhuo') ? pick(CTAS, seed >> 3) : '';
        if (style === 'xhs') {
          out = parts.map((p, i) => pick(EMOJI_BLOCKS, seed + i) + ' ' + p.trim()).join('\n');
          out = '# ' + (text.slice(0, 12)) + '\n' + out + '\n\n#干货分享 #自媒体 #创作日常';
        } else if (style === 'ganhuo') {
          out = parts.map((p, i) => (i + 1) + '. ' + p.trim()).join('\n');
        } else if (style === 'story') {
          out = hook + parts[0];
          for (let i = 1; i < parts.length; i++) out += (i === 1 ? '\n\n' : '\n') + parts[i];
          out += '\n\n（未完待续…想知道后面怎么反转？评论区扣 1）';
        } else { // douyin
          out = hook + parts.join('') ;
          out += '\n\n' + cta;
        }
      }
      const words = out.replace(/[\s\n#️⃣✨🔥💡⚠️📌🎯💥🌟👇🤝]/g, '').length;
      return { out, words, seconds: Math.max(1, Math.round(words / 4)), note: '' };
    }
  };

  // ---- 内容库（种子/模板）----
  const Libs = {
    topicSeed() {
      return [
        { title: '3个被低估的手机剪辑技巧', cat: '剪辑教程', heat: 92, status: '灵感', note: '适合新手，易出爆款' },
        { title: '我是怎么靠副业月入过万的', cat: '搞钱纪实', heat: 88, status: '待写', note: '真实感强，注意合规' },
        { title: '新手做自媒体最常见的5个坑', cat: '避坑干货', heat: 95, status: '已发', note: '完播率通常高' },
        { title: '一条视频讲清什么是信息差', cat: '认知科普', heat: 76, status: '灵感', note: '可做系列' },
        { title: '周末在家就能拍的治愈vlog', cat: '生活vlog', heat: 81, status: '待写', note: '无需出镜' }
      ];
    },
    inspo(dateStr) {
      const pool = [
        '用「反常识」开头：把大家以为对的结论先否定掉。',
        '拍一段「失败过程」比拍成功更有代入感。',
        '把干货做成「清单体」：1、2、3 点，完播更高。',
        '今天试试竖屏近景+字幕，沉浸感更强。',
        '蹭一个热点，但角度要冷门，避免同质化。',
        '用「你有没有过这种经历」开场，瞬间拉共鸣。',
        '把一个大话题拆成 7 天连载，提升关注。',
        '评论区找选题：高赞提问就是下期内容。',
        '用对比图/前后对比做封面，点击率更高。',
        '录一段「边做边讲」的过程，真实感拉满。',
        '热点 + 你的专业 = 独特视角，别纯搬运。',
        '今天拍一条「纠错视频」，回应上次翻车。'
      ];
      const h = hashStr(dateStr || U.today());
      const out = [];
      for (let i = 0; i < 4; i++) out.push(pick(pool, h + i * 7 + 3));
      return out;
    },
    hot() {
      return [
        { tag: '#今日热榜', topic: '夏日出行攻略大赏', heat: 980 },
        { tag: '#AI', topic: '普通人怎么用 AI 提效', heat: 872 },
        { tag: '#副业', topic: '轻资产小本创业', heat: 765 },
        { tag: '#生活', topic: '极简收纳好物', heat: 690 },
        { tag: '#职场', topic: '远程办公真实体验', heat: 612 }
      ];
    },
    radar() {
      return [
        { src: '短视频平台', kw: '治愈系美食', trend: '↑ 上升', note: '近期美食+情绪价值内容增量明显' },
        { src: '社交平台', kw: 'AI工具测评', trend: '↑ 上升', note: '实用向测评完播高' },
        { src: '搜索引擎', kw: '新手剪辑教程', trend: '→ 平稳', note: '长尾稳定流量' },
        { src: '电商', kw: '平价好物', trend: '↑ 上升', note: '可结合带货' }
      ];
    },
    refer() {
      return [
        { title: '爆款开头3秒模板合集', type: '结构参考', desc: '收集了20种高完播开头句式，可拆解套用' },
        { title: '知识类账号视觉规范', type: '排版参考', desc: '统一字体/配色/转场，提升专业感' },
        { title: '剧情号反转脚本10例', type: '剧本参考', desc: '前因-冲突-反转-升华结构拆解' },
        { title: '带货口播话术库', type: '话术参考', desc: '痛点-方案-证据-促单四段式' }
      ];
    },
    scripts() {
      return [
        { name: '知识口播·三段式', cat: '口播', tpl: '钩子（反常识）→ 干货（123点）→ 行动号召。示例：「别再这样存钱了…第一…第二…关注我下期讲」' },
        { name: '剧情·误会反转', cat: '剧情', tpl: '日常场景 → 产生误会 → 真相揭晓 → 温情/搞笑收尾。适合 30-60s 竖屏。' },
        { name: '带货·四段式', cat: '带货', tpl: '痛点引入 → 展示产品 → 使用证据 → 限时优惠促单。' },
        { name: 'vlog·旁白模板', cat: 'vlog', tpl: '今天发生了什么 → 过程中有趣细节 → 感悟收尾。自然口语化。' },
        { name: '盘点·清单体', cat: '口播', tpl: '「这5个XX，第3个绝了」→ 逐一快讲 → 互动提问。' }
      ];
    },
    novelGen(genre, kw) {
      genre = genre || '都市';
      kw = (kw || '逆袭').split(/[\s,，、]/).filter(Boolean);
      const hero = kw[0] || '林默';
      const item = kw[1] || '一块旧怀表';
      const title = genre + '：《' + hero + '与' + (kw[1] || '命运') + '》';
      const outline = [
        '第一章·开局：' + hero + '在平凡日子里意外得到' + item + '，生活出现转机。',
        '第二章·冲突：看似好运背后藏着代价，身边人态度开始变化。',
        '第三章·低谷：失去重要之物，主角陷入自我怀疑。',
        '第四章·反转：发现' + item + '真正秘密，绝地反击。',
        '第五章·结局：和解与成长，留下开放悬念。'
      ];
      return { title, outline: outline.join('\n') };
    }
  };
  window.Polish = Polish;
  window.Libs = Libs;
})();
