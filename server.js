'use strict';
const http = require('http');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CSS = `
:root{--bg:#f5f6fa;--ink:#14173b;--mute:#5a5f80;--accent:#2a3fbf;--line:#d9dcea;--mark:#ffd96b}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI","Noto Sans Devanagari",sans-serif}
a{color:inherit}
:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.wrap{max-width:680px;margin:0 auto;padding:0 20px}
.brand{display:flex;align-items:center;gap:14px;text-decoration:none}
.brand b{font:600 2rem/1 Georgia,"Palatino Linotype",serif;letter-spacing:-.01em}
.brand i{font-style:normal;color:var(--mute);font-size:1rem}
.eye{width:44px;height:44px;flex:none}
form{display:flex;gap:8px}
input[type=search]{flex:1;min-width:0;font:inherit;padding:12px 14px;border:1.5px solid var(--ink);border-radius:6px;background:#fff;color:var(--ink)}
button{font:inherit;font-weight:600;padding:0 20px;border:0;border-radius:6px;background:var(--ink);color:#fff;cursor:pointer}
button:hover{background:var(--accent)}
.home{padding-top:18vh}
.home .brand b{font-size:3.4rem}.home .eye{width:72px;height:72px}
.home form{margin-top:28px}
.note{color:var(--mute);margin-top:14px;font-size:.9rem}
header{border-bottom:1px solid var(--line);background:#fff;padding:14px 0}
header .wrap{display:flex;gap:20px;align-items:center}
header form{flex:1}
.meta{color:var(--mute);font-size:.9rem;margin:18px 0 4px}
.r{padding:14px 0;border-bottom:1px solid var(--line)}
.r h2{margin:0;font-size:1.15rem}.r h2 a{color:var(--accent);text-decoration:none}.r h2 a:hover{text-decoration:underline}
.r .u{font-size:.82rem;color:var(--mute);overflow-wrap:anywhere}
.r p{margin:4px 0 0}
mark{background:var(--mark);color:inherit;padding:0 1px;border-radius:2px}
.pager{display:flex;justify-content:space-between;padding:20px 0 40px}
.pager a{color:var(--accent);font-weight:600}
.empty{padding:28px 0}
@media (prefers-reduced-motion:no-preference){.pupil{transition:transform .12s ease-out}}`;

// The mark: an eye whose pupil follows the pointer on the home page.
const EYE = `<svg class="eye" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="#14173b" stroke-width="2.5"/><circle cx="24" cy="24" r="13" fill="none" stroke="#2a3fbf" stroke-width="2.5"/><circle class="pupil" cx="24" cy="24" r="6" fill="#14173b"/></svg>`;
const logo = `<a class="brand" href="/">${EYE}<b>Drishti</b><i>दृष्टि</i></a>`;
const box = (q) => `<form action="/search" role="search"><input type="search" name="q" value="${esc(q)}" placeholder="Search Drishti" aria-label="Search" autofocus><button>Search</button></form>`;
const page = (title, body, script = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}${script}</body></html>`;

const MOVE = `<script>const p=document.querySelector('.pupil');if(p&&!matchMedia('(prefers-reduced-motion:reduce)').matches)addEventListener('pointermove',e=>{const r=p.ownerSVGElement.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),d=Math.hypot(dx,dy)||1,k=Math.min(7,d/40);p.style.transform='translate('+dx/d*k+'px,'+dy/d*k+'px)'})</script>`;

function createServer(index, { perPage = 10 } = {}) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const send = (code, type, body) => { res.writeHead(code, { 'content-type': type + '; charset=utf-8', 'x-content-type-options': 'nosniff' }); res.end(body); };
    const q = (url.searchParams.get('q') || '').trim().slice(0, 200);
    const pg = Math.max(1, parseInt(url.searchParams.get('page'), 10) || 1);

    if (url.pathname === '/') {
      const s = index.stats();
      return send(200, 'text/html', page('Drishti', `<main class="wrap home">${logo}${box('')}<p class="note">${s.documents} pages indexed. No tracking, no ads.</p></main>`, MOVE));
    }
    if (url.pathname === '/api/search') {
      const t = process.hrtime.bigint();
      const r = index.search(q, { limit: Math.min(50, +url.searchParams.get('limit') || perPage), offset: (pg - 1) * perPage });
      return send(200, 'application/json', JSON.stringify({ query: q, ms: Number(process.hrtime.bigint() - t) / 1e6, ...r }));
    }
    if (url.pathname === '/api/stats') return send(200, 'application/json', JSON.stringify(index.stats()));
    if (url.pathname === '/search') {
      const t = process.hrtime.bigint();
      const r = index.search(q, { limit: perPage, offset: (pg - 1) * perPage });
      const ms = (Number(process.hrtime.bigint() - t) / 1e6).toFixed(1);
      const link = (n) => `/search?q=${encodeURIComponent(q)}&page=${n}`;
      const items = r.hits.map((h) => `<article class="r"><h2><a href="${esc(h.url)}">${esc(h.title)}</a></h2><div class="u">${esc(h.url)}</div><p>${h.snippet}</p></article>`).join('');
      const body = `<header><div class="wrap">${logo}${box(q)}</div></header><main class="wrap">` +
        (r.total ? `<p class="meta">${r.total} result${r.total > 1 ? 's' : ''} in ${ms} ms</p>${items}<nav class="pager"><span>${pg > 1 ? `<a href="${link(pg - 1)}">Previous</a>` : ''}</span><span>${pg * perPage < r.total ? `<a href="${link(pg + 1)}">Next</a>` : ''}</span></nav>`
          : `<div class="empty"><p><b>No results for “${esc(q)}”.</b></p><p class="note">Check the spelling, try fewer words, or add pages with <code>drishti crawl &lt;url&gt;</code>.</p></div>`) + `</main>`;
      return send(200, 'text/html', page(`${q} – Drishti`, body));
    }
    send(404, 'text/plain', 'Not found');
  });
}

module.exports = { createServer };
