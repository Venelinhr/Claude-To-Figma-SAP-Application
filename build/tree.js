#!/usr/bin/env node
// tree.js — the v5 layout tree, before and after the build (0 tokens, no Figma).
//   node build/tree.js show <tree.json> [depth]   the first screen: ASCII picture · layer tree · lists (components +
//                                                  states, text styles, colour variables, icons) · lint
//   node build/tree.js plan <tree.json>            the same as `main` shows before an approval: wireframe · L1-L5 layers (repeated
//                                                  rows folded) · SAP components with real kit keys + states · lists · lint
//   node build/tree.js lint <tree.json>            exit 1 on: unknown kit name, raw colour, text without a SAP style,
//                                                  generic layer name
//   node build/tree.js rows <tree.json>            element-plan rows for audit-plan.js (when there is no image plan)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const [cmd, file, depthArg] = process.argv.slice(2);
if (!cmd || !file) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 8).join('\n')); process.exit(2); }
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const T = raw.tree || raw;
const ri = process.argv.indexOf('--ref'), REF = ri > 0 ? JSON.parse(fs.readFileSync(process.argv[ri + 1], 'utf8')) : null;
let ASKS = [];

// a HUG container (a designer's row/column) carries no w/h — the renderer sizes it from content. Resolve _w/_h
// bottom-up so the ASCII placement below never divides by an undefined width (a NaN would corrupt the whole grid).
function measure(o) {
  const kids = (o.c || []).filter(k => !k.abs);
  kids.forEach(measure);
  const pd = Array.isArray(o.p) ? o.p : [o.p || 0, o.p || 0, o.p || 0, o.p || 0];
  if (o.d) {
    const H = o.d === 'H', along = kids.reduce((s, k) => s + (H ? k._w : k._h), 0) + (o.g || 0) * Math.max(0, kids.length - 1);
    const cross = kids.reduce((m, k) => Math.max(m, H ? k._h : k._w), 0);
    o._w = o.w != null ? o.w : (H ? along + pd[1] + pd[3] : cross + pd[1] + pd[3]);
    o._h = o.h != null ? o.h : (H ? cross + pd[0] + pd[2] : along + pd[0] + pd[2]);
  } else {
    const ext = (i, dim) => kids.reduce((m, k) => Math.max(m, (k.xy ? k.xy[i] : 0) + k['_' + dim]), 0);
    o._w = o.w != null ? o.w : ext(0, 'w'); o._h = o.h != null ? o.h : ext(1, 'h');
  }
}
// a small auto-layout pass: absolute x/y for every node (enough for the ASCII picture)
function place(o, x, y) {
  o._x = x; o._y = y;
  const kids = (o.c || []).filter(k => !k.abs);
  if (o.d) {
    const p = Array.isArray(o.p) ? o.p : [o.p || 0, o.p || 0, o.p || 0, o.p || 0];
    const H = o.d === 'H', a = o.a || 'MM';
    const used = kids.reduce((s, k) => s + (H ? k._w : k._h), 0) + (o.g || 0) * Math.max(0, kids.length - 1);
    const free = (H ? o._w - p[1] - p[3] : o._h - p[0] - p[2]) - used;
    let cur = (H ? p[3] : p[0]) + (a[0] === 'C' ? free / 2 : a[0] === 'X' ? free : 0);
    const gap = a[0] === 'S' && kids.length > 1 ? (o.g || 0) + free / (kids.length - 1) : (o.g || 0);
    for (const k of kids) {
      const cross = H ? o._h - p[0] - p[2] - k._h : o._w - p[1] - p[3] - k._w;
      const off = (H ? p[0] : p[3]) + (a[1] === 'C' ? cross / 2 : a[1] === 'X' ? cross : 0);
      place(k, H ? x + cur : x + off, H ? y + off : y + cur);
      cur += (H ? k._w : k._h) + gap;
    }
  } else for (const k of kids) place(k, x + (k.xy ? k.xy[0] : 0), y + (k.xy ? k.xy[1] : 0));
  for (const k of (o.c || []).filter(k => k.abs)) place(k, x + (k.xy ? k.xy[0] : 0), y + (k.xy ? k.xy[1] : 0));
}
measure(T);
place(T, 0, 0);
const all = []; (function walk(o, d) { o._d = d; all.push(o); (o.c || []).forEach(k => walk(k, d + 1)); })(T, 0);

