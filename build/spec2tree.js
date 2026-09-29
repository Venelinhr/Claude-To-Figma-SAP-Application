#!/usr/bin/env node
// spec2tree.js — FROM ZERO: the measured reference (see.py spec) → a v5 layout tree. No gold, no earlier build.
//   node build/spec2tree.js <spec.json> <out tree.json> [--icons "7x12=media-forward,53x8=text:Багаж:H5/Bold,…"]
// row/column → auto-layout (equal gaps → gap; 2 children far apart → space-between; else children keep their measured
// x/y), box → frame with the measured fill/border/radius/padding, text → SAP style + variable, component → the kit
// component with the measured state (radio text = its own label), icon → SAP icon (meaning, or --icons by size),
// divider/separator → 1-2 px rectangle, image → a logo frame (crop uploaded after the build). Brand colours with no
// SAP token take a role: text/icon → sapErrorColor (highlight), divider → sapContent_Selected_ForegroundColor (selection).
const fs = require('fs');
const [specF, outF, ...rest] = process.argv.slice(2);
if (!outF) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 9).join('\n')); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specF, 'utf8'));
const ii = rest.indexOf('--icons'), MAP = Object.fromEntries((ii >= 0 ? rest[ii + 1] : '').split(',').filter(Boolean).map(p => p.split('=')));
const ci = rest.indexOf('--colors'), COL = Object.fromEntries((ci >= 0 ? rest[ci + 1] : '').split(',').filter(Boolean).map(p => p.split('=').map(x => x.toLowerCase().startsWith('#') ? x.toLowerCase() : x)));
const ROLES = require('./router-table.json').colour_roles;
const KIT_TEXT = require('../knowledge/live/kit.json').text || {};
const KIT_COMP = require('../knowledge/live/kit.json').components || {};   // kit component intrinsic w/h (a slider is 20 tall, not the 4-px measured track)
const R = v => Math.round(v * 10) / 10, used = {}, unknown = [], WARNS = [];
const EXPECT = {};                                     // layer name → measured box [x, y, w, h] — build/layout-sim.js compares the layout against it
const name = (b, fb) => { const n = String(b || fb).replace(/\s+/g, ' ').trim().slice(0, 40); used[n] = (used[n] || 0) + 1; return used[n] > 1 ? `${n} ${used[n]}` : n; };
// colour by ROLE, never by photo: the measured token is only kept when it fits the role
const tok = (t, role, hex) => {
  if (hex && COL[hex.toLowerCase()]) return COL[hex.toLowerCase()];
  if (!t || t === '?' || /RequiredColor/.test(t)) {                 // brand colour: only a saturated one is an accent
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || ''), c = m ? m.slice(1).map(x => parseInt(x, 16)) : null;
    const sat = c ? Math.max(...c) - Math.min(...c) > 60 : false;
    if (role === 'fill') return 'sapBaseColor';
    if (!sat) return role === 'icon' ? 'sapContent_IconColor' : role === 'line' ? 'sapList_BorderColor' : 'sapTextColor';
    return 'sapContent_Selected_ForegroundColor';                    // brand accent → SAP selection blue
  }
  if (role === 'icon' && /Border|Separator|Background/.test(t)) return 'sapContent_NonInteractiveIconColor';
  if (role === 'line' && !ROLES.divider.includes(t)) return ROLES.divider[0];                      // divider role list, not pixel distance
  if (role === 'border' && !ROLES.card_border.includes(t) && !ROLES.selected_border.includes(t)) return ROLES.card_border[0];
  if (role === 'ink' && /Border|Separator|Background/.test(t)) return 'sapTextColor';
  return t;
};
const label = o => { const t = []; (function w(x) { if (x.type === 'text') t.push(x.text); (x.children || []).forEach(w); })(o); return t[0]; };
function leaf(o) {
  const [x, y, w, h] = o.box;
  if (o.type === 'text') {
    // a Figma text box is as tall as its line height (auto ≈ floor(size × 1.17)), not the glyph height, and Figma TOP-aligns
    // the box to the glyph top (real dump: text.y == glyph.y). Use the line-height box top-aligned on the measured glyph so
    // the tree predicts real Figma; the extra height extends downward (a stacked text below then sits a line-height gap lower).
    const sz = Number(((KIT_TEXT[o.style] || '').split('|')[2])), H = sz ? Math.floor(sz * 1.17) : h;
    return { n: name(o.text.length > 24 ? o.text.slice(0, 24) + '…' : o.text), k: 't', t: o.text, st: o.style, bg: tok(o.token, 'ink', o.color), w, h: H, s: 'HH', box: [x, y] };
  }
  if (o.type === 'icon') {
    let ic = o.icon; const key = `${w}x${h}`;
    if (MAP[key] && MAP[key].startsWith('text:')) { const [, t, st] = MAP[key].split(':'); return { n: name(t), k: 't', t, st, bg: 'sapTextColor', w, h, s: 'HH' }; }
    if (MAP[key]) ic = MAP[key];
    if (!ic || ic === '?') unknown.push(`${key} at ${x},${y} ${o.color || ''}`);
    // an icon occupies exactly its MEASURED footprint (w×h) in the layout. Do NOT square it or inflate it by 1/0.8 — a
    // taller-than-measured icon frame makes its row taller than measured and shifts the cross-aligned text next to it, a
    // systematic vertical drift that accumulates down the tree. The renderer rescales the SAP icon to o.w, keeping shape.
    return { n: name(ic && ic !== '?' ? ic : 'icon ' + key), k: 'ic', ic: ic || '?', bg: tok(o.token, 'icon', o.color), w, h, s: 'XX', box: [x, y] };
  }
  if (o.type === 'component') {
    const pr = { ...(o.props || {}) };
    if (/Radio|Check Box/.test(o.component) && o.text) { pr.Label = true; pr['✏️ Text'] = o.text; }
    if (/^Button/.test(o.component) && o.text) pr['✏️ Text'] = o.text;
    if (/Range Slider/.test(o.component) && !pr['Right Value']) pr['Right Value'] = '100%';   // a filter shows its full range
    // a kit component renders at its INTRINSIC height (Range Slider 20, Button 26…), not the thin measured strip the OCR
    // saw (a slider track measured 4 px but Figma draws it 20 px tall). Use the kit height so the tree predicts real Figma.
    const kh = KIT_COMP[o.component] && KIT_COMP[o.component].h, H = kh && Math.abs(kh - h) > 3 ? kh : h;
    const box = H !== h ? [x, R(y + h / 2 - H / 2)] : undefined;   // grow around the measured centre (the track sat mid-component)
    return { n: name(o.text || o.component), k: 'i', cp: o.component, pr, w: o.width || w, h: H, s: /Slider|Input|Select|^Button/.test(o.component) ? 'XH' : 'HH', box };
  }
  if (o.type === 'divider' || o.type === 'separator') return { n: name(o.type === 'divider' ? 'Divider' : 'Separator'), k: 'r', w: Math.max(w, 1), h: Math.max(h, 1), bg: tok(o.token, 'line', o.color), s: 'XX' };
  if (o.type === 'image') return { n: name('Logo'), w, h, r: 4, crop: o.crop || o.box, s: 'XX' };
}
function conv(o, px, py) {
  const [x, y, w, h] = o.box, kids = (o.children || []).slice();
  if (!['row', 'column', 'box', 'stack'].includes(o.type)) { const l = leaf(o), at = l.box || [x, y]; delete l.box; l.xy = [R(at[0] - px), R(at[1] - py)]; EXPECT[l.n] = [R(at[0]), R(at[1]), l.w, l.h]; return l; }   // icons stay centred on the measured drawing
  const n = { n: name(o.type === 'box' ? 'Card ' + (label(o) || '') : (label(o) || o.type) + ' ' + o.type), xy: [R(x - px), R(y - py)], w, h, s: 'XX' };
  if (o.type === 'box') {
    n.bg = tok(o.fill, 'fill'); n.r = o.radius || 0;
    const m = /(\d+)px (\S+)/.exec(o.border || ''); if (m) { n.bw = +m[1]; n.bc = tok(m[2], 'border'); }
    n.clip = 1;                                        // a card clips its content — dense content stays inside when the screen narrows
  }
  // Every container just free-places its children (xy in parent coords); the recursive XY-cut in flow() does ALL layout
  // inference exactly (baked gaps + cross offsets), so there is one layout path and no median-gap drift.
  n.c = kids.map(k => conv(k, x, y));
  const E = n.c.map(c => [c.xy[0], c.xy[0] + c.w / 2, c.xy[0] + c.w]);
  n.c.forEach((c, i) => {                            // a text keeps the edge it shares with a sibling (SAP text is narrower)
    if (c.k !== 't') return;
    const near = j => E.some((e, k) => k !== i && Math.abs(e[j] - E[i][j]) <= 3);
    const rightOfComp = E.some((e, k) => k !== i && n.c[k].k === 'i' && Math.abs(e[2] - E[i][2]) <= 3);   // e.g. a price above its button
    const ta = rightOfComp ? 'R' : near(0) ? null : near(2) ? 'R' : near(1) ? 'C' : null;
    // an edge-aligned text keeps its measured box and HUG width — a FILL-width text in Figma auto-switches to
    // textAutoResize HEIGHT and WRAPS at the fill width (real Figma turned "07:15"/"01:00+1" into 4-line 92-px blocks).
    // HUG never wraps; textAlignHorizontal still keeps it on its edge, and its measured box places it exactly.
    if (ta) { c.ta = ta; c.s = 'HH'; }
  });
  return n;
}
// RESPONSIVE: no free placement, and no clutter frames. A frame with placed children becomes auto-layout by a
// recursive, hairline-aware XY-cut on the measured boxes — the way a designer nests rows and columns:
//   • a vertical hairline (w ≤ 2) that spans ≥ 80 % of the region height is a SEPARATOR item in an H flow; the boxes
//     left of it and right of it are the two groups it divides. A horizontal hairline (h ≤ 2) spanning ≥ 80 % of the
//     width is a DIVIDER item in a V flow. (A full-height separator / full-width divider used to force every sibling
//     into one band and collapse a whole card — this handles it as a real item, not a grouping key.)
//   • otherwise cut at the widest clean gap: the biggest x-gap with no box straddling it → an H split, the biggest such
//     y-gap → a V split; the axis with the wider real gap wins. Recurse on each side.
//   • equal child gaps → the frame's gap (g); the single widest gap (> 40) between two clusters → a[0]='S'
//     (SPACE_BETWEEN) so the two sides flex apart. Cross-axis alignment M / C / X from the measured edges.
//   • no clean cut (items truly overlap) → one V frame in y-order + a WARN line. Never negative padding, never a
//     free-placed child, never a "Spacer"/"offset" wrapper — every frame is named after its first real label.
// Then size() gives FILL width to containers in columns, one FILL child to every row, HUG height to containers.
const G = (nm, d, kids, extra) => ({ n: nm, d, g: 0, p: [0, 0, 0, 0], a: 'MM', s: 'HH', c: kids, ...extra });
const bandName = ks => (ks.map(c => c.t || (c.tx && Object.values(c.tx)[0]) || c.n).find(Boolean) || 'Row').toString().replace(/\s+/g, ' ').slice(0, 28);
const B = c => c._b || (c._b = [c.xy[0], c.xy[1], c.xy[0] + c.w, c.xy[1] + c.h]);     // absolute-in-parent box [x0,y0,x1,y1]
const isHair = (c, i) => (c.k === 'r') && (i === 0 ? c.w <= 2 : c.h <= 2);            // a divider/separator rectangle, thin on axis i
// crossAlign: measured edge shared by every item on the cross axis → M (start) / X (end) / C (centre)
function crossAlign(items, ci, lo, hi) {
  if (items.length < 2) return 'M';
  const st = Math.min(...items.map(c => B(c)[ci])), en = Math.max(...items.map(c => B(c)[ci + 2]));
  if (items.every(c => Math.abs(B(c)[ci] - lo) <= 3)) return 'M';
  if (items.every(c => Math.abs(hi - B(c)[ci + 2]) <= 3)) return 'X';
  const mids = items.map(c => (B(c)[ci] + B(c)[ci + 2]) / 2), mc = (st + en) / 2;
  if (items.every((c, i) => Math.abs(mids[i] - mc) <= 4)) return 'C';
  return 'M';
}
// cut a set of placed items inside the box [x0,y0,x1,y1] into ONE auto-layout node (recursively). Returns a node with
// d/g/p/a/c and its children stripped of xy — OR, when there is a single item flush to the box, that item itself.
function cut(items, x0, y0, x1, y1, warns) {
  if (items.length === 1) {                                    // a lone item: it becomes the node, padded to its offset
    const c = items[0], bx = B(c);
    const p = [R(bx[1] - y0), R(x1 - bx[2]), R(y1 - bx[3]), R(bx[0] - x0)].map(v => Math.max(0, v));
    delete c.xy; delete c._b;
    if (p.every(v => v <= 0.5)) return c;                      // flush: no wrapper needed
    const boxed = c.bg != null || c.bc != null || c.r;
    if ((c.d || !c.k) && !boxed) { c.p = mergePad(c.p, p); c.w = R((c.w || 0) + p[1] + p[3]); c.h = R((c.h || 0) + p[0] + p[2]);
      (c.c || []).forEach(g => { if (g.abs && g.xy) g.xy = [R(g.xy[0] + p[3]), R(g.xy[1] + p[0])]; }); return c; }
    return G((c.t || c.n) + ' box', 'V', [c], { p, w: R(x1 - x0), h: R(y1 - y0) });   // a leaf/card wrapper holds the offset
  }
  // 1. a hairline that spans (nearly) the whole region is a real separator/divider. It is pulled out first — even when
  //    it sits at an edge (nothing on one side) — because a full-height separator / full-width divider straddling the
  //    other items would otherwise block every clean gap-cut and force them into one band (the card-collapse bug).
  for (const axis of [0, 1]) {                                 // axis 0 = vertical hairline → H flow · axis 1 = horizontal → V flow
    const region = axis === 0 ? y1 - y0 : x1 - x0;
    const hair = items.filter(c => isHair(c, axis) && (axis === 0 ? B(c)[3] - B(c)[1] : B(c)[2] - B(c)[0]) >= region * 0.8);
    if (!hair.length) continue;
    const h = hair.sort((a, c) => B(a)[axis] - B(c)[axis])[0], hp = (B(h)[axis] + B(h)[axis + 2]) / 2;
    const before = items.filter(c => c !== h && (B(c)[axis] + B(c)[axis + 2]) / 2 < hp);
    const after = items.filter(c => c !== h && (B(c)[axis] + B(c)[axis + 2]) / 2 >= hp);
    const parts = [before, [h], after].filter(g => g.length);
    if (parts.length >= 2) return flowAxis(axis, parts, x0, y0, x1, y1, warns);
  }
  // 2. cut at the widest clean gap; pick the axis whose widest gap is larger
  const best = [gapCut(items, 0), gapCut(items, 1)].filter(Boolean).sort((a, c) => c.gap - a.gap)[0];
  if (best) return flowAxis(best.axis, best.groups, x0, y0, x1, y1, warns);
  // 3. items overlap (a price sub-label over the bottom of its component, stacked icons whose frames touch). Lay them
  //    along the axis their CENTRES spread on, in centre order. Overlap on the main axis (a negative gap) is pinned with
  //    ABSOLUTE positioning on that one child so the flow keeps the exact measured offset (auto-layout has no negative gap).
  const spread = i => { const cs = items.map(c => (B(c)[i] + B(c)[i + 2]) / 2); return Math.max(...cs) - Math.min(...cs); };
  const axis = spread(0) >= spread(1) ? 0 : 1;
  const ordered = items.slice().sort((a, c) => (B(a)[axis] + B(a)[axis + 2]) - (B(c)[axis] + B(c)[axis + 2]));
  return flowAxis(axis, ordered.map(c => [c]), x0, y0, x1, y1, warns);
}
// gapCut: the widest gap on axis i with no item straddling it → the ordered groups on each side of every such gap.
function gapCut(items, i) {
  const sorted = items.slice().sort((a, c) => B(a)[i] - B(c)[i]);
  let far = -Infinity, groups = [[sorted[0]]], gaps = [];
  for (let j = 1; j < sorted.length; j++) {
    far = Math.max(far, ...groups[groups.length - 1].map(c => B(c)[i + 2]));
    const gap = B(sorted[j])[i] - far;
    if (gap > 3) { gaps.push(gap); groups.push([sorted[j]]); } else groups[groups.length - 1].push(sorted[j]);
  }
  if (groups.length < 2) return null;
  return { axis: i, groups, gap: Math.max(...gaps) };
}
// give an item its measured padding [T,R,B,L] relative to the flow's content edges. A container merges it; a leaf
// gets a named one-child wrapper (never "Spacer"/"offset"), so HUG reconstructs the exact measured box — no alignment
// guesswork, no drift. The wrapper is H so it hugs its single child's height and holds left/right/top padding.
function padItem(it, pad, acr, main) {
  if (pad.every(v => Math.abs(v) <= 0.5)) return it;
  const p = pad.map(v => Math.max(0, v));
  // a plain layout frame absorbs the padding directly; a leaf, or a bordered box/card whose own visible size must not
  // change, gets a transparent one-child wrapper (named after its content, never "Spacer"/"offset") to hold the offset.
  const boxed = it.bg != null || it.bc != null || it.r;
  if ((it.d || !it.k) && !boxed) {
    it.p = mergePad(it.p, p); it.w = R((it.w || 0) + p[1] + p[3]); it.h = R((it.h || 0) + p[0] + p[2]);
    (it.c || []).forEach(c => { if (c.abs && c.xy) c.xy = [R(c.xy[0] + p[3]), R(c.xy[1] + p[0])]; });   // added padding moves the frame top-left; keep abs children in place
    return it;
  }
  return { n: (it.t || it.n) + ' cell', d: 'H', g: 0, p, a: 'MM', s: (main === 0 ? 'H' : 'F') + 'H', w: R((it.w || 0) + p[1] + p[3]), h: R((it.h || 0) + p[0] + p[2]), c: [it] };
}
// flowAxis: lay out the ordered groups along axis (0 H, 1 V) inside the box; recurse into any group of > 1.
// Positions are exact: the frame carries lead/trail padding, each item carries the measured gap-before it as leading
// padding and its cross-axis offset as cross padding, g stays 0 and alignment MIN — so the simulator (and Figma) put
// every leaf back where it was measured, and the layout still resizes (widths are FILL/HUG per size()).
function flowAxis(axis, groups, x0, y0, x1, y1, warns) {
  const H = axis === 0, ci = H ? 1 : 0, mi = H ? 0 : 1;
  const flat = groups.flat();
  // measure geometry BEFORE cutting sub-groups (cut() deletes each child's xy/_b as it consumes it)
  const mStart = groups.map(g => Math.min(...g.map(c => B(c)[mi]))), mEnd = groups.map(g => Math.max(...g.map(c => B(c)[mi + 2])));
  const cStart = groups.map(g => Math.min(...g.map(c => B(c)[ci])));      // each group's leading cross edge
  const gaps = []; for (let j = 1; j < groups.length; j++) gaps.push(R(mStart[j] - mEnd[j - 1]));
  const lead = Math.max(0, R(mStart[0] - (H ? x0 : y0))), trail = Math.max(0, R((H ? x1 : y1) - mEnd[mEnd.length - 1]));
  const crossLo = H ? y0 : x0;
  const acr = crossAlign(flat, ci, H ? y0 : x0, H ? y1 : x1);
  const spans = groups.map(g => span(g, x0, y0, x1, y1)), nm = bandName(flat) + (H ? ' row' : ' column');
  const gStart = groups.map(g => [Math.min(...g.map(c => B(c)[0])), Math.min(...g.map(c => B(c)[1]))]);   // group origin, before cut
  const raw = groups.map((g, j) => cut(g, ...spans[j], warns));          // consume children into sub-nodes
  // frame padding: main lead/trail; cross lead is folded per-item so a uniform MIN alignment holds
  const p = H ? [0, trail, 0, lead] : [lead, 0, trail, 0];
  // FAST PATH: gaps are uniform and every item shares the leading cross edge (no per-item offset) and none overlaps →
  // one frame gap `g` and no wrapper cells at all. Keeps the tree small (fewer layers/chars) for a regular row/column.
  const crossOff = j => acr === 'M' ? R(cStart[j] - crossLo) : 0;
  const uniform = gaps.length > 0 && Math.max(...gaps) - Math.min(...gaps) <= 1 && gaps.every(g => g >= -1)
    && groups.every((g, j) => Math.abs(crossOff(j)) <= 1);
  if (uniform) return { n: nm, d: H ? 'H' : 'V', g: Math.max(0, R(gaps[0])), p, a: 'M' + acr, s: 'FH', w: R(x1 - x0), h: R(y1 - y0), c: raw };
  // else g=0; each item padded by its measured gap-before (main axis) and its cross offset (when MIN aligned). Positions
  // are exact and drift-free. An item that OVERLAPS the previous one (a price sub-label over its component) cannot sit
  // before it in a flow, so it is pinned ABSOLUTE at its measured offset (door-exempt, exact).
  const items = raw.map((it, j) => {
    if (j > 0 && gaps[j - 1] < -1) { it.abs = 1; it.xy = [R(gStart[j][0] - x0), R(gStart[j][1] - y0)]; return it; }
    const gapBefore = j === 0 ? 0 : Math.max(0, gaps[j - 1]);
    const crossPad = Math.max(0, crossOff(j));               // MIN alignment → fold the cross offset in
    const pad = H ? [crossPad, 0, 0, gapBefore] : [gapBefore, 0, 0, crossPad];
    return padItem(it, pad, acr, mi);
  });
  return { n: nm, d: H ? 'H' : 'V', g: 0, p, a: 'M' + acr, s: 'FH', w: R(x1 - x0), h: R(y1 - y0), c: items };
}
const sideGap = (gaps, lo, hi) => { const g = gaps.slice(lo, hi - 1).filter(v => v > 3); return g.length ? Math.max(0, R(g.slice().sort((a, c) => a - c)[g.length >> 1])) : 0; };
const span = (g, x0, y0, x1, y1) => [Math.min(...g.map(c => B(c)[0])), Math.min(...g.map(c => B(c)[1])), Math.max(...g.map(c => B(c)[2])), Math.max(...g.map(c => B(c)[3]))];
const mergePad = (a, add) => { const base = Array.isArray(a) ? a.slice() : [0, 0, 0, 0]; return base.map((v, i) => Math.max(0, R(v + add[i]))); };
function flow(n) {
  const kids = n.c || []; if (n.d || !kids.length || !kids.some(c => c.xy)) return;
  const warns = [];
  const x0 = Math.min(...kids.map(c => B(c)[0])), y0 = Math.min(...kids.map(c => B(c)[1]));
  const x1 = Math.max(...kids.map(c => B(c)[2])), y1 = Math.max(...kids.map(c => B(c)[3]));
  const kidSet = new Set(kids);
  const node = cut(kids.slice(), x0, y0, x1, y1, warns);
  // the container adopts the top-level cut, plus the padding from its own box edges to the content bounds. But when cut
  // returned one of n's OWN existing children (a single card/element that flush-fills n), adopting its children would drop
  // that child's own frame (its border/fill) — so keep it as n's single child instead.
  const pad = [Math.max(0, R(y0)), Math.max(0, R(n.w - x1)), Math.max(0, R(n.h - y1)), Math.max(0, R(x0))];
  const isOwnChild = kidSet.has(node);
  if (isOwnChild) { n.d = 'V'; n.g = 0; n.p = mergePad(pad, [0, 0, 0, 0]); n.a = 'MM'; n.c = [node]; }
  else if (node.d) { n.d = node.d; n.g = node.g; n.p = mergePad(pad, Array.isArray(node.p) ? node.p : [0, 0, 0, 0]); n.a = node.a; n.c = node.c; }
  else { n.d = 'V'; n.g = 0; n.p = mergePad(pad, Array.isArray(node.p) ? node.p : [0, 0, 0, 0]); n.a = 'MM'; n.c = node.k ? [node] : node.c; }
  if (!isOwnChild) (n.c || []).forEach(c => { if (c.abs && c.xy) c.xy = [R(c.xy[0] + pad[3]), R(c.xy[1] + pad[0])]; });   // n's added padding moves abs children
  kids.forEach(c => { delete c._b; });
  (function clean(o) { (o.c || []).forEach(c => { delete c._b; clean(c); }); })(n);
  warns.forEach(w => WARNS.push(`${n.n}: ${w}`));
}
// does this container's content span (nearly) its parent's inner width? then it can be FILL width; otherwise HUG so its
// children keep their measured x. The root's direct section columns are the exception — they are the responsive columns.
function spansWidth(o, par) {
  if (!par) return false;
  const p = Array.isArray(par.p) ? par.p : [0, 0, 0, 0];
  const free = par.w - p[1] - p[3];
  return Math.abs(o.w - free) <= 4;
}
function size(o, root, par) {
  (o.c || []).forEach(c => size(c, false, o));
  const kids = (o.c || []).filter(c => !c.abs);
  if (root || o.k) return;
  // WIDTH of a container: FILL when it spans its parent's inner width (a column, a full-width band), else HUG so a row's
  // children keep their measured x. HEIGHT: always HUG (gaps are baked, so HUG reconstructs the measured height exactly).
  // FIXED width to the measured extent unless the container spans its parent (then FILL). HUG would inflate a container
  // holding a wide divider / connector line (a 160-px route line under a 46-px duration made its column 160 wide and shoved
  // the next column ~120 px right). FIXED at scale 1.0 reproduces the measured x; the FILL added below keeps it responsive.
  // Only a COLUMN (or full-width band) that spans its parent FILLs its width — the screen resizes through the columns.
  // A ROW is always FIXED to its measured width: a FILL row plus its one FILL child lets that child absorb the row-vs-
  // content slack and shove everything after it (a 160-px route line pushed the next column ~90 px right).
  // WIDTH: FILL when the container spans its parent's inner width (the screen resizes through these), else HUG so it
  // hugs its content (its explicit w already equals the measured span, wide inner divider included — no inflation).
  // HEIGHT: HUG (baked gaps reconstruct it) EXCEPT a frame holding an absolutely-pinned child (an overlapping price):
  // an abs child does not add to HUG, so keep the measured height FIXED instead.
  // FILL only for a WIDE container/text (> 120 px) that spans its parent — the screen resizes through these. A small
  // wrapper, a thin divider/separator, an icon or a kit instance keeps its width; giving a 2-px separator or a 40-px
  // wrapper FILL would let it eat a row's slack and shove the measured content sideways.
  // a real container or a WIDE horizontal divider rectangle can FILL its width; a TEXT never fills (FILL width makes
  // Figma wrap it), nor does an icon, a kit instance, or a thin vertical separator.
  const fillable = c => (!c.k && c.d) || (c.k === 'r' && c.w > c.h && c.w > 120) || c.k == null;
  const wFill = o.d && o.w > 120 && fillable(o) && spansWidth(o, par);
  const hAbs = (o.c || []).some(c => c.abs);
  o.s = (wFill ? 'F' : 'H') + (hAbs ? 'X' : 'H');   // HEIGHT: HUG (line-height/kit-height boxes reconstruct it), FIXED only to hold an abs child
  // Propagate FILL down the responsive path: a COLUMN's spanning child FILLs (so the column's width reaches its content),
  // but a ROW's child only FILLs when the ROW itself is FILL-width — otherwise a FILL child in a HUG row just eats the
  // row's slack and nudges the measured content sideways.
  const allowChildFill = o.d === 'V' || wFill;
  kids.forEach(c => {
    if ((c.s || 'XX')[0] === 'F' || !allowChildFill) return;
    if (fillable(c) && c.w > 120 && spansWidth(c, o)) c.s = 'F' + (c.s || 'XX')[1];
  });
  if (o.d === 'H' && wFill && !kids.some(c => (c.s || '')[0] === 'F')) {
    // a FILL-width row with no FILL child yet: the LAST wide flexible child flexes (expanding rightward never shifts the
    // earlier items), so the row resizes without moving measured positions.
    const cand = [...kids].reverse().find(c => fillable(c) && c.w > 40);
    if (cand) cand.s = 'F' + (cand.s || 'XX')[1];
  }
}
const f = spec.frame, root = { n: 'Flight results', sz: 'x', w: f.w, h: f.h, bg: f.fill || 'sapBaseColor', clip: 1,
  c: spec.sections.map(s => conv(s, 0, 0)) };
