#!/usr/bin/env node
// audit-plan.js — end gate: does the build hold every element of the plan, the way the plan says?
//   node build/audit-plan.js <plan.json> <tree.json>
// plan.json = an ELEMENT PLAN ({rows:[…]}, validated by `node build/route.js --plan`) — or the
//             older router output (components+states, or --image zones).
// tree.json = the build dump from build/templates/dump-tree.use_figma.js (one read-only call).
// Output: MATCH NN% (plan rows built right ÷ all rows), the rows to fix (MISSING / WRONG STYLE /
// WRONG COLOUR ROLE / WRONG PROP / WRONG DENSITY) and HYGIENE (non-72 font, raw hex, generic
// names, placeholder text, default icons — kit internals skipped). Exit 0 = MATCH ≥ 90% and 0 hygiene.
const fs = require('fs');
const T = require('./router-table.json');
const [planF, treeF] = process.argv.slice(2);
if (!planF || !treeF) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 10).join('\n')); process.exit(2); }
const plan = JSON.parse(fs.readFileSync(planF, 'utf8'));
const tree = JSON.parse(fs.readFileSync(treeF, 'utf8'));
const PASS = 90;
const L = { missing: [], style: [], colour: [], prop: [], density: [], hygiene: [] };
const used = new Set();
const norm = s => String(s || '').toLowerCase().replace(/[\s·•–-]+/g, ' ').trim();
const R = T.colour_roles;
const take = test => { const i = tree.findIndex((n, j) => !used.has(j) && test(n)); if (i >= 0) used.add(i); return i < 0 ? null : tree[i]; };

// components: count per component + props; the Form Factor prop is density
// Each plan row takes its node in 3 passes: same layer name (builds name layers after the plan
// element), then same props, then any node of the component. Taking nodes in tree order alone
// paired "R2 Supplier" with the plan's Currency cell (403:6701: 22 false WRONG PROP lines).
function wantComponents(items) {
  const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();      // True == true
  const propsOk = (n, props) => Object.entries(props || {}).every(([p, v]) => !(p in (n.props || {})) || same(n.props[p], v));
  const pick = test => { for (const [i, n] of tree.entries()) if (!used.has(i) && test(n)) { used.add(i); return n; } return null; };
  const got = new Map();
  const pass = test => items.forEach((it, k) => { if (!got.has(k)) { const n = pick(n => n.component === it.component && test(n, it)); if (n) got.set(k, n); } });
  pass((n, it) => it.element && norm(n.name) === norm(it.element));
  pass((n, it) => propsOk(n, it.props));
  pass(() => true);
  let ok = 0;
  const missing = new Map();
  items.forEach((it, k) => {
    const n = got.get(k);
    if (!n) { const key = `${it.component}${Object.keys(it.props || {}).length ? ' ' + JSON.stringify(it.props) : ''}`; missing.set(key, (missing.get(key) || 0) + 1); return; }
    let good = true;
    for (const [p, v] of Object.entries(it.props || {}))
      if (p in (n.props || {}) && !same(n.props[p], v)) { good = false; (p === 'Form Factor' ? L.density : L.prop).push(`${it.component} "${n.name}": ${p}=${n.props[p]}, plan says ${v}`); }
    if (good) ok++;
  });
  for (const [key, c] of missing) L.missing.push(`${c}× ${key}`);
  return ok;
}