function ascii(maxDepth) {
  const W = 118, sx = W / T.w, sy = sx / 2, H = Math.max(6, Math.round(T.h * sy));
  const g = Array.from({ length: H + 1 }, () => Array(W + 1).fill(' '));
  const X = o => [Math.round(o._x * sx), Math.round(o._y * sy), Math.min(W, Math.round((o._x + o._w) * sx)), Math.min(H, Math.round((o._y + o._h) * sy))];
  const put = (x, y, t, max, over = ' ') => { if (!(y >= 0 && y <= H) || !(x >= 0)) return; if (x <= W && '|+'.includes(g[y][x])) x++;
    for (let i = 0; i < Math.min(t.length, max) && x + i <= W; i++) { if (g[y][x + i] !== ' ' && g[y][x + i] !== over) break; g[y][x + i] = t[i]; } };   // stop at a border
  for (const o of all.filter(o => !o.k && o._d <= maxDepth && o._w * sx >= 8 && o._h * sy >= 2)) {   // containers = boxes
    const [x0, y0, x1, y1] = X(o);
    for (let x = x0; x <= x1; x++) for (const y of [y0, y1]) g[y][x] = g[y][x] === '|' ? '+' : '-';
    for (let y = y0; y <= y1; y++) for (const x of [x0, x1]) g[y][x] = g[y][x] === '-' ? '+' : '|';
    put(x0 + 1, y0, o.n, x1 - x0 - 1, '-');
  }
  const lab = o => o.k === 't' ? String(o.t).replace(/\s+/g, ' ')
    : o.k === 'ic' ? '◇'
    : o.k === 'i' ? (/Radio/.test(o.cp) ? (o.pr && /true/i.test(String(o.pr.Selected)) ? '◉ ' : '○ ') + (o.tx ? Object.values(o.tx)[0] : o.pr && o.pr['✏️ Label'] || '')
      : /Check Box/.test(o.cp) ? '☐ ' + (o.pr && o.pr['✏️ Label'] || '')
      : '[' + ((o.tx && Object.values(o.tx)[0]) || (o.pr && (Object.entries(o.pr).find(([k]) => k.startsWith('✏️')) || [])[1]) || (o.pr && o.pr.Icon) || o.cp) + ']')
    : o.k === 'r' && o.w * sx >= 8 ? '─'.repeat(Math.round(o.w * sx)) : '';
  for (const o of all.filter(o => o.k)) {                                          // leaves = labels in place
    const [x0, , x1] = X(o), t = lab(o), y = Math.round((o._y + o.h / 2) * sy);
    const w = Math.max(4, x1 - x0), box = t && t[0] === '[';                      // a [component] never runs into its neighbour
    if (t) put(x0, y, box && t.length > w ? t.slice(0, w - 2) + '…]' : t, box ? w + 1 : t.length);
  }
  return g.map(r => r.join('').replace(/\s+$/, '')).join('\n');
}
function layers(maxDepth) {
  const out = [];
  (function walk(o, pre, last, d) {
    const p = Array.isArray(o.p) ? o.p.join('/') : o.p;
    const what = o.k === 't' ? `"${String(o.t).slice(0, 28)}" ${o.st || 'NO STYLE'} · ${o.bg || ''}`
      : o.k === 'i' ? `<${o.cp}> ${Object.entries(o.pr || {}).filter(([k]) => /Type|Selected|Form Factor|State|Icon|Value$/.test(k)).map(([k, v]) => `${k}=${v}`).join(' ')}`
      : o.k === 'ic' ? `icon ${o.ic} · ${o.bg || ''}` : o.k === 'r' ? `rect ${o.w}×${o.h} · ${o.bg || ''}` : o.k === 'v' ? 'vector'
      : `${o.d ? (o.d === 'H' ? '→' : '↓') + (o.g ? ' g' + o.g : '') + (p ? ' p' + p : '') : 'frame'}${o.bg ? ' · ' + o.bg : ''}${o.bc ? ' · border ' + o.bc : ''}${o.img ? ' · image' : ''}`;
    out.push(`${pre}${d ? (last ? '└ ' : '├ ') : ''}${o.n}  ${what}${o.s ? '  [' + o.s + ']' : ''}`);
    if (d >= maxDepth) { if (o.c) out.push(`${pre}${last ? '  ' : '│ '}  … ${o.c.length} inside`); return; }
    (o.c || []).forEach((k, i) => walk(k, d ? pre + (last ? '  ' : '│ ') : '', i === o.c.length - 1, d + 1));
  })(T, '', true, 0);
  return out.join('\n');
}
function lists() {
  const count = arr => Object.entries(arr.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ×${n}`).join(' · ');
  const comps = all.filter(o => o.k === 'i').map(o => `${o.cp}${o.pr && o.pr.Selected ? ' (Selected ' + o.pr.Selected + ')' : ''}${o.pr && o.pr.Type ? ' (' + o.pr.Type + ')' : ''}`);
  return [`Components   ${count(comps) || '—'}`, `Text styles  ${count(all.filter(o => o.k === 't').map(o => o.st || 'NO STYLE'))}`,
    `Variables    ${count(all.flatMap(o => [o.bg, o.bc]).filter(t => typeof t === 'string'))}`,
    `Icons        ${count(all.filter(o => o.k === 'ic').map(o => o.ic)) || '—'}`,
    `Density      ${count(all.filter(o => o.pr && o.pr['Form Factor']).map(o => o.pr['Form Factor'])) || '—'}`].join('\n');
}
function lint() {                                             // the front door (build/door.js) is the one gate
  const r = require('./door.js').door(T, file, REF); ASKS = r.ask;
  return r.out.map(([w, m]) => `${w}: ${m}`);
}
function rows() {
  const R = require('./router-table.json').colour_roles;
  const out = [];
  for (const o of all) {
    if (o.k === 't') out.push({ section: 'A', element: o.n, kind: 'text', text: o.t, style: o.st, token: o.bg });
    else if (o.k === 'i') out.push({ section: 'A', element: o.n, kind: 'component', component: o.cp,
      props: Object.fromEntries(Object.entries(o.pr || {}).filter(([k]) => /Type|Selected|Form Factor|Value State/.test(k))) });
    else if (o.k === 'ic') out.push({ section: 'A', element: o.n, kind: 'icon', icon: o.ic });
    else if (!o.k && o.img) out.push({ section: 'A', element: o.n, kind: 'logo' });
    else if (!o.k && typeof o.bc === 'string') {
      const role = ['card_border', 'selected_border'].find(r => R[r] && R[r].includes(o.bc));
      if (role) out.push({ section: 'A', element: o.n, kind: 'container', border_role: role });
    }
  }
  return { frame: { w: T.w, h: T.h }, sections: [{ id: 'A', name: T.n }], rows: out };
}
if (cmd === 'rows') { process.stdout.write(JSON.stringify(rows(), null, 1)); process.exit(0); }
// `plan`: the analysis a person approves. Same order as main's Gate 3: wireframe, L1-L5 layers, components + keys.
function sig(o) { return [o.n.replace(/\d+/g, '#'), o.k || '', o.cp || '', (o.c || []).map(sig).join(',')].join('|'); }
function lTree(max) {
  const out = [];
  (function walk(o, d, pre) {
    const p = Array.isArray(o.p) ? o.p.join('/') : o.p, pr = Object.entries(o.pr || {}).map(([k, v]) => `${k}=${v}`).join(' ');
    const what = o.k === 't' ? `text "${String(o.t).slice(0, 30)}" · ${o.st || 'NO STYLE'} · ${o.bg || ''}`
      : o.k === 'i' ? `SAP ${o.cp}${pr ? ' · ' + pr : ''}${o.tx ? ' · "' + Object.values(o.tx).join('" "').slice(0, 40) + '"' : ''}`
      : o.k === 'ic' ? `icon ${o.ic}` : o.k === 'r' ? `rect ${o.w}×${o.h} · ${o.bg || ''}` : o.k === 'v' ? 'vector'
      : `${o.d ? (o.d === 'H' ? 'HORIZONTAL' : 'VERTICAL') : 'free'}${o.g ? ' gap ' + o.g : ''}${p ? ' pad ' + p : ''}${o.bg ? ' · fill ' + o.bg : ''}${o.bc ? ' · border ' + o.bc : ''}${o.img ? ' · image fill' : ''} · ${o.w != null && o.h != null ? o.w + '×' + o.h : 'auto size'}`;
    out.push(`L${d + 1}${' '.repeat(2 * d + 1)}${o.n}   ${what}${o.s ? ' [' + o.s + ']' : ''}`);
    if (d + 1 >= max) { if (o.c) out.push(`${' '.repeat(2 * d + 6)}… ${o.c.length} inside`); return; }
    for (let i = 0; i < (o.c || []).length; i++) {
      const k = o.c[i]; let j = i; while (j + 1 < o.c.length && sig(o.c[j + 1]) === sig(k)) j++;
      walk(k, d + 1);
      if (j > i) { out.push(`L${d + 2}${' '.repeat(2 * d + 3)}… ×${j - i} more with the same structure (texts differ): ${o.c.slice(i + 1, j + 1).map(x => x.n).join(', ').slice(0, 90)}`); i = j; }
    }
  })(T, 0);
  return out.join('\n');
}
function compTable() {
  const kit = require('./kit-live.js'), by = {};
  for (const o of all.filter(o => o.k === 'i')) {
    const kd = Object.fromEntries(Object.entries((kit.components[o.cp] || {}).props || {}).map(([n, v]) => [n.replace(/#.*$/, ''), v.startsWith('I:') ? v.split(' ').pop() : v.replace(/^[A-Z]:/, '').split(/[| ]/)[0]]));
    const st = Object.fromEntries(Object.entries(o.pr || {}).filter(([k, v]) => !/^✏️|By Text/.test(k) && String(kd[k]) !== String(v)));   // states that differ from the kit default
    const key = o.cp + '|' + JSON.stringify(st), e = by[key] || (by[key] = { cp: o.cp, pr: st, n: 0 });
    e.n++;
  }
  const rows = Object.values(by).sort((a, b) => a.cp.localeCompare(b.cp) || b.n - a.n);
  const w = ['Component', 'Key', 'Variant props (non-default)', '×'];
  const body = rows.map(e => { const c = kit.components[e.cp];
    return [e.cp, c ? c.key.slice(0, 10) + '…' : 'NOT FOUND', Object.entries(e.pr).map(([k, v]) => `${k}=${v}`).join(', ') || 'default', String(e.n)]; });
  const wd = w.map((h, i) => Math.min(60, Math.max(h.length, ...body.map(r => r[i].length))));
  const fmt = r => '| ' + r.map((c, i) => c.slice(0, wd[i]).padEnd(wd[i])).join(' | ') + ' |';
  return [fmt(w), '|' + wd.map(x => '-'.repeat(x + 2)).join('|') + '|', ...body.map(fmt)].join('\n');
}
const problems = lint();
if (cmd === 'plan') {
  console.log(`FRAME  ${T.w}×${T.h} · ${T.n} · ${all.length} layers\n\nWIREFRAME\n${ascii(3)}\n\nL1-L5 LAYER TREE (names = what the Figma layers will be called)\n${lTree(Number(/^\d+$/.test(depthArg || '') ? depthArg : 5))}\n\nSAP COMPONENTS (real kit keys)\n${compTable()}\n\nLISTS\n${lists()}\n\nDOOR  ${problems.length ? '✗ ' + problems.length + ' OUT — fix the tree, run again, never show a plan with OUT\n' + problems.map(p => '  ✗ ' + p).join('\n') : '✓ ALL IN — show the plan'}${ASKS.length ? '\nASK THE USER\n' + ASKS.map(a => '  ? ' + a).join('\n') : ''}`);
  process.exit(problems.length ? 1 : 0);
}
if (cmd === 'lint') { console.log(problems.length ? problems.map(p => '✗ ' + p).join('\n') : '✓ lint clean'); process.exit(problems.length ? 1 : 0); }
const depth = Number(/^\d+$/.test(depthArg || '') ? depthArg : 4);
console.log(`SCREEN  ${T.n} · ${T.w}×${T.h} · ${all.length} layers\n\n${ascii(3)}\n\nLAYERS (depth ≤ ${depth})\n${layers(depth)}\n\nLISTS\n${lists()}\n\nLINT  ${problems.length ? problems.length + ' problem(s)\n' + problems.map(p => '  ✗ ' + p).join('\n') : '✓ clean — ready to build'}`);
process.exit(problems.length ? 1 : 0);
