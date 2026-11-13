// Spuštění u sebe na počítači: node server.js  → otevři http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');

// načte .env (OPENAI_API_KEY=...)
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const transcribe = require('./api/transcribe');
const PORT = process.env.PORT || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json', '.wasm': 'application/wasm', '.data': 'application/octet-stream', '.tflite': 'application/octet-stream', '.binarypb': 'application/octet-stream', '.txt': 'text/plain; charset=utf-8' };

http.createServer((req, res) => {
  if (req.url.startsWith('/api/transcribe')) return transcribe(req, res);
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(__dirname, 'public', path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('Nenalezeno'); }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
}).listen(PORT, () => console.log(`EFEKTIVE Captions běží na http://localhost:${PORT}`));