let total = 0, ok = 0;
if (plan.rows) {                                   // ── element plan ──
  const rows = plan.rows.filter(r => !r.ask);
  total = rows.length;
  for (const r of rows.filter(r => r.kind === 'text')) {
    const n = take(n => n.type === 'TEXT' && norm(n.text).includes(norm(r.text)));
    if (!n) { L.missing.push(`text "${r.text}" (${r.section})`); continue; }
    if (n.inInst) { ok++; continue; }             // label inside a kit component: the component owns style + colour
    let good = true;
    if (r.style && n.style !== r.style) { good = false; L.style.push(`"${r.text}": ${n.style || 'no style'}, plan says ${r.style}`); }
    const allowed = r.token ? [r.token] : (R[r.role] || []);
    if (allowed.length && !allowed.includes(n.fill)) { good = false; L.colour.push(`"${r.text}": ${n.fill || 'no token'}, role ${r.role} needs ${allowed.join(' / ')}`); }
    if (good) ok++;
  }
  ok += wantComponents(rows.filter(r => r.kind === 'component').map(r => ({ component: r.component, props: r.props, element: r.element })));
  for (const r of rows.filter(r => r.kind === 'icon'))
    if (take(n => n.type === 'INSTANCE' && (n.component === r.icon || n.name === r.icon))) ok++;
    else L.missing.push(`icon "${r.icon}" (${r.meaning || r.element}, ${r.section})`);
  for (const r of rows.filter(r => r.kind === 'logo'))
    if (take(n => n.image)) ok++; else L.missing.push(`logo "${r.element}" (image crop from the reference)`);
  for (const r of rows.filter(r => r.kind === 'divider')) {
    const toks = r.token ? [r.token] : R[r.role || 'divider'];
    if (take(n => n.type !== 'TEXT' && n.type !== 'INSTANCE' && toks.includes(n.stroke))) ok++;
    else L.missing.push(`divider "${r.element}" (${r.section}) — stroke ${toks[0]}`);
  }
  for (const r of rows.filter(r => r.kind === 'container')) {
    const bt = r.selected ? R.selected_border : r.border_role ? R[r.border_role] : null;
    const ft = r.fill_role ? R[r.fill_role] : null;
    const hit = take(n => n.type !== 'TEXT' && n.type !== 'INSTANCE' && (bt ? bt.includes(n.stroke) : ft.includes(n.fill)));
    if (hit) ok++;
    else (bt ? L.colour : L.missing).push(`${r.element}: no ${bt ? `border ${bt[0]}${r.selected ? ' (selected card)' : ''}` : `fill ${ft[0]}`}`);
  }
  // default icons left in place: a globe the plan never asked for, or more "information" than planned
  const planned = icon => rows.filter(r => (r.kind === 'icon' && r.icon === icon) || (r.props && r.props.Icon === icon)).length;
  for (const icon of ['globe', 'world', 'information']) {
    const have = tree.filter(n => n.type === 'INSTANCE' && n.name === icon).length;
    if (have > planned(icon)) L.hygiene.push(`default icon "${icon}" ×${have - planned(icon)} not in the plan — set the real icon`);
  }
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
  total = items.length; ok = wantComponents(items);
}

// hygiene (main's verify-invariants, minus its false positives: nodes inside instances are kit internals)
const PLACEHOLDER = /^(tab text|\[swap slot\]|page title|page subtitle|lorem ipsum.*|placeholder)$/i;
const GENERIC = /^(frame|group|rectangle|auto layout)\s*\d*$/i;
for (const n of tree.filter(n => !n.inInst)) {
  if (n.type === 'TEXT' && n.font && !/^\d+$/.test(String(n.font)) && String(n.font).split('+').some(f => f !== '72')) L.hygiene.push(`"${String(n.text).slice(0, 30)}": font ${n.font}, SAP needs 72 (use a kit text style)`);
  if (n.type === 'TEXT' && PLACEHOLDER.test(String(n.text).trim())) L.hygiene.push(`placeholder text "${n.text}" left in the build`);
  // a logo's backing frame may stay raw white
  if ((n.fill === 'RAW' && !/logo|image/i.test(n.name)) || n.stroke === 'RAW') L.hygiene.push(`"${n.name}": raw colour, bind a SAP token`);
}
const generic = tree.filter(n => !n.inInst && n.type === 'FRAME' && GENERIC.test(n.name)).length;
if (generic) L.hygiene.push(`${generic} frames named "Frame"/"Group" — give them real names`);

const pct = total ? Math.round(ok / total * 100) : 100;
const show = (h, a) => console.log(`${h} (${a.length})${a.length ? '\n  - ' + a.join('\n  - ') : ''}`);
console.log(`MATCH ${pct}%  (${ok} of ${total} plan rows built right · pass = ${PASS}%)`);
show('MISSING', L.missing); show('WRONG STYLE', L.style); show('WRONG COLOUR ROLE', L.colour);
show('WRONG PROP', L.prop); show('WRONG DENSITY', L.density); show('HYGIENE', L.hygiene);
const pass = pct >= PASS && !L.hygiene.length;
console.log(`VERDICT: ${pass ? (pct === 100 ? 'MATCHES PLAN' : `PASS — ${pct}% (fix the lines above for 100%)`) : 'FIX THE ITEMS ABOVE, THEN RE-AUDIT'}`);
process.exit(pass ? 0 : 1);