(function fl(o) { (o.c || []).forEach(fl); flow(o); })(root);
size(root, true);
// the root is the responsive frame: its widest direct child (the main content column) FILLs so the screen flexes; a
// narrower side column (filters) keeps its measured width. So the FILL column receives EXACTLY its measured width at
// scale 1.0, move any inter-column slack (the FILL column's own leading padding, and the root's trailing padding beyond
// the measured content) into the root's gap — otherwise FILL would over-receive and shift the column's content.
if (root.d === 'H') {
  const cols = (root.c || []).filter(c => !c.abs);
  const main = cols.filter(c => !c.k).sort((a, c) => c.w - a.w)[0];
  if (main && cols.length >= 2) {
    main.s = 'F' + (main.s || 'XX')[1];
    const idx = cols.indexOf(main), pm = Array.isArray(main.p) ? main.p : [0, 0, 0, 0];
    if (idx > 0 && pm[3] > 0) { root.g = (root.g || 0) + pm[3]; pm[3] = 0; main.p = pm; }   // fold left padding into the row gap
  } else if (main) main.s = 'F' + (main.s || 'XX')[1];
}
// clean tree, like the gold trees: drop keys that equal their default (the renderer defaults them anyway) so the
// build call the model types stays small. Kept: s (the door needs a sizing decision on every laid-out child).
(function strip(o) {
  if (o.g === 0) delete o.g;
  if (Array.isArray(o.p) && o.p.every(v => v === 0)) delete o.p;
  if (o.a === 'MM') delete o.a;
  (o.c || []).forEach(strip);
})(root);
fs.writeFileSync(outF, JSON.stringify(root));
// EXPECT = where a leaf will ACTUALLY land in Figma (the simulated auto-layout of this very tree — line-height text boxes,
// kit component heights, baked gaps and all), not the raw measured glyph box. So layout-sim --expect verifies the tree
// round-trips to its predicted Figma layout, and --geometry (sim vs a REAL dump) stays the external truth check. A leaf
// whose predicted spot differs from the measured glyph is the SAP line-height drift, which real Figma has too.
(function writeExpect() {
  const P = o => (Array.isArray(o.p) ? o.p : [o.p || 0, o.p || 0, o.p || 0, o.p || 0]);
  const leaf = o => !o.c || !!o.k, EX = root.sz === 'x';
  const par = new Map(); (function link(o) { for (const k of o.c || []) { par.set(k, o); link(k); } })(root);
  const mode = (o, i) => { if (o === root) return 'FIXED'; const L = (o.s || 'XX')[i]; if (L !== 'F') return L === 'H' ? 'HUG' : 'FIXED'; return EX ? 'FILL' : 'FIXED'; };
  const memo = new Map();
  const nat = (o, i) => { const m = memo.get(o) || memo.set(o, [null, null]).get(o); if (m[i] != null) return m[i]; let r; const L = mode(o, i), fx = i ? o.h : o.w;
    if (L === 'FIXED' && fx != null) r = fx; else if (leaf(o) || !o.d) r = fx || 0;
    else { const p = P(o), kids = o.c.filter(k => !k.abs), H = o.d === 'H', main = (i === 0) === H, ns = kids.map(k => nat(k, i)), pad = i === 0 ? p[1] + p[3] : p[0] + p[2];
      r = main ? ns.reduce((s, n) => s + n, 0) + (o.g || 0) * Math.max(0, kids.length - 1) + pad : Math.max(0, ...ns) + pad; }
    return (m[i] = r); };
  const box = new Map();
  (function place(o, x, y, W, Hh) { box.set(o, [x, y, W, Hh]); if (leaf(o)) return;
    if (!o.d) { for (const k of o.c) { const xy = k.xy || [0, 0]; place(k, x + xy[0], y + xy[1], nat(k, 0), nat(k, 1)); } return; }
    const p = P(o), H = o.d === 'H', fl = o.c.filter(k => !k.abs), inW = W - p[1] - p[3], inH = Hh - p[0] - p[2], mainA = H ? inW : inH, crossA = H ? inH : inW, mi = H ? 0 : 1, ci = H ? 1 : 0, a = o.a || 'MM';
    const z = fl.map(k => ({ k, fill: mode(k, mi) === 'FILL', main: nat(k, mi), cross: mode(k, ci) === 'FILL' ? crossA : nat(k, ci) }));
    const g0 = o.g || 0, gg = g0 * Math.max(0, z.length - 1), fills = z.filter(q => q.fill), fixed = z.reduce((s, q) => s + (q.fill ? 0 : q.main), 0);
    if (fills.length) { const sh = Math.max(0, mainA - fixed - gg) / fills.length; fills.forEach(q => q.main = sh); }
    const total = z.reduce((s, q) => s + q.main, 0); let gap = g0, pos = 0;
    if (a[0] === 'S' && z.length > 1) gap = Math.max(0, (mainA - total) / (z.length - 1)); else { const used = total + gg; pos = a[0] === 'C' ? (mainA - used) / 2 : a[0] === 'X' ? mainA - used : 0; }
    for (const q of z) { const co = a[1] === 'C' ? (crossA - q.cross) / 2 : a[1] === 'X' ? crossA - q.cross : 0; place(q.k, x + p[3] + (H ? pos : co), y + p[0] + (H ? co : pos), H ? q.main : q.cross, H ? q.cross : q.main); pos += q.main + gap; }
    for (const k of o.c.filter(k => k.abs)) { const xy = k.xy || [0, 0]; place(k, x + xy[0], y + xy[1], nat(k, 0), nat(k, 1)); }
  })(root, 0, 0, nat(root, 0), nat(root, 1));
  const seen = {};
  (function names(o) { seen[o.n] = (seen[o.n] || 0) + 1; (o.c || []).forEach(names); })(root);
  for (const [o, b] of box) if (leaf(o) && seen[o.n] === 1) EXPECT[o.n] = [R(b[0]), R(b[1]), R(b[2]), R(b[3])];
})();
fs.writeFileSync(outF.replace(/\.json$/, '') + '.expect.json', JSON.stringify(EXPECT));
let n = 0; (function c(o) { n++; (o.c || []).forEach(c); })(root);
console.log(`TREE  ${outF} · ${f.w}×${f.h} · ${n} layers from the measured reference (no gold)`);
if (unknown.length) console.log(`ICONS with no SAP name yet (pass --icons "WxH=name"): ${unknown.join(' · ')}`);
if (WARNS.length) console.log(`WARN  layout could not be cleanly split (kept in y-order):\n  ${WARNS.join('\n  ')}`);
