#!/usr/bin/env node
// layout-audit.js <tree.json> [...] — a senior designer's review of a tree's AUTO LAYOUT (2026-10-06, user: "poor auto layouts,
// spacing, paddings, alignment, hug/fill, responsiveness — fix the method"). It counts what makes a Figma screen hard to edit and
// not responsive:
//   offgrid   padding / gap values not on the SAP spacing scale (0 2 4 8 12 16 24 32 48 64)
//   cells     one-child wrapper frames that only hold a measured offset ("… cell", "… box")
//   spacers   empty "Spacer" frames
//   abs       absolute-positioned children inside auto layout
//   gap0      frames with g=0 that hold ≥ 3 flow children (spacing faked with padding, not a real gap)
//   asymPad   frames whose left/right or top/bottom padding differ by 1..6 px (a measurement wobble)
//   fixedH    frames with FIXED height (content clips, or holes stay, when text or data change)
//   fixedW    frames wider than 120 px with FIXED width in a column (they do not follow the screen width)
// Prints one line per tree with a SCORE (100 = clean). run.js prints it after every tree is made.
'use strict';
const fs = require('fs');
const SCALE = [0, 2, 4, 8, 12, 16, 24, 32, 48, 64];
const P = o => Array.isArray(o.p) ? o.p : [o.p || 0, o.p || 0, o.p || 0, o.p || 0];
const LEAF = o => ['t', 'ic', 'i', 'r'].includes(o.k);

function audit(root) {
  const r = { frames: 0, offgrid: 0, values: 0, cells: 0, spacers: 0, abs: 0, gap0: 0, asymPad: 0, fixedH: 0, fixedW: 0, depth: 0 };
  (function w(o, par, d) {
    r.depth = Math.max(r.depth, d);
    if (o.abs && par) r.abs++;
    if (/^Spacer\b/.test(o.n || '') && !(o.c || []).length) r.spacers++;
    if (!LEAF(o) && o.d) {
      r.frames++;
      const p = P(o);
      [...p, o.g || 0].forEach(v => { r.values++; if (!SCALE.includes(Math.round(v))) r.offgrid++; });
      const flow = (o.c || []).filter(c => !c.abs);
      if (flow.length === 1 && o.bg == null && o.bc == null && !o.r && o !== root && /\b(cell|box)( \d+)?$/.test(o.n || '')) r.cells++;
      if (flow.length >= 3 && !(o.g > 0) && (o.a || 'MM')[0] !== 'S') r.gap0++;
      const dx = Math.abs(p[1] - p[3]), dy = Math.abs(p[0] - p[2]);
      if ((dx > 0 && dx <= 6) || (dy > 0 && dy <= 6)) r.asymPad++;
      if (o !== root && (o.s || 'XX')[1] === 'X') r.fixedH++;
      if (o !== root && par && par.d === 'V' && (o.s || 'XX')[0] === 'X' && (o.w || 0) > 120) r.fixedW++;
    }
    (o.c || []).forEach(c => w(c, o, d + 1));
  })(root, null, 0);
  const f = Math.max(1, r.frames), pen = (n, base) => Math.min(20, Math.round(20 * n / Math.max(1, base)));
  r.score = Math.max(0, 100 - pen(r.offgrid, r.values) - pen(r.cells + r.spacers, f) - pen(r.abs * 3, f) - pen(r.gap0, f)
    - pen(r.asymPad, f) - pen(r.fixedH, f) - pen(r.fixedW * 2, f));
  return r;
}
// normalize(tree) — the SAME layout rules spec2tree.js applies, for a tree the model wrote itself (--tree-new): values within 2 px of a
// SAP step take the step, a space-between row never fills a child nor hugs, a pinned child stays FIXED, an offset-only wrapper with no
// offset left is removed. Returns the number of changes. Safe: it never moves anything by more than 2 px.
function normalize(root) {
  let n = 0;
  const step = v => { const s = SCALE.concat([72, 80, 96]).reduce((a, q) => Math.abs(q - v) < Math.abs(a - v) ? q : a, 0); return Math.abs(s - v) <= 2 ? s : v; };
  (function w(o) {
    if (Array.isArray(o.p)) o.p = o.p.map(v => { const s = step(v); if (s !== v) n++; return s; });
    if (typeof o.g === 'number') { const s = step(o.g); if (s !== o.g) { n++; o.g = s; } }
    if (o.abs && !o.k && o.s !== 'XX') { o.s = 'XX'; n++; }
    if (o.d === 'H' && (o.a || 'M')[0] === 'S') {
      if ((o.s || 'XX')[0] === 'H') { o.s = 'X' + (o.s || 'XX')[1]; n++; }
      (o.c || []).forEach(c => { if (!c.abs && (c.s || 'XX')[0] === 'F') { c.s = (LEAF(c) ? 'H' : 'X') + (c.s || 'XX')[1]; n++; } });
    }
    (o.c || []).forEach((c, i) => {
      const k = (c.c || []).length === 1 ? c.c[0] : null;
      if (k && !c.k && c.bg == null && c.bc == null && !c.r && !c.abs && /\b(cell|box)( \d+)?$/.test(c.n || '') && P(c).every(v => !v)) { o.c[i] = k; n++; }
    });
    (o.c || []).forEach(w);
  })(root);
  return n;
}
const line = (r, f) => `LAYOUT ${r.score}/100 · ${r.frames} frames · off-grid ${r.offgrid}/${r.values} · cells ${r.cells} · spacers ${r.spacers} · abs ${r.abs} · gap0 ${r.gap0} · asym-pad ${r.asymPad} · fixed-H ${r.fixedH} · fixed-W ${r.fixedW} · depth ${r.depth}${f ? ' · ' + f : ''}`;
if (require.main === module) {
  const files = process.argv.slice(2);
  if (!files.length) { console.log('usage: node build/layout-audit.js <tree.json> [...]'); process.exit(64); }
  for (const f of files) { const t = JSON.parse(fs.readFileSync(f, 'utf8')); console.log(line(audit(t.tree || t), f)); }
}
module.exports = { audit, normalize, line, SCALE };
