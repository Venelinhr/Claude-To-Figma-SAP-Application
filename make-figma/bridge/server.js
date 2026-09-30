#!/usr/bin/env node
'use strict';
/*
 * make-figma/bridge/server.js — the Make → Figma bridge. STANDALONE: no Claude, no model, no jobs, no mailbox.
 * Port 41779 (the old SAP Bridge keeps 41778 and is not touched). Node core only + the two Make modules of this repo.
 *
 *   plugin  GET  /health                 → { ok, app:'make-figma-bridge' }
 *   plugin  GET  /pair                   → { token }            (once, origin "null" = the Figma plugin sandbox)
 *   plugin  POST /make/fetch {url}       → { jobId }            (token in ?token=)
 *   plugin  GET  /make/job?jobId=        → { status, step, dump? }
 *   ext     GET  /ext/next               → { jobId, url } | {}  (long poll; the "Make → SAP" Chrome extension of this folder)
 *   ext     POST /ext/result {jobId,dump|error}
 * A published *.figma.site link is read by headless Chrome (build/make-fetch.js). A figma.com/make/… share link needs the user's
 * Figma login, so the extension reads it inside the user's own Chrome (bridge/make-link.js createExtQueue).
 */
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const ROOT = path.join(__dirname, '..', '..');
const makeLink = require(path.join(ROOT, 'bridge', 'make-link.js'));
const { fetchMakeDump } = require(path.join(ROOT, 'build', 'make-fetch.js'));

const PORT = Number(process.env.MAKE_FIGMA_PORT) || 41779;
const PAIR_FILE = process.env.MAKE_FIGMA_PAIR || path.join(__dirname, '..', '.pair.json');
const OUT = path.join(__dirname, '..', 'out');

const extQueue = makeLink.createExtQueue();
const jobs = makeLink.createMakeJobs({ fetchDump: (u, o) => (makeLink.checkUrl(u).kind === 'editor' ? extQueue.request(u, o) : fetchMakeDump(u, o)) });

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const sameStr = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const pairHash = () => { try { return JSON.parse(fs.readFileSync(PAIR_FILE, 'utf8')).sha256 || null; } catch (_) { return null; } };
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'null', 'Access-Control-Allow-Headers': 'Content-Type' }); res.end(JSON.stringify(obj)); };
function readBody(req, limit) {
  return new Promise((resolve) => {
    let b = '', over = false;
    req.on('data', (c) => { if (over) return; b += c; if (b.length > limit) { over = true; resolve({ __tooBig: true }); req.destroy(); } });
    req.on('end', () => { if (over) return; try { resolve(JSON.parse(b || '{}')); } catch (_) { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost'), p = url.pathname, org = String(req.headers.origin || '');
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': 'null', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' }); return res.end(); }
    if (p === '/health') return send(res, 200, { ok: true, app: 'make-figma-bridge', version: 1, paired: !!pairHash(), extension: extQueue.alive() });
    if (p === '/pair') {
      if (org !== 'null') return send(res, 403, { error: 'pairing only from the Make → Figma plugin' });
      if (pairHash()) return send(res, 409, { error: 'already paired' });
      const tok = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(PAIR_FILE, JSON.stringify({ sha256: sha256(tok), pairedAt: new Date().toISOString() }), { mode: 0o600 });
      console.log('[pair] plugin paired');
      return send(res, 200, { token: tok });
    }
    if (p === '/ext/next' || p === '/ext/result') {
      // /ext/next is a plain GET (Chrome may send no Origin): only a web-page origin is refused. Results (POST) must come from the extension.
      if (p === '/ext/next' ? /^https?:/i.test(org) : !org.startsWith('chrome-extension://')) return send(res, 403, { error: 'only the Make → SAP extension' });
      if (p === '/ext/next') { if (!extQueue.alive()) console.log('[ext] extension connected'); return send(res, 200, (await extQueue.next()) || {}); }
      const b = await readBody(req, 30e6);
      if (b.__tooBig) return send(res, 413, { error: 'dump too big' });
      if (b.dump) { try { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, 'last-dump.json'), String(b.dump)); } catch (_) {} }
      extQueue.result(b);
      return send(res, 200, { ok: true });
    }
    if (p === '/make/fetch' || p === '/make/job') {
      const h = pairHash(), t = url.searchParams.get('token') || '';
      if (!h || !sameStr(sha256(t), h)) return send(res, 401, { error: 'bad or missing token' });
      if (p === '/make/fetch') {
        const b = await readBody(req, 4000);
        if (b.__tooBig) return send(res, 400, { error: 'request too big' });
        const r = jobs.start(b.url, { width: b.width });
        if (r.error) return send(res, r.code || 400, { error: r.error });
        console.log(`[make ${r.id}] ${String(b.url).slice(0, 90)}`);
        return send(res, 200, { jobId: r.id });
      }
      const s = jobs.get(url.searchParams.get('jobId'));
      return s ? send(res, 200, s) : send(res, 404, { error: 'unknown make job' });
    }
    send(res, 404, { error: 'not found' });
  } catch (e) { try { send(res, 500, { error: String(e && e.message || e) }); } catch (_) {} }
});
server.listen(PORT, '127.0.0.1', () => console.log(`Make → Figma bridge on http://localhost:${PORT} (standalone, no Claude)`));
