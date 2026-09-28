#!/usr/bin/env node
// verify-tree.js — did Figma build the v5 tree exactly? (the SAP-execution gate for screens without an image plan)
//   node build/verify-tree.js <tree.json> <built.json>      built.json = dump-compact.use_figma.js of the build
// Per layer, in tree order: name · component · variant props · text typed inside · text style · colour variables.
// + HYGIENE: raw colour, non-72 font, generic layer names. Exit 0 = MATCH ≥ 95 % and hygiene 0.
const fs = require('fs');
const [tf, bf] = process.argv.slice(2);
if (!tf || !bf) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 5).join('\n')); process.exit(2); }
const raw = JSON.parse(fs.readFileSync(tf, 'utf8')), T = raw.tree || raw;
const built = JSON.parse(fs.readFileSync(bf, 'utf8')).filter(r => !['VECTOR', 'BOOLEAN_OPERATION'].includes(r[1]));
const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
const bad = [], hyg = []; let i = 0, ok = 0, total = 0;
(function walk(o) {
  const r = built[i++]; total++;
  const why = [];
  if (!r) why.push('not built');
  else {
    const [name, type, cp, vp, fill, stroke, st, text] = r;
    if (name !== o.n) why.push(`name "${name}"`);
    const tok = t => (typeof t === 'string' && !t.startsWith('RAW') ? t : '');
    if (o.k === 't') {
      if (type !== 'TEXT') why.push(`is ${type}`);
      if (text !== String(o.t).slice(0, 60)) why.push(`text "${text}"`);
      if (o.st && st !== o.st) why.push(`style ${st || 'none'}, tree ${o.st}`);
      if (tok(o.bg) && fill !== o.bg) why.push(`colour ${fill}, tree ${o.bg}`);
    } else if (o.k === 'i' || o.k === 'ic') {
      if (type !== 'INSTANCE') why.push(`is ${type}`);
      else if (o.k === 'i' && cp !== o.cp) why.push(`component ${cp}, tree ${o.cp}`);
      else if (o.k === 'ic' && cp !== o.ic) why.push(`icon ${cp}, tree ${o.ic}`);
      for (const [k, v] of Object.entries(o.pr || {})) if (k in (vp || {}) && !same(vp[k], v)) why.push(`${k}=${vp[k]}, tree ${v}`);
      for (const v of Object.values(o.tx || {})) if (!(r[9] || []).some(t => t === String(v).slice(0, 40))) why.push(`inner text "${v}" missing`);
    } else {
      if (tok(o.bg) && fill !== o.bg) why.push(`fill ${fill || 'none'}, tree ${o.bg}`);
      if (tok(o.bc) && stroke !== o.bc) why.push(`border ${stroke || 'none'}, tree ${o.bc}`);
    }
  }
  if (why.length) bad.push(`${o.n}: ${why.join(' · ')}`); else ok++;
  if (!o.k) (o.c || []).forEach(walk);
})(T);
for (const r of built) {
  if (r[4] === 'RAW' || r[5] === 'RAW') hyg.push(`"${r[0]}": raw colour`);
  if (r[1] === 'TEXT' && r[8] && r[8] !== '72') hyg.push(`"${r[0]}": font ${r[8]}`);
  if (r[1] === 'FRAME' && /^(frame|group|rectangle)\s*\d*$/i.test(r[0])) hyg.push(`"${r[0]}": generic name`);
}
const pct = Math.round(ok / total * 100);
console.log(`MATCH ${pct}%  (${ok} of ${total} tree layers built exactly)`);
console.log(`WRONG (${bad.length})${bad.length ? '\n  - ' + bad.slice(0, 30).join('\n  - ') : ''}`);
console.log(`HYGIENE (${hyg.length})${hyg.length ? '\n  - ' + hyg.join('\n  - ') : ''}`);
const pass = pct >= 95 && !hyg.length;
console.log(`VERDICT: ${pass ? 'PASS' : 'FIX THE ITEMS ABOVE'}`);
process.exit(pass ? 0 : 1);
