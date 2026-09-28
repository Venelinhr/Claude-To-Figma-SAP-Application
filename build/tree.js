#!/usr/bin/env node
// tree.js — the v5 layout tree, before and after the build (0 tokens, no Figma).
//   node build/tree.js show <tree.json> [depth]   the first screen: ASCII picture · layer tree · lists (components +
//                                                  states, text styles, colour variables, icons) · lint
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

// a small auto-layout pass: absolute x/y for every node (enough for the ASCII picture)
function place(o, x, y) {
  o._x = x; o._y = y;
  const kids = (o.c || []).filter(k => !k.abs);
  if (o.d) {
    const p = Array.isArray(o.p) ? o.p : [o.p || 0, o.p || 0, o.p || 0, o.p || 0];
    const H = o.d === 'H', a = o.a || 'MM';
    const used = kids.reduce((s, k) => s + (H ? k.w : k.h), 0) + (o.g || 0) * Math.max(0, kids.length - 1);
    const free = (H ? o.w - p[1] - p[3] : o.h - p[0] - p[2]) - used;
    let cur = (H ? p[3] : p[0]) + (a[0] === 'C' ? free / 2 : a[0] === 'X' ? free : 0);
    const gap = a[0] === 'S' && kids.length > 1 ? (o.g || 0) + free / (kids.length - 1) : (o.g || 0);
    for (const k of kids) {
      const cross = H ? o.h - p[0] - p[2] - k.h : o.w - p[1] - p[3] - k.w;
      const off = (H ? p[0] : p[3]) + (a[1] === 'C' ? cross / 2 : a[1] === 'X' ? cross : 0);
      place(k, H ? x + cur : x + off, H ? y + off : y + cur);
      cur += (H ? k.w : k.h) + gap;
    }
  } else for (const k of kids) place(k, x + (k.xy ? k.xy[0] : 0), y + (k.xy ? k.xy[1] : 0));
  for (const k of (o.c || []).filter(k => k.abs)) place(k, x + (k.xy ? k.xy[0] : 0), y + (k.xy ? k.xy[1] : 0));
}
place(T, 0, 0);
const all = []; (function walk(o, d) { o._d = d; all.push(o); (o.c || []).forEach(k => walk(k, d + 1)); })(T, 0);

function ascii(maxDepth) {
  const W = 110, sx = W / T.w, sy = sx / 2.2, H = Math.max(6, Math.round(T.h * sy));
  const g = Array.from({ length: H + 1 }, () => Array(W + 1).fill(' '));
  for (const o of all.filter(o => !o.k && o._d <= maxDepth && o.w * sx >= 6 && o.h * sy >= 2)) {
    const x0 = Math.round(o._x * sx), y0 = Math.round(o._y * sy), x1 = Math.min(W, Math.round((o._x + o.w) * sx)), y1 = Math.min(H, Math.round((o._y + o.h) * sy));
    for (let x = x0; x <= x1; x++) for (const y of [y0, y1]) g[y][x] = g[y][x] === '|' ? '+' : '-';
    for (let y = y0; y <= y1; y++) for (const x of [x0, x1]) g[y][x] = g[y][x] === '-' ? '+' : '|';
    const label = o.n.slice(0, Math.max(0, x1 - x0 - 2));
    for (let i = 0; i < label.length; i++) g[y0][x0 + 1 + i] = label[i];
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
function lint() {
  const L = [];
  const k = spawnSync(process.execPath, [path.join(__dirname, 'kit.js'), 'pack', '--plan', file], { encoding: 'utf8' });
  for (const l of String(k.stderr || '').split('\n').filter(l => /NOT FOUND/.test(l))) L.push('kit: ' + l.replace(/^\/\/ /, ''));
  for (const o of all) {
    for (const t of [o.bg, o.bc]) if (typeof t === 'string' && t.startsWith('RAW')) L.push(`"${o.n}": raw colour ${t.slice(3)} — use a SAP variable`);
    if (o.k === 't' && !o.st) L.push(`"${o.n}": text "${String(o.t).slice(0, 20)}" has no SAP text style`);
    if (!o.k && /^(frame|group|rectangle|auto layout)\s*\d*$/i.test(o.n)) L.push(`"${o.n}": generic layer name — name it after what it is`);
  }
  return [...new Set(L)];
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
const problems = lint();
if (cmd === 'lint') { console.log(problems.length ? problems.map(p => '✗ ' + p).join('\n') : '✓ lint clean'); process.exit(problems.length ? 1 : 0); }
const depth = Number(depthArg || 4);
console.log(`SCREEN  ${T.n} · ${T.w}×${T.h} · ${all.length} layers\n\n${ascii(3)}\n\nLAYERS (depth ≤ ${depth})\n${layers(depth)}\n\nLISTS\n${lists()}\n\nLINT  ${problems.length ? problems.length + ' problem(s)\n' + problems.map(p => '  ✗ ' + p).join('\n') : '✓ clean — ready to build'}`);
process.exit(problems.length ? 1 : 0);
