const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const HOST = '0.0.0.0';
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.mcfunction': 'text/plain; charset=utf-8',
};

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

function safeJoin(base, target) {
  const targetPath = path.posix.normalize('/' + target).replace(/^\/+/, '');
  const resolved = path.resolve(base, targetPath);
  if (!resolved.startsWith(path.resolve(base))) return null;
  return resolved;
}

function listDir(absPath, urlPath) {
  const entries = fs.readdirSync(absPath, { withFileTypes: true })
    .filter(e => !e.name.startsWith('.'))
    .sort((a, b) => (b.isDirectory() - a.isDirectory()) || a.name.localeCompare(b.name));
  const items = entries.map(e => {
    const name = e.name + (e.isDirectory() ? '/' : '');
    const href = path.posix.join(urlPath, e.name) + (e.isDirectory() ? '/' : '');
    return `<li><a href="${href}">${name}</a></li>`;
  }).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Index of ${urlPath}</title>
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;color:#222}
a{color:#2a6df4;text-decoration:none}a:hover{text-decoration:underline}
li{padding:.2rem 0}h1{font-size:1.2rem}nav a{margin-right:1rem}</style></head>
<body><nav><a href="/">🏠 Home</a><a href="/browse/">📂 Browse</a></nav>
<h1>Index of ${urlPath}</h1><ul>${urlPath !== '/browse/' ? '<li><a href="../">../</a></li>' : ''}${items}</ul></body></html>`;
}

function landingPage() {
  const readme = fs.existsSync(path.join(ROOT, 'README.md'))
    ? fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8') : '';
  const escaped = readme.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mano Royale — Minecraft Bedrock Add-on</title>
<style>
:root{color-scheme:light dark}
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:880px;margin:0 auto;padding:2rem 1.25rem;line-height:1.6;color:#1f2328}
header{background:linear-gradient(135deg,#3b8b3b,#1f5f1f);color:#fff;padding:2rem;border-radius:14px;margin-bottom:1.5rem}
header h1{margin:0 0 .25rem;font-size:2rem}header p{margin:0;opacity:.9}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin:1.5rem 0}
.card{background:#f6f8fa;border:1px solid #d0d7de;border-radius:10px;padding:1rem}
.card h3{margin:0 0 .5rem;font-size:1rem}
.card a{color:#2a6df4;text-decoration:none;font-weight:600}
.card a:hover{text-decoration:underline}
pre{background:#f6f8fa;border:1px solid #d0d7de;border-radius:8px;padding:1rem;overflow-x:auto;white-space:pre-wrap;font-size:.85rem;max-height:520px;overflow-y:auto}
.badge{display:inline-block;background:#1f5f1f;color:#fff;padding:.15rem .55rem;border-radius:999px;font-size:.75rem;margin-right:.35rem}
footer{margin-top:2rem;padding-top:1rem;border-top:1px solid #d0d7de;color:#656d76;font-size:.85rem}
</style></head>
<body>
<header>
  <h1>⛏️ Mano Royale <span class="badge">v1.1.0</span></h1>
  <p>Sistema de Segunda Mano Inteligente para Minecraft Bedrock Edition</p>
</header>

<p>Este proyecto es un <strong>add-on de Minecraft Bedrock</strong> (no una aplicación web).
Está compuesto por un <em>behavior pack</em> y un <em>resource pack</em> que se instalan en Minecraft.
Esta página te permite explorar los archivos del proyecto y leer la documentación.</p>

<div class="cards">
  <div class="card" style="background:#fff8d6;border-color:#e6b800"><h3>⬇️ Descargar .mcaddon</h3><a href="/download/mano-royale.mcaddon"><strong>mano-royale.mcaddon</strong> →</a><br><small>BP+RP combinados, listo para Minecraft</small></div>
  <div class="card"><h3>⬇️ Solo Behavior Pack</h3><a href="/download/mano-royale-BP.mcpack">.mcpack →</a></div>
  <div class="card"><h3>⬇️ Solo Resource Pack</h3><a href="/download/mano-royale-RP.mcpack">.mcpack →</a></div>
  <div class="card"><h3>📂 Behavior Pack</h3><a href="/browse/behavior_pack/">Explorar archivos →</a></div>
  <div class="card"><h3>🎨 Resource Pack</h3><a href="/browse/resource_pack/">Explorar archivos →</a></div>
  <div class="card"><h3>📄 Instalación</h3><a href="/INSTALL.md">INSTALL.md →</a></div>
  <div class="card"><h3>📱 Guía Android</h3><a href="/ANDROID_GUIDE.md">ANDROID_GUIDE.md →</a></div>
  <div class="card"><h3>🔧 Técnico</h3><a href="/TECHNICAL.md">TECHNICAL.md →</a></div>
  <div class="card"><h3>📋 Changelog</h3><a href="/CHANGELOG.md">CHANGELOG.md →</a></div>
</div>

<h2>README</h2>
<pre>${escaped}</pre>

<footer>Servido por un servidor estático en Replit · Puerto 5000</footer>
</body></html>`;
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);

    if (urlPath === '/' || urlPath === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...NO_CACHE });
      res.end(landingPage());
      return;
    }

    let relative = urlPath;
    if (urlPath.startsWith('/download/')) {
      relative = 'build/' + urlPath.slice('/download/'.length);
    } else if (urlPath.startsWith('/browse/')) relative = urlPath.slice('/browse/'.length);
    else if (urlPath.startsWith('/browse')) relative = '';

    const abs = safeJoin(ROOT, relative);
    if (!abs || !fs.existsSync(abs)) {
      res.writeHead(404, { 'Content-Type': 'text/plain', ...NO_CACHE });
      res.end('404 Not Found');
      return;
    }

    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      const browseUrl = urlPath.startsWith('/browse') ? urlPath : '/browse' + urlPath;
      const normalized = browseUrl.endsWith('/') ? browseUrl : browseUrl + '/';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...NO_CACHE });
      res.end(listDir(abs, normalized));
      return;
    }

    const ext = path.extname(abs).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, ...NO_CACHE });
    fs.createReadStream(abs).pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain', ...NO_CACHE });
    res.end('500 Server Error: ' + err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Mano Royale browser running at http://${HOST}:${PORT}`);
});
