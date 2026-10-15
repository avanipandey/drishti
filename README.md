# Drishti (दृष्टि)

A small search engine in Node.js with no dependencies. It crawls pages, builds an inverted index, ranks results with BM25 (title matches count triple) and serves a web UI and JSON API.

Requires Node 18 or newer.

```bash
node bin/drishti.js serve                          # starts at http://localhost:3000 with starter pages
node bin/drishti.js crawl https://example.com --max 100   # add pages (same host only by default)
node bin/drishti.js serve --port 8080
```

- Search page: `/search?q=taj mahal`
- JSON API: `/api/search?q=space&page=1`, `/api/stats`
- Index file: `data/index.json.gz` (override with `DRISHTI_INDEX`)

The crawler identifies itself as `DrishtiBot/1.0`, obeys `Disallow` rules in robots.txt and waits 500 ms between requests. Crawl only sites you have permission to crawl.

Limits: the index is held in memory (fine for tens of thousands of pages), English suffix stemming only, no phrase queries. Hindi and other scripts are indexed as exact words.
