#!/usr/bin/env node
// Instant SAP Web UI Kit lookups from knowledge/live/kit.json — use INSTEAD of Figma discovery calls.
//   node build/kit.js c <name|regex>        component: key, size, every prop key + values
//   node build/kit.js list [page-regex]     component names (+page) — find the right component
//   node build/kit.js v <regex>             variables: name, key, light value
//   node build/kit.js hex <#rrggbb> [n]     nearest COLOR variables to a measured colour
//   node build/kit.js t [regex]             text styles: name, key, font, size, line height
//   node build/kit.js i <regex>             icons: name → key
//   node build/kit.js e [regex]             effect styles (shadows)
//   node build/kit.js pack <name...>        print `const KIT = {...}` for the build prelude
//        (names: component names, text style names, token short names e.g. sapTitleColor, icon names)
const kit = require('../knowledge/live/kit.json');
// + SAP icons the kit's Iconography page lacks (suitcase, meal, share-arrow…) — see icons-extra.json
for (const [n, v] of Object.entries(require('../knowledge/live/icons-extra.json').icons)) kit.icons['sap-icons/' + n] = v.key;
const [cmd, q = '', n = '6'] = process.argv.slice(2);
const re = new RegExp(q, 'i');
const out = s => console.log(s);
const hexRgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
// resolve alias chains to a final light value
const resolve = (name, d = 0) => { const v = kit.vars[name]; if (!v) return '?'; const val = v.split('|')[2];
  return val.startsWith('→') && d < 8 ? resolve(val.slice(1), d + 1) : val; };
if (cmd === 'c') {
  const exact = Object.keys(kit.components).filter(k => k.toLowerCase() === q.toLowerCase());
  const hits = exact.length ? exact : Object.keys(kit.components).filter(k => re.test(k)).slice(0, 5);
  if (!hits.length) out('no component matches ' + q + ' — try: node build/kit.js list');
  for (const name of hits) { const c = kit.components[name];
    out(`${name}  [${c.page}] ${c.type} key=${c.key} default=${c.w}x${c.h}`);
    for (const [k, v] of Object.entries(c.props)) out(`  ${JSON.stringify(k)}  ${v}`); }
} else if (cmd === 'list') {
  for (const [name, c] of Object.entries(kit.components)) if (re.test(c.page) || re.test(name)) out(`${name}  [${c.page}] ${c.w}x${c.h}`);
} else if (cmd === 'v') {
  for (const [name, v] of Object.entries(kit.vars)) if (re.test(name)) { const [key, t] = v.split('|'); out(`${name}  ${t} key=${key} = ${resolve(name)}`); }
} else if (cmd === 'hex') {
  const [r, g, b] = hexRgb(q); const rows = [];
  for (const [name, v] of Object.entries(kit.vars)) { if (v.split('|')[1] !== 'C') continue;
    const val = resolve(name); if (!/^#[0-9a-f]{6}$/i.test(val)) continue;
    const [r2, g2, b2] = hexRgb(val); rows.push([Math.hypot(r - r2, g - g2, b - b2), name, val, v.split('|')[0]]); }
  rows.sort((a, b) => a[0] - b[0]).slice(0, +n).forEach(([d, name, val, key]) => out(`Δ${d.toFixed(0)}  ${name}  ${val}  key=${key}`));
} else if (cmd === 't') {
  for (const [name, v] of Object.entries(kit.text)) if (re.test(name)) out(`${name}  ${v}`);
} else if (cmd === 'i') {
  for (const [name, key] of Object.entries(kit.icons)) if (re.test(name)) out(`${name}  ${key}`);
} else if (cmd === 'e') {
  for (const [name, key] of Object.entries(kit.effects)) if (re.test(name)) out(`${name}  ${key}`);
} else if (cmd === 'pack') {
  const names = process.argv.slice(3), K = { c: {}, v: {}, t: {}, i: {} }, miss = [];
  const low = o => Object.fromEntries(Object.keys(o).map(k => [k.toLowerCase(), k]));
  const lc = low(kit.components), lt = low(kit.text), li = low(kit.icons);
  const vShort = {}; for (const f of Object.keys(kit.vars)) { const s = f.split('/').pop(); (vShort[s.toLowerCase()] ||= []).push(f); }
  const iShort = {}; for (const f of Object.keys(kit.icons)) { const s = f.split('/').pop().toLowerCase(); (iShort[s] ||= f); }
  for (const nm of names) { const l = nm.toLowerCase();
    if (lc[l]) K.c[nm] = kit.components[lc[l]].key;
    else if (lt[l]) K.t[nm] = kit.text[lt[l]].split('|')[0];
    else if (kit.vars[nm]) K.v[nm] = kit.vars[nm].split('|')[0];
    else if (vShort[l]) { K.v[nm] = kit.vars[vShort[l][0]].split('|')[0]; if (vShort[l].length > 1) miss.push(`${nm}: ${vShort[l].length} vars share this short name, used ${vShort[l][0]}`); }
    else if (li[l]) K.i[nm] = kit.icons[li[l]];
    else if (iShort[l]) K.i[nm] = kit.icons[iShort[l]];
    else miss.push(`${nm}: NOT FOUND — use kit.js list / v / t / i to find the right name`); }
  out('const KIT = ' + JSON.stringify(K) + ';');
  if (miss.length) console.error('// ' + miss.join('\n// '));
} else out(require('fs').readFileSync(__filename, 'utf8').split('\n').slice(1, 11).join('\n'));
