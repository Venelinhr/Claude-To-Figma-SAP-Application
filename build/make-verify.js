#!/usr/bin/env node
// make-verify.js — "does the Figma frame equal the Make app?" checked OFFLINE, before the user ever pastes into SAP Bridge.
//   node build/make-verify.js <make-dump.json> [--tol 2] [--quiet]
// Converts the dump (build/make-convert.js), lets build/layout-sim.js place every node the way Figma auto layout would, then compares the
// simulated box of every node with the box the SAME control has in the running Make app (the dump box). Prints the nodes that are off.
//   STRUCTURE  the tree is simulated with every text / kit part at its Make size, so ONLY the layout logic (direction, gap, padding, FILL / HUG / FIXED,
//              alignment, column widths) is tested — every traced node must land within tol px of its Make box. This is the gate.
//   KIT DRIFT  the same on the real tree (kit components have their own fixed size: a 24 px Avatar where Make has 48 px moves what sits below it) — info only.
//   GROSS      any node of the real tree bigger than the screen, or off by more than 40 px in STRUCTURE — what a mis-read layout looks like.
// Exit 0 = STRUCTURE >= 97 % and no GROSS node. `node --test test/make2tree.test.js` runs it for every saved dump.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const args = process.argv.slice(2), opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
if (!args[0] || args[0].startsWith('--')) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 12).join('\n')); process.exit(2); }
const tol = Number(opt('--tol', 2)), D = JSON.parse(fs.readFileSync(args[0], 'utf8'));
const { convert } = require('./make-convert.js');
const r = convert(D, require('../knowledge/live/kit.json'), require('./make-map.json'), require('../knowledge/live/icons-extra.json').icons || {}, null);
const tree = r.tree, trace = r.trace, tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'make-verify-'));
const nodeAt = (T, p) => p.reduce((n, i) => n.c[i], T), R = v => Math.round(v * 10) / 10, LEAF = new Set(['text', 'inst', 'icon', 'img']);
function sim(T, name) {
  const tf = path.join(tmp, name + '.tree.json'), bf = path.join(tmp, name + '.boxes.json'); fs.writeFileSync(tf, JSON.stringify(T));
  try { execFileSync(process.execPath, [path.join(__dirname, 'layout-sim.js'), tf, '--dump-boxes', bf], { stdio: 'pipe' }); } catch (e) { /* layout-sim exits 1 on overflow; the boxes are written before */ }
  return JSON.parse(fs.readFileSync(bf, 'utf8'));
}
const real = sim(tree, 'real'), T2 = JSON.parse(JSON.stringify(tree));
for (const t of trace) if (LEAF.has(t.k) && t.b) { const n = nodeAt(T2, t.p); n.w = t.b[2]; n.h = t.b[3]; }      // every text / kit part at the size it has in Make
const made = sim(T2, 'made'), by = {}; D.controls.forEach(c => { by[c.id] = c; });
const rows = [];
for (const t of trace) {
  const k = t.p.join('.'), a = made[k], s = real[k]; if (!a || !s || !t.b) continue;
  const e = t.b, leaf = LEAF.has(t.k), cx = t.ta === 'C' ? (a[2] - e[2]) / 2 : 0;
  const dx = a[0] + cx - e[0], dy = a[1] - e[1], dw = leaf ? 0 : a[2] - e[2], dh = leaf ? 0 : a[3] - e[3], off = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dw), Math.abs(dh));
  const ax = s[0] + cx - e[0], ay = s[1] - e[1], drift = Math.max(Math.abs(ax), Math.abs(ay));
  rows.push({ id: t.id, cls: (by[t.id] || {}).cls || '?', leaf, e, a, s, dx, dy, dw, dh, off, drift, gross: off > 40 || s[2] > D.viewport[0] * 1.05 || s[3] > D.viewport[1] * 4 });
}
const pct = (l, k) => (l.length ? Math.round(1000 * l.filter(x => x[k] <= tol).length / l.length) / 10 : 100);
const L = rows.filter(x => x.leaf), F = rows.filter(x => !x.leaf), gross = rows.filter(x => x.gross), sp = pct(rows, 'off'), ok = sp >= 97 && !gross.length;
const out = [`MAKE-VERIFY  ${path.basename(args[0])} · ${D.controls.length} controls · ${rows.length} traced nodes · tol ${tol} px`,
  `STRUCTURE  ${rows.filter(x => x.off <= tol).length}/${rows.length} nodes land on their Make box = ${sp} %${sp < 97 ? '  ✗ (need 97)' : '  ✓'}   (leaves ${pct(L, 'off')} % · frames ${pct(F, 'off')} %)`,
  `KIT DRIFT  ${pct(rows, 'drift')} % of nodes still within tol with the real kit sizes (info: kit parts are smaller/larger than Make's touch-size boxes)`,
  `GROSS      ${gross.length} nodes off by > 40 px or bigger than the screen${gross.length ? '  ✗ FAIL' : '  ✓'}`];
if (!args.includes('--quiet') || !ok) rows.filter(x => x.off > tol || x.gross).sort((a, b) => (process.env.VERIFY_ORDER ? 0 : b.off - a.off)).slice(0, +(process.env.VERIFY_N || 12))
  .forEach(x => out.push(`  ${x.leaf ? 'leaf ' : 'frame'} ${x.cls.replace('sap.', '')} ${x.id.slice(-14)}: Make ${R(x.e[0])},${R(x.e[1])} ${R(x.e[2])}×${R(x.e[3])} → Figma ${R(x.a[0])},${R(x.a[1])} ${R(x.a[2])}×${R(x.a[3])}  (Δ ${R(x.dx)},${R(x.dy)}${x.leaf ? '' : ' size ' + R(x.dw) + ',' + R(x.dh)})`));
console.log(out.join('\n'));
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(ok ? 0 : 1);
