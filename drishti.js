#!/usr/bin/env node
'use strict';
const path = require('path');
const { Index } = require('../src/engine');
const { crawl } = require('../src/crawler');
const { createServer } = require('../src/server');

const FILE = process.env.DRISHTI_INDEX || path.join(__dirname, '..', 'data', 'index.json.gz');
const [cmd, ...args] = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i > -1 ? args.splice(i, 2)[1] : def; };

(async () => {
  if (cmd === 'seed') {
    const ix = Index.load(FILE);
    require('../src/seed').forEach((d) => ix.add(d));
    ix.save(FILE);
    console.log('Indexed starter pages.', ix.stats());
  } else if (cmd === 'crawl') {
    const max = +opt('max', 50), delay = +opt('delay', 500), all = args.includes('--all-hosts');
    const seeds = args.filter((a) => /^https?:\/\//.test(a));
    if (!seeds.length) return console.log('Usage: drishti crawl <url...> [--max 50] [--delay 500] [--all-hosts]');
    const ix = Index.load(FILE);
    const n = await crawl(seeds, { max, delay, sameHost: !all, onPage: (p) => { ix.add(p); console.log('+', p.url); } });
    ix.save(FILE);
    console.log(`Crawled ${n} pages.`, ix.stats());
  } else if (cmd === 'serve') {
    const port = +opt('port', process.env.PORT || 3000);
    const ix = Index.load(FILE);
    if (!ix.docs.length) { require('../src/seed').forEach((d) => ix.add(d)); ix.save(FILE); }
    createServer(ix).listen(port, () => console.log(`Drishti running at http://localhost:${port}`, ix.stats()));
  } else {
    console.log('Drishti\n  drishti seed\n  drishti crawl <url...> [--max N] [--delay ms] [--all-hosts]\n  drishti serve [--port 3000]');
  }
})();
