#!/usr/bin/env node
// flip.js — invert ONE assumption of a build-first run with ONE tree property, then rebuild with run.js --resume.
//   node build/flip.js density <job>                     Form Factor Compact ⇄ Cozy on every kit instance that has one
//   node build/flip.js text <job> "<old>" "<new>"        one exact text (text leaf, inner text or ✏️ prop) replaced — e.g. an OCR-unsure text
// Only these two flips exist, because only these map to exactly one tree property. Anything else in the ledger has flip: null —
// change it with /screen tweak or an edit of tree.json. Geometry is never touched (door.js --baseline stays green).
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), [id, job, a, b] = process.argv.slice(2);
if (!id || !job) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(64); }
const treeF = path.resolve(ROOT, job, 'tree.json'), ledgerF = path.resolve(ROOT, job, 'assumed.json');
if (!fs.existsSync(treeF)) { console.log(`no tree.json in ${job}`); process.exit(64); }
const raw = JSON.parse(fs.readFileSync(treeF, 'utf8')), T = raw.tree || raw;
let n = 0, msg = '';
if (id === 'density') {
  const seen = new Set();
  (function w(o) { if (o.k === 'i' && o.pr && o.pr['Form Factor']) { seen.add(o.pr['Form Factor']); o.pr['Form Factor'] = o.pr['Form Factor'] === 'Compact' ? 'Cozy' : 'Compact'; n++; } (o.c || []).forEach(w); })(T);
  msg = `density: ${n} kit instance(s) flipped (${[...seen].join(', ')} → the other)`;
} else if (id === 'text') {
  if (a == null || b == null) { console.log('usage: flip.js text <job> "<old>" "<new>"'); process.exit(64); }
  (function w(o) {
    if (o.k === 't' && o.t === a) { o.t = b; n++; }
    for (const k of Object.keys(o.tx || {})) if (o.tx[k] === a) { o.tx[k] = b; n++; }
    for (const k of Object.keys(o.pr || {})) if (k.startsWith('✏️') && o.pr[k] === a) { o.pr[k] = b; n++; }
    (o.c || []).forEach(w);
  })(T);
  msg = `text: ${n} place(s) "${a}" → "${b}"`;
} else { console.log(`no flip "${id}" — only density and text map to one tree property; use /screen tweak for the rest`); process.exit(1); }
if (!n) { console.log(`nothing to flip for "${id}" in ${job}`); process.exit(1); }
fs.writeFileSync(treeF, JSON.stringify(raw.tree ? { ...raw, tree: T } : T));
try { const L = JSON.parse(fs.readFileSync(ledgerF, 'utf8')); for (const x of L.assumed || []) if (x.flip === id) x.flipped = true; fs.writeFileSync(ledgerF, JSON.stringify(L, null, 1)); } catch (_) {}
console.log(`FLIPPED ${msg}\nNEXT  node build/run.js --job ${job} --file <key> --resume`);
