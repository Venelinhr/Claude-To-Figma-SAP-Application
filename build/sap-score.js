#!/usr/bin/env node
// sap-score.js — how much a tree reads like an SAP screen (Make's top-down structure) instead of "pixel soup". Offline, 0 tokens.
//   node build/sap-score.js <tree.json> [--json]
// Measures (2026-10-04, from the Figma Make trace: Make builds a side panel + a list of IDENTICAL cards on SAP spacing):
//   FREE      free-placed containers (abs) — Make places nothing by hand; every one is a layout break
//   PAD>120   paddings over 120 px — a part pushed into place by a huge inset instead of sitting in its own column
//   REPEAT    repeated cards (same name prefix "Card", same size ±6 %) that share ONE structure — Make builds them from one template
//   GRID      gaps + paddings on the 4 px SAP grid (0–2 px count as on-grid)
//   SCORE     100 − 4·FREE − 3·PAD>120 − (100 − REPEAT)/4 − (100 − GRID)/4, floored at 0
const fs = require('fs');
const f = process.argv[2];
if (!f) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 9).join('\n')); process.exit(2); }
const T = JSON.parse(fs.readFileSync(f, 'utf8')); const root = T.tree || T;
const leaf = o => !!o.k || !(o.c || []).length;
let free = 0, bigPad = 0, sp = 0, onGrid = 0; const cards = [];
const P = o => (Array.isArray(o.p) ? o.p : o.p != null ? [o.p, o.p, o.p, o.p] : []);
(function w(o, top) {
  if (!top && !leaf(o) && o.abs && !o.crop) free++;
  if (!leaf(o)) {
    P(o).forEach(v => { if (v > 120) bigPad++; sp++; if (v <= 2 || v % 4 === 0) onGrid++; });
    if (o.g != null) { sp++; if (o.g <= 2 || o.g % 4 === 0) onGrid++; }
    if (/^Card\b/.test(o.n || '') && (o.w || 0) >= 300 && (o.h || 0) >= 100) cards.push(o);
  }
  (o.c || []).forEach(c => w(c, false));
})(root, true);
const sig = (o, d = 0) => d > 3 ? '' : (o.k ? (o.cp || o.k) : (o.d || '-')) + (o.c && !o.k ? '[' + o.c.filter(c => !c.abs).map(c => sig(c, d + 1)).join(',') + ']' : '');
let groups = [], same = 0, inGroups = 0;
cards.forEach(c => { const g = groups.find(g => Math.abs(g[0].w - c.w) <= 0.06 * c.w && Math.abs(g[0].h - c.h) <= 0.12 * c.h); g ? g.push(c) : groups.push([c]); });
groups = groups.filter(g => g.length >= 2);
groups.forEach(g => { const s = g.map(c => sig(c)), top = s.slice().sort((a, b) => s.filter(x => x === b).length - s.filter(x => x === a).length)[0]; inGroups += g.length; same += s.filter(x => x === top).length; });
const repeat = inGroups ? Math.round(100 * same / inGroups) : null, grid = sp ? Math.round(100 * onGrid / sp) : 100;
const score = Math.max(0, Math.round(100 - 4 * free - 3 * bigPad - (100 - (repeat == null ? 100 : repeat)) / 4 - (100 - grid) / 4));
const r = { score, free, bigPad, repeat, cards: inGroups, grid };
if (process.argv.includes('--json')) console.log(JSON.stringify(r));
else console.log(`SAP-SCORE ${score} · FREE ${free} · PAD>120 ${bigPad} · REPEAT ${repeat == null ? '— (no repeated cards)' : repeat + '% of ' + inGroups + ' cards'} · GRID ${grid}%`);
