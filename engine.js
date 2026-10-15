'use strict';
const fs = require('fs');
const zlib = require('zlib');

const STOP = new Set(('a an and are as at be by for from has have he in is it its of on or that the to was were will with ' +
  'this these those not but if then than so such into over also can may who what when where how which their there they you your we our ' +
  'और का की के है में से को पर यह एक').split(' '));

const WORD = /[\p{L}\p{M}\p{N}]+/gu;
const words = (s) => (s.toLowerCase().match(WORD) || []).filter((w) => !STOP.has(w));

// Light English suffix stripping; other scripts (e.g. Devanagari) pass through unchanged.
function stem(w) {
  if (!/^[a-z]+$/.test(w) || w.length < 5) return w;
  const s = w.replace(/(ingly|edly|ing|ed|es|ly|s)$/, '');
  return s.length >= 3 ? s : w;
}
const tokenize = (s) => words(s).map(stem);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

class Index {
  constructor() { this.docs = []; this.post = new Map(); this.urls = new Set(); this.totalLen = 0; }

  add({ url, title, text }) {
    if (!url || this.urls.has(url)) return false;
    const id = this.docs.length;
    const tf = new Map();
    const bump = (t, w) => tf.set(t, (tf.get(t) || 0) + w);
    const tt = tokenize(title || ''), bt = tokenize(text || '');
    tt.forEach((t) => bump(t, 3));            // title matches count triple
    bt.forEach((t) => bump(t, 1));
    const len = tt.length + bt.length;
    this.docs.push({ url, title: title || url, text: (text || '').slice(0, 20000), len });
    this.urls.add(url);
    this.totalLen += len;
    for (const [t, n] of tf) {
      if (!this.post.has(t)) this.post.set(t, []);
      this.post.get(t).push([id, n]);
    }
    return true;
  }

  // BM25 ranking; documents matching every query term get a boost.
  search(q, { limit = 10, offset = 0 } = {}) {
    const terms = [...new Set(tokenize(q))];
    const N = this.docs.length;
    if (!terms.length || !N) return { total: 0, hits: [] };
    const avg = this.totalLen / N, k1 = 1.2, b = 0.75;
    const score = new Map(), seen = new Map();
    for (const t of terms) {
      const list = this.post.get(t);
      if (!list) continue;
      const idf = Math.log(1 + (N - list.length + 0.5) / (list.length + 0.5));
      for (const [id, tf] of list) {
        const norm = tf + k1 * (1 - b + b * (this.docs[id].len / avg));
        score.set(id, (score.get(id) || 0) + idf * ((tf * (k1 + 1)) / norm));
        seen.set(id, (seen.get(id) || 0) + 1);
      }
    }
    const ranked = [...score].map(([id, s]) => [id, s * (seen.get(id) / terms.length) ** 2])
      .sort((a, c) => c[1] - a[1]);
    const hits = ranked.slice(offset, offset + limit).map(([id, s]) => {
      const d = this.docs[id];
      return { url: d.url, title: d.title, snippet: this.snippet(d.text, q), score: +s.toFixed(3) };
    });
    return { total: ranked.length, hits };
  }

  // Returns HTML-safe text with query words wrapped in <mark>.
  snippet(text, q, size = 220) {
    const ws = words(q);
    if (!text) return '';
    if (!ws.length) return esc(text.slice(0, size));
    const re = new RegExp(ws.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'iu');
    const m = re.exec(text);
    const start = m ? Math.max(0, m.index - 70) : 0;
    let win = text.slice(start, start + size);
    if (start > 0) win = '…' + win.replace(/^\S*\s/, '');
    if (start + size < text.length) win += '…';
    return esc(win).replace(new RegExp('(' + ws.map((w) => esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'giu'), '<mark>$1</mark>');
  }

  stats() { return { documents: this.docs.length, terms: this.post.size }; }

  save(file) {
    fs.mkdirSync(require('path').dirname(file), { recursive: true });
    const data = JSON.stringify({ docs: this.docs, post: [...this.post] });
    fs.writeFileSync(file, zlib.gzipSync(data));
  }

  static load(file) {
    const ix = new Index();
    if (!fs.existsSync(file)) return ix;
    const { docs, post } = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));
    ix.docs = docs; ix.post = new Map(post);
    ix.urls = new Set(docs.map((d) => d.url));
    ix.totalLen = docs.reduce((a, d) => a + d.len, 0);
    return ix;
  }
}

module.exports = { Index, tokenize };
