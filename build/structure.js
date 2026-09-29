#!/usr/bin/env node
// structure.js — what MATCH cannot see: WHERE things are. Runs on the build's geometry dump (absolute boxes of every layer,
// build/templates/dump-geometry.use_figma.js) and, with a reference, on the measured reference (see.py spec.json).
//   node build/structure.js <geometry.json> [--spec see-ref/spec.json]      exit 1 = a structure defect
// Checks: (1) BOX  every reference box (a card, a card inside a card, a pink surround) has a build frame of the same size and
// place; a strip 777×36 where the reference has a box 788×271 is a defect. (2) FRAME  the build is the reference size.
// (3) COLLAPSED  a frame 1-2 px high/wide that holds content. (4) OUTSIDE  a layer past the root frame (clip hides it).
// (5) OVERLAP  two texts on top of each other (a wrapped "01:00+1" over "SOF"). A pass needs 0 of these.
const fs = require('fs');
function check(rows, spec) {
  const G = rows.map(r => ({ id: r[0], type: r[1], name: r[2], x: r[3], y: r[4], w: r[5], h: r[6], fill: r[9], text: r[13], parent: r[14] }));
  const root = G[0], out = [], hasParent = rows.some(r => r.length > 14 && r[14]);
  const s = spec ? root.w / spec.frame.w : 1;
  if (spec && (Math.abs(root.w - spec.frame.w) > 2 || Math.abs(root.h - spec.frame.h) > 2))
    out.push(`FRAME  build ${root.w}×${root.h}, the reference is ${spec.frame.w}×${spec.frame.h} — build at the reference size`);
  const has = new Set(); for (const g of G) if (g.type === 'FRAME' || g.type === 'RECTANGLE') has.add(g);
  if (spec) {
    const boxes = []; (function w(x, d) { if (x.type === 'box' && x.box) boxes.push({ box: x.box, d }); (x.children || []).forEach(k => w(k, d + (x.type === 'box' ? 1 : 0))); })({ children: spec.sections }, 0);
    for (const { box: [bx, by, bw, bh] } of boxes) {
      const X = bx * s, Y = by * s, W = bw * s, H = bh * s, tol = Math.max(6, 0.02 * Math.max(W, H));
      const hit = [...has].find(g => Math.abs(g.x - X) <= tol && Math.abs(g.y - Y) <= tol && Math.abs(g.w - W) <= tol && Math.abs(g.h - H) <= tol);
      if (hit) continue;
      const near = [...has].filter(g => g.w > 8 && g.h > 8).sort((a, b) => (3 * Math.hypot(a.x - X, a.y - Y) + Math.abs(a.w - W) + 0.5 * Math.abs(a.h - H)) - (3 * Math.hypot(b.x - X, b.y - Y) + Math.abs(b.w - W) + 0.5 * Math.abs(b.h - H)))[0];   // place first
      out.push(`BOX  the reference has a box ${bw}×${bh} at ${bx},${by}; the build has none there` + (near ? ` — nearest "${near.name}" ${near.w}×${near.h} at ${near.x},${near.y} (${near.id})` : ''));
    }
  }
  for (const g of G) {
    if (g === root) continue;
    // a collapsed frame's children lie OUTSIDE its box: use the parent column of the dump when it has one
    const holds = hasParent ? G.some(k => k.parent === g.id && (k.type !== 'RECTANGLE' || k.h > 4)) : G.some(k => k !== g && k.x >= g.x - 1 && k.y >= g.y - 1 && k.x + k.w <= g.x + g.w + 1 && k.y + k.h <= g.y + g.h + 1 && k.type !== 'FRAME' && k.h > 4);
    if (g.type === 'FRAME' && (g.h <= 2 || g.w <= 2) && holds && !/divider|separator|spacer|line|arrow/i.test(g.name))
      out.push(`COLLAPSED  "${g.name}" (${g.id}) is ${g.w}×${g.h} but holds content`);
    if (g.x + g.w > root.x + root.w + 1 || g.y + g.h > root.y + root.h + 1 || g.x < root.x - 1 || g.y < root.y - 1) out.push(`OUTSIDE  "${g.name}" (${g.id}) ${g.x},${g.y} ${g.w}×${g.h} is past the frame ${root.w}×${root.h} — clipped, hidden`);
  }
  const T = G.filter(g => g.type === 'TEXT');
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
    const a = T[i], b = T[j], ow = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oh = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ow > 2 && oh > 2 && ow * oh > 0.3 * Math.min(a.w * a.h, b.w * b.h)) out.push(`OVERLAP  "${String(a.text).slice(0, 20)}" (${a.id}) and "${String(b.text).slice(0, 20)}" (${b.id}) sit on top of each other`);
  }
  return [...new Set(out)];
}
module.exports = { check };
if (require.main === module) {
  const [gf, ...rest] = process.argv.slice(2);
  if (!gf) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 8).join('\n')); process.exit(2); }
  const i = rest.indexOf('--spec'), r = check(JSON.parse(fs.readFileSync(gf, 'utf8')), i >= 0 ? JSON.parse(fs.readFileSync(rest[i + 1], 'utf8')) : null);
  console.log(r.length ? `STRUCTURE  ✗ ${r.length}\n` + r.map(l => '  ' + l).join('\n') : 'STRUCTURE  ✓ 0');
  process.exit(r.length ? 1 : 0);
}
