'use strict';
const UA = 'DrishtiBot/1.0';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
  if (e[0] === '#') { const c = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1); return c ? String.fromCodePoint(c) : ' '; }
  return ENT[e.toLowerCase()] ?? m;
});

function parseHtml(html, base) {
  const title = decode((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || '').replace(/\s+/g, ' ').trim();
  const links = [];
  for (const m of html.matchAll(/<a\s[^>]*href\s*=\s*["']([^"'#]+)[^"']*["']/gi)) {
    try { const u = new URL(decode(m[1]), base); if (/^https?:$/.test(u.protocol)) { u.hash = ''; links.push(u.href); } } catch {}
  }
  const text = decode(html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|nav|footer)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  return { title, text, links };
}

async function robotsFor(origin, cache) {
  if (cache.has(origin)) return cache.get(origin);
  const rules = [];
  try {
    const r = await fetch(origin + '/robots.txt', { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      let applies = false;
      for (const line of (await r.text()).split('\n')) {
        const [k, ...v] = line.split('#')[0].split(':');
        const key = (k || '').trim().toLowerCase(), val = v.join(':').trim();
        if (key === 'user-agent') applies = val === '*' || val.toLowerCase().includes('drishti');
        else if (key === 'disallow' && applies && val) rules.push(val);
      }
    }
  } catch {}
  cache.set(origin, rules);
  return rules;
}

// Breadth-first crawl. Respects robots.txt Disallow rules and waits `delay` ms between requests.
async function crawl(seeds, { max = 50, delay = 500, sameHost = true, onPage = () => {} } = {}) {
  const hosts = new Set(seeds.map((s) => new URL(s).host));
  const queue = [...seeds], seen = new Set(seeds), robots = new Map();
  let count = 0;
  while (queue.length && count < max) {
    const url = queue.shift(), u = new URL(url);
    if ((await robotsFor(u.origin, robots)).some((p) => u.pathname.startsWith(p))) continue;
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, signal: AbortSignal.timeout(10000) });
      if (!res.ok || !/text\/html/i.test(res.headers.get('content-type') || '')) continue;
      const page = parseHtml((await res.text()).slice(0, 1_000_000), res.url);
      count++;
      onPage({ url: res.url, title: page.title, text: page.text });
      for (const l of page.links) {
        if (!seen.has(l) && (!sameHost || hosts.has(new URL(l).host))) { seen.add(l); queue.push(l); }
      }
    } catch (e) { console.error('skip', url, e.message); }
    await sleep(delay);
  }
  return count;
}

module.exports = { crawl, parseHtml };
