/* ============================================================
 * 局域网共享服务（零依赖 Node）
 *  - 静态托管当前目录（PWA 前端）
 *  - /api/ping   探测服务是否可用
 *  - /api/data   GET 取全量数据 / POST 写全量数据
 *  - 数据统一存 data.json（手机 + 电脑共享同一份）
 * 用法: node server.js   (默认端口 18788, 可用 PORT 环境变量覆盖)
 * ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data.json');
const PORT = Number(process.env.PORT || 18788);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg'
};

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const j = JSON.parse(raw);
    if (!j || typeof j !== 'object') return { _ts: 0, data: {} };
    if (!j.data || typeof j.data !== 'object') j.data = {};
    return j;
  } catch (e) {
    return { _ts: 0, data: {} };
  }
}

function writeData(obj) {
  try {
    if (fs.existsSync(DATA_FILE)) {
      fs.copyFileSync(DATA_FILE, DATA_FILE + '.bak');
    }
  } catch (e) { /* 备份失败不阻断 */ }
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj), 'utf8');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', c => {
      b += c;
      if (b.length > 50 * 1024 * 1024) { reject(new Error('payload too large')); req.destroy(); }
    });
    req.on('end', () => resolve(b));
    req.on('error', reject);
  });
}

function json(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(s)
  });
  res.end(s);
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(buf);
  });
}

function lanIPs() {
  const out = [];
  const ifs = os.networkInterfaces();
  Object.keys(ifs).forEach(k => {
    (ifs[k] || []).forEach(i => {
      if (i.family === 'IPv4' && !i.internal) out.push(i.address);
    });
  });
  return out;
}

const server = http.createServer(async (req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://' + (req.headers.host || 'localhost')).pathname);
  } catch (e) {
    pathname = '/';
  }

  // ---------- API ----------
  if (pathname === '/api/ping') {
    return json(res, 200, { ok: true, ts: Date.now(), file: path.basename(DATA_FILE) });
  }

  if (pathname === '/api/data') {
    if (req.method === 'GET') {
      return json(res, 200, readData());
    }
    if (req.method === 'POST') {
      try {
        const incoming = JSON.parse(await readBody(req));
        if (!incoming || typeof incoming !== 'object') throw new Error('bad payload');
        // 合并策略：按 store 逐条，以 updated 时间戳较新者胜出
        const cur = readData();
        const merged = { _ts: Date.now(), data: {} };
        const names = new Set([].concat(Object.keys(cur.data || {}), Object.keys(incoming.data || {})));
        names.forEach(s => {
          const a = (cur.data || {})[s] || [];
          const b = (incoming.data || {})[s] || [];
          const map = new Map();
          a.forEach(it => { if (it && it.id) map.set(String(it.id), it); });
          b.forEach(it => {
            if (!it || !it.id) return;
            const key = String(it.id);
            const ex = map.get(key);
            if (!ex || (Number(it.updated) || 0) >= (Number(ex.updated) || 0)) map.set(key, it);
          });
          merged.data[s] = Array.from(map.values());
        });
        writeData(merged);
        return json(res, 200, { ok: true, ts: merged._ts });
      } catch (e) {
        return json(res, 400, { ok: false, error: String(e && e.message || e) });
      }
    }
    return json(res, 405, { ok: false, error: 'method not allowed' });
  }

  // ---------- 静态文件 ----------
  let rel = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.join(ROOT, rel);
  // 防目录穿越
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 Forbidden');
  }
  fs.stat(filePath, (err, st) => {
    if (!err && st.isDirectory()) filePath = path.join(filePath, 'index.html');
    sendFile(res, filePath);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = lanIPs();
  console.log('============================================');
  console.log('  Media Studio LAN Server');
  console.log('============================================');
  console.log('  本机访问:   http://localhost:' + PORT + '/');
  ips.forEach(ip => console.log('  同 WiFi:    http://' + ip + ':' + PORT + '/'));
  console.log('  数据文件:   ' + DATA_FILE);
  console.log('--------------------------------------------');
  console.log('  手机/其他电脑连同一 WiFi 后，用上面"同 WiFi"地址打开，');
  console.log('  即可与本机共享同一份数据。');
  console.log('  按 Ctrl+C 停止服务。');
  console.log('============================================');
});
