#!/usr/bin/env node
// layout-sim.js — OFFLINE auto-layout simulator: where would Figma put every leaf? No Figma call, ~50 ms.
//   node build/layout-sim.js <tree.json> --expect <tree.expect.json> [--scale 0.85] [--tol 4]   position error vs the measured reference
//   node build/layout-sim.js <tree.json> --sizes                                                simulated size vs recorded w/h (checks the simulator on gold trees)
//   node build/layout-sim.js <tree.json> --geometry-out <file>                                  the simulated boxes as geometry rows (the shape structure.js reads) — v6 STRUCT-SIM
// Prints POSITION (leaves within tol px of the reference) and OVERFLOW (leaves outside the frame when its width is scaled).
// Exit 1 when POSITION < 95 % or a leaf overflows. Model: FIXED = w/h · HUG = content · FILL = equal share of the free space.
const fs = require('fs');
const args = process.argv.slice(2);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const tf = args[0];
if (!tf || tf.startsWith('--')) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(2); }
const raw = JSON.parse(fs.readFileSync(tf, 'utf8')), T = raw.tree || raw;
if (T.$c) { console.error('layout-sim needs the plain tree (tree.json), not the compact wire format'); process.exit(2); }
const scale = Number(opt('--scale', 1)), tol = Number(opt('--tol', 4));
T.w = Math.round(T.w * scale);
const P = o => (Array.isArray(o.p) ? o.p : [o.p || 0, o.p || 0, o.p || 0, o.p || 0]);   // t r b l
const leaf = o => !o.c || !!o.k;
const EXPLICIT = T.sz === 'x', parent = new Map();     // explicit trees: F always means FILL; legacy trees: F = fill only when it spans the parent (same rule as render-tree.js _axis)
(function link(o) { for (const k of o.c || []) { parent.set(k, o); link(k); } })(T);
function mode(o, i) {
  if (o === T) return 'FIXED';
  const L = (o.s || 'XX')[i];
  if (L !== 'F') return L === 'H' ? 'HUG' : 'FIXED';
  if (EXPLICIT) return 'FILL';
  const par = parent.get(o);
  if (!par || !par.d) return 'FIXED';
  const p = P(par), along = (par.d === 'H') === (i === 0), dim = i === 0 ? 'w' : 'h';
  if (!along) { const free = i === 0 ? par.w - p[1] - p[3] : par.h - p[0] - p[2]; return Math.abs(o[dim] - free) <= 1 ? 'FILL' : 'FIXED'; }
  const kids = (par.c || []).filter(k => !k.abs);
  const used = kids.reduce((q, k) => q + k[dim], 0) + (par.g || 0) * Math.max(0, kids.length - 1) + (i === 0 ? p[1] + p[3] : p[0] + p[2]);
  return Math.abs(used - par[dim]) <= 1 && kids.filter(k => (k.s || '')[i] === 'F').length === 1 ? 'FILL' : 'FIXED';
}
const memo = new Map();
function nat(o, i) {                                   // natural size on axis i (0 width, 1 height)
  const m = memo.get(o) || memo.set(o, [null, null]).get(o);
  if (m[i] != null) return m[i];
  let r;
  const L = mode(o, i), fixed = i ? o.h : o.w;
  if (o.wrapRow && i === 1 && o.h != null) { m[1] = o.h; return o.h; }   // a wrapping row: its height is the wrapped height (place() wraps the items)
  if (L === 'FIXED' && fixed != null) r = fixed;
  else if (leaf(o) || !o.d) r = fixed || 0;
  else {
    const p = P(o), kids = o.c.filter(k => !k.abs), H = o.d === 'H', main = (i === 0) === H;
    const ns = kids.map(k => nat(k, i)), pad = i === 0 ? p[1] + p[3] : p[0] + p[2];
    r = main ? ns.reduce((s, n) => s + n, 0) + (o.g || 0) * Math.max(0, kids.length - 1) + pad : Math.max(0, ...ns) + pad;
  }
  return (m[i] = r);
}
const boxes = new Map();
function place(o, x, y, W, Hh) {
  boxes.set(o, [x, y, W, Hh]);
  if (leaf(o)) return;
  if (!o.d) { for (const k of o.c) { const xy = k.xy || [0, 0]; place(k, x + xy[0], y + xy[1], nat(k, 0), nat(k, 1)); } return; }
  const p = P(o), H = o.d === 'H', flow = o.c.filter(k => !k.abs);
  const inW = W - p[1] - p[3], inH = Hh - p[0] - p[2], mainA = H ? inW : inH, crossA = H ? inH : inW;
  const mi = H ? 0 : 1, ci = H ? 1 : 0, a = o.a || 'MM';
  if (o.wrapRow && H) {                                // Figma auto layout "wrap": items fill a line, then start the next one
    let cx = 0, cy = 0, lh = 0;
    for (const k of flow) { const w = nat(k, 0), h = nat(k, 1); if (cx > 0 && cx + w > inW + 0.01) { cx = 0; cy += lh + (o.cg || 0); lh = 0; } place(k, x + p[3] + cx, y + p[0] + cy, w, h); cx += w + (o.g || 0); lh = Math.max(lh, h); }
    return;
  }
  const z = flow.map(k => ({ k, fill: mode(k, mi) === 'FILL', main: nat(k, mi), cross: mode(k, ci) === 'FILL' ? crossA : nat(k, ci) }));
  const gap0 = o.g || 0, gaps = gap0 * Math.max(0, z.length - 1), fills = z.filter(q => q.fill);
  const fixed = z.reduce((s, q) => s + (q.fill ? 0 : q.main), 0);
  if (fills.length) { const share = Math.max(0, mainA - fixed - gaps) / fills.length; fills.forEach(q => { q.main = share; }); }
  const total = z.reduce((s, q) => s + q.main, 0);
  let gap = gap0, pos = 0;
  if (a[0] === 'S' && z.length > 1) gap = Math.max(0, (mainA - total) / (z.length - 1));
  else { const used = total + gaps; pos = a[0] === 'C' ? (mainA - used) / 2 : a[0] === 'X' ? mainA - used : 0; }
  for (const q of z) {
    const co = a[1] === 'C' ? (crossA - q.cross) / 2 : a[1] === 'X' ? crossA - q.cross : 0;
    place(q.k, x + p[3] + (H ? pos : co), y + p[0] + (H ? co : pos), H ? q.main : q.cross, H ? q.cross : q.main);
    pos += q.main + gap;
  }
  for (const k of o.c.filter(k => k.abs)) { const xy = k.xy || [0, 0]; place(k, x + xy[0], y + xy[1], nat(k, 0), nat(k, 1)); }
}
place(T, 0, 0, nat(T, 0), nat(T, 1));
const all = [...boxes.keys()], leaves = all.filter(leaf), R = v => Math.round(v * 10) / 10;
// --dump-boxes <file>: write the simulated box of EVERY node by index path ("0.1.2" = T.c[0].c[1].c[2]; "" = root) — build/make-verify.js compares them with the Make boxes
const dbf = opt('--dump-boxes', null);
if (dbf) { const o = {}; (function w(n, p) { const b = boxes.get(n); if (b) o[p.join('.')] = b.map(R); (n.c || []).forEach((k, i) => w(k, p.concat(i))); })(T, []); fs.writeFileSync(dbf, JSON.stringify(o)); }
// --geometry-out <file>: every node's SIMULATED box as a geometry row [id,type,name,x,y,w,h,radius,stroke,fill,padding,gap,layout,text,parentId]
// — the shape build/structure.js reads from dump-geometry — so run.js can run structure.check on the tree BEFORE anything is built (pre-filter only).
const gof = opt('--geometry-out', null);
if (gof) {
  const rows = [], ids = new Map(); let n = 0;
  (function w(o, pid) {
    const id = 's' + n++, b = boxes.get(o), t = o.k === 't' ? 'TEXT' : o.k === 'r' ? 'RECTANGLE' : (o.k === 'i' || o.k === 'ic') ? 'INSTANCE' : o.k === 'v' ? 'VECTOR' : 'FRAME';
    ids.set(o, id);
    rows.push([id, t, o.n || '', R(b[0]), R(b[1]), R(b[2]), R(b[3]), o.r || 0, o.bc || null, typeof o.bg === 'string' ? o.bg : null, o.p || null, o.g || 0, o.d || 'NONE', o.k === 't' ? o.t : (o.cp || o.ic || null), pid]);
    (o.c || []).forEach(k => w(k, id));
  })(T, null);
  fs.writeFileSync(gof, JSON.stringify(rows));
}
const lines = [`LAYOUT-SIM  ${tf} · scale ${scale} · frame ${T.w}×${T.h} · ${leaves.length} leaves, ${all.length - leaves.length} frames`];
let bad = 0;
if (args.includes('--sizes')) {
  const sized = all.filter(o => o !== T && o.w != null && o.h != null);
  const miss = sized.map(o => { const b = boxes.get(o); return { o, dw: b[2] - o.w, dh: b[3] - o.h }; }).filter(m => Math.abs(m.dw) > 2 || Math.abs(m.dh) > 2);
  lines.push(`SIZES     ${sized.length - miss.length}/${sized.length} boxes match the recorded size (±2 px)`);
  miss.slice(0, 8).forEach(m => lines.push(`  ${m.o.n}: recorded ${m.o.w}×${m.o.h} · simulated ${R(boxes.get(m.o)[2])}×${R(boxes.get(m.o)[3])}`));
}
const ef = opt('--expect', null);
if (ef) {
  const E = JSON.parse(fs.readFileSync(ef, 'utf8')), rows = [];
  for (const o of leaves) {
    const e = E[o.n]; if (!e) continue;
    const b = boxes.get(o), ta = o.ta;                  // an aligned text keeps its right edge / centre
    const dx = ta === 'R' ? b[0] + b[2] - (e[0] + e[2]) : ta === 'C' ? b[0] + b[2] / 2 - (e[0] + e[2] / 2) : b[0] - e[0];
    rows.push({ n: o.n, dx, dy: b[1] - e[1], e, b });
  }
  const ok = rows.filter(r => Math.abs(r.dx) <= tol && Math.abs(r.dy) <= tol), pct = rows.length ? Math.round((100 * ok.length) / rows.length) : 0;
  lines.push(`POSITION  ${ok.length}/${rows.length} leaves within ${tol} px of the reference = ${pct} %${pct < 95 ? '  ✗ FAIL (need 95)' : '  ✓'}`);
  rows.filter(r => !ok.includes(r)).sort((a, b) => Math.abs(b.dx) + Math.abs(b.dy) - Math.abs(a.dx) - Math.abs(a.dy)).slice(0, 8)
    .forEach(r => lines.push(`  ${r.n}: reference ${R(r.e[0])},${R(r.e[1])} → simulated ${R(r.b[0])},${R(r.b[1])}  (Δ ${R(r.dx)}, ${R(r.dy)})`));
  if (pct < 95) bad = 1;
}
// --geometry <check/geometry.json>: compare the SIMULATED box of every UNIQUELY-named node against the REAL Figma box the
// plugin dumped, and print the shallowest divergences — so the simulator can be calibrated to predict real Figma (text
// height = line height, no wrapping). geometry row: [id, type, name, x, y, w, h, …]; only names that occur once on each side.
const gf = opt('--geometry', null);
if (gf) {
  const rows = JSON.parse(fs.readFileSync(gf, 'utf8'));
  const realCount = {}; rows.forEach(r => realCount[r[2]] = (realCount[r[2]] || 0) + 1);
  const real = {}; rows.forEach(r => { if (realCount[r[2]] === 1) real[r[2]] = [r[3], r[4], r[5], r[6]]; });
  const depth = new Map(); (function d(o, k) { depth.set(o, k); (o.c || []).forEach(c => d(c, k + 1)); })(T, 0);
  const simCount = {}; all.forEach(o => simCount[o.n] = (simCount[o.n] || 0) + 1);
  const diffs = [];
  for (const o of all) {
    if (simCount[o.n] !== 1 || !real[o.n]) continue;
    const b = boxes.get(o), e = real[o.n];
    const dx = R(b[0] - e[0]), dy = R(b[1] - e[1]), dw = R(b[2] - e[2]), dh = R(b[3] - e[3]);
    if (Math.abs(dx) > tol || Math.abs(dy) > tol || Math.abs(dw) > tol || Math.abs(dh) > tol)
      diffs.push({ n: o.n, d: depth.get(o), dx, dy, dw, dh, b, e });
  }
  const matched = Object.keys(real).filter(n => simCount[n] === 1).length;
  lines.push(`GEOMETRY  ${matched - diffs.length}/${matched} uniquely-named nodes match real Figma (±${tol} px)${diffs.length ? '  ✗' : '  ✓'}`);
  diffs.sort((a, b) => a.d - b.d || (Math.abs(b.dx) + Math.abs(b.dy) + Math.abs(b.dw) + Math.abs(b.dh)) - (Math.abs(a.dx) + Math.abs(a.dy) + Math.abs(a.dw) + Math.abs(a.dh)))
    .slice(0, 12).forEach(r => lines.push(`  L${r.d} ${r.n}: real ${R(r.e[0])},${R(r.e[1])} ${R(r.e[2])}×${R(r.e[3])} · sim ${R(r.b[0])},${R(r.b[1])} ${R(r.b[2])}×${R(r.b[3])}  (Δxy ${r.dx},${r.dy} Δwh ${r.dw},${r.dh})`));
}
// a leaf that spills past the frame is real overflow only if no clipping ancestor (whose own box is inside the frame)
// hides it — a card/column with clipsContent keeps its dense content from actually leaving the screen when it narrows.
const clipped = o => { for (let p = parent.get(o); p; p = parent.get(p)) { if (!p.clip) continue; const b = boxes.get(p);
  if (b && b[0] >= -1 && b[1] >= -1 && b[0] + b[2] <= T.w + 1 && b[1] + b[3] <= T.h + 1) return true; } return false; };
const ov = leaves.filter(o => { const b = boxes.get(o); return (b[0] + b[2] > T.w + 1 || b[1] + b[3] > T.h + 1 || b[0] < -1) && !clipped(o); });
lines.push(`OVERFLOW  ${ov.length} leaves outside the ${T.w}×${T.h} frame${ov.length ? '  ✗ FAIL' : '  ✓'}`);
ov.slice(0, 5).forEach(o => { const b = boxes.get(o); lines.push(`  ${o.n}: ${R(b[0])},${R(b[1])} ${R(b[2])}×${R(b[3])}`); });
if (ov.length) bad = 1;
console.log(lines.join('\n'));
process.exit(bad);
