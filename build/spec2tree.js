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
const R = v => Math.round(v * 10) / 10, used = {}, unknown = [];
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
  if (o.type === 'text') return { n: name(o.text.length > 24 ? o.text.slice(0, 24) + '…' : o.text), k: 't', t: o.text, st: o.style, bg: tok(o.token, 'ink', o.color), w, h, s: 'HH' };
  if (o.type === 'icon') {
    let ic = o.icon; const key = `${w}x${h}`;
    if (MAP[key] && MAP[key].startsWith('text:')) { const [, t, st] = MAP[key].split(':'); return { n: name(t), k: 't', t, st, bg: 'sapTextColor', w, h, s: 'HH' }; }
    if (MAP[key]) ic = MAP[key];
    if (!ic || ic === '?') unknown.push(`${key} at ${x},${y} ${o.color || ''}`);
    const z = Math.round(Math.max(w, h) / 0.8), c = [x + w / 2, y + h / 2];               // a SAP icon's drawing fills ~80 % of its frame
    return { n: name(ic && ic !== '?' ? ic : 'icon ' + key), k: 'ic', ic: ic || '?', bg: tok(o.token, 'icon', o.color), w: z, h: z, s: 'XX', box: [c[0] - z / 2, c[1] - z / 2] };
  }
  if (o.type === 'component') {
    const pr = { ...(o.props || {}) };
    if (/Radio|Check Box/.test(o.component) && o.text) { pr.Label = true; pr['✏️ Text'] = o.text; }
    if (/^Button/.test(o.component) && o.text) pr['✏️ Text'] = o.text;
    if (/Range Slider/.test(o.component) && !pr['Right Value']) pr['Right Value'] = '100%';   // a filter shows its full range
    return { n: name(o.text || o.component), k: 'i', cp: o.component, pr, w: o.width || w, h, s: /Slider|Input|Select|^Button/.test(o.component) ? 'XH' : 'HH' };
  }
  if (o.type === 'divider' || o.type === 'separator') return { n: name(o.type === 'divider' ? 'Divider' : 'Separator'), k: 'r', w: Math.max(w, 1), h: Math.max(h, 1), bg: tok(o.token, 'line', o.color), s: 'XX' };
  if (o.type === 'image') return { n: name('Logo'), w, h, r: 4, crop: o.crop || o.box, s: 'XX' };
}
function conv(o, px, py) {
  const [x, y, w, h] = o.box, kids = (o.children || []).slice();
  if (!['row', 'column', 'box', 'stack'].includes(o.type)) { const l = leaf(o), at = l.box || [x, y]; delete l.box; l.xy = [R(at[0] - px), R(at[1] - py)]; return l; }   // icons stay centred on the measured drawing
  const n = { n: name(o.type === 'box' ? 'Card ' + (label(o) || '') : (label(o) || o.type) + ' ' + o.type), xy: [R(x - px), R(y - py)], w, h, s: 'XX' };
  if (o.type === 'box') {
    n.bg = tok(o.fill, 'fill'); n.r = o.radius || 0;
    const m = /(\d+)px (\S+)/.exec(o.border || ''); if (m) { n.bw = +m[1]; n.bc = tok(m[2], 'border'); }
  }
  const H = o.type === 'row' || (o.type === 'box' && o.layout && o.layout.dir === 'row');
  kids.sort((a, b) => H ? a.box[0] - b.box[0] : a.box[1] - b.box[1]);
  const st = kids.map(k => H ? k.box[0] : k.box[1]), sz = kids.map(k => H ? k.box[2] : k.box[3]);
  const gaps = kids.slice(1).map((k, i) => st[i + 1] - st[i] - sz[i]), med = gaps.length ? gaps.slice().sort((a, b) => a - b)[gaps.length >> 1] : 0;
  const cr = kids.map(k => H ? [k.box[1] - y, y + h - k.box[1] - k.box[3], k.box[1] + k.box[3] / 2] : [k.box[0] - x, x + w - k.box[0] - k.box[2], k.box[0] + k.box[2] / 2]);
  const same = i => kids.length < 2 || Math.max(...cr.map(c => c[i])) - Math.min(...cr.map(c => c[i])) <= 3;
  const cross = same(0) ? 'M' : same(1) ? 'X' : same(2) ? 'C' : null;                  // top/left · bottom/right · centre
  const auto = o.type !== 'stack' && cross && gaps.every(g => g >= -1 && Math.abs(g - med) <= 3);
  const spread = o.type === 'row' && kids.length === 2 && med > 40;
  if (auto || spread) {
    n.d = H ? 'H' : 'V';
    const first = kids[0] ? kids[0].box : o.box, last = kids.length ? kids[kids.length - 1].box : o.box;
    const pt = R((kids.length ? Math.min(...kids.map(k => k.box[1])) : y) - y), pl = R((kids.length ? Math.min(...kids.map(k => k.box[0])) : x) - x);
    const pb = R(y + h - (kids.length ? Math.max(...kids.map(k => k.box[1] + k.box[3])) : y + h)), pr = R(x + w - (kids.length ? Math.max(...kids.map(k => k.box[0] + k.box[2])) : x + w));
    n.p = [Math.max(0, pt), Math.max(0, pr), Math.max(0, pb), Math.max(0, pl)];
    if (spread) n.a = 'S' + (cross || 'C'); else { n.g = Math.max(0, R(med)); n.a = 'M' + cross; }
    n.c = kids.map(k => { const c = conv(k, x, y); delete c.xy; return c; });
  } else {                                          // unequal spacing: children keep their measured place
    n.c = kids.map(k => conv(k, x, y));
    const E = n.c.map(c => [c.xy[0], c.xy[0] + c.w / 2, c.xy[0] + c.w]);
    n.c.forEach((c, i) => {                         // a text keeps the edge it shares with a sibling (SAP text is narrower)
      if (c.k !== 't') return;
      const near = j => E.some((e, k) => k !== i && Math.abs(e[j] - E[i][j]) <= 3);
      const rightOfComp = E.some((e, k) => k !== i && n.c[k].k === 'i' && Math.abs(e[2] - E[i][2]) <= 3);   // e.g. a price above its button
      const ta = rightOfComp ? 'R' : near(0) ? null : near(2) ? 'R' : near(1) ? 'C' : null;
      if (ta) { c.ta = ta; c.s = 'XH'; const x = Math.round(c.w * 0.5);                // spare width on the free side:
        if (ta === 'R') { c.xy[0] -= x; c.w += x; } else if (ta === 'C') { c.xy[0] -= x / 2; c.w += x; } }   // SAP text may be wider (01:00+1 wrapped)
    });
  }
  return n;
}
// RESPONSIVE: no free placement. A frame with placed children becomes auto-layout: children are grouped into bands
// (overlap in y), each band is a row (H) with spacer frames for the measured gaps; bands stack in a column (V).
// The widest gap (>40) is a FILL spacer, so the row flexes. Then a sizing pass: FILL width for containers in columns,
// one FILL child in every row, HUG height for containers.
const SP = (d, g, fill) => ({ n: 'Spacer', d, s: fill ? (d === 'H' ? 'FX' : 'XF') : 'XX', w: d === 'H' ? R(g) : 1, h: d === 'H' ? 1 : R(g) });
function flow(n) {
  const kids = n.c || []; if (n.d || !kids.length || !kids.some(c => c.xy)) return;
  const [W, Ht] = [n.w, n.h], b = c => c._b || (c._b = [c.xy[0], c.xy[1], c.xy[0] + c.w, c.xy[1] + c.h]);
  const pl = Math.max(0, Math.min(...kids.map(c => b(c)[0]))), pt = Math.max(0, Math.min(...kids.map(c => b(c)[1])));
  const pr = Math.max(0, W - Math.max(...kids.map(c => b(c)[2]))), pb = Math.max(0, Ht - Math.max(...kids.map(c => b(c)[3])));
  const sorted = kids.slice().sort((a, c) => b(a)[1] - b(c)[1] || b(a)[0] - b(c)[0]), bands = [];
  sorted.forEach(c => { const cur = bands[bands.length - 1]; if (cur && b(c)[1] < cur.bot - 1) { cur.k.push(c); cur.bot = Math.max(cur.bot, b(c)[3]); } else bands.push({ k: [c], top: b(c)[1], bot: b(c)[3] }); });
  const inner = W - pr, out = [];
  bands.forEach((bd, bi) => {
    if (bi) out.push(SP('V', bd.top - bands[bi - 1].bot));
    const ks = bd.k.sort((a, c) => b(a)[0] - b(c)[0]), lead = b(ks[0])[0] - pl, trail = inner - b(ks[ks.length - 1])[2];
    ks.forEach(c => { if (c.k === 't' && !c.ta) c.s = 'HH'; });
    if (ks.length === 1 && lead <= 3) { const c = ks[0]; if (trail <= 3 && c.k !== 'i' && c.k !== 'ic') c.s = 'F' + (c.s || 'XX')[1]; delete c.xy; out.push(c); if (trail > 3 || c.k === 'ic') { /* keep left */ } return; }
    const row = []; let prev = pl, gaps = [];
    ks.forEach(c => {
      const g = b(c)[0] - prev; if (g > 3) { const sp = SP('H', g); row.push(sp); gaps.push(sp); }
      const dy = b(c)[1] - bd.top; let it = c; delete it.xy;
      if (dy > 3) it = { n: c.n + ' offset', d: 'V', g: 0, p: [0, 0, 0, 0], a: 'MM', s: 'HH', c: [SP('V', dy), c] };
      row.push(it); prev = b(c)[2];
    });
    if (inner - prev > 3) { const sp = SP('H', inner - prev); row.push(sp); gaps.push(sp); }
    const wide = gaps.filter(g => g.w > 40).sort((a, c) => c.w - a.w)[0]; if (wide) wide.s = 'FX';
    const cent = ks.every(c => Math.abs(b(c)[1] + c.h / 2 - (bd.top + bd.bot) / 2) <= 3), top = ks.every(c => Math.abs(b(c)[1] - bd.top) <= 3);
    out.push({ n: (ks.map(c => c.t || c.n)[0] || 'Band') + ' row', d: 'H', g: 0, p: [0, 0, 0, 0], a: 'M' + (cent ? 'C' : 'M'), s: 'FH', c: row });
  });
  kids.forEach(c => delete c._b);
  n.d = 'V'; n.g = 0; n.p = [pt, pr, pb, pl]; n.a = 'MM'; n.c = out;
}
function size(o, root) {
  (o.c || []).forEach(c => size(c));
  const kids = (o.c || []).filter(c => !c.abs);
  if (o.d && !root && !o.k && o.n !== 'Spacer') o.s = (o.s || 'XX')[0] + 'H';
  if (o.d === 'V') kids.forEach(c => { const cont = !c.k || c.k === 'r' || (c.k === 't' && c.w > 120); if (cont && c.n !== 'Spacer' && (c.s || 'XX')[0] === 'X' && (c.w > 120 || c.d)) c.s = 'F' + (c.s || 'XX')[1]; });
  if (o.d === 'H' && !kids.some(c => (c.s || '')[0] === 'F')) {
    const cand = kids.filter(c => c.k !== 'i' && c.k !== 'ic' && c.w > 40).sort((a, c) => c.w - a.w)[0];
    if (cand) cand.s = 'F' + (cand.s || 'XX')[1];
  }
}
const f = spec.frame, root = { n: 'Flight results', sz: 'x', w: f.w, h: f.h, bg: f.fill || 'sapBaseColor', clip: 1,
  c: spec.sections.map(s => conv(s, 0, 0)) };
(function fl(o) { (o.c || []).forEach(fl); flow(o); })(root);
size(root, true);
fs.writeFileSync(outF, JSON.stringify(root));
let n = 0; (function c(o) { n++; (o.c || []).forEach(c); })(root);
console.log(`TREE  ${outF} · ${f.w}×${f.h} · ${n} layers from the measured reference (no gold)`);
if (unknown.length) console.log(`ICONS with no SAP name yet (pass --icons "WxH=name"): ${unknown.join(' · ')}`);
