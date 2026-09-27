#!/usr/bin/env node
// audit-plan.js — end gate: does the build hold every element of the plan, the way the plan says?
//   node build/audit-plan.js <plan.json> <tree.json>
// plan.json = an ELEMENT PLAN ({rows:[…]}, validated by `node build/route.js --plan`) — or the
//             older router output (components+states, or --image zones).
// tree.json = the build dump from build/templates/dump-tree.use_figma.js (one read-only call).
// Output: MISSING / WRONG STYLE / WRONG COLOUR ROLE / WRONG PROP / WRONG DENSITY lines, same
// checklist format as audit-screen.py. Exit 1 on any line — the build is not done.
const fs = require('fs');
const T = require('./router-table.json');
const [planF, treeF] = process.argv.slice(2);
if (!planF || !treeF) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 10).join('\n')); process.exit(2); }
const plan = JSON.parse(fs.readFileSync(planF, 'utf8'));
const tree = JSON.parse(fs.readFileSync(treeF, 'utf8'));
const L = { missing: [], style: [], colour: [], prop: [], density: [] };
const used = new Set();
const norm = s => String(s || '').toLowerCase().replace(/[\s·•–-]+/g, ' ').trim();

// components: count per component + props; the Form Factor prop is density
function wantComponents(items) {
  const want = new Map();
  for (const { component, props } of items) {
    const k = component + JSON.stringify(props || {});
    const w = want.get(k) || { component, props: props || {}, count: 0 }; w.count++; want.set(k, w);
  }
  for (const w of want.values()) {
    let got = 0;
    for (const [i, n] of tree.entries()) {
      if (got >= w.count || used.has(i) || n.component !== w.component) continue;
      used.add(i); got++;
      for (const [p, v] of Object.entries(w.props))
        if (p in (n.props || {}) && n.props[p] !== v) (p === 'Form Factor' ? L.density : L.prop).push(`${w.component} "${n.name}": ${p}=${n.props[p]}, plan says ${v}`);
    }
    if (got < w.count) L.missing.push(`${w.count - got}× ${w.component}${Object.keys(w.props).length ? ' ' + JSON.stringify(w.props) : ''}`);
  }
}

if (plan.rows) {                                   // ── element plan ──
  const rows = plan.rows.filter(r => !r.ask);
  for (const r of rows.filter(r => r.kind === 'text')) {
    const i = tree.findIndex((n, j) => !used.has(j) && n.type === 'TEXT' && norm(n.text).includes(norm(r.text)));
    if (i < 0) { L.missing.push(`text "${r.text}" (${r.section})`); continue; }
    used.add(i); const n = tree[i];
    if (r.style && n.style !== r.style) L.style.push(`"${r.text}": ${n.style || 'no style'}, plan says ${r.style}`);
    const allowed = r.token ? [r.token] : (T.colour_roles[r.role] || []);
    if (allowed.length && !allowed.includes(n.fill)) L.colour.push(`"${r.text}": ${n.fill || 'no token'}, role ${r.role} needs ${allowed.join(' / ')}`);
  }
  wantComponents(rows.filter(r => r.kind === 'component').map(r => ({ component: r.component, props: r.props })));
  const icons = {}; for (const r of rows.filter(r => r.kind === 'icon')) icons[r.icon] = (icons[r.icon] || 0) + 1;
  for (const [icon, need] of Object.entries(icons)) {
    const have = tree.filter(n => n.type === 'INSTANCE' && (n.component === icon || n.name === icon)).length;
    if (have < need) L.missing.push(`${need - have}× icon "${icon}"`);
  }
  const logos = rows.filter(r => r.kind === 'logo').length, images = tree.filter(n => n.image).length;
  if (images < logos) L.missing.push(`${logos - images}× logo (image crop from the reference)`);
  const selTok = T.colour_roles.selected_border[0];
  for (const r of rows.filter(r => r.kind === 'container' && r.selected))
    if (!tree.some(n => n.stroke === selTok)) L.colour.push(`${r.element}: no border ${selTok} (selected card)`);
} else {                                           // ── router output (older plans) ──
  const items = [];
  if (plan.zones) for (const z of plan.zones) {
    if (!z.component || ['container', 'unmapped', 'ask', 'decoration'].includes(z.component)) continue;
    const p = { ...(z.props || {}), ...(z.state || {}) }; if (z.density) p['Form Factor'] = z.density;
    items.push({ component: z.component, props: p });
  } else for (const c of plan.components || []) {
    const p = {}; for (const s of (plan.states || []).filter(s => s.component === c.name)) p[s.prop] = s.value;
    items.push({ component: c.name, props: p });
  }
  wantComponents(items);
}

const show = (h, a) => console.log(`${h} (${a.length})${a.length ? '\n  - ' + a.join('\n  - ') : ''}`);
show('MISSING', L.missing); show('WRONG STYLE', L.style); show('WRONG COLOUR ROLE', L.colour);
show('WRONG PROP', L.prop); show('WRONG DENSITY', L.density);
const ok = Object.values(L).every(a => !a.length);
console.log(`VERDICT: ${ok ? 'MATCHES PLAN' : 'FIX THE ITEMS ABOVE, THEN RE-AUDIT'}`);
process.exit(ok ? 0 : 1);
