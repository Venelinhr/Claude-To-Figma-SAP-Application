#!/usr/bin/env node
// rename.js — name a built frame through the SAP Bridge plugin (one tiny job, ~1 s, 0 tokens). Replaces the model's rename call after a PASS.
//   node build/rename.js <nodeId> "<name>" --file <figma file key>
'use strict';
const fs = require('fs'), path = require('path');
const PROJ = path.join(__dirname, '..'), BASE = 'http://127.0.0.1:41778';
const a = process.argv.slice(2), nodeId = a[0], name = a[1], fi = a.indexOf('--file'), fileKey = fi >= 0 ? a[fi + 1] : '';
if (!/^\d+[:-]\d+$/.test(nodeId || '') || !name || !fileKey) { console.log('usage: node build/rename.js <nodeId> "<name>" --file <key>'); process.exit(64); }
const token = (() => { try { return fs.readFileSync(path.join(PROJ, '.claude', '.bridge-token'), 'utf8').trim(); } catch (_) { return ''; } })();
const api = async (route, body, ms) => { const r = await fetch(`${BASE}${route}${route.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`, body === undefined ? { signal: AbortSignal.timeout(ms || 8000) } : { method: 'POST', body: JSON.stringify(body), signal: AbortSignal.timeout(ms || 15000) }); return { status: r.status, json: await r.json().catch(() => ({})) }; };
(async () => {
  const q = await api('/tree', { fileKey, name: 'rename', payload: { rename: { nodeId: nodeId.replace('-', ':'), name: String(name).slice(0, 120) } }, want: { geometry: false, audit: false, pngScale: 0 } });
  if (q.status !== 200 || !q.json.jobId) { console.log(`RENAME ✗ queue failed (${q.status}) ${(q.json && q.json.error) || ''}`); process.exit(1); }
  for (let i = 0; i < 12; i++) {
    const w = await api(`/tree/wait?jobId=${q.json.jobId}&timeout=2`, undefined, 6000).catch(() => null);
    if (w && w.json && (w.json.status === 'done' || w.json.ok === true)) { console.log(`RENAMED ${name}`); process.exit(0); }
    if (w && w.json && (w.json.status === 'error' || w.json.ok === false)) { console.log(`RENAME ✗ ${w.json.error || 'failed'}`); process.exit(1); }
  }
  console.log('RENAME ✗ timed out (is SAP Bridge open in the file?)'); process.exit(1);
})().catch(e => { console.log('RENAME ✗ ' + e.message); process.exit(1); });
